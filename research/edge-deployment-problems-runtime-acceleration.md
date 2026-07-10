# 边缘部署问题候选资料池：Runtime、内核、内存、服务化与推理加速

> 收集日期：2026-07-10。本文是一手资料驱动的**候选资料池**，用于后续筛选、实测和课程改写，**不是课程结论，也不是对任一框架、版本或硬件的通用性能承诺**。所有解决方案都应在课程的 Qwen/GGUF/llama.cpp 主线或明确标注的扩展 runtime 上复现后再进入正文。

## 与现有课程的对齐口径

- `已有`：现有章节已经讲到同一问题，本条主要补直接一手证据或更严格的诊断口径。
- `扩展`：现有章节讲到上位概念，但缺少可操作的现象、日志、边界或进阶 runtime 示例。
- `新增`：现有六个相关页面没有形成可执行的问题卡。
- 本轮共 23 条：`已有` 3 条、`扩展` 9 条、`新增` 11 条。

| ID | 主题 | 覆盖状态 | 建议主落点 |
| --- | --- | --- | --- |
| RTA-01 | ONNX Runtime 节点回落 CPU | 已有 | 推理框架与部署链路 |
| RTA-02 | LiteRT delegate 整图拒绝 | 扩展 | 推理框架与部署链路 |
| RTA-03 | LiteRT 部分图跨 CPU/加速器切换 | 新增 | 推理框架与部署链路 |
| RTA-04 | DLA 层回落 GPU | 新增 | 推理框架与部署链路 |
| RTA-05 | `torch.compile` graph break | 新增 | 推理加速基础 |
| RTA-06 | 动态 shape 引发反复重编译 | 新增 | 推理加速基础 |
| RTA-07 | TensorRT 找不到可用实现 | 扩展 | 推理框架与部署链路 |
| RTA-08 | TensorRT optimization profile 不覆盖输入 | 新增 | 推理加速实验 |
| RTA-09 | TensorRT profile/shape 切换首轮抖动 | 新增 | Profiling |
| RTA-10 | TensorRT engine 无法跨环境反序列化 | 新增 | 推理框架与部署链路 |
| RTA-11 | FlashAttention/融合 SDPA 未被选中 | 扩展 | 推理加速基础 |
| RTA-12 | CUDA Graph 捕获失败或 replay 错误 | 新增 | 推理加速实验 |
| RTA-13 | vLLM KV Cache 抢占与重计算 | 扩展 | 本地服务 / Profiling |
| RTA-14 | TensorRT-LLM KV Cache 吃满余量 | 扩展 | 推理加速基础 |
| RTA-15 | 动态 batching 排队换吞吐 | 扩展 | 本地服务 |
| RTA-16 | chunked prefill 的 TTFT/ITL 取舍 | 新增 | 本地服务 / Profiling |
| RTA-17 | 服务 CPU 饥饿但 GPU 利用率低 | 新增 | 本地服务 |
| RTA-18 | speculative decoding 没有加速 | 扩展 | 推理加速基础 |
| RTA-19 | 首个请求冷启动显著偏慢 | 已有 | 本地服务 |
| RTA-20 | CUDA allocator 碎片导致“有余量仍 OOM” | 扩展 | Profiling / 排障索引 |
| RTA-21 | TTFT/TPOT/ITL/E2E 混为一个“延迟” | 已有 | Profiling |
| RTA-22 | 压测到达过程不真实，吞吐不可外推 | 扩展 | Profiling / 本地服务 |
| RTA-23 | 每次部署都重新做 TensorRT tactic 搜索 | 新增 | 推理框架与部署链路 |

## 候选问题卡

### RTA-01：模型能运行，但 ONNX Runtime 的 GPU/NPU 加速没有真正覆盖全部节点

- **覆盖状态**：已有。
- **问题/现象**：推理结果正确，但 GPU/NPU 利用率低、CPU 占用高，端到端延迟接近 CPU baseline；仅看到目标 Execution Provider 出现在列表中，仍不能证明整图运行在加速器上。
- **常见原因**：ONNX Runtime 按 provider 优先级把各节点分配给第一个有对应 kernel 的 EP；目标 EP 不支持的节点会由后续 EP（常见是 CPU）执行。另一个不同层次的机制是 `session.run()` 内部 EP 失败后的 session fallback，不能与逐节点分区混为一谈。
- **最小诊断证据**：保存 `ort.get_available_providers()`、`session.get_providers()`、provider options、启用 profiling 后的 JSON，以及同输入下 CPU-only 和目标 EP 的延迟；在 profile 中确认关键节点的 provider，而不是只截一张 GPU 利用率图。
- **解决/规避方案**：显式设置 provider 顺序；检查目标 EP 的算子、dtype 和 shape 覆盖；把不支持的算子改写、升级或补自定义 kernel；验证阶段可移除 CPU EP 或禁用 run fallback 以尽早暴露问题，但要分别记录“节点未覆盖”和“EP 执行失败”。
- **适用边界或副作用**：强制 fail-fast 会把原本可用的混合执行变成启动或运行失败；少量 CPU 节点未必是主瓶颈，只有 profile 和对照实验能判断是否值得改图。
- **一手来源**：[ONNX Runtime Execution Providers](https://onnxruntime.ai/docs/execution-providers/)（官方文档）；[ONNX Runtime Python API Summary](https://onnxruntime.ai/docs/api/python/api_summary.html)（官方 API 文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的“Runtime 加速与 fallback / ONNX Runtime 最小入口”；`docs/troubleshooting-index.md` 的 runtime 层最小证据包。建议把现有 `get_providers()` 检查扩成“provider 列表 + 节点 profile + CPU 对照”。

### RTA-02：LiteRT 的 GPU/NPU delegate 被整图拒绝，实际全程走 CPU

- **覆盖状态**：扩展。
- **问题/现象**：应用成功加载 delegate，也能输出结果，但延迟和功耗没有改善；日志显示 delegate 没有接受任何 op，模型实际全程走 CPU。
- **常见原因**：delegate 只支持特定模型类型、精度或算子集合。例如把浮点模型交给只支持 8-bit 量化算子的 delegate 时，delegate 会拒绝全部操作。
- **最小诊断证据**：记录模型 dtype/量化方案、启用的 delegate、delegate 初始化日志和被委派节点数；用 LiteRT benchmark tool 对比 CPU-only 与 delegate；不要只记录“delegate 创建成功”。
- **解决/规避方案**：按目标 delegate 的支持表选择导出和量化方案；在转换后检查 op/dtype；如果目标 NPU 路线不覆盖当前模型，明确回退 CPU/GPU 或换已支持的 delegate，不把“API 可用”写成“NPU 已加速”。
- **适用边界或副作用**：delegate 支持随设备、驱动和 LiteRT 版本变化；换量化方案可能改变准确率，必须补质量回归。官方支持表只是筛选条件，最终仍要在目标设备 benchmark。
- **一手来源**：[LiteRT Delegates](https://developers.google.com/edge/litert/performance/delegates)（Google 官方文档）；[LiteRT delegate for NPUs](https://developers.google.com/edge/litert/android/npu/overview)（Google 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的“移动端 / 跨平台 runtime”表与 delegate 验收字段；`docs/troubleshooting-index.md` 的 runtime/fallback 分类。现有内容有路线图，缺“被整图拒绝仍能正常返回”的诊断卡。

### RTA-03：LiteRT 部分图在加速器与 CPU 间来回切换，反而比纯 CPU 更慢

- **覆盖状态**：新增。
- **问题/现象**：只有部分算子被 GPU、DSP、Edge TPU 或其他 NPU delegate 接管；日志不断出现 unsupported-op 警告，启用加速后端到端延迟反而上升。
- **常见原因**：delegate 把可支持节点切成一个或多个子图，未支持节点留在主图；跨分区切换会引入同步、布局转换和 GPU/CPU 等内存拷贝，足以抵消 kernel 加速收益。
- **最小诊断证据**：保存未支持 op 警告、delegate 分区数量、每个分区的节点列表，以及 CPU-only / delegate 的相同输入、相同线程数、相同预热条件的端到端延迟；若工具可用，记录跨设备 copy/sync 时间。
- **解决/规避方案**：优先让关键路径形成较大的连续 delegate 分区；改写少数切断子图的 op、固定受支持的 shape/layout，或直接关闭收益为负的 delegate。把“委派节点比例”和“分区数量”同时写入报告。
- **适用边界或副作用**：不能仅以委派比例判断收益；一个位于关键路径上的小 CPU 岛可能比多个非关键 unsupported op 更糟。改图还需验证数值一致性和转换工具兼容性。
- **一手来源**：[Implementing a Custom Delegate](https://developers.google.com/edge/litert/performance/implementing_delegate)（Google 官方文档）；[GPU delegates for LiteRT: Troubleshooting GPU support](https://developers.google.com/edge/litert/performance/gpu)（Google 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的“fallback / backend / device”证据链；`docs/inference-acceleration.md` 的内存与数据搬运层。适合新增一张“算子覆盖率高仍可能因分区切换变慢”的问题卡。

### RTA-04：指定 DLA 后仍有层跑在 GPU，功耗和延迟不符合预期

- **覆盖状态**：新增。
- **问题/现象**：目标是使用 NVIDIA DLA 等边缘加速器，但构建参数允许 GPU fallback 后，部分层落到 GPU；模型可运行，却不再是预期的 DLA-only 路径。
- **常见原因**：DLA 只支持 TensorRT 层、格式和 shape 的子集；`--allowGPUFallback` / `allowGPUFallback()` 会让原本指定给 DLA、但无法在 DLA 上运行的层转到 GPU。
- **最小诊断证据**：记录 TensorRT/JetPack 版本、`trtexec` 完整构建命令、是否启用 `--allowGPUFallback`、`--dumpLayerInfo`/详细 layer placement，以及 DLA/GPU 利用率和功耗采样。
- **解决/规避方案**：先在禁用 GPU fallback 的验证构建中暴露不支持层；再决定改写层、调整精度/格式，还是接受混合执行。若接受 fallback，报告必须列出落到 GPU 的层和实测代价。
- **适用边界或副作用**：只适用于所用 TensorRT/平台版本确实提供 DLA 的环境；禁用 fallback 可能直接导致 engine 构建失败；混合执行未必一定更慢，但会改变功耗、资源隔离和部署边界。
- **一手来源**：[Building and Launching the Loadable](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/dla-build-and-run.html)（NVIDIA 官方文档）；[TensorRT’s Capabilities — DLA](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/capabilities.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的 Jetson TensorRT、fallback 与 backend 日志；`docs/lab-profiling.md` 的功耗/温度证据。现有课程没有 DLA layer placement 的最小证据包。

### RTA-05：`torch.compile` 看似启用，但 graph break 把模型切成许多小图

- **覆盖状态**：新增。
- **问题/现象**：模型能运行，编译也没有整体失败，但加速很小或更慢；profile 中出现多个短小 compiled region，中间夹着 eager/Python 执行。
- **常见原因**：数据依赖的 Python 分支、`.item()`、文件/日志操作、部分 Python/C 函数或未支持自定义 op 无法被追踪，触发 graph break；每次 break 都损失融合和跨算子优化机会。
- **最小诊断证据**：用 `TORCH_LOGS="graph_breaks"` 保存位置和原因；用 profiler 观察 `Torch-Compiled Region`；再用 `fullgraph=True` 做诊断性运行，让第一个 break 直接报错；同时保留 eager baseline。
- **解决/规避方案**：把数据依赖控制流改为 `torch.cond`/张量算子；把 `.item()`、打印和 CPU I/O 移出编译区域；为稳定的自定义逻辑注册 custom op，或只编译真正连续且耗时的子模块。
- **适用边界或副作用**：`fullgraph=True` 适合暴露问题，不是所有模型的生产默认值；人为隔离小段 eager 代码有时比复杂改写更便宜，必须用编译耗时和稳态延迟共同判断。
- **一手来源**：[torch.compile Troubleshooting](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/torch.compiler_troubleshooting.html)（PyTorch 官方文档）；[Common Graph Breaks](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/compile/programming_model.common_graph_breaks.html)（PyTorch 官方文档）。
- **课程映射**：`docs/inference-acceleration.md` 的图优化层；`docs/lab-inference-acceleration.md` 的“加速是否真实有效”。建议增加 graph break 日志，而不是只讲 dynamic shape 会破坏图优化。

### RTA-06：输入 shape 变化导致 `torch.compile` 重编译，最终回落 eager

- **覆盖状态**：新增。
- **问题/现象**：首次请求和若干新长度请求都出现明显停顿；日志反复显示 compiling/recompiling；超过缓存上限后，后续调用不再得到编译收益。
- **常见原因**：编译图的 guard 对 shape、dtype、device、Python 常量或对象状态做了专门化；新请求使 guard 失败。达到 recompile/cache limit 后，框架会停止继续编译该 frame 并回落 eager。
- **最小诊断证据**：保存 `TORCH_LOGS="recompiles,dynamic,guards"`；按请求顺序记录 shape/序列长度与延迟；统计同一 frame 的 compile ID；把冷编译耗时和稳态执行耗时分开。
- **解决/规避方案**：对确有动态长度的区域尝试 `dynamic=True`；对服务请求做 shape/序列长度 bucketing；稳定会触发 guard 的 Python 参数。只有变化集合有明确上界时才考虑提高缓存上限。
- **适用边界或副作用**：动态 kernel 可能牺牲某些静态 shape 优化；bucket/padding 会增加无效计算；盲目提高缓存上限会增加编译时间和内存，而不会修复无界动态输入。
- **一手来源**：[Dealing with Recompilations](https://docs.pytorch.org/docs/stable/user_guide/torch_compiler/compile/programming_model.recompilation.html)（PyTorch 官方文档）；[`torch.compile` API](https://docs.pytorch.org/docs/stable/generated/torch.compile)（PyTorch 官方 API 文档）。
- **课程映射**：`docs/inference-acceleration.md` 的 dynamic shape / 图优化；`docs/lab-local-service.md` 的首个与后续请求记录。适合新增“请求长度序列—重编译—稳态”的实验。

### RTA-07：TensorRT 构建报 `could not find any implementation for node`

- **覆盖状态**：扩展。
- **问题/现象**：ONNX 能被解析，但 engine 构建阶段提示某节点没有可用 implementation/tactic，最终无法生成 serialized network。
- **常见原因**：官方错误说明首先指向给定 workspace 限制下没有可运行实现；也可能是 TensorRT bug、插件/算子缺失，或网络的 dtype/shape 组合没有受支持 tactic。
- **最小诊断证据**：保存完整 builder 日志、首个失败 node、TensorRT/CUDA/GPU 精确版本、workspace/memory-pool limit、ONNX 最小复现；用详细日志和 layer info 区分“解析成功但 tactic 不可用”。
- **解决/规避方案**：先按错误提示提高 workspace memory-pool limit 后重建；检查该 node 的 op、dtype、shape 和插件注册；用 Polygraphy/最小 ONNX 子图复现。若 workspace 足够仍失败，按官方要求提交最小 bug，而不是无限调参。
- **适用边界或副作用**：提高 workspace 只解决“存在实现但当前限制筛掉”的情况，不能创造不存在的 kernel；更大的构建预算也可能延长 tactic 搜索。必须避免把所有此类错误都归因于显存不足。
- **一手来源**：[TensorRT Understanding Error Messages](https://docs.nvidia.com/deeplearning/tensorrt/latest/reference/troubleshooting-error-messages.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的 TensorRT engine/kernel 路线；`docs/troubleshooting-index.md` 的 runtime 层证据。现有“unsupported op / kernel 缺失”可扩成精确错误卡。

### RTA-08：TensorRT optimization profile 不覆盖真实输入，动态 shape 请求失败

- **覆盖状态**：新增。
- **问题/现象**：静态样例能构建 engine，线上某个 batch、图像尺寸或序列长度在 `set_input_shape`/enqueue 阶段失败；或不同 execution context 争用同一 profile。
- **常见原因**：动态输入没有 profile，真实 shape 超出 `MIN/MAX`，运行前没有选择 profile/设置输入 shape，或并发 context 的 profile 使用不符合约束。
- **最小诊断证据**：保存 engine 的 profile 数量与每个输入的 `MIN/OPT/MAX`、失败请求的真实 shape、所选 profile index、`set_input_shape` 返回值和 enqueue 错误；用 `trtexec --minShapes/--optShapes/--maxShapes` 复现。
- **解决/规避方案**：按真实 workload 分布建立覆盖范围合理的一个或多个 profile；运行时先异步选择 profile，再设置 shape，并在同一 CUDA stream 上 enqueue；对常见 shape 路由到最接近 OPT 的 profile。
- **适用边界或副作用**：把 `MIN/MAX` 无限制放宽并非免费：官方文档指出不同范围的内存可能差异很大，且某些 tactic 只在 `MIN=OPT=MAX` 时可用；更多 profile/context 也增加 engine 与运行时管理成本。
- **一手来源**：[TensorRT Dynamic Shapes: Core Concepts](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/dynamic-shapes-basics.html)（NVIDIA 官方文档）；[TensorRT `IOptimizationProfile` API](https://docs.nvidia.com/deeplearning/tensorrt/latest/_static/python-api/infer/Core/OptimizationProfile.html)（NVIDIA 官方 API 文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的 TensorRT/dynamic shape 风险；`docs/lab-inference-acceleration.md` 的上下文长度单变量实验。建议把 `ctx-size` 思路扩成 profile 范围与真实请求 shape 对照。

### RTA-09：TensorRT 切换 profile 或输入 shape 后，第一轮推理异常慢

- **覆盖状态**：新增。
- **问题/现象**：同一 shape 连续请求的稳态延迟正常，但每次切换 optimization profile 或输入 shape 后，第一个 `enqueueV3()` 出现可重复的尖峰，污染 P99。
- **常见原因**：TensorRT 需要在 shape/profile 改变后重新推导网络 shape，并为部分 tactic 重新计算所需资源；这部分一次性工作落在下一次 enqueue 前。
- **最小诊断证据**：按请求顺序记录 profile、shape、enqueue 时间，至少比较“切换后第 1 次”和同 shape 后续多次；同时保存 H2D/D2H 与 compute 分账，避免把网络或客户端等待误判成 profile 抖动。
- **解决/规避方案**：按 shape bucket 复用 context/profile；服务 ready 前分别预热会进入生产的 profile/shape；减少高频 profile 切换，并优先使用异步 profile 切换 API。
- **适用边界或副作用**：为每个 bucket 常驻 context 会增加设备内存和管理复杂度；长尾 shape 很多时，完全预热不现实，应把冷 shape 延迟单独纳入 SLO。
- **一手来源**：[Optimizing TensorRT Performance — Overhead of Shape Change and Optimization Profile Switching](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/optimization.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/lab-profiling.md` 的冷启动与重复运行；`docs/lab-local-service.md` 的第一次/第二次请求。现有记录只区分冷/热请求，尚未把尖峰定位到 profile/shape 切换。

### RTA-10：TensorRT engine 在另一台设备或另一 runtime 上无法反序列化

- **覆盖状态**：新增。
- **问题/现象**：同一个 `.engine`/plan 在构建机可运行，复制到目标机后反序列化失败，日志出现 TensorRT 版本或 compute capability 不匹配；即使能运行，性能也可能退化。
- **常见原因**：默认 engine 只兼容构建它的 TensorRT 版本与设备类型，并记录版本、compute capability 和 tactic 相关硬件属性；“ONNX 可移植”不等于“序列化 engine 可移植”。
- **最小诊断证据**：保存构建端与运行端的 TensorRT/CUDA/driver、GPU compute capability、OS/CPU 架构、build flags 和完整 deserialize 日志；记录是否启用了 version/hardware compatibility。
- **解决/规避方案**：首选在目标设备/目标 runtime 构建 engine；确有 fleet 复用需要时，在构建期显式启用对应 version/hardware compatibility，并在所有目标机回归性能与正确性；把 ONNX/权重保留为可重建来源。
- **适用边界或副作用**：兼容模式会排除部分架构特定 tactic，官方明确提示可能降低吞吐或增加延迟；跨版本计划可能包含可执行代码，只应反序列化可信来源；具体兼容能力还受平台限制。
- **一手来源**：[TensorRT Engine Compatibility](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/engine-compatibility.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的“格式—runtime—backend—设备”链路；`docs/troubleshooting-index.md` 的模型/runtime 版本证据。适合新增 engine provenance 清单。

### RTA-11：启用了 FlashAttention/融合 SDPA，但实际回落到 math kernel

- **覆盖状态**：扩展。
- **问题/现象**：参数或配置显示“flash attention enabled”，但速度/显存无改善；PyTorch 自动选择了 math 或其他 SDPA backend，或强制 fused backend 时才出现不支持原因。
- **常见原因**：融合 kernel 对设备架构、dtype、head dimension、mask/layout 等输入有约束；PyTorch 默认会按输入自动选择实现，当前 fused kernel 不可用时可回落到 C++ math 实现。
- **最小诊断证据**：记录 GPU、PyTorch/CUDA、输入 dtype/shape/head dimension/mask；用 `torch.nn.attention.sdpa_kernel()` 临时只允许目标 backend，保存其 warning/error 原因；profile kernel 名并与 math baseline 对照。
- **解决/规避方案**：让输入满足所选 backend 的约束，或选择当前设备支持的 attention backend；如果使用独立 `flash-attn` 包，先核对其 README 中的 PyTorch/CUDA/架构要求并运行项目测试；无法满足时显式接受 fallback，不伪报收益。
- **适用边界或副作用**：强制单一 backend 可能从“可运行但较慢”变成直接报错；不同 backend 可能有细小数值差异；独立 FlashAttention 项目的支持矩阵不能直接外推到 PyTorch 内置 SDPA 的所有版本。
- **一手来源**：[`scaled_dot_product_attention`](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention)（PyTorch 官方 API 文档）；[Dao-AILab FlashAttention README](https://github.com/Dao-AILab/flash-attention)（项目官方仓库）。
- **课程映射**：`docs/inference-acceleration.md` 的 low-bit/attention kernel；`docs/lab-inference-acceleration.md` 的 `-fa` 实验。现有内容有 flag，缺“强制 backend 暴露回落原因”的证据方法。

### RTA-12：CUDA Graph 捕获失败，或 replay 使用旧地址/旧 shape 得到错误结果

- **覆盖状态**：新增。
- **问题/现象**：capture 报 `cudaErrorStreamCaptureUnsupported/Invalidated`；或者 capture 成功，但后续输入变化时出现 illegal memory access、崩溃或静默错误结果。
- **常见原因**：capture 内包含 `.item()`、`.cpu()`、同步 memcpy/stream synchronize；使用 legacy default stream；输入 shape、控制流或内存地址在 replay 间变化，而 graph 固定记录了拓扑、kernel 参数和指针。
- **最小诊断证据**：保存 CUDA error code 和 capture 栈；开启同步检测定位隐藏 CPU-GPU sync；记录 capture/replay 输入的 shape、stride、data pointer；用相同输入比较 eager 与 graph 输出；确认预热发生在 side stream。
- **解决/规避方案**：把同步和 CPU 逻辑移出 capture；保留长生命周期静态输入/输出 buffer，用 `.copy_()` 更新值；按常见 shape padding/bucketing 并分别 capture；高度动态部分保持 eager 或只 capture 静态子图。
- **适用边界或副作用**：多个 graph/bucket 会占用静态 buffer 和私有内存池，可能增加 OOM 风险；padding 增加计算；CUDA Graph 主要减少 CPU launch overhead，GPU kernel 本身已很长时收益可能很小。
- **一手来源**：[CUDA Graph Constraints](https://docs.nvidia.com/dl-cuda-graph/cuda-graph-basics/constraints.html)（NVIDIA 官方文档）；[CUDA Graph Capture Failures](https://docs.nvidia.com/dl-cuda-graph/latest/troubleshooting/capture-failures.html)（NVIDIA 官方文档）；[Accelerating PyTorch with CUDA Graphs](https://pytorch.org/blog/accelerating-pytorch-with-cuda-graphs/)（PyTorch 官方文章）。
- **课程映射**：`docs/inference-acceleration.md` 的 graph/runtime 层；`docs/lab-inference-acceleration.md` 的单变量验证；`docs/lab-profiling.md` 的内存证据。适合做进阶实验，不替换 llama.cpp 基线。

### RTA-13：vLLM 因 KV Cache 不足抢占请求，尾延迟突然升高

- **覆盖状态**：扩展。
- **问题/现象**：服务没有 OOM，但日志出现 `preempted by ... RECOMPUTE`，并发上升或长请求混入时 TTFT/E2E/P99 突然恶化。
- **常见原因**：当前 batch 的请求所需 KV Cache 超过可用 block；vLLM 为保持服务可用而抢占请求、释放 cache，并在稍后从 prefill 重新计算。
- **最小诊断证据**：保存 preemption warning 与累计次数；同时采集 `vllm:num_preemptions`、`kv_cache_usage_perc`、running/waiting requests、prompt/output length、TTFT/E2E P50/P99；用相同负载降低并发验证因果。
- **解决/规避方案**：在仍有安全余量时提高 `gpu_memory_utilization`；降低 `max_num_seqs` 或 `max_num_batched_tokens`；减少最大上下文/输出预算；多 GPU 路线可评估 TP/PP，但要把同步或 pipeline 延迟作为代价实测。
- **适用边界或副作用**：提高 cache 占比可能挤压其他 CUDA 分配并引发 OOM；降低并发会损失吞吐；增加并行度可能增加同步和通信开销。目标应是减少抢占下的 SLO 违约，而非追求 cache 100% 占用。
- **一手来源**：[vLLM Optimization and Tuning — Preemption](https://docs.vllm.ai/en/latest/configuration/optimization/)（vLLM 官方文档）；[vLLM Production Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)（vLLM 官方文档）。
- **课程映射**：`docs/inference-acceleration.md` 的 KV Cache/并发；`docs/lab-local-service.md` 的 API 慢与排队；`docs/lab-profiling.md` 的风险表。现有内容讲 OOM，缺“未 OOM 但被重计算”的问题卡。

### RTA-14：TensorRT-LLM engine 能构建，服务初始化或长上下文运行时仍 OOM

- **覆盖状态**：扩展。
- **问题/现象**：engine 构建成功，却在 runtime 初始化、并发请求或长上下文时 OOM；日志显示 KV cache block 池占用大量剩余显存。
- **常见原因**：engine 构建不需要同时分配运行时的大型 I/O/KV tensor；TensorRT-LLM 的权重、activation、runtime buffer 和 KV Cache 是不同内存项，KV Cache 默认可使用大部分加载权重后剩余的 GPU 内存。
- **最小诊断证据**：保存 TensorRT-LLM `[MemUsageChange]`、weights/activation memory、KV primary/secondary block 数、tokens per block、`free_gpu_memory_fraction`/`max_tokens`、max batch/context/output，以及 OOM 时设备总/可用内存。
- **解决/规避方案**：为非 KV runtime 分配留出显式余量；调低 `free_gpu_memory_fraction` 或设置 `max_tokens`；降低 max batch、并发、上下文或生成长度；逐步加压找到 cache 容量与 SLO 的拐点。
- **适用边界或副作用**：减小 KV 池会降低可同时驻留的 token 数，可能引发排队、抢占或吞吐下降；把 cache 放到 host/secondary memory 会增加搬运与延迟。不能只用 engine 文件大小估算服务显存。
- **一手来源**：[Memory Usage of TensorRT-LLM](https://nvidia.github.io/TensorRT-LLM/reference/memory.html)（NVIDIA 官方文档）；[How to Change KV Cache Behavior](https://nvidia.github.io/TensorRT-LLM/latest/examples/kvcacheconfig.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/inference-acceleration.md` 的 KV Cache；`docs/lab-profiling.md` 的峰值显存；`docs/lab-local-service.md` 的常驻服务资源。建议把权重、activation、runtime buffer、KV 分账。

### RTA-15：动态 batching 提高吞吐，却把请求耗在队列里

- **覆盖状态**：扩展。
- **问题/现象**：总吞吐提高，但单请求平均延迟和 P99 变差；低 QPS 下仍出现固定的额外等待；用户看到的 TTFT 增长大于模型计算变化。
- **常见原因**：动态 batcher 为等候更多请求，会在 `max_queue_delay_microseconds` 范围内延迟当前请求；更大的 batch 与非零 delay 用排队时间换取设备执行效率。
- **最小诊断证据**：固定模型和输入，记录 batch size 分布、queue delay、server compute time、client P50/P95/P99 和吞吐；分别测试禁用 batching、默认不等待、多个 queue delay；同时记录请求到达率。
- **解决/规避方案**：先从 `dynamic_batching {}` 的无额外等待配置建立基线，再在明确的延迟预算内逐步增加 batch/delay；对交互与离线流量分开队列或实例；用 P99/SLO 而不是只看平均吞吐选参数。
- **适用边界或副作用**：Triton dynamic batching 面向可批处理的无状态模型；LLM continuous batching 的调度单位不同，不能原样照搬参数。低流量服务常常凑不出目标 batch。
- **一手来源**：[Triton Batchers — Dynamic Batcher](https://github.com/triton-inference-server/server/blob/main/docs/user_guide/batcher.md)（NVIDIA Triton 官方项目文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的 Little's law 与并发；`docs/lab-local-service.md` 的服务化开销。现有内容讲“排队会慢”，可扩成 queue-delay 单变量实验。

### RTA-16：chunked prefill 调参改善 ITL，却恶化 TTFT 或吞吐

- **覆盖状态**：新增。
- **问题/现象**：把长 prompt 切块后，正在 decode 的请求更流畅，但新长请求首 token 更慢；或增大 token budget 后 TTFT/吞吐改善，ITL 变差。
- **常见原因**：vLLM chunked prefill 优先调度 decode，再用剩余 `max_num_batched_tokens` 处理 prefill；较小预算减少 prefill 对 decode 的干扰，较大预算允许每批处理更多 prefill token。
- **最小诊断证据**：固定 prompt/output 长度分布与到达率，扫描 `max_num_batched_tokens`；同时记录 TTFT、TPOT/ITL、E2E、output tok/s、queue time 和 batch token 数；分开看短 prompt 与长 prompt。
- **解决/规避方案**：按业务 SLO 选择 token budget，而不是照搬吞吐推荐值；交互服务优先守住 ITL/TTFT，离线服务再偏吞吐；长短请求差异很大时考虑流量分层。
- **适用边界或副作用**：参数含义和默认值受 vLLM 版本影响；禁用 chunked prefill 时还存在 `max_num_batched_tokens` 与 `max_model_len` 的启动约束。课程只能保留“扫描与分账”方法，不能固化某个数值。
- **一手来源**：[vLLM Optimization and Tuning — Chunked Prefill](https://docs.vllm.ai/en/latest/configuration/optimization/)（vLLM 官方文档）。
- **课程映射**：`docs/inference-acceleration.md` 的 prefill/decode；`docs/lab-profiling.md` 的 TTFT/tokens/s 分账；`docs/lab-local-service.md` 的并发/长上下文风险。适合进阶 serving 实验。

### RTA-17：GPU 没吃满并非 GPU kernel 慢，而是 API server/调度 CPU 饥饿

- **覆盖状态**：新增。
- **问题/现象**：GPU 利用率呈锯齿或偏低，扩 GPU/换 kernel 后收益小；并发时 tokenization、调度、流式返回延迟上升，端到端吞吐受 CPU 核数限制。
- **常见原因**：服务至少还有 API server、engine scheduler 和 GPU worker 等 CPU 进程；tokenization、chat template、多模态加载、调度、detokenization、网络和流式 SSE 都消耗 CPU。物理核不足或 NUMA 不当会让 GPU 等待。
- **最小诊断证据**：同时采集每进程 CPU、run queue、上下文切换、GPU timeline/utilization、tokenization/queue/decode 时间；记录容器 vCPU 与物理核/超线程关系；增加 CPU 配额后做同负载 A/B。
- **解决/规避方案**：先保证各服务进程有足够物理核；按 GPU NUMA 节点绑定 worker；tokenizer-bound 时使用更快 tokenizer 或扩 API server；减少不必要的逐 token CPU/日志工作。
- **适用边界或副作用**：增加 API server 会增加内存、线程和连接数，某些缓存模式也会变化；GPU kernel 已是主瓶颈时加 CPU 不会改善；NUMA 参数只应依据实际拓扑设置。
- **一手来源**：[vLLM Optimization and Tuning — CPU Resources for GPU Deployments](https://docs.vllm.ai/en/latest/configuration/optimization/)（vLLM 官方文档）。
- **课程映射**：`docs/inference-acceleration.md` 的“GPU 利用率低 / CPU sampling”；`docs/lab-local-service.md` 的 API 与客户端开销；`docs/lab-profiling.md` 的系统级 profiling。建议把 CPU 进程分账加入高级排障。

### RTA-18：speculative decoding 开启后没有加速，甚至尾延迟更差

- **覆盖状态**：扩展。
- **问题/现象**：加入 draft model、增加 speculative token 数后 tokens/s 没提升，某些任务或 P99 反而退化；只看“已启用 speculative decoding”无法解释结果。
- **常见原因**：收益取决于 draft 相对 target 的速度、draft/target 接受率、验证开销和 draft 长度。原始论文显示，draft 越长会线性增加 draft loop 成本，而后部 token 接受效率下降，速度会平台化甚至回退。
- **最小诊断证据**：在同一 target、prompt 集、采样参数和并发下做 on/off A/B；记录 acceptance rate、accepted/draft tokens、draft/verify 时间、TTFT、TPOT、E2E P50/P99；按任务类型分组。
- **解决/规避方案**：选与 target tokenizer/分布匹配且足够快的 drafter；扫描少量 draft lengths，选择实测拐点；低接受率或 target 本身很小/高并发已吃满算力时关闭 speculative decoding。
- **适用边界或副作用**：论文的 2–3 倍收益来自特定模型、硬件、batch 和任务，不能外推为承诺；额外 drafter 占显存；更长 draft 可能提高方差，必须看尾延迟而非只看平均值。
- **一手来源**：[Fast Inference from Transformers via Speculative Decoding](https://arxiv.org/abs/2211.17192)（原始论文）；[Accelerating Large Language Model Decoding with Speculative Sampling](https://arxiv.org/abs/2302.01318)（原始论文）。
- **课程映射**：`docs/inference-acceleration.md` 的算法层只列出 speculative decoding；`docs/lab-profiling.md` 可加入 acceptance/draft/verify 字段。适合作为扩展实验，不进入 llama.cpp 最低验收。

### RTA-19：首个或前几个服务请求显著偏慢，平均值被冷启动污染

- **覆盖状态**：已有。
- **问题/现象**：server 已监听且 health check 成功，但首个/前几个真实推理请求比后续请求慢很多；部署滚动重启时用户周期性命中慢请求。
- **常见原因**：部分 backend 把 kernel/JIT、内存池、算法选择或其他初始化延后到第一批真实输入；“进程 ready”不一定等于所有生产 shape 已热身。
- **最小诊断证据**：分别记录进程启动、模型加载完成、ready、warmup 完成时间；按顺序保存前 N 次请求的 shape、TTFT/E2E 和 server timing；重启后复现，而不是在已热进程上测一次。
- **解决/规避方案**：用代表性 shape/精度执行显式 warmup，并让 readiness 在 warmup 成功后才通过；多 profile/bucket 服务分别预热常见路径；benchmark 使用独立 warmup 次数且不混入正式统计。
- **适用边界或副作用**：Triton `ModelWarmup` 的具体效果依 backend 而异，并会延长模型加载、降低模型更新响应速度；无法覆盖长尾 shape 时，应单独报告冷 shape SLO。
- **一手来源**：[Triton Model Configuration — Model Warmup](https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton-inference-server-2450/user-guide/docs/user_guide/model_configuration.html)（NVIDIA 官方文档）；[Triton Perf Analyzer CLI](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/perf_analyzer/docs/cli.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/lab-local-service.md` 已要求比较第一次和第二次请求；`docs/lab-profiling.md` 已提醒冷启动。建议补“ready 与 warmup 完成分离”和前 N 次时序表。

### RTA-20：显存总量看似够用，PyTorch 仍因 allocator 碎片 OOM

- **覆盖状态**：扩展。
- **问题/现象**：`nvidia-smi` 或 reserved 总量看似仍有余地，但一次较大的连续分配失败；动态 batch/shape 运行久后更容易复现，重启进程暂时恢复。
- **常见原因**：caching allocator 的 free block 被活跃分配隔开，或分散在不能合并的 segment；总 free bytes 足够不代表存在满足当前请求的连续 block。频繁变化的 allocation size 会放大问题。
- **最小诊断证据**：OOM 前后保存 `memory_summary()`、allocated/reserved/active/inactive split 指标和 `memory_snapshot()`；记录请求 shape/batch 序列；用 NVML 总显存与 PyTorch allocator 视图对照，识别框架外分配。
- **解决/规避方案**：先减少无界 shape/batch 波动并按 bucket 复用 buffer；用 memory snapshot 找出长期存活的小块；对变化 batch 可评估 `expandable_segments`；只有 inactive split block 明显时，才把 `max_split_size_mb` 作为最后手段。
- **适用边界或副作用**：`max_split_size_mb` 只对 native allocator 有意义，且性能代价可能很大；PyTorch memory snapshot 看不到直接 CUDA/NCCL 等框架外分配；`empty_cache()` 不能释放仍活跃或被切分钉住的 block。
- **一手来源**：[PyTorch CUDA Semantics — Memory Management](https://docs.pytorch.org/docs/main/notes/cuda.html#cuda-memory-management)（PyTorch 官方文档）；[Understanding CUDA Memory Usage](https://docs.pytorch.org/docs/stable/torch_cuda_memory.html)（PyTorch 官方文档）；[When does fragmentation occur in the CUDA caching allocator?](https://docs.pytorch.org/devlogs/eager/2026-06-01-cuda-caching-allocator/)（PyTorch 维护者 DevLog）。
- **课程映射**：`docs/inference-acceleration.md` 已在六层框架中提到碎片；`docs/lab-profiling.md` 只记录峰值；`docs/troubleshooting-index.md` 可增加 allocated/reserved/inactive split 的最小证据。

### RTA-21：把 TTFT、TPOT、ITL、E2E 和队列时间混成一个“延迟”

- **覆盖状态**：已有。
- **问题/现象**：两个系统都宣称“延迟更低”，但一个优化了首 token，另一个只提高 decode；或 GPU 计算没变，TTFT 因排队激增。不同团队数字无法对比。
- **常见原因**：指标定义、流式/非流式响应、输入/输出 token 长度、负载形状和 percentile 不一致；只用 curl 总耗时或 tokens/s 代表全部用户体验。
- **最小诊断证据**：同一次请求至少记录 input/output tokens、TTFT、TPOT/ITL、E2E、queue/prefill/decode time、stream 模式和 P50/P95/P99；保存原始逐请求结果与 server 指标。
- **解决/规避方案**：课程表格固定做“用户侧 TTFT/E2E + 服务侧 queue/prefill/decode + throughput”分账；明确 TPOT 与逐 SSE chunk 的 ITL 并非总可互换；横向比较必须使用相同 workload 与统计窗口。
- **适用边界或副作用**：详细 tracing/逐请求 timing 本身会有开销；不同 server 对 SSE token 聚合方式不同，ITL 语义需随工具版本确认；非流式 API 无法直接测真实首 token。
- **一手来源**：[vLLM Production Metrics](https://docs.vllm.ai/en/latest/usage/metrics/)（vLLM 官方文档）；[NVIDIA GenAI-Perf Metrics](https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton-inference-server-2500/user-guide/docs/perf_analyzer/genai-perf/README.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/inference-acceleration.md`、`docs/lab-profiling.md` 与 `docs/lab-local-service.md` 已强调指标分账。建议补 queue/prefill/decode 的服务端字段，避免只以 curl elapsed 对照 CLI tokens/s。

### RTA-22：压测默认一次性灌满请求，吞吐和延迟不能代表真实服务

- **覆盖状态**：扩展。
- **问题/现象**：离线/闭环压测得到很高吞吐，换成真实到达率后 P99 或排队完全不同；不同报告一个用固定并发，一个用 QPS，到达过程不可比。
- **常见原因**：负载生成器的 concurrency 与 request rate 是不同控制量；例如 `vllm bench serve` 的 `request-rate=inf` 会在时间 0 发送全部请求，而有限 request rate 可用 Poisson/gamma 到达。最大并发限制还可能让实际 QPS 低于目标。
- **最小诊断证据**：保存 request rate、arrival distribution/burstiness、max concurrency、数据集 token 长度分布、warmup、成功/失败数、实际完成 QPS、TTFT/TPOT/E2E percentiles；绘制发送和完成时间线。
- **解决/规避方案**：至少分“单请求延迟、固定并发容量、目标 QPS/突发”三种场景；用接近业务的 token 长度和到达分布；除 throughput 外报告满足 TTFT/TPOT/E2E SLO 的 goodput。
- **适用边界或副作用**：合成 Poisson 也不一定代表真实业务；客户端本身可能成为瓶颈；goodput 必须先写清 SLO，不能跨不同阈值比较。离线吞吐仍有价值，但只能回答设备饱和上限。
- **一手来源**：[vLLM `bench serve` CLI](https://docs.vllm.ai/en/latest/cli/bench/serve/)（vLLM 官方文档）；[Triton Perf Analyzer CLI](https://docs.nvidia.com/deeplearning/triton-inference-server/user-guide/docs/perf_analyzer/docs/cli.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/lab-profiling.md` 已要求记录并发和负载形状；`docs/06-runtime-deployment.md` 已讲 Little's law；`docs/lab-local-service.md` 暂不展开复杂并发。适合加入进阶压测模板，而非最低 smoke test。

### RTA-23：TensorRT 每次构建都重新搜索 tactic，部署/迭代“冷启动”过长

- **覆盖状态**：新增。
- **问题/现象**：模型每次转换、CI 或设备部署都花很久 build engine；日志反复对相同层做 tactic timing/JIT，服务若把 build 放到启动路径，ready 时间不可接受。
- **常见原因**：TensorRT builder 会测量候选 tactic 选择实现；没有挂载可复用 timing cache 时，只创建本地临时 cache，构建结束即销毁。更高 builder optimization level 也会增加搜索时间。
- **最小诊断证据**：保存 build 总时间、每层 profiling/timing cache hit/miss、builder optimization level、网络与 BuilderConfig hash、目标 GPU/CUDA/TensorRT；比较空 cache 与复用 cache 的构建结果和 engine 性能。
- **解决/规避方案**：序列化并复用匹配的 timing cache；开发期可降低 builder optimization level 加快反馈，发布前恢复并重建；把 engine 构建移出在线请求路径，部署已验证的可信 engine 或在目标机预构建。
- **适用边界或副作用**：timing cache 与目标设备、CUDA、TensorRT 和影响实现选择的 BuilderConfig 相关，不能无条件跨环境复用；降低 optimization level 可能让最终 engine 更慢；兼容检查失败时应重测而不是强行忽略。
- **一手来源**：[Optimizing TensorRT Performance — Reducing Engine Build Time](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/optimization.html)（NVIDIA 官方文档）；[TensorRT Performance Benchmarking](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/benchmarking.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` 的 engine 构建；`docs/lab-local-service.md` 的启动时间；`docs/lab-profiling.md` 的冷/热记录。适合把 build latency 与 inference latency 分开。

## 优先吸收建议

最值得优先转成课程问题卡的 5 条：

1. **RTA-01 ONNX Runtime 节点回落 CPU**：直接修正“provider 在列表里就等于已加速”的常见误判，且能沿用现有 provider 示例。
2. **RTA-05 `torch.compile` graph break**：补齐现有“图优化可能被 dynamic shape/unsupported op 破坏”与真实日志之间的缺口。
3. **RTA-08 TensorRT optimization profile**：是 engine 构建成功但真实 shape 请求失败的典型部署断点，诊断字段清晰。
4. **RTA-13 vLLM KV Cache 抢占**：把“长上下文/并发慢”从笼统 OOM 扩成可观察的重计算与尾延迟问题。
5. **RTA-21 服务时延分账**：能统一后续所有加速实验的报告口径，防止用 tokens/s、curl elapsed 或平均延迟互相替代。

## 证据强度与待验证边界

- 本池没有仅依赖 SEO 聚合文或匿名帖子形成的条目；每条至少有官方文档、官方项目仓库或原始论文。
- **版本敏感但非弱证据**：RTA-04（DLA）、RTA-08～10（TensorRT）、RTA-11（SDPA/FlashAttention）、RTA-13/16/17（vLLM）必须在课程锁定版本后复核 flag、默认值与支持矩阵。
- **需本课程实测后才能下结论**：RTA-03 的分区拷贝代价、RTA-11 的 fused attention 收益、RTA-18 speculative decoding 的最佳 draft length、RTA-20 allocator 参数、RTA-23 timing cache 收益。来源直接支撑机制与诊断方法，但不支撑本课程设备上的具体提升数字。
- **来源较旧但仍为官方机制说明**：RTA-19 引用 Triton 24.05 的 ModelWarmup 页面。进入正文前应再核对课程实际 Triton/serving runtime；它不能直接证明 `llama-server` 具有同名配置。
