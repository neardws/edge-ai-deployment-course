# 边缘部署问题候选资料池：更多端侧 Runtime 与开源生态

> 收集日期：2026-07-10。本文是第二轮广泛检索形成的候选资料池，只补第一轮尚未收录、且能给出明确故障现象与诊断入口的问题族。内容尚未进入课程正文，也不代表已经在本课程设备上复现。

## 收集与证据口径

- 本轮覆盖 MLC LLM / Apache TVM、ncnn、MNN、Arm NN、ExecuTorch 深层 backend，以及 WebGPU / WebNN。
- 仅以官方文档、官方仓库文档、标准或维护者 issue / release 为结论依据；社区文章没有被当作唯一证据。
- 证据等级：`A` = 官方文档、标准或原始论文；`B` = 官方仓库中的维护者 issue / discussion / release；`C` = 可复现实践，且必须有 `A/B` 交叉证据。
- “新增”是相对于第一轮 5 个 `edge-deployment-problems*.md` 的问题族去重结果，不表示所有课程页面都完全没有提过上位概念。

## 快速索引

| ID | 生态 / 平台 | 新增问题族 | 证据 | 建议主落点 |
| --- | --- | --- | --- | --- |
| ECO-01 | MLC LLM | 运行时改写编译期配置，模型库契约没有同步变化 | A | Runtime 部署 / 环境矩阵 |
| ECO-02 | MLC LLM / WebGPU | 单个 GPUBuffer 超过浏览器或设备限制 | A | Runtime 部署 / 推理加速 |
| ECO-03 | Apache TVM Vulkan | Target 能力与实机不一致，代码生成保守或直接失败 | A | Runtime 部署 / 环境矩阵 |
| ECO-04 | Apache TVM MetaSchedule | 调优数据库未命中，编译仍使用未调度算子 | A | 推理加速 / Profiling |
| ECO-05 | ncnn | 复用 Extractor 导致后续输入仍返回旧中间结果 | A | Runtime 部署 / 排障索引 |
| ECO-06 | ncnn | 外部内存构造 Mat 后生命周期失效 | A | Runtime 部署 / 排障索引 |
| ECO-07 | ncnn Vulkan | 加载模型后才开启 Vulkan，网络实际未启用 GPU | A | Runtime 部署 / 环境矩阵 |
| ECO-08 | ncnn / OpenMP | 已走 Vulkan，CPU 仍因转换和 spin-wait 高占用抖动 | A | 推理加速 / Profiling |
| ECO-09 | MNN | 改输入尺寸后未 resizeSession 或继续使用旧 Tensor 指针 | A | Runtime 部署 / 排障索引 |
| ECO-10 | MNN | 读取未声明保留的中间 Tensor，内容已被内存复用覆盖 | A | Runtime 部署 / 精度排障 |
| ECO-11 | MNN GPU | 调优缓存没有覆盖新 shape，初始化反复变慢 | A | Runtime 部署 / Profiling |
| ECO-12 | MNN | 同时写 numThread 和 GPU mode，union 配置互相覆盖 | A | 环境矩阵 / 排障索引 |
| ECO-13 | Arm NN | 动态 backend 因路径、文件名或 ABI 不兼容被跳过 | A | Runtime 部署 / 环境矩阵 |
| ECO-14 | Arm NN | FastMath 提速同时改变数值精度 | A | 推理加速 / 精度恢复 |
| ECO-15 | ExecuTorch | 动态维缺少 ValueRange，静态 arena 按样例尺寸规划过小 | A | Runtime 部署 / 内存规划 |
| ECO-16 | ExecuTorch Vulkan | `.pte` 已下放 Vulkan，但 backend 注册代码未链接进应用 | A | Runtime 部署 / 环境矩阵 |
| ECO-17 | ExecuTorch Vulkan | 算子已支持，布局或 storage type 不匹配仍插入大量 copy | A | 推理加速 / Profiling |
| ECO-18 | ExecuTorch QNN | context binary 与 APK 中 QNN runtime 版本不匹配 | A | Runtime 部署 / 环境矩阵 |
| ECO-19 | WebGPU | 映射中的 buffer 仍提交给 GPU，触发 validation 或同步等待 | A | Web 端部署 / 数据搬运 |
| ECO-20 | WebGPU | 同步创建 pipeline 把编译停顿推迟到首次 submit | A | Web 端部署 / Profiling |
| ECO-21 | WebNN GPU | 每次 dispatch 都在系统内存与 GPU 间自动上传下载 | A | Web 端部署 / 数据搬运 |
| ECO-22 | WebNN | 把异步 dispatch 返回时间误当成真实推理延迟 | A | Profiling / Benchmark |

## 候选问题卡

### ECO-01：改了 `mlc-chat-config.json` 的 context，但已编译模型库没有同步变化

- **生态 / 平台**：MLC LLM，各原生端与 WebGPU 编译目标。
- **问题现象**：直接把运行目录中的 `context_window_size`、`prefill_chunk_size` 或 `tensor_parallel_shards` 改大后，程序仍按旧上限工作，出现请求失败、内存异常或不可解释行为；采样参数却能正常生效。
- **常见原因**：同一配置文件同时含编译期元数据和运行期聊天参数。官方文档明确说明第一部分字段只用于编译期，运行时修改可能产生不可预期行为。
- **最小诊断证据**：保存 `gen_config` / `compile` 完整命令、编译时和运行时两份配置及哈希、模型库文件哈希；逐项区分编译期字段与 `temperature/top_p` 等运行期字段。
- **解决 / 规避方案**：需要改变 context、prefill chunk、TP shard 等编译契约时，重新生成配置并重新编译对应模型库；部署包把配置、权重和模型库作为同一版本单元。
- **适用边界 / 副作用**：增大 context 或 chunk 会提高运行时内存需求；重新编译增加构建时间。不同 MLC 版本允许 override 的字段会变化，发布时需按锁定版本复核。
- **一手来源**：[MLC LLM Customize MLC Chat Config](https://llm.mlc.ai/docs/deploy/mlc_chat_config.html)；[Compile Model Libraries](https://llm.mlc.ai/docs/compilation/compile_models.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`。
- **与第一轮去重**：第一轮 `RTA-08/TRT-01` 是 TensorRT optimization profile 不覆盖输入；本条是“可编辑配置文件与已编译模型库的制品契约不一致”，诊断和修复入口不同。

### ECO-02：MLC WebGPU 加载大模型时报 `createBuffer` size 越界

- **生态 / 平台**：MLC LLM WebGPU、浏览器 WebGPU。
- **问题现象**：编译或加载较大模型时报 `Failed to execute 'createBuffer' ... size ... outside the unsigned long long value range`，或创建大 buffer 时只得到失效对象 / OOM；总显存看似够也可能失败。
- **常见原因**：较大的 context window 或 prefill chunk 使单个中间 buffer 超出 WebGPU / 适配器的 `maxBufferSize`、binding 限制或可分配范围；这不是只看“总内存”能解释的问题。
- **最小诊断证据**：记录浏览器与 adapter 信息、`adapter.limits` / `device.limits`、失败 buffer 的请求大小、编译时 `context_window_size` 和 `prefill_chunk_size`，并用 WebGPU error scope 区分 validation 与 out-of-memory。
- **解决 / 规避方案**：按 MLC 文档降低 `prefill_chunk_size`（大模型可先试 1024 或更低）或 context window；只请求 adapter 确实支持的 required limits；必要时把大张量 / prefill 分块，重新编译后复测。
- **适用边界 / 副作用**：减小 chunk 可能增加分块调度开销并改变 TTFT / 吞吐；降低 context 会收窄产品能力。不同浏览器、GPU 与驱动暴露的限制不同。
- **一手来源**：[MLC LLM Compile Model Libraries](https://llm.mlc.ai/docs/compilation/compile_models.html)；[WebGPU Explainer: optional capabilities and fallible allocation](https://gpuweb.github.io/gpuweb/explainer/)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/inference-acceleration.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮 `DEV-03/RTA-20` 分别是 Jetson 物理内存碎片和 CUDA allocator 碎片；本条是浏览器 GPU API 的单 buffer / device-limit 约束。

### ECO-03：TVM Vulkan 的 Target 能力与实机不一致

- **生态 / 平台**：Apache TVM Vulkan。
- **问题现象**：同一图在某设备编译时报缺少 SPIR-V capability / extension；或者可以运行但没有使用实机支持的 FP16、INT8、subgroup 等能力，性能明显保守。
- **常见原因**：TVM 代码生成必须在编译期知道 Vulkan feature 与 limit。字段未指定时会按“不支持”或规范最低值处理；手工声明了实机并不支持的能力，则会生成设备无法接受的 shader。
- **最小诊断证据**：保存完整 TVM Target、设备查询结果、Vulkan driver/API 版本、SPIR-V validation / runtime 错误；设置 `TVM_VULKAN_ENABLE_VALIDATION_LAYERS=1`，必要时保存 TIR、SPIR-V 和反汇编。
- **解决 / 规避方案**：在目标机用 `-from_device=N` / 对应设备查询构造 Target；跨机编译时只显式写入已验证能力与 limit；保留设备指纹并按设备族分别构建。
- **适用边界 / 副作用**：从一台设备查询出的 Target 不保证可移植到另一台；validation 和 shader dump 仅用于诊断，会增加启动时间、日志或磁盘占用。
- **一手来源**：[Apache TVM Vulkan Runtime](https://tvm.apache.org/docs/arch/runtimes/vulkan.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`。
- **与第一轮去重**：第一轮的 delegate / EP fallback 是运行时算子覆盖；本条发生在 TVM 编译期 Target 能力建模与 SPIR-V 代码生成阶段。

### ECO-04：MetaSchedule 调完了，但数据库没有真正应用到当前模型

- **生态 / 平台**：Apache TVM MetaSchedule。
- **问题现象**：调优目录里已有记录，重新编译的延迟却与未调优版本接近；编译不报错，但热点算子仍保持默认 / 未调度实现。
- **常见原因**：`MetaScheduleApplyDatabase` 只替换能在数据库中命中的 workload；没有记录的函数会原样保留。错误 `work_dir`、结构变化、Target 变化或过严的 structural match 都会造成未命中而不一定硬失败。
- **最小诊断证据**：保存 `database_workload.json`、`database_tuning_record.json` 的记录数与哈希；记录当前 Target；查询热点 workload 是否有 tuning record；对比 apply 前后的 TIR / IRModule 和端到端 benchmark。
- **解决 / 规避方案**：调优与编译使用固定且明确的 `work_dir` 和同一 Target；在 CI 检查热点 workload 的命中率；未命中的算子先用 DLight 等规则调度建立基线，再对热点补调优。
- **适用边界 / 副作用**：放宽 module equality 可能误复用不合适的记录；共享数据库需按 Target、TVM 版本和 workload 身份管理，不能把旧设备结果无条件套到新设备。
- **一手来源**：[Apache TVM MetaSchedule: Search-Based Auto-Tuning](https://tvm.apache.org/docs/deep_dive/tensor_ir/tutorials/meta_schedule.html)。**证据等级 A**。
- **课程映射**：`docs/inference-acceleration.md`、`docs/lab-inference-acceleration.md`、`docs/lab-profiling.md`。
- **与第一轮去重**：第一轮 `RTA-23` 是 TensorRT 重复 tactic 搜索导致构建慢；本条是 TVM 已有调优记录未命中 / 未应用，主要症状是最终 kernel 仍未优化。

### ECO-05：复用同一个 ncnn Extractor，后续图片仍得到第一次结果

- **生态 / 平台**：ncnn CPU / Vulkan。
- **问题现象**：连续输入不同图片，输出却一直像第一张；模型和预处理单次运行均正确。
- **常见原因**：`Extractor` 保存一次运算实例的中间结果；官方 FAQ 把“总是输出第一张图的结果”直接指向复用 Extractor。`Net` 可共享，但每次独立推理应使用独立 Extractor。
- **最小诊断证据**：记录每次输入 hash、Extractor 地址 / 创建位置和输出 hash；用“每请求新建 Extractor”做 A/B；不要先改模型权重或后处理。
- **解决 / 规避方案**：`Net` 初始化一次并共享；每次请求创建新的 `Extractor`，多线程时每个并发推理使用独立实例。
- **适用边界 / 副作用**：新建 Extractor 不等于重新加载模型，开销通常远小于重建 `Net`；并发时仍需为 allocator 和线程配置做目标机压测。
- **一手来源**：[ncnn FAQ](https://ncnn.readthedocs.io/en/latest/faq.html)；[ncnn tips and tricks](https://ncnn.readthedocs.io/en/latest/developer-guide/ncnn-tips-and-tricks.zh.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/troubleshooting-index.md`、`docs/lab-local-service.md`。
- **与第一轮去重**：第一轮没有“推理实例缓存导致跨请求陈旧输出”的生命周期问题；它不是模型数值误差或普通冷启动。

### ECO-06：用外部指针构造 ncnn Mat 后，调用方释放 / 改写了底层内存

- **生态 / 平台**：ncnn C++ API。
- **问题现象**：异步或稍后推理时随机崩溃、输出漂移；换成内部复制后恢复。问题常在函数返回、容器扩容或下一帧覆盖输入后出现。
- **常见原因**：从外部 `void*` 构造的 `ncnn::Mat` 只是引用该内存，并不会接管或自动释放；底层 buffer 的有效期短于 Mat / 推理使用期。
- **最小诊断证据**：记录 Mat `data` 指针、外部 buffer 所有者与生命周期；启用 ASan；比较直接引用与 `.clone()`；在覆盖原 buffer 前后核对输入 hash。
- **解决 / 规避方案**：保证外部 buffer 活到最后一次使用完成；跨线程 / 异步或所有权不清时使用 `.clone()` 转移到独立存储；用 RAII 明确所有者。
- **适用边界 / 副作用**：clone 增加一次拷贝和峰值内存；零拷贝路线可以保留，但必须把同步点与生命周期写进接口契约。
- **一手来源**：[ncnn official FAQ: convert float data to ncnn::Mat](https://github.com/Tencent/ncnn/wiki/faq.en)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮的 external data 是 ONNX 多文件权重完整性；本条是进程内输入 buffer 所有权和生命周期，不是模型文件缺失。

### ECO-07：模型加载后才设置 `use_vulkan_compute`，ncnn 实际禁用 GPU

- **生态 / 平台**：ncnn Vulkan。
- **问题现象**：日志出现 `set_vulkan_compute failed, network use_vulkan_compute disabled`；程序仍能出结果，但性能接近 CPU。
- **常见原因**：Vulkan 选项在 `load_param` / `load_model` 后才设置，网络加载阶段没有按 Vulkan 路径准备 pipeline 和资源。
- **最小诊断证据**：保存 option 设置与模型加载的调用顺序、完整日志、`get_gpu_count()`、CPU / Vulkan A/B；确认不是“设备不支持 Vulkan”后再改顺序。
- **解决 / 规避方案**：创建 `Net` 后、加载 param / model 前设置 `net.opt.use_vulkan_compute = true`；初始化失败时明确回退并记录 backend。
- **适用边界 / 副作用**：调整顺序不能修复缺驱动、无 Vulkan 设备或不支持算子；GPU 路线仍需端到端基准，不能由日志成功推断一定更快。
- **一手来源**：[ncnn official FAQ](https://github.com/Tencent/ncnn/wiki/faq.en)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`。
- **与第一轮去重**：第一轮 `RTA-02` 是 delegate 因模型类型 / 算子不支持而拒绝；本条是 ncnn 初始化调用顺序导致 GPU 网络根本未建立。

### ECO-08：ncnn 已启用 Vulkan，CPU 仍高占用并出现帧延迟抖动

- **生态 / 平台**：ncnn Vulkan + OpenMP，移动端 big.LITTLE CPU。
- **问题现象**：GPU 在工作，但 CPU 长时间高占用，UI 掉帧或推理尾延迟抖动；减少 GPU kernel 时间后端到端体验仍没有改善。
- **常见原因**：param / bin 加载及 GPU 上传前后的 FP32↔FP16 转换仍在 CPU 上使用 OpenMP；线程池用 spinlock 等待，默认 spin 时间可让空闲线程继续占 CPU。
- **最小诊断证据**：同时记录 CPU 每线程占用、GPU 时间、模型加载 / 转换 / 推理分账、`num_threads`、`openmp_blocktime`、OMP runtime 与核心绑定；做 OpenMP on/off 和 blocktime A/B。
- **解决 / 规避方案**：减少线程数；按 big / little 核绑定；降低 `openmp_blocktime` 或使用 `OMP_WAIT_POLICY=PASSIVE`；Vulkan 主路径且 CPU 并行无收益时评估 `NCNN_OPENMP=OFF`。
- **适用边界 / 副作用**：更少线程或被动等待可能降低 CPU 路径峰值吞吐；`set_kmp_blocktime` 仅对特定 OpenMP 实现有效，需按实际 runtime 选择。
- **一手来源**：[ncnn OpenMP best practice](https://ncnn.readthedocs.io/en/latest/how-to-use-and-FAQ/openmp-best-practice.html)。**证据等级 A**。
- **课程映射**：`docs/inference-acceleration.md`、`docs/lab-profiling.md`、`docs/lab-local-service.md`。
- **与第一轮去重**：第一轮 `RTA-17` 是 LLM 服务的 tokenizer / scheduler CPU 饥饿；本条是 ncnn OpenMP spin-wait 与 Vulkan 数据转换造成的端侧 CPU 占用。

### ECO-09：MNN 改了输入 shape，却没有重新规划 Session 内存

- **生态 / 平台**：MNN CPU / GPU Session API。
- **问题现象**：新尺寸输入复制失败、输出 shape 仍旧、推理报错或结果异常；改完 shape 后继续使用之前取得的 output Tensor 指针时尤为常见。
- **常见原因**：只调用 `resizeTensor`，没有随后调用 `resizeSession` 做预推理、内存分配与复用；官方 API 还要求输入 resize 后重新取得 output buffer。
- **最小诊断证据**：保存旧 / 新 input 与 output shape、`resizeTensor` / `resizeSession` 调用顺序、每次返回码，以及 resize 前后 Tensor 地址。
- **解决 / 规避方案**：更新全部动态输入后调用一次 `resizeSession`，再重新获取 input / output Tensor 并填充数据；用最小、常用、最大 shape 做回归。
- **适用边界 / 副作用**：频繁 resize 可能触发重新规划、GPU 调优或缓存更新，造成延迟尖峰；shape 集合有限时应做 bucket / session 复用。
- **一手来源**：[MNN official Session API](https://github.com/alibaba/MNN/wiki/session)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮动态 shape 条目关注导出约束、TensorRT profile 或 OpenVINO plugin；本条是 MNN Session resize 后的内存重规划与 Tensor 句柄失效。

### ECO-10：MNN 的中间 Tensor 在下一步执行中被复用覆盖

- **生态 / 平台**：MNN Session。
- **问题现象**：回调或调试代码拿到某层中间 Tensor 后，稍后再读内容已经变化；最终输出正确，但逐层比对与业务分支读取异常。
- **常见原因**：MNN 为节省内存会复用 outputs 之外的 Tensor 存储；未通过 `saveTensors` 声明保留的中间结果不具备长期有效性。
- **最小诊断证据**：记录 Tensor 名、读取时点、指针和 hash；比较加入 / 不加入 `saveTensors`；在回调内立即复制一份作为对照。
- **解决 / 规避方案**：只对确需跨阶段使用的中间 Tensor 配置 `saveTensors`，或在有效回调窗口内复制；生产路径不要依赖未声明的中间 buffer 生命周期。
- **适用边界 / 副作用**：保留或复制中间结果会增加峰值内存和拷贝；大量保存还可能破坏框架原有内存复用收益。
- **一手来源**：[MNN official Session API](https://github.com/alibaba/MNN/wiki/session)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/04-accuracy-repair.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮逐层数值比对默认张量可稳定读取；本条补的是 MNN 中间结果的存储生命周期，避免把被覆盖的数据误判为数值漂移。

### ECO-11：MNN GPU 调优缓存未覆盖新 shape，冷启动反复出现

- **生态 / 平台**：MNN OpenCL / Metal 等 GPU backend。
- **问题现象**：首次初始化很慢；切换输入尺寸后又出现长时间 tuning / program compile；已有 cache 文件却没有覆盖当前 shape。
- **常见原因**：更高 tuning 级别用更长初始化换稳态性能；缓存需要显式保存 / 更新。官方文档要求有限多 shape 在每次 `resizeSession` 后更新 cache，无限随机 shape 则建议关闭 GPU tuning。
- **最小诊断证据**：保存 GPU mode、shape 序列、cache 路径 / hash / mtime、每次 session / module load 时间和稳态推理时间；分别测空 cache、命中 cache、新 shape。
- **解决 / 规避方案**：有限 shape 做 bucket，并在每个 bucket resize 后 `updateCacheFile` / `updateCache`；部署时把 cache 与模型、设备和 runtime 版本绑定；无界随机 shape 使用 `MNN_GPU_TUNING_NONE` 建立可预测基线。
- **适用边界 / 副作用**：关闭 tuning 可能降低稳态性能；高强度 tuning 增加首次准备时间；缓存不能假定跨 GPU / 驱动 / MNN 版本可移植。
- **一手来源**：[MNN official Session API](https://github.com/alibaba/MNN/wiki/session)；[MNN Module API](https://mnn-docs.readthedocs.io/en/latest/inference/module.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-profiling.md`、`docs/lab-local-service.md`。
- **与第一轮去重**：第一轮 `RTA-19` 只区分服务冷 / 热请求；本条是 MNN GPU autotuning 与 shape-keyed cache 的具体持久化问题。

### ECO-12：MNN 同时设置 `numThread` 和 GPU `mode`，后写入者覆盖前者

- **生态 / 平台**：MNN `ScheduleConfig`。
- **问题现象**：切换 CPU / GPU 配置后线程数异常、GPU tuning 或 memory mode 与代码不符，重复实验结果难以解释。
- **常见原因**：`numThread` 与 `mode` 是同一个 union 的两个视图，共用一片内存；两者都赋值时，后一次写入会覆盖前一次。
- **最小诊断证据**：记录 `config.type`、最后一次赋值顺序和 union 原始整数值；CPU 路线打印 `numThread`，GPU 路线以十六进制拆解 tuning / memory bitmask。
- **解决 / 规避方案**：先确定 backend；CPU 只设置 `numThread`，GPU 只设置 `mode`，不要在同一配置对象中重复赋值；切换 backend 时重新初始化配置。
- **适用边界 / 副作用**：这是 MNN C++ API 的具体数据结构约束；封装层可能隐藏 union，但仍要核对最终传入值。
- **一手来源**：[MNN official Session API](https://github.com/alibaba/MNN/wiki/session)。**证据等级 A**。
- **课程映射**：`docs/environment-matrix.md`、`docs/06-runtime-deployment.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮没有“同一配置内存被两个 backend 字段互相覆盖”的 API 级问题。

### ECO-13：Arm NN 动态 backend 文件存在，却没有被 Runtime 加载

- **生态 / 平台**：Arm NN dynamic backend。
- **问题现象**：部署目录里已有 backend `.so`，但注册列表中缺失，运行回到其他 backend 或优化阶段找不到指定 backend；进程可能只给 warning 而不退出。
- **常见原因**：扫描路径不是存在的绝对目录、文件名不符合 `<vendor>_<name>_backend.so[.version]`、backend ID 重复，或 `GetVersion()` 声明的 Backend API 与当前 Arm NN ABI 不兼容。
- **最小诊断证据**：保存 dynamic backend 扫描路径、文件名 / symlink、loader warning、已注册 backend 列表、`GetBackendId/GetVersion` 和 Arm NN runtime 版本；用 `ldd` / loader 日志排除依赖缺失。
- **解决 / 规避方案**：按官方命名放到有效绝对路径；用当前 Arm NN Backend API 重新构建不兼容 backend；启动验收必须显式检查 backend registry，而不是只看 `.so` 存在。
- **适用边界 / 副作用**：动态 backend 与 Arm NN ABI 版本耦合；重新构建和分设备打包增加发布矩阵，强制 fail-fast 会降低 fallback 可用性。
- **一手来源**：[Arm NN Backend Developer Guide](https://arm-software.github.io/armnn/latest/md_src_backends__r_e_a_d_m_e.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮 `DEV-15` 是 backend 已加载但只接管部分图；本条是 backend 插件在注册前就因路径、命名或 ABI 被跳过。

### ECO-14：Arm NN 开启 FastMath 后更快，但输出误差扩大

- **生态 / 平台**：Arm NN `GpuAcc` / `CpuAcc`。
- **问题现象**：打开 `FastMathEnabled` / `enable-fast-math` 后延迟下降，但与基线的 max error、分类边界或下游任务指标发生变化。
- **常见原因**：FastMath 允许支持它的 compute backend 使用更激进的数学路径；最新官方文档还说明，在权重 / bias 为 FP16、层为 FP32 的模型上会自动启用 `reduceFp32ToFp16`。它是性能选项，不是数值等价保证。
- **最小诊断证据**：固定 backend、输入和线程，仅切换 FastMath；保存逐层 / 最终输出误差、任务指标和 kernel profiling；同时记录是否另有 FP16 / BF16 放宽。
- **解决 / 规避方案**：先以 FastMath 关闭建立正确性基线；只在任务阈值通过后启用；敏感模型保留严格路径，或对关键子图使用更高精度 backend。
- **适用边界 / 副作用**：关闭 FastMath 可能损失性能；误差大小依模型、算子和 backend 而变，不能引用单一容差作为所有模型的保证。
- **一手来源**：[Arm NN Runtime Options](https://arm-software.github.io/armnn/latest/runtimeoptions.html)。**证据等级 A**。
- **课程映射**：`docs/inference-acceleration.md`、`docs/04-accuracy-repair.md`、`docs/lab-inference-acceleration.md`。
- **与第一轮去重**：第一轮 `TRT-03` 是 TensorRT FP16 / INT8 的表示范围和校准误差；本条是 Arm NN FastMath 的近似数学实现开关。

### ECO-15：ExecuTorch 动态维没有真实上界，静态内存 arena 只按样例尺寸规划

- **生态 / 平台**：ExecuTorch core runtime / memory planning。
- **问题现象**：导出的 `.pte` 在样例 shape 上运行，换到更大的合法输入后出现 planned buffer 不足、分配 / 执行失败；设备明明预留了内存，Method 的静态计划却不够。
- **常见原因**：动态维没有标注 `ValueRange`，或仍使用将 example input 当上界的 HintBased shape evaluation；最终 fixed-size arena 没有按真实最大 shape 规划。
- **最小诊断证据**：保存 `torch.export` dynamic shape / `Dim(min,max)` 定义、示例与失败 shape、memory-planning inspection、`MethodMeta` 中各 planned buffer 大小和 runtime 错误。
- **解决 / 规避方案**：为每个动态维声明真实 `ValueRange`，使用推荐的 `ValueRangeBasedSymShapeEval` 做 upper-bound planning；以 min / common / max shape 在目标设备验收。
- **适用边界 / 副作用**：更宽上界会直接扩大静态 arena；数据依赖输出可能仍需 client `MemoryAllocator`，不能只靠输入 shape 上界解决。
- **一手来源**：[ExecuTorch Memory Planning](https://docs.pytorch.org/executorch/stable/compiler-memory-planning.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/inference-acceleration.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮 TensorRT / OpenVINO 动态 shape 是 backend profile / plugin 编译边界；本条是 ExecuTorch AOT 固定 arena 的符号上界规划。

### ECO-16：ExecuTorch `.pte` 已下放 Vulkan，应用却报 backend 未注册

- **生态 / 平台**：ExecuTorch Vulkan。
- **问题现象**：运行时报 `Backend VulkanBackend is not registered`，即使导出时已经用 Vulkan partitioner 生成 `.pte`。
- **常见原因**：应用构建时未打开 `EXECUTORCH_BUILD_VULKAN`、没有链接 `vulkan_backend` / `executorch_backends`，或静态链接器把只靠注册副作用引用的代码裁掉。
- **最小诊断证据**：保存 exact error、CMake cache、最终 link map / 依赖库、runtime backend registry 和 `.pte` 的 delegate 信息。
- **解决 / 规避方案**：构建时启用 Vulkan；链接对应 backend target；按官方要求用 `--whole-archive` 等等价方式保留注册对象；启动 smoke test 显式列出 backend registry。
- **适用边界 / 副作用**：whole-archive 可能增大二进制；backend 成功注册只证明可调用，算子覆盖和实机性能仍需另验。
- **一手来源**：[ExecuTorch Vulkan Troubleshooting](https://docs.pytorch.org/executorch/stable/backends/vulkan/vulkan-troubleshooting.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮 `DEV-15` 是 delegate 分区覆盖不足；本条是链接器 / 静态注册导致整个 backend 不存在。

### ECO-17：ExecuTorch Vulkan 算子都支持，仍因表示不兼容插入大量 copy

- **生态 / 平台**：ExecuTorch Vulkan。
- **问题现象**：没有明显 unsupported op，图也已委托 Vulkan，但 profile 中 copy / layout conversion 很多，延迟仍高。
- **常见原因**：相邻算子虽然各自受支持，却不支持同一种 memory layout 或 storage type；backend 为满足下一算子要求插入转换和复制。
- **最小诊断证据**：保存 ExecuTorch profiling / ETDump、每个 graph break、copy / layout-conversion 事件、张量 layout / storage type，以及 CPU / Vulkan 端到端对照。
- **解决 / 规避方案**：定位复制最多的边界；优先统一连续子图的 layout / storage；改写阻断算子或只委托收益为正的子图；以 copy 字节数和端到端时间验收。
- **适用边界 / 副作用**：改 layout 可能引入其他算子的慢路径或数值变化；官方文档只给故障机制，具体修图收益必须在目标 GPU 上复测。
- **一手来源**：[ExecuTorch Vulkan Troubleshooting](https://docs.pytorch.org/executorch/stable/backends/vulkan/vulkan-troubleshooting.html)。**证据等级 A**。
- **课程映射**：`docs/inference-acceleration.md`、`docs/lab-profiling.md`、`docs/06-runtime-deployment.md`。
- **与第一轮去重**：第一轮 `RTA-03/LRT-02` 是 CPU 与加速器分区往返；本条即使仍在 Vulkan backend 内，也会因 layout / storage representation 插入复制。

### ECO-18：ExecuTorch QNN context binary 比 APK 内的 QNN runtime 更新

- **生态 / 平台**：ExecuTorch Qualcomm QNN / Android。
- **问题现象**：设备日志出现 `Qnn API version ... is mismatched`、`Using newer context binary on old SDK`、`Can't create context from binary. Error 5000`。
- **常见原因**：模型 / context binary 用 QNN SDK 版本 X 编译，APK 实际打包了版本 Y 的 QNN runtime；context binary 不是跨版本通用制品。
- **最小诊断证据**：保存编译端 QNN SDK 版本、APK dependency tree / 实际 so 版本、context / `.pte` hash、目标 SoC 和完整 `adb logcat` 的 `ExecuTorch` 标签日志。
- **解决 / 规避方案**：让 Gradle 中 QNN runtime 与编译 SDK 匹配，或用 APK 所带 runtime 对应 SDK 重新编译模型；把 SDK/runtime/SoC 写进制品 manifest。
- **适用边界 / 副作用**：升级 APK runtime 可能改变其他模型兼容性；重编译后的 context 仍需在每类目标 SoC 实测，文档中的版本号只是示例。
- **一手来源**：[ExecuTorch Qualcomm AI Engine Backend: Common Issues](https://docs.pytorch.org/executorch/stable/backends-qualcomm.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`、`docs/troubleshooting-index.md`。
- **与第一轮去重**：第一轮 `DEV-21` 是 ORT QNN wrapper 与外部 `.bin` 配对；本条是 ExecuTorch QNN context binary 与 runtime API / SDK 的二进制兼容性。

### ECO-19：WebGPU buffer 仍处于 mapped 状态就提交给 GPU

- **生态 / 平台**：浏览器 WebGPU。
- **问题现象**：`queue.submit()` 或使用该 buffer 的命令触发 validation error；或者每帧 `mapAsync -> 写入 -> submit` 出现明显串行等待，GPU 利用率呈空洞。
- **常见原因**：mapped `GPUBuffer` 对 GPU 来说处于 unavailable 状态，必须 `unmap()` 后才能进入 Queue timeline；`MAP_READ/MAP_WRITE` 还只能与受限的 COPY usage 组合，不能把同一 buffer 同时当任意 storage buffer 使用。
- **最小诊断证据**：保存 `buffer.mapState`、创建时 usage flags、`uncapturederror` / error scope、map / unmap / submit 时序和每帧等待；比较直接 `queue.writeBuffer`、staging buffer 与逐帧 map 的时间线。
- **解决 / 规避方案**：提交前显式 `unmap()`；将 CPU 更新与 GPU 计算分离为 staging / device buffer，或使用 `queue.writeBuffer`；连续帧用 ring buffer 避免等待同一资源回收，readback 使用独立 `MAP_READ | COPY_DST` buffer。
- **适用边界 / 副作用**：staging 与 ring buffer 增加显存和复制；`queue.writeBuffer` 至少包含一次额外拷贝，不保证所有数据规模都更快，需按真实帧大小实测。
- **一手来源**：[WebGPU specification: Buffer Mapping](https://gpuweb.github.io/gpuweb/#buffer-mapping)；[WebGPU Explainer: Buffer Mapping](https://gpuweb.github.io/gpuweb/explainer/)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/inference-acceleration.md`、`docs/lab-profiling.md`。
- **与第一轮去重**：第一轮没有浏览器 GPUBuffer 的 map-state / usage 状态机问题；它不是 unsupported op fallback，也不是 CUDA allocator 碎片。

### ECO-20：同步创建 WebGPU pipeline，把编译卡顿推迟到首次提交

- **生态 / 平台**：浏览器 WebGPU。
- **问题现象**：模型加载阶段看似很快，但第一次 `submit` / 推理突然卡顿；主线程或 GPU queue timeline 被 shader / pipeline 编译阻塞。
- **常见原因**：立即式 `createComputePipeline()` 返回对象不代表底层编译已经完成，规范允许停顿发生在创建、首次 setPipeline、finish 或 submit 等时点。
- **最小诊断证据**：分别记录 shader module、pipeline 请求、Promise 完成、首次 submit 和首次完成时间；保存 `getCompilationInfo()` / pipeline error；比较同步与异步创建。
- **解决 / 规避方案**：优先使用 `createComputePipelineAsync()` 并等待其完成后再标记模型 ready；预建常用 pipeline，benchmark 将编译与稳态执行分开。
- **适用边界 / 副作用**：异步 API 不会消除编译成本，只把完成点变得可观察、避免阻塞 queue timeline；大量预建 pipeline 会增加启动时间和内存。
- **一手来源**：[GPUDevice `createComputePipelineAsync`](https://gpuweb.github.io/types/interfaces/GPUDevice.html)。**证据等级 A**。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-profiling.md`、`docs/lab-local-service.md`。
- **与第一轮去重**：第一轮 `RTA-19` 是通用服务 warm-up；本条是 WebGPU pipeline API 明确允许把编译 stall 延迟到首次 queue 使用，需用 async Promise 划定 ready。

### ECO-21：WebNN 使用 ArrayBuffer 输入输出，GPU 每次自动上传再下载

- **生态 / 平台**：WebNN GPU context。
- **问题现象**：算子执行很快，端到端延迟却被输入 / 输出拷贝主导；大张量或连续帧尤其明显。
- **常见原因**：W3C WebNN 规范说明，GPU context 接收系统内存 `ArrayBufferView` 时，会自动上传输入到 GPU，并在图结束时把 output 下载回系统内存；每次 dispatch 都可能重复这个循环。
- **最小诊断证据**：记录 input / output 字节数、输入输出对象类型、上传 / graph / readback 分账；比较系统内存 ArrayBuffer 路线与同 context 的 `MLTensor` / GPU-resident 数据路线。
- **解决 / 规避方案**：能复用时让输入、中间结果和下游图保持设备驻留；只在真正需要 JavaScript / CPU 消费结果时 read back；把预后处理合并进同一图或流水线。
- **适用边界 / 副作用**：设备驻留增加显存和生命周期管理；CPU context 不存在同一种 GPU 上传下载；最终 UI / JS 使用结果时仍不可避免一次 readback。
- **一手来源**：[W3C Web Neural Network API: Device Selection](https://www.w3.org/TR/webnn/)。**证据等级 A**。
- **课程映射**：`docs/inference-acceleration.md`、`docs/06-runtime-deployment.md`、`docs/lab-profiling.md`。
- **与第一轮去重**：第一轮分区拷贝来自 unsupported op 跨 CPU / 加速器切换；本条即使整图都在 WebNN GPU 执行，API 边界上的系统内存 I/O 仍可每次产生拷贝。

### ECO-22：只测 `MLContext.dispatch()` 返回时间，得到的是入队延迟

- **生态 / 平台**：WebNN CPU / GPU / NPU。
- **问题现象**：测得的“推理延迟”极低，甚至低于任何合理 kernel 时间；压力增加后 dispatch 仍快，但结果读取越来越慢。
- **常见原因**：WebNN `dispatch()` 异步提交并立即返回，本身不提供图执行完成信号；真实完成需要等 output tensor 可读，例如 `await context.readTensor(output)`。
- **最小诊断证据**：同一次请求分别记录 dispatch 前后、readTensor 完成和端到端时间；保存 warm-up、shape、设备偏好、并发与输出字节数；队列压力下观察两者差距。
- **解决 / 规避方案**：正确性 / 单请求延迟测试必须等待 output read 完成；吞吐测试明确区分 enqueue rate、completion rate 和端到端 percentile；不要在每个中间步骤强制 readback。
- **适用边界 / 副作用**：readTensor 计入必要的 readback，可能不是纯 kernel 时间；若只想测设备时间，需要实现 / 浏览器暴露的 profiling 支持，且必须与用户侧端到端指标并列。
- **一手来源**：[W3C Web Neural Network API](https://www.w3.org/TR/webnn/)。**证据等级 A**。
- **课程映射**：`docs/lab-profiling.md`、`docs/inference-acceleration.md`、`docs/lab-local-service.md`。
- **与第一轮去重**：第一轮 `RTA-21` 是 TTFT / ITL / E2E 指标定义混淆；本条是 WebNN 异步 API 导致把 enqueue 时间直接误报成执行时间。

## 覆盖与证据统计

| 生态 / 平台 | 条目数 |
| --- | ---: |
| MLC LLM | 2 |
| Apache TVM | 2 |
| ncnn | 4 |
| MNN | 4 |
| Arm NN | 2 |
| ExecuTorch | 4 |
| WebGPU / WebNN | 4 |
| **合计** | **22** |

| 证据等级 | 条目数 | 说明 |
| --- | ---: | --- |
| A | 22 | 官方文档、标准或官方仓库文档 |
| B | 0 | 未用维护者 issue / release 单独成条 |
| C | 0 | 未把社区复现单独作为结论 |

## 最值得优先吸收的 5 条

1. **ECO-15 ExecuTorch 动态上界内存规划**：把“支持动态 shape”与“固定 arena 必须按真实上界规划”连接起来，适合端侧内存课程主线。
2. **ECO-04 TVM 调优数据库未命中**：能纠正“有 tuning log 就已经加速”的误判，并提供 IR、数据库和 benchmark 三层证据。
3. **ECO-17 ExecuTorch Vulkan 表示转换 copy**：补齐“算子都支持仍可能慢”的关键路径，区别于普通 CPU fallback。
4. **ECO-09 MNN resize 后句柄与内存计划失效**：现象具体、最小复现简单，适合进入 Runtime 排障索引。
5. **ECO-22 WebNN 异步 dispatch 误测**：直接关系浏览器端 benchmark 可信度，可复用为所有异步 runtime 的计时检查卡。

## 进入课程前仍需验证

- 所有条目当前都是来源驱动的“候选问题”，尚无本课程设备日志；至少为优先 5 条各做一个最小复现后再写成课程结论。
- MLC LLM、TVM、MNN、Arm NN、ExecuTorch 和 WebNN API 都在演进；正式吸收时应固定工具版本、设备 / 浏览器版本和构建参数。
- 性能修复必须同时保留数值 / 任务回归。减少 copy、开启 FastMath、改变 chunk 或关闭 tuning 都可能把成本转移到精度、内存、TTFT 或稳态吞吐。
- WebGPU / WebNN 的设备能力与实现支持受浏览器、OS、GPU driver 和隐私策略影响，标准支持不等于所有用户环境已实现。
