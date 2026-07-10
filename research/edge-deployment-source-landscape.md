# 边缘部署问题资料池：来源地图与证据口径

> 统计日期：2026-07-10。本页回答“这些问题从哪里来、哪些来源可以支撑课程结论、还缺哪些生态”。它是研究资料，不是课程正文。

## 当前规模

- 第一轮形成 86 条原始记录，合并 3 个直接重复簇后为 83 个独立问题族。
- 第二轮向端侧 Runtime、芯片/NPU 平台和生产运维继续扩展，新增 66 条平台专属问题记录；没有发现需要与第一轮直接合并的同义重复。
- 两轮合计 **152 条原始记录、149 个独立问题族**。
- 7 份问题卡共引用 **192 个唯一 URL、28 个来源域名**；第一轮为 112 个 URL / 19 个域名，第二轮净增 80 个 URL / 9 个域名。
- 这些数字表示“问题证据池”的来源，不把课程推荐阅读、搜索结果页或没有形成问题卡的线索混入统计。

## 来源分层

| 来源层 | 本资料池中的代表来源 | 主要用途 | 能否单独支撑课程结论 |
| --- | --- | --- | --- |
| Runtime / SDK 官方文档 | NVIDIA TensorRT/Jetson、PyTorch/ExecuTorch、ONNX/ONNX Runtime、LiteRT/TFLM、Core ML、OpenVINO、vLLM、llama.cpp | 算子支持、版本边界、配置语义、内存和线程约束 | 可以，记为 A 级，但版本敏感结论仍须锁定版本 |
| 扩展端侧 Runtime 官方资料 | [MLC LLM](https://llm.mlc.ai/docs/compilation/compile_models.html)、[Apache TVM](https://tvm.apache.org/docs/arch/runtimes/vulkan.html)、[ncnn](https://ncnn.readthedocs.io/en/latest/faq.html)、MNN、Arm NN、WebGPU/WebNN | 浏览器、移动端和嵌入式 Runtime 的编译、缓存、对象生命周期与数据搬运 | 可以，记为 A 级 |
| 芯片 / NPU 官方资料 | Qualcomm QNN/HTP、[Arm Ethos-U/Vela](https://gitlab.arm.com/artificial-intelligence/ethos-u/ethos-u-vela/-/blob/4.5.0/PERFORMANCE.md)、Rockchip RKNN、Intel NPU、Hailo/Raspberry Pi、[Coral Edge TPU](https://coral.ai/docs/edgetpu/compiler/) | 编译产物与芯片匹配、驱动/固件/SDK 矩阵、总线和片上存储限制 | 可以，记为 A 级；只能外推到来源明确覆盖的芯片与版本 |
| 标准与原始论文 | ONNX、WebGPU/WebNN 规范、arXiv、ACL Anthology、PMLR | 格式语义、量化/蒸馏/压缩方法的机制和实验边界 | 可以，记为 A 级；论文中的具体收益不能直接外推到课程设备 |
| 官方仓库 issue / PR / release | llama.cpp、vLLM、TensorRT、OpenVINO Model Server 等维护者记录 | 确认真实回归、修复版本和维护者认可的根因 | 只有已闭环根因、合并修复或明确 release note 才记为 B 级 |
| 课程、教材和 benchmark | MIT EfficientML、ML Systems Book、Jetson AI Lab、Microsoft EdgeAI for Beginners、[MLPerf Tiny](https://mlcommons.org/benchmarks/inference-tiny/)、Edge Impulse | 发现问题、组织教学顺序、校准 benchmark 字段 | 只作发现与结构参考，不单独证明某个故障根因 |
| 社区实践 | 技术博客、论坛、问答、未确认 issue | 提供检索词和复现线索 | 不能单独进入课程结论；必须回到 A/B 级来源交叉确认 |

## 192 个一手来源的域名分布

| 域名 | 唯一 URL | 主要覆盖 |
| --- | ---: | --- |
| `github.com` | 29 | 官方仓库文档、维护者 issue/PR/release、芯片工具链 |
| `docs.nvidia.com` | 28 | TensorRT、Jetson、CUDA/DLA |
| `docs.pytorch.org` | 23 | PyTorch 导出/量化/编译、ExecuTorch |
| `onnxruntime.ai` | 17 | 量化、Execution Provider、线程/内存、安全 |
| `arxiv.org` | 12 | 量化、剪枝、蒸馏与推理方法原始论文 |
| `docs.openvino.ai` | 11 | OpenVINO、Intel NPU、OVMS |
| `docs.vllm.ai` | 10 | KV Cache、调度、服务化与安全配置 |
| `developers.google.com` | 10 | LiteRT 移动端与 GPU delegate |
| `apple.github.io` | 7 | Core ML Tools 转换与优化 |
| `ai.google.dev` | 6 | LiteRT/TFLM 模型、算子和 MCU runtime |
| `coral.ai` | 5 | Edge TPU compiler、runtime、USB 部署 |
| `arm-software.github.io` | 4 | Arm NN 生命周期、API 与版本配对 |
| `onnx.ai` | 3 | ONNX 规范与 external data |
| `ncnn.readthedocs.io` | 3 | ncnn 生命周期、Vulkan 与 OpenMP |
| `gpuweb.github.io` | 3 | WebGPU 设备限制和异步执行语义 |
| `gitlab.arm.com` | 3 | Ethos-U Vela 配置、存储与优化 |
| `tvm.apache.org` | 2 | TVM Vulkan 与 MetaSchedule |
| `pytorch.org` | 2 | PyTorch 量化入口与官方说明 |
| `nvidia.github.io` | 2 | NVIDIA 推理工具补充资料 |
| `llm.mlc.ai` | 2 | MLC 模型编译和运行配置 |
| `huggingface.co` | 2 | 模型/序列化与安全边界 |
| `aclanthology.org` | 2 | 蒸馏原始论文 |
| `www.w3.org` | 1 | WebNN 规范 |
| `www.tensorflow.org` | 1 | TensorFlow 模型优化 |
| `proceedings.mlr.press` | 1 | 原始论文 |
| `mnn-docs.readthedocs.io` | 1 | MNN Runtime 配置 |
| `developer.apple.com` | 1 | Apple 平台部署约束 |
| `developer.android.com` | 1 | Android 平台接口与迁移 |
| **合计** | **192** | **28 个域名** |

## 第二轮具体补了什么

| 扩展线 | 新增记录 | 唯一来源 URL | 新增覆盖 |
| --- | ---: | ---: | --- |
| 更多端侧 Runtime | 22 | 19 | MLC/TVM、ncnn、MNN、Arm NN、ExecuTorch 深层 backend、WebGPU/WebNN |
| 芯片、NPU 与边缘硬件 | 20 | 23 | QNN/HTP、Ethos-U/Vela、RKNN、Intel NPU、Hailo/Raspberry Pi、Coral Edge TPU |
| 真实运维与维护者闭环 | 24 | 38 | 并发对象、探针、缓存、热更新、模型包兼容、日志隐私、鉴权与供应链 |
| **合计** | **66** | **80** | 从“模型能否运行”扩展到“设备上是否真实加速、能否长期安全运行” |

第二轮不是把同一个 fallback/OOM 问题换平台重写。每条必须新增至少一个平台专属的失败条件、诊断证据或解决参数；只有上位机制相似、但无法共用诊断入口的条目，才作为“通用模式的不同平台实例”并列保留。

## 证据准入门槛

1. **A 级**：官方文档、标准、原始论文。记录适用平台、版本、前置条件和副作用。
2. **B 级**：官方仓库中的维护者 issue/PR/release。只收根因已确认、修复已合并或发布说明明确列出的回归。
3. **C 级**：可复现实践。不能单独定论，必须至少有一条 A/B 证据交叉支持。
4. 未闭环的 open/stale issue、论坛转述、SEO 汇总、厂商营销页和缺少硬件/输入/质量口径的 benchmark，只进入“待复现线索”，不写成已知根因。
5. “能加载”“加速器被识别”“文件变小”都不是完成证据；问题卡应同时保留正确性/质量、节点分配、端到端性能和资源数据。

## 仍然存在的来源空白

- **MediaTek NeuroPilot/APU**：公开资料多为高层产品介绍，具体 compiler/runtime 失败边界常在合作伙伴门户或 NDA SDK 中；没有可靠公开证据时不硬凑。
- **Hailo Dataflow Compiler 深层错误**：公开 Model Zoo 与 Raspberry Pi 文档足以确认架构/版本问题，但 allocator、unsupported layer 等细节多需要开发者权限。
- **更多 MCU / 工业 NPU**：NXP eIQ、STM32Cube.AI、TI TIDL、Ambarella CVflow、Sophgo TPU-MLIR、Canaan nncase 等尚未形成正式问题卡，可作为下一轮定向扩展，而不是继续无边界铺开。
- **真实设备复现**：当前跨平台新条目多数是文档级证据。课程正文只能把课程实际设备复现过的条目标为“已实测”，其他应保留“扩展路线/未实测”。

## 对课程吸收的边界

- 资料池保留完整平台语境；课程正文优先抽象成“现象 → 最小证据 → 决策 → 副作用”的问题卡。
- 课程主线仍以 Qwen/GGUF/llama.cpp、Ubuntu/Jetson 和可复查 profiling 为中心；其他平台用于建立迁移能力，不把课程扩成 28 个厂商 API 手册。
- 每批吸收前先选择少量高价值条目做复现，再修改章节和排障索引；资料收集阶段不改侧栏和课程正文。
