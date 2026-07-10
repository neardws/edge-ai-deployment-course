# 边缘部署问题候选资料池：芯片、NPU 与边缘硬件平台

> 收集日期：2026-07-10。本文是第二轮资料池，不是课程正文。结论只覆盖来源明确写出的硬件、SDK 与版本；不能从一个 SoC 外推到整个厂商生态。

## 口径与去重方法

- 已逐项对照第一轮的 `QCP-*`、`KD/PX/OX/ORT/TRT/LRT/CML/OV-*`、`RTA-*` 与 `DEV-*`。本页不重复 Jetson 功耗/温度/内存/局部升级、LiteRT delegate、Core ML、OpenVINO 通用动态 shape/异构切图、QNN context cache/SSR 等既有条目。
- 也与并行第二轮 runtime 资料的 `ECO-13/14`（Arm NN dynamic backend/FastMath）和 `ECO-18`（ExecuTorch QNN context-runtime 版本）交叉核对；本页的 Arm NN 生命周期/ACL 配对与 QNN HTP/finalization 问题不与它们重叠。
- “新增”指第一轮没有记录该平台的**专属失败条件、诊断证据或生产边界**；相似的通用现象会在每条的“去重说明”中主动指出。
- 最小诊断证据应能区分“模型本身错误”“编译产物与目标不匹配”“加速器未真正执行”和“主机/总线/版本栈瓶颈”。
- 证据等级：**A** = 官方文档、标准或论文；**B** = 官方维护者 issue/release；**C** = 可复现实践，且必须有 A/B 交叉支持。本轮 20 条均达到 A。

## 一、Qualcomm QNN / HTP

### CHIP-01：浮点模型直接交给 QNN HTP，session 创建失败或并未得到预期 NPU 路径

- **平台/边界**：ONNX Runtime QNN EP 的 **HTP backend**；公开页面说明其测试范围包括 QNN 2.22.x 与 SC8280、SM8350、Snapdragon X，其他 QAIRT/QNN 与 SoC 组合必须另验。QNN GPU/CPU backend 不受“HTP 仅量化模型”这条限制。
- **现象**：FP32 权重/激活模型直接加载 HTP 失败；允许 CPU fallback 时，应用虽然能返回结果，但不能据此认定 HTP 已执行。
- **原因**：HTP backend 只接受量化模型；QNN EP 还要求静态 shape，并只覆盖其支持的 ONNX 算子子集。
- **最小诊断证据**：保存 ONNX 输入/权重 dtype 与 shape、QNN EP 初始化日志；诊断时设置 `session.disable_cpu_ep_fallback=1`，确认“不允许 CPU 后是否仍能建 session”。
- **方案**：在 x86-64 环境生成面向 QNN 的 QDQ 模型，固定真实部署 shape，使用代表性校准集；先以禁止 CPU fallback 的 smoke test 验证整图可接管，再恢复产品所需的降级策略。
- **边界/副作用**：固定 shape 会降低输入灵活性；量化可能引入精度损失；禁止 fallback 只适合验收，不一定适合要求可用性优先的生产请求。
- **一手来源 / 证据**：[ONNX Runtime QNN EP - Running a model with HTP backend](https://onnxruntime.ai/docs/execution-providers/QNN-ExecutionProvider.html#running-a-model-with-qnn-eps-htp-backend-python)（A）
- **课程映射**：[PTQ 与 QAT](../docs/02-ptq-qat.md)、[推理框架与部署链路](../docs/06-runtime-deployment.md)、[环境与版本矩阵](../docs/environment-matrix.md)
- **与第一轮去重**：第一轮 `QCP-007`/`RTA-01` 讨论通用浮点回落与 EP 覆盖；本条新增 HTP 的“量化模型 + 静态 shape”硬门槛及禁止 fallback 的验收法，不重复 `DEV-21/22` 的 context cache/SSR。

### CHIP-02：把 HTP graph finalization 设到最高优化级后，部署冷启动或编译时间异常长

- **平台/边界**：ONNX Runtime QNN EP 的 `htp_graph_finalization_optimization_mode`；具体收益随 QNN/QAIRT、模型和 SoC 变化。
- **现象**：同一模型 session 初始化远慢于默认配置，而稳态推理收益有限；开发迭代时每次启动都像“卡住”。
- **原因**：模式 `0` 是默认；`1` 以较快准备换较弱优化；`2`、`3` 依次投入更长 finalization 时间以争取更优图。
- **最小诊断证据**：把 session 创建、首次推理和 warm-run 分开计时，保存所用 mode、QNN EP profile 与最终稳态延迟；至少对 `0/1/2/3` 做同机同模型对照。
- **方案**：迭代期使用 `0` 或 `1`；发布候选再比较 `2/3` 的一次性准备成本与稳态收益，只有收益覆盖产品启动预算时才采用高档位。
- **边界/副作用**：降低 finalization 档位可能损失稳态性能；高档位是否值得不能由文档保证，必须在目标 SoC 上测。
- **一手来源 / 证据**：[ONNX Runtime QNN EP - Configuration options](https://onnxruntime.ai/docs/execution-providers/QNN-ExecutionProvider.html#configuration-options)（A）
- **课程映射**：[推理框架与部署链路](../docs/06-runtime-deployment.md)、[Profiling 实验](../docs/lab-profiling.md)
- **与第一轮去重**：第一轮 `RTA-19` 是通用首请求冷启动，`DEV-21` 是 context cache 文件配对；本条新增 QNN finalization 优化级本身的准备时间/稳态性能取舍。

## 二、Arm Ethos-U / Vela 与 Arm NN

### CHIP-03：Vela 使用默认或错误的 accelerator/system/memory 配置，估算很好但与板上性能不符

- **平台/边界**：Vela 4.5.0；Ethos-U55/U65/U85 的配置名称、MAC 数、SRAM 拓扑和带宽不能混用。
- **现象**：Vela 报告的周期、SRAM/DRAM 流量与实机差异很大，或产物按另一种 Ethos-U 配置生成。
- **原因**：`--accelerator-config` 标识目标 NPU；`--system-config` 与 `--memory-mode` 描述真实系统带宽和存储区。官方明确要求后两者正确描述目标嵌入式系统；内部默认值可能对目标无效。
- **最小诊断证据**：保留 Vela summary 中三项配置、Vela 版本、板级 Ethos-U 型号/MAC 配置、SRAM 大小/带宽，以及同输入的板上 PMU/周期数据。
- **方案**：由 BSP/芯片厂商配置文件或硬件设计参数建立唯一目标配置；构建脚本显式传三项参数，并把 summary 与实机 profiling 一起归档。
- **边界/副作用**：Vela 报告是基于配置的估算，不替代板上测量；修改配置可能改变调度、内存放置和产物，必须重新做数值与性能回归。
- **一手来源 / 证据**：[Vela 4.5.0 Performance - target configuration](https://gitlab.arm.com/artificial-intelligence/ethos-u/ethos-u-vela/-/blob/4.5.0/PERFORMANCE.md#accelerator-configuration)（A）、[Vela 4.5.0 options](https://gitlab.arm.com/artificial-intelligence/ethos-u/ethos-u-vela/-/blob/4.5.0/OPTIONS.md#configuration-file)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[Profiling 实验](../docs/lab-profiling.md)、[最终项目](../docs/final-project.md)
- **与第一轮去重**：第一轮 `DEV-01/02` 是 Jetson 功耗/温度导致的运行时漂移；本条是 Vela 离线编译的硬件拓扑描述错误。

### CHIP-04：Ethos-U 模型算子都能编译，但 arena cache 配置不对导致大量外部内存流量

- **平台/边界**：Vela 4.5.0；`--optimise Performance` 会使用 arena cache，`--optimise Size` 不使用该区域；可用 SRAM 大小由具体 MCU/SoC 设计决定。
- **现象**：NPU 算子覆盖率很高，延迟和能耗仍明显超预算，Vela 报告显示 DRAM 流量或 spill 偏高。
- **原因**：memory mode 的 `arena_cache_size` 未按板上可用 SRAM 设置，或为了体积选择 `Size` 策略后放弃 arena cache 的性能优化。
- **最小诊断证据**：保存 `--optimise`、`--memory-mode`、`--arena-cache-size`，比较 Vela 的 total SRAM/DRAM used 与带宽估算；在板上对同一产物记录 PMU 周期和外部内存流量。
- **方案**：以真实可用 SRAM 配置 arena cache；分别编译 `Performance`/`Size` 产物，按 flash、SRAM、延迟与能耗共同验收；若持续 spill，减小峰值中间张量或改网络结构。
- **边界/副作用**：扩大 arena cache 会占用其他固件/任务的 SRAM；Performance 产物可能更大；不能把模拟配置中的 SRAM 全量分给 NPU。
- **一手来源 / 证据**：[Vela 4.5.0 options - Optimisation strategy and Arena Cache Size](https://gitlab.arm.com/artificial-intelligence/ethos-u/ethos-u-vela/-/blob/4.5.0/OPTIONS.md#arena-cache-size)（A）
- **课程映射**：[推理加速基础](../docs/inference-acceleration.md)、[Profiling 实验](../docs/lab-profiling.md)
- **与第一轮去重**：第一轮 `DEV-13` 是 LiteRT Micro tensor arena 总量不足导致分配失败；本条是 Ethos-U/Vela 的 SRAM arena cache 放置与外存带宽问题，模型可以运行但性能失真。

### CHIP-05：新产品继续采用 Arm NN，却忽略项目已停止维护和安全更新

- **平台/边界**：Arm NN 官方 latest 文档当前明确标记为 legacy；不等于 Arm Compute Library、CMSIS-NN 或全部 Arm AI 软件均停止维护。
- **现象**：模型仍能运行，但团队期待后续算子、平台、安全修复；把来自不可信来源的模型直接交给无后续安全修复的 parser/runtime。
- **原因**：Arm NN 已不再由 Arm 主动维护，官方声明不会再提供安全补丁或功能改进，并建议只在可信环境使用。
- **最小诊断证据**：记录应用实际链接的 Arm NN 版本/commit、模型来源与信任边界、是否对模型签名/哈希验证，以及依赖漏洞扫描结果。
- **方案**：存量产品冻结并归档完整依赖，限制只加载可信、签名模型；新项目评估受维护的 LiteRT/ExecuTorch/ONNX Runtime 或芯片厂商 runtime，并做等价性能回归。
- **边界/副作用**：迁移 runtime 会改变算子覆盖、精度和性能；存量产品不必立即重写，但必须把风险当作产品生命周期决策。
- **一手来源 / 证据**：[Arm NN latest documentation - legacy notice](https://arm-software.github.io/armnn/latest/)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[推理框架与部署链路](../docs/06-runtime-deployment.md)
- **与第一轮去重**：第一轮 `DEV-10` 是 Android NNAPI 废弃迁移；本条新增 Arm NN 自身停止维护及“不可信模型”安全边界。

### CHIP-06：Arm NN 与 Arm Compute Library 随意混搭，构建时报缺枚举/字段或运行异常

- **平台/边界**：Arm NN 23.11 FAQ 记录的构建边界；不同 Arm NN release 对应的 Compute Library commit 应以该 release 脚本为准。
- **现象**：编译出现 ACL activation enum、字段或 API 不存在；单独看两个仓库都能构建，却组合失败。
- **原因**：Arm NN 与 Compute Library revision 不匹配；官方 FAQ 指向 `scripts/get_compute_library.sh` 中该版本的 `DEFAULT_CLFRAMEWORKREVISION`。
- **最小诊断证据**：保存 Arm NN tag/SHA、Compute Library SHA、编译器/ABI、首个编译错误；对照对应 release 脚本的默认 ACL revision。
- **方案**：使用 release 自带脚本锁定 ACL commit，把两者 SHA 写入 lockfile/镜像标签；升级时成对升级并重跑构建与数值测试。
- **边界/副作用**：锁定旧组合能恢复构建但不会获得新硬件/安全修复；不要仅靠改头文件绕过 ABI 不匹配。
- **一手来源 / 证据**：[Arm NN 23.11 FAQ - Arm NN and Compute Library revision mismatch](https://arm-software.github.io/armnn/23.11/md_docs__f_a_q.html)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮 `DEV-04` 是 JetPack/L4T 局部升级；本条是 Arm NN 与 ACL 的源码 revision 配对规则。

## 三、Rockchip RKNN / RKNPU2

### CHIP-07：RKNN Toolkit2、rknn_server 与板端 Runtime 不一致，模型转换成功却初始化失败

- **平台/边界**：RKNN SDK 2.3.2 用户指南；RK3562/3566/3568/3576/3588/RV1126B 使用 `librknnrt.so`，RV1103/1106 系列使用 `librknnmrt.so`；ARM64 直跑不需要 `rknn_server`，但仍依赖板端 runtime。
- **现象**：PC 侧导出 `.rknn` 成功，板端 `rknn_init`/远程评估失败，或报 server/runtime 缺失、版本不一致、model invalid。
- **原因**：Toolkit2、RKNN Server、Runtime/driver 是配套版本栈；官方要求保持 server、runtime 与 Toolkit2 一致。动态 shape 还要求 server/runtime 至少 1.5.0。
- **最小诊断证据**：保存 Toolkit2 日志；用 `strings` 查询 `rknn_server` 与 `librknnrt.so`/`librknnmrt.so` 版本；记录 `/sys/kernel/debug/rknpu/version` 或等价 driver version 与 SoC。
- **方案**：按板卡 BSP 支持矩阵成套更新 Toolkit2、server、runtime/driver；产物 metadata 固化版本和 target；升级后用官方样例与目标模型各做一次初始化/推理 smoke test。
- **边界/副作用**：第三方板卡 BSP 可能不能直接使用最新 runtime/driver；盲目替换 vendor 分区库有系统启动风险，应优先使用板厂提供的兼容包。
- **一手来源 / 证据**：[Rockchip RKNPU User Guide 2.3.2, sections 2.2.1-2.2.3](https://github.com/airockchip/rknn-toolkit2/blob/master/doc/02_Rockchip_RKNPU_User_Guide_RKNN_SDK_V2.3.2_EN.pdf)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮没有 RKNN 版本栈；它与 `DEV-04` 的 Jetson 包依赖相似，但诊断命令、组件和失败边界完全不同。

### CHIP-08：把 RKNN “dynamic shape” 当成任意尺寸，未登记尺寸的请求失败

- **平台/边界**：RKNN SDK 2.3.2；动态 shape 仅由 RK3562/3566/3568/3576/3588/RV1126B 支持，Toolkit2 与 runtime 至少 1.5.0。结论不能外推到未列出的 RKNPU1/RV 平台。
- **现象**：模型宣称支持动态输入，但只有若干尺寸能跑；多输入模型把合法尺寸交叉组合后仍失败。
- **原因**：RKNPU 硬件不支持任意 shape，转换时必须给出有限 shape 列表；多输入 shape 按列表位置一一配对，不能做笛卡尔组合。量化时还会用最大输入组校准并让全部 shape 共用量化参数。
- **最小诊断证据**：保存转换脚本的 `dynamic_input`；通过 `RKNN_QUERY_INPUT_DYNAMIC_RANGE` 导出每个输入的 shape 列表；记录请求 shape 及其在列表中的索引组合。
- **方案**：把生产尺寸收敛为明确 bucket，转换时逐组登记；入口先路由到合法 bucket；对每个 bucket 单独做精度/延迟回归，无法共享量化参数时拆成多个静态模型。
- **边界/副作用**：增加 bucket 会增加编译/测试成本；动态模型不支持 weight sharing 与 context reuse；拆模型会增加 flash/DDR 占用。
- **一手来源 / 证据**：[Rockchip RKNPU User Guide 2.3.2, section 5.4](https://github.com/airockchip/rknn-toolkit2/blob/master/doc/02_Rockchip_RKNPU_User_Guide_RKNN_SDK_V2.3.2_EN.pdf)（A）、[official dynamic-shape example](https://github.com/airockchip/rknn-toolkit2/tree/master/rknn-toolkit2/examples/functions/dynamic_shape)（A）
- **课程映射**：[推理框架与部署链路](../docs/06-runtime-deployment.md)、[精度恢复与回归分析](../docs/04-accuracy-repair.md)
- **与第一轮去重**：第一轮 `TRT-01/RTA-08` 是连续范围的 TensorRT optimization profile，`DEV-20` 是 OpenVINO 设备 plugin 动态维度；本条新增 RKNN 有限白名单、多输入位置配对和共享量化参数三项边界。

### CHIP-09：RKNN 零拷贝按原始 tensor size 分配，忽略 stride 后输出越界或图像错行

- **平台/边界**：RKNNRT API 2.3.2 的 native input/output 与 zero-copy 接口；stride/alignment 取决于具体 RKNPU 与 tensor layout。
- **现象**：普通 API 结果正确，改零拷贝后图像错位、输出尾部异常或出现 `size_with_stride larger than model origin size`；偶发覆盖相邻内存。
- **原因**：硬件 tensor 的每行可能有填充，`w_stride` 大于有效宽度，实际缓冲区需按 `size_with_stride` 而非逻辑 `size` 分配。
- **最小诊断证据**：用 `RKNN_QUERY_NATIVE_INPUT_ATTR`/`OUTPUT_ATTR` 保存 `dims/fmt/type/w_stride/size/size_with_stride`；记录实际分配字节数，并用 guard bytes 检查越界。
- **方案**：zero-copy 路径按 native attr 的 `size_with_stride` 创建/导入内存；逐行写入时使用硬件 stride；先与普通 API 的同输入输出做 hash/逐元素对照。
- **边界/副作用**：padding 会增加内存；native layout 可能需要额外预处理，错误地把 padding 当有效像素也会产生数值问题。
- **一手来源 / 证据**：[Rockchip RKNNRT API Reference 2.3.2 - `rknn_tensor_attr`](https://github.com/airockchip/rknn-toolkit2/blob/master/doc/04_Rockchip_RKNPU_API_Reference_RKNNRT_V2.3.2_EN.pdf)（A）、[official `rknn_api.h`](https://github.com/airockchip/rknn-toolkit2/blob/master/rknpu2/runtime/Linux/librknn_api/include/rknn_api.h#L298-L300)（A）
- **课程映射**：[推理加速基础](../docs/inference-acceleration.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮没有 NPU native stride/zero-copy buffer；它不是 `QCP-002` 的多输入校准顺序问题，也不是通用 OOM。

## 四、Intel NPU

### CHIP-10：Intel NPU 节点存在，但 Linux 上设备不可见或 OpenVINO 无法使用

- **平台/边界**：Intel Linux NPU Driver v1.30.0 的官方验证矩阵：Meteor/Arrow/Lunar/Panther Lake、Ubuntu 24.04 kernel 6.14.0-37、对应 firmware、Level Zero 1.26.3、OpenVINO 2026.0；其他组合不是由该 release 页面确认的等价组合。
- **现象**：机器规格写有 NPU，但没有 `/dev/accel/accel0`，OpenVINO 枚举不到 `NPU`，或编译/执行时报 driver/compiler 错误。
- **原因**：kernel、firmware、Level Zero、NPU compiler/plugin 与 OpenVINO 并非任意组合；缺包、旧 Level Zero 冲突、用户无 `render` 权限或 firmware/driver 不匹配均可能阻断。
- **最小诊断证据**：保存 CPU/SoC、OS/kernel；检查 `/dev/accel/accel0`、`dmesg`、`groups`；记录 firmware、Level Zero、NPU driver/compiler 与 OpenVINO 版本。
- **方案**：以目标 driver release 的已验证矩阵成套安装；清理冲突的旧包，确认设备节点和权限，再用最小 OpenVINO 枚举/compile smoke test。
- **边界/副作用**：官方 release 安装步骤可能要求替换系统 Level Zero 包；这会影响同机其他 oneAPI/GPU 工作负载，应使用镜像或可回滚包快照。
- **一手来源 / 证据**：[Intel Linux NPU Driver v1.30.0 release](https://github.com/intel/linux-npu-driver/releases/tag/v1.30.0)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮 `OV-01/02` 是模型转换与 layout，`DEV-19/20` 是 HETERO/dynamic shape；本条新增 Linux NPU 的 kernel/firmware/Level Zero/权限整栈检查。

### CHIP-11：把 Intel NPU 离线编译 blob 当作跨机、跨版本生产产物，导入后失败

- **平台/边界**：OpenVINO 2026 NPU device 文档；官方明确把 offline compilation/blob import 定位为开发用途，并声明跨 OpenVINO 版本不保证 blob 兼容。
- **现象**：开发机导出的 blob 在另一台 SKU、较少 tile 的设备、不同 driver 或新版 OpenVINO 上无法导入/执行。
- **原因**：离线编译必须显式指定 platform，额外资源属性可能超出目标 SKU；compiler-in-plugin 与 driver 也有兼容条件，blob 本身不具备通用可移植保证。
- **最小诊断证据**：保存源 IR/hash、OpenVINO、NPU compiler/driver、platform ID、stepping、tiles 与编译参数；在目标机同时尝试“由 IR 现场编译”和“导入 blob”以隔离可移植性问题。
- **方案**：生产交付保留原始 IR/模型，让目标机或目标 SKU 构建流程生成 cache；若必须下发 blob，按 SKU + driver/compiler/OpenVINO 精确分桶并提供失效后回编译路径。
- **边界/副作用**：目标机编译增加首次启动时间；维护多桶 blob 增加发布复杂度，且仍需真实设备验证。
- **一手来源 / 证据**：[OpenVINO 2026 NPU Device - compiler selection and limitations](https://docs.openvino.ai/2026/openvino-workflow/running-inference/inference-devices-and-modes/npu-device.html)（A）
- **课程映射**：[推理框架与部署链路](../docs/06-runtime-deployment.md)、[环境与版本矩阵](../docs/environment-matrix.md)
- **与第一轮去重**：第一轮 `RTA-10` 是 TensorRT engine 的 GPU/runtime 可移植性；本条新增 Intel NPU 官方“不建议生产使用预编译 blob”、compiler-in-plugin/driver 与 SKU 资源边界。

### CHIP-12：Intel NPU 离线编译固定过多 tiles，在较小 SKU 上 compiler exception 或产物不可用

- **平台/边界**：OpenVINO 2026 `ov::intel_npu::tiles/max_tiles`；tile 数依 Meteor/Arrow/Lunar/Panther Lake 的具体 SKU，不按系列名猜测。
- **现象**：同系列高配机器能编译/运行，低配 SKU 报 tile 超限；使用相同 blob 时出现跨设备兼容问题。
- **原因**：`tiles` 不能超过目标的 `max_tiles`；除 `1` 外的固定 tile 数会降低跨设备兼容性，离线编译若未给真实资源可能使用不代表全部 SKU 的查找表。
- **最小诊断证据**：在每台目标机查询 `max_tiles`、device architecture/UUID 与实际 `tiles`；归档 blob 编译时的平台与资源参数。
- **方案**：在线编译时先查询 `max_tiles`；面向多 SKU 默认让 compiler 选择或使用兼容的最低配置，只有逐 SKU 验证后才固定更高 tile 数。
- **边界/副作用**：保守 tile 数可能牺牲高配机性能；按 SKU 构建会增加产物矩阵。
- **一手来源 / 证据**：[OpenVINO 2026 NPU Device - tiles and max_tiles](https://docs.openvino.ai/2026/openvino-workflow/running-inference/inference-devices-and-modes/npu-device.html#ov-intel-npu-max-tiles-and-ov-intel-npu-tiles)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[推理加速实验](../docs/lab-inference-acceleration.md)
- **与第一轮去重**：第一轮没有 NPU tile/SKU 资源编译问题；它不同于 `RTA-08` 的输入 shape profile。

## 五、Hailo 与 Raspberry Pi AI HAT

### CHIP-13：用错误 Model Zoo 分支或 `hw_arch` 生成 HEF，目标 Hailo 芯片无法使用

- **平台/边界**：Hailo Model Zoo 当前 master 面向 Hailo-10/15；Hailo-8/8L 需要 v2.x 分支并配 DFC 3.x。HEF 的 `hw_arch` 必须与 Hailo-8、8L、10H、15H/15L 的真实架构一致。
- **现象**：模型能 parse/optimize，HEF 到设备上加载失败，或团队从 master 拿到默认面向新架构的产物部署到 Hailo-8/8L。
- **原因**：Hailo 编译产物是硬件架构专属；Model Zoo 分支、DFC/HailoRT 主版本与目标架构存在明确配套关系。
- **最小诊断证据**：用 `hailortcli fw-control identify` 保存 `Device Architecture`，用 `hailortcli parse-hef`/构建日志记录 HEF 架构，同时保存 Model Zoo branch、DFC 与 HailoRT 版本。
- **方案**：先识别设备，再选择对应 Model Zoo 分支与 `--hw-arch`；在 CI 中把 HEF 架构与目标设备清单做静态校验，并在真实芯片做 load smoke test。
- **边界/副作用**：同一 ONNX 需为不同 Hailo 架构分别优化/编译；不能仅改 HEF 文件名复用产物。
- **一手来源 / 证据**：[Hailo Model Zoo - compatibility notice](https://github.com/hailo-ai/hailo_model_zoo#models)（A）、[Hailo Model Zoo - compilation and `--hw-arch`](https://github.com/hailo-ai/hailo_model_zoo/blob/master/docs/GETTING_STARTED.rst#compilation)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[推理框架与部署链路](../docs/06-runtime-deployment.md)
- **与第一轮去重**：第一轮 `RTA-10` 是 TensorRT engine 跨环境；本条新增 Hailo Model Zoo/DFC/HailoRT 分支和 HEF `hw_arch` 的公开配套规则。

### CHIP-14：Raspberry Pi 上 Hailo kernel driver、firmware、HailoRT/Tappas 版本混装

- **平台/边界**：Raspberry Pi 5 的 AI Kit/AI HAT+（Hailo-8/8L）与 AI HAT+ 2（Hailo-10H）；前者用 `hailo-all`，后者用 `hailo-h10-all`，两包不能共存。
- **现象**：升级一部分包后 NPU 不再识别、HEF 不能运行，或在 HAT+ 2 上装了 HAT+ 的软件栈。
- **原因**：kernel driver、firmware、HailoRT、Tappas 与生成模型的 toolchain 需要兼容；两代 HAT 使用不同且冲突的软件包。
- **最小诊断证据**：保存 `dpkg -l 'hailo*'`、kernel/OS、`dmesg | grep -i hailo`，运行 `hailortcli fw-control identify` 并记录 firmware、board name 与 device architecture。
- **方案**：按实际 HAT 选择唯一 meta-package，清理 hold/冲突版本后成套安装并重启；用 identify、kernel log 和一个对应架构 HEF 做验收。
- **边界/副作用**：成套升级可能使旧 HEF/toolchain 不兼容；生产镜像应锁版本并保留回滚，不在现场只升级单个 Hailo 包。
- **一手来源 / 证据**：[Raspberry Pi official documentation source - software prerequisites and package versions](https://github.com/raspberrypi/documentation/blob/master/documentation/asciidoc/computers/ai/getting-started.adoc#software-prerequisites)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮没有 Hailo/Raspberry Pi 包栈；它不同于 Jetson `DEV-04` 的 L4T 依赖，且给出了 HAT 两代互斥包与设备识别证据。

### CHIP-15：旧 Raspberry Pi AI Kit 仍跑 PCIe Gen 2，吞吐低于预期

- **平台/边界**：Raspberry Pi 5 + 已停产 AI Kit（M.2 HAT+ + Hailo-8L）；AI HAT+ 与 AI HAT+ 2 会自动应用设置，不需要手工配置。
- **现象**：Hailo-8L 正常识别，但主机到 NPU 数据传输/多流吞吐偏低；同模型 compute 时间正常而端到端时间偏高。
- **原因**：AI Kit 默认使用 PCIe Gen 2，官方建议在 `config.txt` 加 `dtparam=pciex1_gen=3` 才能以 Gen 3 通信。
- **最小诊断证据**：保存 HAT 型号、`config.txt`、`lspci -vv` 的 negotiated link speed/width，并分开记录 Hailo compute 与主机传输/端到端时间。
- **方案**：仅对 AI Kit 按官方步骤启用 Gen 3、重启并复查链路；同时保留 Gen 2 基线和长时间稳定性测试。
- **边界/副作用**：更高链路速率仍需对线缆、HAT、供电和长时间稳定性做产品验收；若出现链路错误或不稳定，应保留退回 Gen 2 的路径。新设计优先 AI HAT，AI Kit 已停产。
- **一手来源 / 证据**：[Raspberry Pi official documentation source - Enable PCIe Gen 3.0](https://github.com/raspberrypi/documentation/blob/master/documentation/asciidoc/computers/ai/getting-started.adoc#enable-pcie-gen-30-ai-kit-only)（A）
- **课程映射**：[Profiling 实验](../docs/lab-profiling.md)、[最终项目](../docs/final-project.md)
- **与第一轮去重**：第一轮无 PCIe 协商速率问题；它不同于 `DEV-02` 的热降频，也不是模型 kernel 本身慢。

## 六、Coral Edge TPU

> 本节只指传统 Coral Edge TPU、Edge TPU Compiler 16.x / PyCoral 工具链与 USB Accelerator，不外推到 2026 年重新定位后的新 Coral/MLIR 平台。传统工具链页面仍可访问，但正文版权年份为 2020，正式授课时应把它标成 legacy 生态并重新核对软件供应状态。

### CHIP-16：Edge TPU 遇到第一个不支持算子后，后面本可支持的算子也全部留在 CPU

- **平台/边界**：Coral Edge TPU Compiler 当前公开文档描述的单次 partition 行为；仅针对 Coral Edge TPU，不外推到 LiteRT 其他 delegate。
- **现象**：编译成功且前段有 Edge TPU custom op，但只插入一个早期 NPU 子图；后半图即使包含支持算子也都在 CPU，端到端速度可能低一个数量级。
- **原因**：compiler 目前不能多次 partition；遇到第一个不兼容 op 后，该 op 和其后全部节点留在 CPU。
- **最小诊断证据**：保留 `edgetpu_compiler -s` 与 `.log` 的 mapped Edge TPU/CPU 统计，记录第一个未映射 op；用模型可视化确认 custom op 后仍有多少节点。
- **方案**：把不支持算子移到图尾、替换为受支持等价结构或在主机侧显式拆前后处理；目标是 compiled model 只含 Edge TPU custom op，再做数值对照。
- **边界/副作用**：改图可能改变精度；人为拆图会增加维护和 tensor 传输；不能用“加速算子百分比”代替端到端实测。
- **一手来源 / 证据**：[Coral - TensorFlow models on the Edge TPU, Compiling](https://coral.ai/docs/edgetpu/models-intro/#compiling)（A）
- **课程映射**：[推理框架与部署链路](../docs/06-runtime-deployment.md)、[推理加速基础](../docs/inference-acceleration.md)
- **与第一轮去重**：第一轮 `RTA-02/03` 是 LiteRT delegate 的通用整图拒绝/多段切换；本条新增 Coral compiler “只能切一次，第一个不支持 op 之后永不回到 TPU”的特殊行为。

### CHIP-17：新版 Edge TPU Compiler 产物放到旧 runtime，报 `Package requires runtime version`

- **平台/边界**：Coral Edge TPU compiler/runtime 版本表；模型对更新 runtime 前向兼容，但较新 compiler 的默认产物不一定能在旧 runtime 运行。
- **现象**：编译正常，设备加载时报需要的 runtime version 高于当前版本。
- **原因**：产物携带最低 runtime 要求；compiler 版本有对应默认 runtime 下限。
- **最小诊断证据**：保存 `edgetpu_compiler --version`、设备 runtime version 与完整 `Failed precondition`；把模型 hash 和 `--min_runtime_version` 一并归档。
- **方案**：优先更新设备 runtime；不能更新时，用新版 compiler 的 `--min_runtime_version <设备版本>` 重编译并检查算子覆盖与精度。
- **边界/副作用**：降低最低 runtime 可能失去新算子/编译优化；旧设备矩阵应在 CI 中真实加载验证。
- **一手来源 / 证据**：[Coral Edge TPU Compiler - Compiler and runtime versions](https://coral.ai/docs/edgetpu/compiler/#compiler-and-runtime-versions)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮没有 Edge TPU package runtime 协议；它不是通用 ONNX opset/parser 兼容问题 `OX-01`。

### CHIP-18：多个 Coral 模型单独编译并频繁切换，8 MB 片上参数 cache 反复换入

- **平台/边界**：Coral Edge TPU 约 8 MB 片上 SRAM 的 compiler-managed scratchpad；与 CPU/GPU 的透明 cache 不同。
- **现象**：单模型 warm-run 很快，多模型轮转时每次切换出现额外延迟；或 co-compile 后排在后面的模型即使单独运行也持续从外存流式读取参数。
- **原因**：单独编译的模型有不同 cache token，切换会清空/重写；co-compile 共用 token，但 SRAM 按命令行顺序静态分配，后续模型可能拿不到足够片上空间。
- **最小诊断证据**：保存 compiler 输出的 on-chip available/used 与 off-chip streaming bytes、模型顺序和 token 情况；比较 AAAAA、BBBBB 与 ABAB 的时延序列。
- **方案**：频繁同 TPU 轮转的模型一起 co-compile，并把高频模型放前；若 off-chip 代价大且切换少，保留单独编译反而可能更快，需按真实调度测。
- **边界/副作用**：co-compile 空间是编译期固定的；把共编译模型实际分到不同 Edge TPU 会浪费片上空间，部署调度必须与编译假设一致。
- **一手来源 / 证据**：[Coral Edge TPU Compiler - Parameter data caching and co-compiling](https://coral.ai/docs/edgetpu/compiler/#parameter-data-caching)（A）
- **课程映射**：[推理加速基础](../docs/inference-acceleration.md)、[Profiling 实验](../docs/lab-profiling.md)
- **与第一轮去重**：第一轮 `RTA-13/14` 是 LLM KV cache，`RTA-19` 是通用冷启动；本条是 Edge TPU 参数 scratchpad token、共编译顺序和 off-chip streaming 的专属机制。

### CHIP-19：试图在 Raspberry Pi/Coral 板端安装新版 Edge TPU Compiler

- **平台/边界**：Edge TPU Compiler 从 2.1 起不再提供 ARM64 版本，只支持 x86-64 Debian 系主机；运行已编译模型的 libedgetpu/pycoral 是另一件事。
- **现象**：在 Raspberry Pi 或 Coral Dev Board 上找不到兼容 compiler 包/二进制，误以为 Edge TPU 硬件或 runtime 不支持模型。
- **原因**：官方把编译阶段迁到 x86-64 主机或 Colab；板端只承担部署/推理。
- **最小诊断证据**：记录主机 `uname -m`、compiler 版本/包架构与报错；分别确认板端 runtime 能否加载一个官方预编译模型。
- **方案**：在 x86-64 Debian/Ubuntu CI 或官方 Colab 编译，将 `_edgetpu.tflite`、compiler log 和版本清单发布到设备；不要在板端临时编译。
- **边界/副作用**：远端编译增加供应链和产物管理要求；应校验模型 hash，并按 CHIP-17 固定 runtime 下限。
- **一手来源 / 证据**：[Coral Edge TPU Compiler - System requirements](https://coral.ai/docs/edgetpu/compiler/#system-requirements)（A）
- **课程映射**：[环境与版本矩阵](../docs/environment-matrix.md)、[推理框架与部署链路](../docs/06-runtime-deployment.md)
- **与第一轮去重**：第一轮没有 host compiler architecture 与 device runtime 分离问题。

### CHIP-20：Coral USB Accelerator 插在 USB 2 路径，NPU 算得快但端到端吞吐低

- **平台/边界**：Coral USB Accelerator；官方规格为 USB 3.0/3.1 Gen 1，并明确建议为最佳性能使用 USB 3.0。结论不适用于 PCIe/M.2 Edge TPU。
- **现象**：模型的 TPU 执行时间正常，输入/输出传输占主导；换机器、hub 或线缆后 FPS 波动很大。
- **原因**：设备经 USB 2 hub/端口或非 SuperSpeed 线缆协商到 480 Mb/s，而非 USB 3 的 5 Gb/s 链路。
- **最小诊断证据**：保存 `lsusb -t` 的 480M/5000M、拓扑/hub/线缆，分离 H2D/D2H 与 device compute 时间；同设备同模型直连 USB 3 做基线。
- **方案**：直连已确认的 USB 3 控制器，使用合格短线，避免与高带宽设备共享 hub；产品验收把 negotiated speed 纳入启动诊断。
- **边界/副作用**：小输入模型可能对总线不敏感；USB 3 也可能增加功耗/EMI，工业环境需做稳定性与供电测试。
- **一手来源 / 证据**：[Coral USB Accelerator - requirements and USB 2/3 performance note](https://coral.ai/docs/accelerator/get-started/#requirements)（A）
- **课程映射**：[Profiling 实验](../docs/lab-profiling.md)、[排障索引](../docs/troubleshooting-index.md)
- **与第一轮去重**：第一轮没有主机-加速器 USB 链路协商问题；它不同于 `RTA-17` 的服务 CPU 饥饿。

## 覆盖统计

| 平台/生态 | 新增问题族 | 证据等级 |
| --- | ---: | --- |
| Qualcomm QNN / HTP | 2 | A × 2 |
| Arm Ethos-U / Vela | 2 | A × 2 |
| Arm NN / Compute Library | 2 | A × 2 |
| Rockchip RKNN / RKNPU2 | 3 | A × 3 |
| Intel NPU | 3 | A × 3 |
| Hailo / Raspberry Pi AI HAT | 3 | A × 3 |
| Coral Edge TPU | 5 | A × 5 |
| **合计** | **20** | **A × 20，B × 0，C × 0** |

## 建议优先吸收的 5 条

1. **CHIP-16 Edge TPU 第一个不支持算子后全回 CPU**：规则反直觉，compiler log 易复现，适合扩展“不能只看加速算子比例”。
2. **CHIP-07 RKNN 三段版本栈不一致**：能形成一张清晰的 Toolkit/Server/Runtime/Driver 诊断表，板端排障价值高。
3. **CHIP-03 Vela 系统/内存配置与硬件不一致**：补上“离线性能估算依赖硬件拓扑输入”，能与现有 Jetson 实机 profiling 形成对照。
4. **CHIP-11 Intel NPU blob 不应当作跨版本生产产物**：官方边界明确，能纠正“预编译一次到处运行”的常见误区。
5. **CHIP-13 Hailo HEF `hw_arch`/分支错配**：覆盖 Raspberry Pi AI HAT 的实际增长生态，诊断证据也非常明确。

## 没有可靠公开资料或本轮不应硬凑的生态

| 生态 | 本轮状态 | 原因与后续取证条件 |
| --- | --- | --- |
| MediaTek NeuroPilot / APU | **空白** | 可公开核验材料以产品与高层 API 介绍为主，具体算子、编译器错误、内存/量化边界多依赖合作伙伴门户或 NDA SDK。本轮不把论坛转述当事实；获得公开 SDK 版本文档、官方 sample/release 或实机日志后再收录。 |
| Apple ANE / Core ML | **不新增** | 第一轮已有 `CML-01/02`、`DEV-16/17/18`，覆盖动态输入、预处理/数值、部署目标、compute unit 差异和冷启动；本轮未找到足够独立且不重复的问题族。 |
| NVIDIA Jetson / DLA | **不新增** | 第一轮已有 `DEV-01` 至 `DEV-05` 及 `RTA-04/10` 等，覆盖功耗/温度/内存、L4T 局部升级、容器、DLA fallback 与 TensorRT engine 可移植性；为保持去重，本轮不再换措辞重复。 |
| Hailo Dataflow Compiler 深层 allocator/unsupported-layer 错误 | **空白** | 详细 DFC 文档主要需要开发者区/客户权限。本文只保留公开 Model Zoo 与 Raspberry Pi 官方文档能直接证明的架构和版本边界。 |

## 复核边界

- 23 个唯一 URL 在 2026-07-10 逐一跟随重定向检查，全部返回 HTTP 200；GitHub/GitLab `master/latest` 页面仍会变化，正式吸收课程时应固定 release/tag 或保存访问日期。
- RKNN 三条严格限定官方 **SDK 2.3.2** 文档；Intel 条目分别限定 **linux-npu-driver v1.30.0** 与 **OpenVINO 2026**；Vela 条目限定 **4.5.0**。
- A 级来源证明机制和厂商边界，不等于证明任意模型在任意板卡上的收益。正式写入课程正文前，优先在课程可获得的实机上复现 CHIP-03、07、09、13、16，并把命令、版本和原始日志纳入证据链。
