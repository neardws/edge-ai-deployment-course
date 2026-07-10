# 边缘部署问题与解决方案：候选资料库总索引

> 收集日期：2026-07-10。当前阶段只建立可追溯、可去重、可映射到课程章节的资料池，尚未把候选内容写入课程正文或侧栏。

## 结果总览

- 两轮七条并行资料线共形成 **152 条原始记录**。
- 合并第一轮 3 个直接重复簇后，得到 **149 个独立问题族**；第二轮相似条目具有不同的平台专属诊断入口，未直接合并。
- 第一轮 86 条记录按课程现状标记为：**已有 10 条、扩展 35 条、新增 41 条**；第二轮新增 66 条平台与运维问题记录。
- 每条都包含问题现象、常见原因、最小诊断证据、解决或规避方案、适用边界 / 副作用、一手来源和课程映射；第一轮另标课程覆盖状态，第二轮另标证据等级与去重说明。
- 来源以官方文档、原始论文、官方仓库和维护者资料为主；聚合文章没有被当作唯一证据。
- 7 份问题卡共引用 **192 个唯一 URL、28 个来源域名**；完整来源分层、域名统计和空白见[来源地图与证据口径](./edge-deployment-source-landscape.md)。

## 第一轮分轨资料

| 资料线 | 原始记录 | 已有 | 扩展 | 新增 | 主要覆盖 |
| --- | ---: | ---: | ---: | ---: | --- |
| [量化、压缩与剪枝](./edge-deployment-problems-quantization-compression.md) | 18 | 3 | 11 | 4 | PTQ/QAT、校准、离群值、GGUF/imatrix、KV Cache 量化、剪枝与 2:4 稀疏 |
| [蒸馏与模型导出/转换](./edge-deployment-problems-distillation-export.md) | 24 | 2 | 8 | 14 | 知识蒸馏、PyTorch/ONNX、TensorRT、LiteRT、Core ML、OpenVINO |
| [Runtime、内核、内存与服务化](./edge-deployment-problems-runtime-acceleration.md) | 23 | 3 | 9 | 11 | fallback、graph break、动态 shape、KV Cache、batching、冷启动、benchmark |
| [设备与平台约束](./edge-deployment-problems-platform-device.md) | 21 | 2 | 7 | 12 | Jetson、Android、LiteRT Micro、ExecuTorch、Core ML、OpenVINO、QNN |
| **合计** | **86** | **10** | **35** | **41** | 去重后 83 个问题族 |

## 第二轮广泛检索

第二轮针对第一轮偏重 NVIDIA、PyTorch、ONNX、Google 和 Apple 的情况，补入更多开源 Runtime、芯片/NPU 平台和上线运维证据。

| 扩展线 | 新增记录 | 证据构成 | 主要覆盖 |
| --- | ---: | --- | --- |
| [更多端侧 Runtime 与开源生态](./edge-deployment-problems-broad-runtime-ecosystems.md) | 22 | A × 22 | MLC/TVM、ncnn、MNN、Arm NN、ExecuTorch backend、WebGPU/WebNN |
| [芯片、NPU 与边缘硬件平台](./edge-deployment-problems-broad-chip-platforms.md) | 20 | A × 20 | QNN/HTP、Ethos-U/Vela、RKNN、Intel NPU、Hailo/Raspberry Pi、Coral |
| [真实运维与维护者闭环](./edge-deployment-problems-broad-realworld-ops.md) | 24 | A × 20、B × 4 | 并发、探针、缓存、热更新、兼容、隐私、鉴权和模型供应链 |
| **第二轮合计** | **66** | **A × 62、B × 4、C × 0** | 与第一轮合计 152 条原始记录、149 个独立问题族 |

## 跨轨去重结果

以下条目描述同一核心故障，只保留一个主条目作为后续课程吸收入口；补充条目仍保留其平台语境和额外来源，不重复计入独立问题族。

| 问题族 | 主条目 | 补充条目 | 合并理由 |
| --- | --- | --- | --- |
| ONNX Runtime 节点未被目标 EP 接管 | `RTA-01` | `ORT-01` | 都是节点级 provider 覆盖不足和 CPU 回落；`RTA-01` 对节点分配与 session fallback 的区分更完整 |
| TensorRT 动态输入 profile 不覆盖真实 shape | `RTA-08` | `TRT-01` | 都要求保存 MIN/OPT/MAX、真实请求 shape 和 profile；`RTA-09` 的“切换后首轮尖峰”是独立后续问题，不合并 |
| LiteRT 部分 delegate 导致 CPU / 加速器往返 | `RTA-03` | `LRT-02` | 都是 unsupported op 切碎图并使同步 / 拷贝成本超过 kernel 收益 |

### 第二轮的跨平台近邻主题

下列条目属于相同的上位工程模式，但平台对象、诊断证据和修复参数不同，因此仍分别计为独立问题族。课程吸收时可以先讲通用模式，再选一至两个平台实例。

| 上位模式 | 平台实例 | 为什么不直接合并 |
| --- | --- | --- |
| 可变执行对象被跨请求 / 跨线程复用 | `ECO-05`、`OPS-10`、`OPS-21` | 分别涉及 ncnn Extractor、TensorRT execution context、ExecuTorch Method，线程契约不同 |
| backend 文件存在但没有正确加载 / 注册 | `ECO-13`、`ECO-16`、`OPS-14` | 分别检查 Arm NN backend 路径/ABI、ExecuTorch 链接、ORT EP 动态库版本 |
| 空闲 worker 自旋导致端侧功耗 | `ECO-08`、`OPS-15` | ncnn/OpenMP 与 ORT intra/inter-op thread pool 的控制项不同 |
| 编译产物与 runtime / 芯片协议不兼容 | `ECO-18`、`OPS-19`、`OPS-20`、`CHIP-07`、`CHIP-11`、`CHIP-13`、`CHIP-17` | PTE、QNN context、RKNN、Intel NPU blob、Hailo HEF、Edge TPU package 各有独立版本门禁 |
| 缓存按 shape、device 或版本失效 | `ECO-11`、`OPS-22`、`CHIP-11`、`CHIP-18` | MNN 调优缓存、OpenVINO cache、NPU blob、Edge TPU 片上参数 cache 的生命周期不同 |
| 动态 shape 不是任意 shape | `ECO-09`、`ECO-15`、`CHIP-08` | MNN session 重规划、ExecuTorch arena 上界、RKNN 有限 shape 白名单的失败点不同 |

## 建议第一批吸收的 12 个问题

这些条目来源较强、诊断动作明确，而且能补齐现有课程从“概念”到“工程现场”的缺口。它们仍需按下表完成课程主线或代表设备上的最小复现。

| 优先条目 | 为什么值得先讲 | 建议落点 | 进入正文前的最小验证 |
| --- | --- | --- | --- |
| `QCP-011` 已量化 GGUF 再量化 | 直接对应课程 Q8/Q5/Q4 主线，能解释同为 Q4 但来源链不同为何质量差很多 | `docs/03-llm-quantization.md`、`docs/04-accuracy-repair.md` | 同一 F16/BF16 基座分别直量化与二次量化，固定 prompt 做质量 A/B |
| `QCP-007` “整数模型”仍有浮点回落 | 把模型位宽、算子覆盖和真实执行后端分开 | `docs/02-ptq-qat.md`、`docs/06-runtime-deployment.md` | 检查算子图、delegate/provider 日志和 CPU-only 对照 |
| `QCP-013` KV Cache 量化短上下文反而慢 | 能纠正“更省内存必然更快”的误解 | `docs/03-llm-quantization.md`、`docs/inference-acceleration.md` | 固定模型，比较短/长上下文的内存、TTFT 和 decode 速度 |
| `QCP-016` 剪枝重参数化未固化 | 说明零权重、checkpoint 变小和稀疏 kernel 加速是三件事 | `docs/05-compression-distillation.md` | 对比 pruning 前、mask 尚在、remove 后的 state dict 与 runtime |
| `KD-02` cross-tokenizer 蒸馏 | 是 LLM 蒸馏最容易被忽略的输出空间前提 | `docs/05-compression-distillation.md`、`docs/transformer-llm-basics.md` | 对同一文本打印教师/学生 token、ID、序列长度并检查可对齐性 |
| `PX-01` 数据依赖控制流无法完整导出 | 能把“导出成功”与“真实分支被保留”区分开 | `docs/06-runtime-deployment.md` | 用覆盖正/负分支的两个输入验证导出图，不只跑 tracing 样例 |
| `OX-02` ONNX external data 丢失 | 属于大模型搬运和打包时高频、容易误判为模型损坏的问题 | `docs/06-runtime-deployment.md`、`docs/troubleshooting-index.md` | 在干净目录按部署包重新加载，并核对外部权重文件名、路径和 hash |
| `RTA-01` ORT 节点回落 CPU | 把“provider 已注册”与“关键节点已加速”分开 | `docs/06-runtime-deployment.md` | 保存节点 profile、provider 顺序和 CPU-only 延迟 |
| `RTA-05` `torch.compile` graph break | 能解释“开了编译器却没加速”的常见假象 | `docs/inference-acceleration.md` | 保存 graph-break 报告、图数量和 eager/compiled 对照 |
| `RTA-08` TensorRT profile 不覆盖输入 | 是动态图像、batch 和上下文长度部署的共同门槛 | `docs/06-runtime-deployment.md`、`docs/lab-inference-acceleration.md` | 保存 MIN/OPT/MAX、真实 shape 和失败请求，按 shape bucket 复测 |
| `RTA-13` vLLM KV Cache 抢占 | 能把显存余量、并发和尾延迟连接到同一条证据链 | `docs/inference-acceleration.md`、`docs/lab-local-service.md` | 记录 KV 使用、preemption/recompute 指标、P50/P95/P99 |
| `DEV-10` NNAPI 废弃与迁移 | 防止移动端路线建立在已废弃的平台接口上 | `docs/environment-matrix.md`、`docs/06-runtime-deployment.md` | 固定 Android 版本和设备，对比 CPU、LiteRT GPU / 可用 NPU 路线 |

## 第二轮建议优先吸收的 15 个问题

| 资料线 | 优先条目 | 适合先讲的原因 |
| --- | --- | --- |
| 更多端侧 Runtime | `ECO-15`、`ECO-04`、`ECO-17`、`ECO-09`、`ECO-22` | 分别覆盖静态 arena、调优记录命中、隐式 copy、动态 resize、异步 benchmark；机制可迁移到多个 Runtime |
| 芯片 / NPU 平台 | `CHIP-16`、`CHIP-07`、`CHIP-03`、`CHIP-11`、`CHIP-13` | 能训练学生从 compiler log、版本矩阵和硬件配置判断“为什么没有真正加速” |
| 生产运维 | `OPS-23`、`OPS-04`、`OPS-10`、`OPS-20`、`OPS-22` | 补齐不可变模型版本、进程恢复、并发安全、模型包门禁和 cache 生命周期 |

## 证据边界与待验证项

- `QCP-001`、`QCP-012` 关于 instruct/imatrix 语料的细化建议包含 llama.cpp 维护者讨论证据；写入正文前要在 Qwen 上做至少三组语料 A/B。
- `KD-01`、`KD-04`、`KD-07`、`KD-08` 的部分论文实验来自 CNN、BERT 或 NMT；可吸收故障机制和验证方法，不外推论文中的具体收益数字到 LLM。
- Android、LiteRT Micro、ExecuTorch、Core ML、OpenVINO 和 QNN 条目当前主要是一手文档证据，课程尚无对应真机日志，应明确标成扩展路线或“未实测”。
- RKNN、Intel NPU、Ethos-U、Hailo、Coral、ncnn、MNN、WebGPU/WebNN 等第二轮条目也以文档级证据为主；不能把 A 级来源误写成“本课程已在真机复现”。
- TensorRT、vLLM、PyTorch 编译器、LiteRT、Core ML、QNN 等工具的算子与版本边界变化较快，正式发布前需要按课程锁定版本重新核对。
- 未闭环的 open/stale issue 只保留为线索；第二轮正式问题卡中的 B 级条目均有合并修复或明确 release note。
- 任何性能解决方案都必须同时保留正确性 / 质量回归；“能运行”“文件变小”“加速器被识别”都不能单独作为完成证据。

## 下一阶段建议

1. 先从两轮共 27 个优先候选中选 6 条进入 `docs/troubleshooting-index.md`；课程主线问题优先，跨平台问题放到对应章节的“进阶问题卡”。
2. 对课程 Qwen/GGUF/llama.cpp 主线可直接复现的条目，补一份最小日志与失败样例；跨平台条目保持“阅读 + 选做实测”。
3. 只将课程自行改写的表格、Mermaid 和实验步骤放进正文；外部图文继续保留为来源链接，不直接复制。
4. 完成一批吸收后再运行 `npm run typecheck` 和 `npm run build`，避免在资料收集阶段反复改站点结构。
