# 边缘部署问题候选资料池：真实故障、版本回归与生产运维

> 第二轮收集日期：2026-07-10。本文只收录维护方已经明确说明的机制、官方故障排查条目，或已有修复闭环的维护者 issue / release note。未确认根因的开放 issue 只放在文末“待验证线索”，不写成既定结论。

## 收集与证据口径

- 本轮先与第一轮 [83 个独立问题族](./edge-deployment-problems.md) 按“核心根因 + 最小诊断证据”去重；同一故障只有平台语境不同的，不重复计数。
- **A**：官方文档、标准或论文直接说明机制与处置边界。
- **B**：维护者确认的 issue、合并修复、release note，或维护者仓库当前源码明确实现的行为。
- **C**：可复现实践但还需要 A / B 交叉。本轮正式问题卡不使用 C。
- “状态 / 版本”记录的是来源在 2026-07-10 的状态，不表示所有旧版本都自动获得修复；正式写进课程前仍需按课程锁定版本复核。

## 一、llama.cpp 与 vLLM 服务运行

### OPS-01：把 llama.cpp `/health` 同时当作鉴权、就绪和容量探针

- **项目 / 平台**：llama.cpp `llama-server`。
- **现象**：编排系统看到 `/health` 为 200 就继续送流量，但全部 slot 已占满；或者配置了 API key 后仍发现 `/health` 可匿名访问。
- **确认原因**：官方 server 文档明确说明 `/health` 是公开端点，不做 API key 检查；容量是另一层语义，`/slots?fail_on_no_slot=1` 才会在没有可用 slot 时返回 503。
- **最小诊断证据**：保存 `/health`、`/slots` 与 `?fail_on_no_slot=1` 的状态码；同时记录 busy slot 数、排队时间、反向代理允许的路径和是否带 Authorization。
- **方案 / 规避**：liveness 只判断进程；readiness 判断模型状态；capacity / admission 单独依据 slot 或队列；公网入口用反向代理只放行需要的推理路由，并把监控端点放到受信网络。
- **边界 / 副作用**：容量探针在瞬时满载时会抖动，不能直接配置成激进的 liveness；隐藏 `/health` 还需要外部进程级探针。
- **来源 / 证据**：[llama.cpp server README：health、slots 与 API key 边界](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)；**A**。
- **状态 / 适用版本**：非 issue；当前 `master` 官方文档行为，路由和默认开关需随实际构建复核。
- **课程映射**：`docs/lab-local-service.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`RTA-19` 讲冷启动，本文讲探针语义、匿名端点与容量，根因不同。

### OPS-02：llama-server 进入 idle sleep 后，健康探针仍不能证明模型是热的

- **项目 / 平台**：llama.cpp `llama-server --sleep-idle-seconds`。
- **现象**：服务监控正常，但闲置后的第一条业务请求突然出现模型重载延迟和内存尖峰。
- **确认原因**：官方文档说明 idle sleep 会卸载模型及 KV cache；`GET /health`、`/props`、`/models` 不会唤醒模型，也不会重置 idle timer，睡眠状态要从 `/props` 读取。
- **最小诊断证据**：记录 sleep 前后的 `/props`、RSS / VRAM、第一条与第二条请求 TTFT，以及模型 reload 日志。
- **方案 / 规避**：把“进程健康”和“模型热就绪”分开；低延迟场景关闭 sleep 或在接流量前发送受控 warm-up；资源优先场景则把 reload 时间纳入 SLO。
- **边界 / 副作用**：关闭 sleep 增加常驻内存和功耗；定时 warm-up 会抵消节能效果。
- **来源 / 证据**：[llama.cpp server README：Sleeping on Idle](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md#sleeping-on-idle)；**A**。
- **状态 / 适用版本**：非 issue；功能由 PR `#18228` 引入，适用于包含该功能的构建。
- **课程映射**：`docs/lab-local-service.md`、`docs/lab-profiling.md`。
- **第一轮去重**：`RTA-19` 是一般首次请求 warm-up；本文是显式 idle unload 后探针仍为健康的运行态问题。

### OPS-03：llama.cpp M-RoPE context checkpoint 在长时复用中触发服务崩溃

- **项目 / 平台**：llama.cpp；Windows CUDA、Qwen3.5-35B-A3B 的已复现案例。
- **现象**：多次保存 / 复用 prompt checkpoint 后，server 无额外错误突然退出，外层看到 Windows `0xC0000005`；最后日志常停在 `found better prompt with f_keep`。
- **确认原因**：维护者把修复归入 `kv-cache: fix M-RoPE checkpoints`；报告者验证 PR `#20132` 后崩溃消失，PR 随即合并并关闭 issue。
- **最小诊断证据**：保存 llama.cpp build / commit、模型、`--ctx-checkpoints` / parallel 配置、崩溃码，以及退出前 `prompt_save` / checkpoint restore 日志；用固定会话序列重复触发。
- **方案 / 规避**：升级到包含合并提交 `17a4258`（2026-03-06）或更新构建；升级前的临时降险是减少 / 禁用 context checkpoint 复用并由进程监督器重启，但需在目标版本验证对应 flag。
- **边界 / 副作用**：关闭 checkpoint 会增加重复 prefill；该修复不能外推为所有后续“server 突然退出”的根因，issue 后续仍有未确认的相似报告。
- **来源 / 证据**：[llama.cpp issue #20002](https://github.com/ggml-org/llama.cpp/issues/20002)、[修复 PR #20132](https://github.com/ggml-org/llama.cpp/pull/20132)；**B**。
- **状态 / 适用版本**：issue `closed/completed`；PR 已合并。已确认案例基于 b8179 附近的 Windows CUDA 构建和 M-RoPE checkpoint 路径。
- **课程映射**：`docs/lab-local-service.md`、`docs/troubleshooting-index.md`、`docs/environment-matrix.md`。
- **第一轮去重**：第一轮没有“prompt checkpoint 保存 / 恢复导致进程级访问违规”的故障族；不与 KV cache 容量或抢占条目合并。

### OPS-04：vLLM EngineCore 已死亡，却仍在原进程内重试请求

- **项目 / 平台**：vLLM V1 serving。
- **现象**：一次全局 engine 异常后，后续请求持续 500 / 503；业务层重试同一个实例仍无法恢复。
- **确认原因**：vLLM 官方 API 把 `EngineDeadError` 明确定义为 EngineCore 死亡且 **unrecoverable**；`/health` 捕获它并返回 503，launcher 的 watchdog / shutdown handler 用于终止异常 server。
- **最小诊断证据**：保存首个 EngineCore stack trace、`EngineDeadError`、`/health` 状态、server / engine PID，以及 supervisor 的退出码和重启次数；把单请求 `EngineGenerateError` 与全局 EngineDead 分开。
- **方案 / 规避**：遇到 EngineDead 时摘流并重建进程 / Pod，不复用原 engine；设置有退避和上限的 supervisor；保留首因日志，重启后再做模型 smoke 与 readiness。
- **边界 / 副作用**：自动重启会丢失在途请求和内存 KV cache；没有退避会形成 crash loop 并覆盖首因日志。
- **来源 / 证据**：[vLLM EngineDeadError 定义](https://docs.vllm.ai/en/latest/api/vllm/v1/engine/exceptions/)、[vLLM health 实现](https://docs.vllm.ai/en/stable/api/vllm/entrypoints/serve/instrumentator/health/)、[vLLM launcher 关停逻辑](https://docs.vllm.ai/en/v0.14.0/api/vllm/entrypoints/launcher/)；**A**。
- **状态 / 适用版本**：非 issue；适用于含 V1 EngineCore / `EngineDeadError` 的版本，具体启动器路径随版本变化。
- **课程映射**：`docs/lab-local-service.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`DEV-22` 是 Qualcomm HTP SSR 后重建 ORT session；本文是 vLLM EngineCore 进程级不可恢复，不合并。

### OPS-05：多租户共享 vLLM prefix cache 暴露缓存命中时序

- **项目 / 平台**：vLLM Automatic Prefix Caching。
- **现象**：不同租户共享服务时，攻击者可通过 TTFT 差异推测某个前缀是否已被其他请求缓存。
- **确认原因**：vLLM 官方设计文档明确把未隔离的前缀缓存列为 timing-based attack 风险，并提供 per-request `cache_salt`；文档也说明多租户需使用 SHA-256 规避哈希碰撞风险。
- **最小诊断证据**：记录是否启用 prefix caching、hash algorithm、请求是否携带 `cache_salt`、salt 的信任域，以及同前缀 cache hit / miss 的 TTFT 分布。
- **方案 / 规避**：按租户或明确共享组生成不可预测的 salt；选择 `sha256` / `sha256_cbor`；跨信任域不共享 cache。
- **边界 / 副作用**：隔离降低跨租户命中率并增加 KV 占用；salt 不能替代 API 鉴权和网络隔离。
- **来源 / 证据**：[vLLM Automatic Prefix Caching：Cache Isolation for Security](https://docs.vllm.ai/en/v0.14.1/design/prefix_caching/)；**A**。
- **状态 / 适用版本**：非 issue；SHA-256 从 v0.8.3 支持，文档记载自 v0.10.2 为默认；`cache_salt` 需按实际 API 版本核对。
- **课程映射**：`docs/inference-acceleration.md`、`docs/lab-local-service.md`。
- **第一轮去重**：第一轮只讲 KV cache 性能 / 容量与 `DEV-09` 编译缓存；本文是多租户时序隔离。

### OPS-06：为排障打开 vLLM request logging，DEBUG 日志落出 prompt

- **项目 / 平台**：vLLM OpenAI-compatible server。
- **现象**：排障日志、集中式日志或工单附件中出现用户原始文本、token IDs、参数或 LoRA 请求信息。
- **确认原因**：官方参数说明写明 `--enable-log-requests` 在 INFO 记录 request ID / 参数 / LoRA，在 DEBUG 记录 prompt text 或 token IDs。
- **最小诊断证据**：保存 `--enable-log-requests`、`VLLM_LOGGING_LEVEL`、日志采集规则与一条脱敏测试请求，检查落盘和上游日志平台。
- **方案 / 规避**：生产默认保持 request logging 关闭；确需开启时限制时窗、采样、访问权限和保留期，并在采集侧脱敏；问题结束后验证已关闭。
- **边界 / 副作用**：完全关闭请求日志会削弱逐请求排障；只隐藏 access log 不等于关闭 engine request log。
- **来源 / 证据**：[vLLM Engine Arguments：enable-log-requests](https://docs.vllm.ai/en/v0.19.0/configuration/engine_args/)；**A**。
- **状态 / 适用版本**：非 issue；新版本参数为 `--enable-log-requests`，旧版 `--disable-log-requests` 已经历弃用迁移。
- **课程映射**：`docs/lab-local-service.md`、`docs/report-template.md`。
- **第一轮去重**：第一轮未覆盖日志隐私；与指标定义 `RTA-21` 不同。

### OPS-07：只配置 vLLM `--api-key`，误以为同端口全部路由都受保护

- **项目 / 平台**：vLLM HTTP server。
- **现象**：未携带 API key 的调用仍能访问部分推理、运维或开发端点，造成未授权推理、暂停服务或状态泄露。
- **确认原因**：vLLM Security 文档明确说明 API key 主要覆盖 `/v1`、部分 `/v2` / `/inference` 路由；同端口还有不执行该鉴权的 endpoint，开发模式还会暴露 cache reset、sleep / wake、collective RPC 等高风险功能。
- **最小诊断证据**：枚举实际注册路由；用无 key 请求验证 `/v1`、`/health`、`/invocations` 和所有启用的 dev / profiler 端点；保存反向代理 allowlist。
- **方案 / 规避**：服务放到反向代理后，只 allowlist 产品需要的路由并统一鉴权 / 限流；生产禁止 `VLLM_SERVER_DEV_MODE=1` 和 profiler endpoint；内部通信端口只放可信网络。
- **边界 / 副作用**：阻断监控端点前要给监控单独通道；API key 仍需轮换和 TLS，代理 allowlist 也要随升级复审。
- **来源 / 证据**：[vLLM Security：API Key Authentication Limitations](https://docs.vllm.ai/en/stable/usage/security/)；**A**。
- **状态 / 适用版本**：非 issue；当前 stable 官方安全文档，端点集合高度版本敏感。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-local-service.md`。
- **第一轮去重**：第一轮没有服务攻击面 / 鉴权范围条目。

### OPS-08：vLLM 编译缓存目录可被不可信用户写入

- **项目 / 平台**：vLLM / torch.compile / Triton cache。
- **现象**：服务启动或编译缓存命中时异常崩溃，严重时加载了被篡改的缓存产物；共享主机上问题只在某个 cache root 复现。
- **确认原因**：vLLM Security 文档明确警告，不可信写入者可利用 cache 目录使 vLLM 崩溃或执行任意代码；`VLLM_CACHE_ROOT` 还会承载 torch.compile、Inductor 和 Triton kernel cache。
- **最小诊断证据**：记录 `VLLM_CACHE_ROOT` / `TRITON_CACHE_DIR`、属主权限、挂载来源、文件 hash / mtime、容器 UID，以及清空可信 cache 后的 A/B。
- **方案 / 规避**：每个服务身份使用私有、不可被其他租户写入的 cache；镜像 / 升级时按版本隔离 cache root；发现篡改先隔离并重建，不把未知 cache 复制到新实例。
- **边界 / 副作用**：禁用或清空 cache 会增加启动 / 编译时间；只读根文件系统仍需单独提供可信可写 cache。
- **来源 / 证据**：[vLLM Security：Cache Directory Security](https://docs.vllm.ai/en/stable/usage/security/#cache-directory-security)；**A**。
- **状态 / 适用版本**：非 issue；当前 stable 安全文档。
- **课程映射**：`docs/environment-matrix.md`、`docs/lab-local-service.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`DEV-09` 是 LiteRT cache hit / cold start；本文是缓存目录信任边界与代码执行风险。

### OPS-09：vLLM 进程 / worker / socket 增多后撞到文件描述符上限

- **项目 / 平台**：vLLM Linux serving。
- **现象**：高并发或多进程部署出现 `OSError: [Errno 24] Too many open files`，新连接、模型 shard 或 IPC 初始化失败。
- **确认原因**：vLLM 当前源码在启动时检查 `RLIMIT_NOFILE`，尝试把 soft limit 提到 65535；自动提升失败时明确警告该状态可导致 FD limit error，并建议提高 `ulimit -n`。
- **最小诊断证据**：保存 soft / hard `RLIMIT_NOFILE`、`/proc/$pid/fd` 数量与类型、worker / API server 数、并发连接数，以及首次 EMFILE 堆栈。
- **方案 / 规避**：在 systemd / container runtime 层设置合适的 nofile soft / hard limit；监控 fd 使用率而非只看上限；减少无界连接和不必要的 worker，确保连接与文件在错误路径关闭。
- **边界 / 副作用**：提高上限不会修复真正的 FD 泄漏；看到启动 warning 也不能反推某次 CUDA OOM 是 FD 所致，仍以首个 EMFILE 证据为准。
- **来源 / 证据**：[vLLM `set_ulimit` 当前源码](https://github.com/vllm-project/vllm/blob/main/vllm/utils/system_utils.py#L285-L306)；**B（维护者仓库当前行为）**。
- **状态 / 适用版本**：非 issue；`main` 当前实现。旧版本文件路径和目标值可能不同。
- **课程映射**：`docs/lab-local-service.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：第一轮没有 FD / socket 资源耗尽条目。

## 二、TensorRT 与 ONNX Runtime 生产边界

### OPS-10：多个请求线程并发复用同一个 TensorRT `IExecutionContext`

- **项目 / 平台**：TensorRT runtime。
- **现象**：单线程正常，并发后出现错输出、动态 shape / profile 串扰、随机 CUDA 错误或崩溃。
- **确认原因**：TensorRT 官方 threading 文档说明 `IExecutionContext` 保存每次推理的 activation、shape 和 profile 状态；同一实例并发访问是 undefined behavior，标准模式是一线程 / 并发执行单元一个 context，同一 engine 可创建多个 context。
- **最小诊断证据**：记录 engine 与 context object ID、线程 / CUDA stream、profile index、输入 shape 和失败请求；把共享 context 与每 worker 独立 context 做相同并发 A/B。
- **方案 / 规避**：只共享只读 engine；每个并发 worker / stream 持有独立 execution context；用户自定义 allocator 和 logger 也必须自行保证线程安全。
- **边界 / 副作用**：多个 context 会增加 activation / workspace 内存；创建 context 可以并发，但 refit / config 等可变对象仍需隔离。
- **来源 / 证据**：[TensorRT 11.1 How TensorRT Works：Threading](https://docs.nvidia.com/deeplearning/tensorrt/11.1.0/architecture/how-trt-works.html#threading)；**A**。
- **状态 / 适用版本**：非 issue；TensorRT 11.1 当前明确文档，旧版也有相同警告但接口名可能不同。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-inference-acceleration.md`。
- **第一轮去重**：`RTA-12` 是 CUDA Graph 地址 / shape replay；本文是 execution context 对象并发安全。

### OPS-11：TensorRT engine 打包时漏掉外部 plugin shared library

- **项目 / 平台**：TensorRT 自定义 plugin / version-compatible plan。
- **现象**：构建机能运行，部署机反序列化时报找不到 plugin creator，或 plugin name / version / namespace 不匹配。
- **确认原因**：官方文档要求二选一：用 `setPluginsToSerialize()` 把 plugin library 随 plan 序列化，或把外部 `.so` / DLL 一同发布并在反序列化 engine 前显式 `loadLibrary()`；parser 还能查询 version-compatible network 所需的 plugin library 列表。
- **最小诊断证据**：保存 parser `getUsedVCPluginLibraries()`、plugin name / version / namespace、部署包 manifest、动态库依赖和 runtime registry；在干净镜像做 deserialize smoke。
- **方案 / 规避**：发布流水线从 parser 生成 plugin allowlist；选择嵌入或外置后固定一种打包方式；外置时在 deserialize 前加载并校验依赖；把 engine、plugin、runtime 和 hash 放同一 manifest。
- **边界 / 副作用**：嵌入增加 plan 大小并涉及 host code 信任；外置便于升级但更容易漏文件 / ABI 失配。
- **来源 / 证据**：[TensorRT Plugin Shared Libraries](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/plugins-api-migration.html#plugin-shared-libraries)、[TensorRT Engine Compatibility](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/engine-compatibility.html#using-version-compatibility-with-the-onnx-parser)；**A**。
- **状态 / 适用版本**：非 issue；适用于使用自定义或 version-compatible plugin 的 TensorRT 10/11 路线，API 以锁定版本为准。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`。
- **第一轮去重**：`TRT-02` 是 ONNX parse / build 阶段找不到 op/plugin；本文是已构建 engine 在生产包中缺 runtime plugin。

### OPS-12：把来源不可信的 TensorRT plan 当成普通权重文件加载

- **项目 / 平台**：TensorRT version-compatible engine / packaged plugins。
- **现象**：模型供应链只校验“能否反序列化”，却允许第三方 plan 在服务进程内执行嵌入的 host code。
- **确认原因**：TensorRT 官方兼容性文档明确警告 version-compatible plan 和内嵌 plugin 可包含在宿主进程中执行的代码；只应反序列化自建或可信渠道获得的 engine，并需显式允许 `engine_host_code_allowed`。
- **最小诊断证据**：记录 plan 来源、构建流水线 / 签名、SHA-256、是否启用 host code、嵌入 plugin 列表和反序列化环境。
- **方案 / 规避**：把 plan 视为可执行制品而非数据文件；只从受控 builder 产出，签名 / hash 校验后原子发布；第三方 ONNX 在隔离构建环境转换，不直接接收第三方 plan 上线。
- **边界 / 副作用**：禁用 host code 会阻断需要 lean runtime / packaged plugin 的合法 plan；hash 只能证明完整性，信任仍来自签名者和构建链。
- **来源 / 证据**：[TensorRT Engine Deserialization and Trust Boundary](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/engine-compatibility.html#version-compatibility)；**A**。
- **状态 / 适用版本**：非 issue；当前官方安全边界。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/final-project.md`。
- **第一轮去重**：`RTA-10` 讲 engine 跨环境不可移植；本文讲 engine 作为可执行制品的供应链信任。

### OPS-13：TensorRT 10.3 PyPI wheel 无法定位 lean runtime，误判 plan 损坏

- **项目 / 平台**：TensorRT 10.3、PyPI 安装、version-compatible engine。
- **现象**：相同 plan 在完整安装可加载，在 PyPI wheel 环境反序列化失败，loader 找不到 lean library。
- **确认原因**：NVIDIA 10.3 release note 把它列为已知问题并给出把 `tensorrt_lean_libs` 加入 loader path 的 workaround；10.4 release note 明确标记已修复，不再需要手工设置该路径。
- **最小诊断证据**：保存 TensorRT 精确版本、安装渠道、`tensorrt_lean_libs` 路径、loader trace / `LD_LIBRARY_PATH`、plan 构建版本，以及 10.3 workaround 与 10.4 的 A/B。
- **方案 / 规避**：优先升级到 10.4+；必须停留 10.3 时按官方说明添加 wheel lean-lib 目录；不要因该错误直接重建 / 判坏 engine。
- **边界 / 副作用**：修复只解决 wheel loader 寻址，不解决真正的 engine / GPU / plugin 不兼容；全局改 `LD_LIBRARY_PATH` 可能引入其他版本混装。
- **来源 / 证据**：[TensorRT 10.3 Release Notes（官方归档 PDF）](https://docs.nvidia.com/deeplearning/tensorrt/archives/tensorrt-1030/pdf/TensorRT-Release-Notes.pdf)、[TensorRT 10.4 Release Notes（官方归档 PDF）](https://docs.nvidia.com/deeplearning/tensorrt/archives/tensorrt-1040/pdf/TensorRT-Release-Notes.pdf)；**B**。
- **状态 / 适用版本**：10.3 已知回归；10.4 明确修复。
- **课程映射**：`docs/environment-matrix.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`RTA-10` 是一般 engine 版本 / 硬件兼容；本文是特定 10.3 PyPI 打包回归及修复版本。

### OPS-14：ONNX Runtime EP 动态库放进系统路径，混用了另一套 ORT 版本

- **项目 / 平台**：ONNX Runtime shared Execution Providers。
- **现象**：开发机能注册 CUDA / TensorRT / OpenVINO / QNN EP，部署机却报 provider library 或依赖加载失败；更隐蔽时能启动但行为未定义。
- **确认原因**：ORT 官方文档要求 provider shared library 与 ONNX Runtime core shared library 位于同一目录，并明确不建议放入系统目录或通用 `LD_LIBRARY_PATH`；多套 ORT 并存时可能找到错误版本并导致 undefined behavior。
- **最小诊断证据**：保存 `libonnxruntime` 和 `onnxruntime_providers_*` 的绝对路径、hash / version、动态链接器 trace、EP 注册错误及干净包目录复现。
- **方案 / 规避**：把 core、`providers_shared` 和所需 EP library 作为同一原子运行包发布；不依赖机器级搜索路径；在干净容器 / 设备镜像做 provider 初始化和一条推理 smoke。
- **边界 / 副作用**：EP 自身的 CUDA / QNN / OpenVINO 系统依赖仍要满足；同目录只解决 ORT 组件寻址，不保证驱动兼容。
- **来源 / 证据**：[ONNX Runtime：Execution Provider Shared Libraries](https://onnxruntime.ai/docs/build/eps.html#execution-provider-shared-libraries)；**A**。
- **状态 / 适用版本**：非 issue；当前官方构建 / 部署文档。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`。
- **第一轮去重**：`DEV-12` 是 reduced-op allowlist 漏 kernel；本文是 EP / core 动态库版本混装。

### OPS-15：ONNX Runtime 空闲时 worker 仍自旋，端侧功耗和温度居高不下

- **项目 / 平台**：ONNX Runtime CPU thread pools。
- **现象**：请求已结束但 CPU 仍有稳定占用，电池、风扇或设备温度不下降；多个 session 时更明显。
- **确认原因**：ORT 官方 threading 文档说明 worker 默认会 spin 以降低下一次推理唤醒延迟，但会消耗额外 CPU cycles、resources 和 power；每 session 独立线程池还会造成相互竞争。
- **最小诊断证据**：记录空闲 CPU、功耗 / 温度、session 数和线程数；对比 `session.intra_op.allow_spinning=0`、`session.inter_op.allow_spinning=0` 前后的 idle 与首请求延迟。
- **方案 / 规避**：功耗敏感场景关闭或缩短 spinning；多 session 评估共享 global thread pool；同时固定 intra / inter op 线程数并做延迟 - 功耗曲线。
- **边界 / 副作用**：关闭自旋可能增加短请求尾延迟；共享线程池可能改变多模型隔离和吞吐。
- **来源 / 证据**：[ONNX Runtime Thread Management：Thread spinning behavior](https://onnxruntime.ai/docs/performance/tune-performance/threading.html#thread-spinning-behavior)；**A**。
- **状态 / 适用版本**：非 issue；当前官方配置项，键名需按锁定版本核对。
- **课程映射**：`docs/inference-acceleration.md`、`docs/lab-profiling.md`、`docs/jetson-deployment.md`。
- **第一轮去重**：`DEV-02` 是 Jetson 负载下热 / 过流降频；本文是 ORT idle thread spinning 主动耗电。

### OPS-16：ONNX Runtime 处理一次超大输入后长期保持高内存，被误判为泄漏

- **项目 / 平台**：ONNX Runtime CPU / CUDA memory arena。
- **现象**：某个 outlier shape / batch 后 RSS 或显存不回到此前水平，长时服务看似“越跑越占内存”。
- **确认原因**：ORT arena 会保留内存供后续请求复用；官方 C API 文档提供 arena shrinkage，并说明在 `kNextPowerOfTwo` 策略下通常只回收初始块之后为 outlier 扩展的区域。
- **最小诊断证据**：保存请求 shape / batch 时间线、arena 策略与配置、进程 / GPU 内存高水位；在同一 workload 对比启用 shrink run option 前后，并排除框架外分配。
- **方案 / 规避**：根据常态请求设置初始 chunk 和 arena extend strategy；在明确的请求 / 批次边界触发官方 shrink；先做 memory profile，不用进程 RSS 单独判泄漏。
- **边界 / 副作用**：频繁 shrink 会增加重新分配成本并恶化延迟；初始 chunk 不会按同样规则全部回收；真正的对象泄漏仍需另行排查。
- **来源 / 证据**：[ONNX Runtime C API：Memory arena shrinkage](https://onnxruntime.ai/docs/get-started/with-c.html#memory-arena-shrinkage)；**A**。
- **状态 / 适用版本**：非 issue；以实际 ORT 版本支持的 run config key 为准。
- **课程映射**：`docs/lab-profiling.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`RTA-20` 是 PyTorch allocator 碎片导致分配失败；本文是 ORT arena 有意保持高水位和显式 shrink。

### OPS-17：只做 ONNX schema 校验，就把第三方模型当作安全模型包上线

- **项目 / 平台**：ONNX Runtime。
- **现象**：模型形式上合法，却在加载 / 推理时申请异常大的内存或计算资源，拖垮边缘服务。
- **确认原因**：ORT 官方首页明确说明 runtime 会验证模型符合 ONNX 规范，但合法模型仍可被构造成消耗大量 memory / compute 的恶意模型；不可信模型应先检查并在安全环境测试。
- **最小诊断证据**：记录来源 / 签名、文件 hash / size、opset / op 清单、initializer 总量、静态 shape 上界，以及隔离环境的加载峰值、推理超时和输出 smoke。
- **方案 / 规避**：模型 manifest 固定所有文件 hash、大小和版本；隔离完成 schema checker、资源上界检查与代表输入 smoke 后再原子切换；服务层设置内存、CPU / GPU time 和输入大小限制。
- **边界 / 副作用**：静态检查不能证明业务正确性，也不能发现所有路径的资源峰值；沙箱和限额可能阻断合法的大模型。
- **来源 / 证据**：[ONNX Runtime：Model Validation 与不可信模型警告](https://onnxruntime.ai/docs/#model-validation)；**A**。
- **状态 / 适用版本**：非 issue；当前官方安全建议。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/final-project.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`OX-02` 是 external data 漏打包；本文是“规范合法不等于安全”的模型供应链与资源隔离。

## 三、LiteRT / TFLite Micro 与 ExecuTorch 端侧生命周期

### OPS-18：LiteRT GPU delegate 在一个线程创建，却被线程池中的另一个线程调用

- **项目 / 平台**：LiteRT Android GPU delegate。
- **现象**：单次测试正常，接入 coroutine / executor / camera pipeline 后报 `GpuDelegate must run on the same thread where it was initialized`，或 native 路径出现 EGL context 错误。
- **确认原因**：官方 Java 文档要求 GPU delegate 在执行它的同一线程创建；C / C++ 文档进一步要求 `ModifyGraphWithDelegate()` 与 `Invoke()` 使用当前线程的同一 EGLContext。
- **最小诊断证据**：记录 delegate / interpreter 创建和 Invoke 的 thread ID、EGLContext、生命周期与 close 顺序；用单线程专用 executor 做 A/B。
- **方案 / 规避**：为每个 GPU interpreter 使用固定专用线程 / EGL context，并把创建、invoke、销毁都调度到该线程；不要把同一实例放进通用线程池轮转。
- **边界 / 副作用**：专用线程增加调度与生命周期管理；多个 context 也会占用额外 GPU 资源。
- **来源 / 证据**：[LiteRT Android GPU delegate（Interpreter API）](https://developers.google.com/edge/litert/android/gpu)、[LiteRT Android GPU delegate（C/C++）](https://developers.google.com/edge/litert/android/gpu_native)；**A**。
- **状态 / 适用版本**：非 issue；官方页面 2026-05-28 更新，适用于 Android GPU delegate 路线。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-local-service.md`。
- **第一轮去重**：第一轮 LiteRT 条目集中在算子覆盖、布局、量化与缓存；没有线程 / EGL 生命周期。

### OPS-19：TFLite Micro OTA 后模型 schema 比固件 runtime 新，设备启动即失败

- **项目 / 平台**：LiteRT / TFLite Micro MCU。
- **现象**：只更新模型数组 / 分区后，设备报 model schema version 与 runtime 支持版本不相等；或新模型用了旧 runtime 不支持的 op version。
- **确认原因**：官方 microcontroller 指南要求在构造 interpreter 前比较 `model->version()` 和 `TFLITE_SCHEMA_VERSION`；LiteRT op-version 文档说明旧 runtime 只在模型未使用新特性时才能读取新转换器产物，否则必须检测为不兼容。
- **最小诊断证据**：保存固件 commit / `TFLITE_SCHEMA_VERSION`、模型 hash、model schema 和逐 op version、resolver 列表，以及新旧 bank 的启动日志。
- **方案 / 规避**：把固件 runtime、model、resolver 清单作为一个兼容单元；OTA 下载到非活动 bank，先做 hash、schema、op-version、AllocateTensors 和 golden-input smoke，再切换；失败保留上一 bank 回滚。
- **边界 / 副作用**：schema 相等仍不保证 resolver、arena、数值正确；双 bank 和 golden input 增加 flash 占用，具体原子切换由目标 MCU / bootloader 实现。
- **来源 / 证据**：[LiteRT for Microcontrollers：加载时 schema version 检查](https://ai.google.dev/edge/litert/microcontrollers/get_started)、[LiteRT Operator Versions](https://ai.google.dev/edge/litert/models/ops_version)；**A**。
- **状态 / 适用版本**：非 issue；适用于使用 FlatBuffer model 和 TFLM runtime 的固件。
- **课程映射**：`docs/environment-matrix.md`、`docs/06-runtime-deployment.md`、`docs/final-project.md`。
- **第一轮去重**：`DEV-13/14` 是 arena 与 resolver 缺 op；本文是 OTA 兼容门和可回滚激活流程。

### OPS-20：ExecuTorch 只检查 `.pte` 文件存在，不做内部一致性与版本门禁

- **项目 / 平台**：ExecuTorch `.pte` / 可选 `.ptd` model package。
- **现象**：离线复制中断或模型 / runtime 版本组合错误后，设备在 load_method 或执行阶段才失败；新 exporter 产物在旧 runtime 上偶发可用、偶发不可用。
- **确认原因**：ExecuTorch runtime 提供 `Verification.InternalConsistency`；PTE 有 `ETxx` magic 和长度 / segment header。官方兼容策略只保证稳定 API 生成的旧 PTE 至少能在下一个非 patch runtime 运行，**不保证 forward compatibility**，backend / custom op 还各有额外限制。
- **最小诊断证据**：保存 `.pte` / `.ptd` hash 与大小、ET / extended header、exporter / runtime / backend 版本、verification level、registered operator / backend 列表和 load error。
- **方案 / 规避**：manifest 锁定所有 model data、runtime 和 backend 版本；下载到 staging 后做 hash、`InternalConsistency`、load_method 和 golden-input smoke，再原子激活；旧 runtime 不接受未经验证的新 PTE。
- **边界 / 副作用**：内部一致性验证不是密码学签名，也不证明数值质量；更强验证会增加加载时间；backend payload 的兼容期可能短于 core PTE。
- **来源 / 证据**：[ExecuTorch Runtime Python API：Verification](https://docs.pytorch.org/executorch/stable/runtime-python-api-reference.html)、[PTE file format](https://docs.pytorch.org/executorch/stable/pte-file-format.html)、[Runtime Compatibility Policy](https://github.com/pytorch/executorch/blob/main/runtime/COMPATIBILITY.md)；**A**。
- **状态 / 适用版本**：非 issue；PTE compatibility guarantee 自 ExecuTorch 0.4 起纳入正式策略，具体模型仍看所用 backend / op。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/environment-matrix.md`、`docs/final-project.md`。
- **第一轮去重**：`DEV-15` 是 backend fallback；本文是文件内部一致性、forward compatibility 与更新激活。

### OPS-21：多个线程并发执行同一个 ExecuTorch `Method` 实例

- **项目 / 平台**：ExecuTorch core runtime。
- **现象**：单请求正确，并发时输出交叉、mutable tensor 状态被覆盖或出现间歇性错误。
- **确认原因**：官方 runtime overview 说明 `Program` immutable、可跨线程；`Method` mutable 且只在不同 Method 实例之间可并行，对同一个 Method 实例的 access / execution 必须串行化。
- **最小诊断证据**：记录 Program / Method object ID、线程、输入输出 buffer 地址与并发时间线；对比同 Method 加锁和每 worker 独立 Method。
- **方案 / 规避**：共享 Program，每个并发 worker load 自己的 Method；资源紧张时对单 Method 加锁；DataLoader 若修改共享状态也必须自己加锁。
- **边界 / 副作用**：多个 Method 会增加 planned buffer / backend context 内存；加锁会限制吞吐；delegate 仍可能有更严格线程边界。
- **来源 / 证据**：[ExecuTorch Runtime Overview：Threading Considerations](https://docs.pytorch.org/executorch/stable/runtime-overview.html#threading-considerations)、[DataLoader thread-safety contract](https://docs.pytorch.org/executorch/stable/executorch-runtime-api-reference.html)；**A**。
- **状态 / 适用版本**：非 issue；当前 ExecuTorch 1.3 文档。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-local-service.md`。
- **第一轮去重**：第一轮没有 ExecuTorch runtime object 并发安全条目。

## 四、OpenVINO / OVMS 缓存、更新与探针

### OPS-22：OpenVINO model cache 跨版本复用，或 auto-shape 不断生成 blob 填满磁盘

- **项目 / 平台**：OpenVINO Runtime / OpenVINO Model Server cache。
- **现象**：升级 runtime / driver 后旧 cache import 失败；动态 shape 服务的 cache 目录持续增长直至磁盘告警；加密模型意外留下未加密 cache。
- **确认原因**：OpenVINO 属性文档明确说 cache 内部结构可能随 release 改变，且数据可能与 platform / device 绑定并在版本变化后失效；OVMS cache 文档明确警告 auto batch / auto shape 可为新 shape 反复再生 cache 并耗尽磁盘，自定义加密 loader 还可能产生未加密 cache 风险。
- **最小诊断证据**：保存 OpenVINO / plugin / driver 版本、device、cache path / 大小 / 增长率、shape cardinality、`loaded_from_cache`、权限和 cache 是否包含完整权重。
- **方案 / 规避**：cache path 按 runtime + device + model hash / config 隔离；升级时清理或滚动重建；限制动态 shape bucket 和磁盘 quota；加密模型先评审 cache encryption / 禁用策略。
- **边界 / 副作用**：清 cache 会增加下次编译启动时间；按版本隔离增加磁盘占用；weightless cache 仍可能依赖原权重文件。
- **来源 / 证据**：[OpenVINO `cache_dir` 属性与版本边界](https://docs.openvino.ai/2025/api/c_cpp_api/group__ov__runtime__cpp__prop__api.html)、[OVMS Model Cache：disk 与 security side effects](https://docs.openvino.ai/nightly/model-server/ovms_docs_model_cache.html)；**A**。
- **状态 / 适用版本**：非 issue；OpenVINO 2025 / nightly 官方文档。进入课程前锁定到同一发布线复核。
- **课程映射**：`docs/environment-matrix.md`、`docs/lab-local-service.md`、`docs/troubleshooting-index.md`。
- **第一轮去重**：`DEV-09` 是 LiteRT GPU serialization token；本文是 OpenVINO cache 的版本 / device 失效、磁盘增长与加密边界。

### OPS-23：在 OVMS 已有版本目录内覆盖模型文件，期待自动热更新和可回滚

- **项目 / 平台**：OpenVINO Model Server model repository。
- **现象**：替换 `model/7/` 中的 XML / BIN 后 server 继续服务旧模型；或直接删除旧版本后，新版本失败时无可用回滚对象。
- **确认原因**：OVMS 官方 version policy 文档明确说明：新增数值子目录会被检测，默认切到最高版本；删除目录会卸载；**修改已部署版本目录中的文件不会被检测，也不会触发 reload**。
- **最小诊断证据**：记录 repository 目录 / inode / mtime、served model version、model status、poll interval 和请求返回的版本；对比“覆盖目录”和“发布新数值目录”。
- **方案 / 规避**：每次发布不可变的新数值版本目录；文件全部落盘并校验后再原子显露目录；先用 `specific` 或保留 `latest:2` 做 canary / rollback，确认后再删除旧版本。
- **边界 / 副作用**：同时服务多版本增加 RAM；默认 highest-number 切换不是质量验收；DAG / MediaPipe graph 不适用同一版本策略；Windows mmap 下卸载前不能删除已加载 IR 文件。
- **来源 / 证据**：[OVMS Model Version Policy：Updating Model Versions](https://docs.openvino.ai/2025/model-server/ovms_docs_model_version_policy.html#updating-model-versions)；**A**。
- **状态 / 适用版本**：非 issue；OpenVINO 2025 官方行为，默认 1 秒轮询，可配置或禁用。
- **课程映射**：`docs/06-runtime-deployment.md`、`docs/lab-local-service.md`、`docs/final-project.md`。
- **第一轮去重**：`DEV-04` 是 JetPack / L4T 部分包升级；本文是模型仓库不可变版本、在线切换和回滚。

### OPS-24：OVMS readiness 在模型未全部初始化时仍报告成功的历史回归

- **项目 / 平台**：OpenVINO Model Server。
- **现象**：编排系统依据 `/v2/health/ready` 提前送流量，但模型尚未全部加载，首批请求失败或抖动。
- **确认原因**：OVMS 2026.2 release note 明确列出 readiness 修复：现在只有全部模型完成初始化才成功，模型未加载时返回正确错误；这反向确认旧行为不能被当作可靠的 model-ready 证明。
- **最小诊断证据**：保存 OVMS 精确版本、启动日志中的各 model state、readiness 时序和第一条成功推理时间；在升级前后重启复测。
- **方案 / 规避**：升级到 2026.2+；旧版在外层 readiness 中增加模型 status / 代表性 smoke，不只依赖 HTTP 200；滚动部署保留旧实例直至新实例实测 ready。
- **边界 / 副作用**：代表推理 smoke 会增加启动时间和一次资源占用；2026.2 修复不代表自定义 pipeline 的业务正确性已经验证。
- **来源 / 证据**：[OpenVINO Model Server 2026.2 Release Notes](https://github.com/openvinotoolkit/model_server/releases/tag/v2026.2)；**B**。
- **状态 / 适用版本**：旧版本 readiness 行为已知有误；v2026.2 明确修复。
- **课程映射**：`docs/lab-local-service.md`、`docs/troubleshooting-index.md`、`docs/environment-matrix.md`。
- **第一轮去重**：`RTA-19` 是 warm-up / 首请求偏慢；本文是具体版本的 readiness 错报回归。

## 覆盖与证据统计

| 项目 / 平台 | 正式问题族 | A | B | 核心新增面 |
| --- | ---: | ---: | ---: | --- |
| llama.cpp | 3 | 2 | 1 | 探针语义、idle sleep、checkpoint 崩溃修复 |
| vLLM | 6 | 5 | 1 | 崩溃恢复、缓存隔离、日志隐私、鉴权、FD |
| TensorRT | 4 | 3 | 1 | 并发对象、plugin 打包、plan 信任、wheel 回归 |
| ONNX Runtime | 4 | 4 | 0 | EP 打包、idle 功耗、arena 高水位、不可信模型 |
| LiteRT / TFLite Micro | 2 | 2 | 0 | GPU 线程 / EGL、OTA 兼容回滚 |
| ExecuTorch | 2 | 2 | 0 | PTE 验证 / 兼容、Method 并发 |
| OpenVINO / OVMS | 3 | 2 | 1 | cache 生命周期、不可变版本、readiness 回归 |
| **合计** | **24** | **20** | **4** | **C = 0** |

### issue / release 状态汇总

- **已修复并闭环**：`OPS-03` llama.cpp issue `#20002` 已 `closed/completed`，PR `#20132` 于 2026-03-06 合并。
- **已知回归并有修复版本**：`OPS-13` TensorRT 10.3 PyPI lean-library loader，10.4 明确修复。
- **已知回归并有修复版本**：`OPS-24` OVMS readiness，v2026.2 明确修复。
- **维护者当前源码行为**：`OPS-09` vLLM `main` 仍主动检查并尝试提升 `RLIMIT_NOFILE`；不是某个未结 issue 的推测根因。
- 其余 20 条为当前官方文档机制，不依赖未确认的开放 issue。

### 与第二轮其他资料线的潜在重复

这些不是本文件内部重复，但总索引合并时可考虑做“通用问题族 + 平台实例”：

| 本文件 | 其他资料线 | 潜在合并方式 |
| --- | --- | --- |
| `OPS-10` TensorRT context、`OPS-21` ExecuTorch Method | `ECO-05` ncnn Extractor | 上位问题都是“有可变执行状态的 request object 被跨请求 / 跨线程复用”；ncnn 是陈旧输出，TRT / ExecuTorch 是并发未定义行为，平台诊断仍应分卡 |
| `OPS-14` ORT EP 动态库 | `ECO-13` Arm NN dynamic backend、`ECO-16` ExecuTorch Vulkan backend 注册 | 可合并为“backend 文件存在不等于已注册”，下挂同目录版本、命名 / ABI、静态链接裁剪三种根因 |
| `OPS-15` ORT thread spinning | `ECO-08` ncnn OpenMP spin-wait | 可合并为“空闲 worker 自旋造成端侧功耗 / 温度与尾延迟”，保留不同 runtime 的关闭 knob |
| `OPS-20` PTE / runtime 兼容门 | `ECO-18` ExecuTorch QNN context、`CHIP-17` Edge TPU package runtime | 可在总索引建立“编译产物携带最低 runtime / backend 协议”问题族；PTE core、QNN payload、Edge TPU package 的兼容保证不能互相代替 |
| `OPS-22` OpenVINO cache | `ECO-11` MNN shape tuning cache、`CHIP-11` Intel NPU offline blob | 可合并成“cache / precompiled blob 必须按 model + shape + device + runtime / driver 失效”，但 OpenVINO 还独有 auto-shape 磁盘与加密 cache 风险 |
| `OPS-19` TFLM OTA schema / op version | `CHIP-17` Edge TPU compiler / runtime version | 都可映射到 OTA compatibility gate；一个是 FlatBuffer / op version，另一个是 Edge TPU package 最低 runtime，正式课程示例应二选一主线、另一条作平台补充 |

## 建议优先吸收的 5 条

1. **OPS-23 OVMS 不可变模型版本与回滚**：直接补齐课程从“模型能跑”到“如何安全换模型”的空白，且官方行为清楚、可用本地目录最小复现。
2. **OPS-04 vLLM EngineDead 的进程级恢复**：能把普通请求错误与全局不可恢复故障分开，适合形成 liveness / readiness / supervisor 三层实验。
3. **OPS-10 TensorRT execution context 并发安全**：是并发压测才暴露的正确性风险，比只讲吞吐 / batching 更接近真实生产。
4. **OPS-20 ExecuTorch PTE 验证与 forward-compatibility 门禁**：可统一模型包 hash、runtime / backend 锁定、staging smoke 与原子激活。
5. **OPS-22 OpenVINO cache 版本、磁盘与安全边界**：同时覆盖 cache invalidation、磁盘长期增长和加密模型泄露风险，能纠正“cache 只会加速”的单向理解。

## 仍未确认、只保留为线索

- [llama.cpp #18746](https://github.com/ggml-org/llama.cpp/issues/18746) 报告 Vulkan router model load / 500 回归，但 issue 因 stale 以 `closed/not_planned` 结束，报告者也明确说未找到根因；不能写成某个 commit 或 Python cache 的已知故障。
- [llama.cpp #9852](https://github.com/ggml-org/llama.cpp/issues/9852) 报告更新后随机 load / generate crash，但没有可确认的完整 backtrace，最终因 stale 关闭；pinned-memory warning 也被维护者明确指出“不太可能是原因”。
- [vLLM #37451](https://github.com/vllm-project/vllm/issues/37451) 是 v0.17.1、DeepSeek-OCR-2、H100 在 CUDA graph capture 时崩溃的开放报告；截至收集日仍为 `open`，根因与修复尚未闭环，只可进入待复现池。
- llama.cpp `#20002` 修复后的后续相似崩溃报告不自动等同于原 M-RoPE checkpoint bug；只有 issue 中由报告者确认被 PR `#20132` 修复的路径进入正式条目。

## 进入课程正文前的复核动作

1. 将版本敏感条目固定到课程实际版本：llama.cpp commit、vLLM、TensorRT、ORT、LiteRT、ExecuTorch、OpenVINO / OVMS。
2. 每个 model package 实验保留 manifest（文件名、size、SHA-256、exporter / runtime / backend / device）和上一可用版本；不在原版本目录原地覆盖。
3. 服务实验统一分开 liveness、model readiness、capacity；崩溃恢复实验必须保留首因日志和有退避的重启次数。
4. 缓存实验同时看启动收益、磁盘 / 内存高水位、跨版本失效和信任域；不能只报告 cache hit 后更快。
5. 并发问题必须用两个并发请求复现，并记录 context / Method / thread / stream 身份，避免把对象复用错误误判为模型数值问题。
