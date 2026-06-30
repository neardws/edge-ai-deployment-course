---
title: 端侧部署问题框架
---

# 端侧部署问题框架

## 建议学时

4 学时。

建议拆成四段：

| 时段 | 内容 | 课堂产出 |
| --- | --- | --- |
| 第 1 学时 | 端侧部署场景、约束和指标 | 端侧任务描述表 |
| 第 2 学时 | 模型、runtime、硬件、网络的联合决策 | 部署决策矩阵 |
| 第 3 学时 | Ubuntu Server、Jetson 与端云协同差异 | 硬件路径选择说明 |
| 第 4 学时 | 项目评估讨论和失败模式复盘 | 项目立项评审清单 |

## 学习目标

- 建立端侧 AI 部署的整体判断框架。
- 区分模型能力、设备资源、runtime、功耗散热、网络环境和产品体验之间的约束关系。
- 明确量化、压缩、蒸馏、推理加速和 runtime 选型分别解决什么问题。
- 能把 Ubuntu Server 和 Jetson 放到同一套评估语言里讨论。
- 能解释什么时候应该本地推理、什么时候应该端云协同、什么时候应该放弃端侧方案。
- 为后续 Qwen 小模型、llama.cpp、Jetson 和服务化实验建立统一的指标表。

## 问题背景

端侧推理重新受到重视，不只是因为设备算力提升。更直接的原因是云端推理在隐私、延迟、弱网、成本和个性化体验上存在天然限制。

手机、PC、车载、IoT、工业终端、摄像头、机器人和边缘网关等场景，都要求模型在受限资源内稳定工作。端侧部署不是把云端模型直接搬到设备上运行，而是要先定义“业务可用”的边界：准确性够不够、首 token 是否能接受、tokens/s 是否稳定、内存峰值是否越界、连续运行是否降频、失败时能否恢复。

本课程把端侧部署看成一个系统决策问题，而不是一个单点优化问题。量化可以让模型更小，推理加速可以让执行更快，runtime 可以让硬件能力被调用起来，端云协同可以把不同风险和不同负载分配到合适的位置。只有这些决策组合起来，端侧模型才可能进入真实产品。

## 端侧部署的核心问题

端侧部署首先要回答四个问题：

1. 任务是否必须在端侧完成。
2. 目标设备是否能承载模型和上下文。
3. 本地推理的体验是否优于云端或端云协同。
4. 部署链路是否能被长期维护。

很多失败项目不是因为模型完全不能跑，而是因为没有把这些问题在立项阶段说清楚。

| 问题 | 典型错误 | 正确做法 |
| --- | --- | --- |
| 为什么要端侧 | 只说“保护隐私”或“降低成本” | 写清楚隐私、延迟、弱网、成本、离线能力中的哪一项是硬约束 |
| 跑什么模型 | 直接选择最大的开源模型 | 先定义任务、上下文长度、输出格式和质量阈值 |
| 跑在哪 | 用开发机结果代表目标设备 | 分开记录 Ubuntu Server、Jetson、移动端或工业设备结果 |
| 怎么评价 | 只看一次 demo 是否成功 | 建立质量、延迟、内存、功耗、稳定性和失败样例记录 |
| 怎么上线 | 把命令行实验直接当服务 | 增加 API、日志、重启、限流、fallback 和版本管理 |

## 图示讲解

端侧部署的第一张图应该是“决策闭环”，不是模型结构图。

```mermaid
flowchart TD
  A["业务任务"] --> B["模型能力要求"]
  A --> C["目标设备约束"]
  A --> D["隐私/网络/成本约束"]
  B --> E["候选模型"]
  C --> F["Runtime 与硬件后端"]
  D --> G["本地/云端/端云协同策略"]
  E --> H["量化/压缩/蒸馏"]
  F --> H
  G --> I["系统集成方案"]
  H --> J["真实设备 Profiling"]
  I --> J
  J --> K{"达到业务可用?"}
  K -- "否" --> L["定位瓶颈: 质量/延迟/内存/功耗/Fallback"]
  L --> E
  L --> F
  L --> G
  K -- "是" --> M["服务化与上线验证"]
```

端侧部署的第二张图是“本地、云端、端云协同”的路由图。

```mermaid
flowchart LR
  A["用户请求"] --> B{"是否包含隐私数据?"}
  B -- "是" --> C["本地优先处理"]
  B -- "否" --> D{"是否需要复杂推理?"}
  D -- "是" --> E["云端大模型"]
  D -- "否" --> C
  C --> F{"本地结果是否达标?"}
  F -- "是" --> G["返回结果"]
  F -- "否" --> H{"是否允许上传脱敏内容?"}
  H -- "是" --> E
  H -- "否" --> I["返回受限结果或请求用户确认"]
  E --> G
```

## 公开资料怎么转成本章内容

ML Systems Book 强调系统指标、部署可靠性和生命周期；MIT/EfficientML 强调模型效率、硬件感知优化和实验结构；Jetson 文档强调边缘设备的软件栈、功耗、温度和迁移风险。本章不复制它们的系统图或课程表, 而是把这些资料重画成课程自己的立项判断框架: 先判定端侧必要性, 再选择模型/runtime/硬件, 最后用真实设备日志决定是否继续。

```mermaid
flowchart LR
  A["端侧必要性: 隐私 / 延迟 / 弱网 / 成本"] --> B["模型能力: 质量 / 上下文 / 输出格式"]
  B --> C["执行路径: 量化 / runtime / GPU offload"]
  C --> D["目标设备: Ubuntu baseline / Jetson / 移动端路线"]
  D --> E["系统策略: 本地 / 云端 / 端云协同"]
  E --> F["验收证据: 日志 / profiling / 失败样例 / 报告"]
```

| 外部资料中的经典图表思路 | 本章重画/改写成 | Qwen 主线中的落点 |
| --- | --- | --- |
| ML Systems Book 的部署指标、可靠性和生产生命周期视角 | “质量、延迟、资源、稳定性、工程成本、安全边界”六维指标表 | 最终部署评估报告的评分维度 |
| MIT/EfficientML 的高效模型、硬件约束和实验组织 | “模型能力 -> 量化/压缩 -> runtime -> 真实设备 profiling”的决策闭环 | Q8/Q5/Q4 对比和推理加速实验 |
| Jetson 文档中的功耗、温度、软件栈和设备约束 | Ubuntu baseline 与 Jetson 迁移对照表 | 解释服务器结果为什么不能直接代表边缘设备 |
| 端云协同和系统资料中的路由/fallback 思路 | 本地、云端、脱敏上传、受限返回的路由图 | local API、VLM/Agent 和最终复盘 |
| 官方 runtime 文档中的后端和格式差异 | 模型、runtime、硬件、上下文、服务形态联合决策矩阵 | 避免只按模型文件大小选方案 |

### 本课程重绘：端侧部署决策闭环

Hugging Face 的参数量和碳足迹图提醒学生：端侧部署判断不只看模型能不能跑，还要看参数规模、能耗、设备占用和长期成本。本章把它重画成课程决策闭环。

```mermaid
flowchart LR
  A["模型能力需求"] --> B["模型规模 / 权重文件"]
  B --> C["设备预算: 内存 / 功耗 / 温度"]
  C --> D["runtime 与量化格式"]
  D --> E["profiling: latency / tokens/s / memory"]
  E --> F["质量与风险登记"]
  F --> G{"部署判断"}
  G -- "可接受" --> H["local API / 报告结论"]
  G -- "不可接受" --> I["换模型 / 回退量化 / 端云协同"]
```

| 来源图思路 | 本章吸收什么 | 转成课程判断 |
| --- | --- | --- |
| [Hugging Face model parameters](https://huggingface.co/datasets/huggingface-course/documentation-images/resolve/main/en/chapter1/model_parameters.png) | 模型大小、内存、带宽和加载时间要一起看 | 模型能力与设备预算表 |
| [Hugging Face carbon footprint](https://huggingface.co/datasets/huggingface-course/documentation-images/resolve/main/en/chapter1/carbon_footprint.svg) | 端侧部署不是只追求速度，还要看能耗、散热和长期运行 | 功耗、温度、单位 token 能耗和风险登记 |
| 外部生态图 | 外部图只提供判断维度 | 结论必须回到 Qwen GGUF、profiling 和本地 API 证据 |

这张表要求每个方案都回答“为什么要端侧”和“证据在哪里”。如果某个方案只有命令能跑、没有指标阈值、没有设备日志、没有失败样例, 它还不是可评审的部署方案。

Microsoft EdgeAI for Beginners 把端侧 AI 讲成 local-first 的产品架构：数据尽量在设备附近处理，小模型负责低延迟和隐私敏感任务，复杂任务再路由到更强模型或云端。本课程吸收这个思路，但把工具换成 Qwen GGUF、llama.cpp、Jetson 和本地 API。

| local-first 设计点 | 本课程怎么落地 | 需要的证据 |
| --- | --- | --- |
| 隐私优先 | 敏感输入先在本地 Qwen 小模型处理，必要时只上传脱敏摘要 | 哪些字段不出端、脱敏规则、日志样例 |
| 离线可用 | 弱网或断网时仍能完成摘要、抽取、格式化等低风险任务 | 断网场景说明、本地 API smoke test |
| 成本可控 | 高频简单请求走本地，小模型承担固定格式任务 | 请求类型分布、tokens/s、单位能耗或设备占用 |
| SLM/LLM 分工 | 本地 SLM 处理常规任务，云端或大模型处理复杂推理 | 路由规则、fallback 条件、失败样例 |
| 可观察性 | 工具调用、模型输出、异常和人工确认都要留证据 | server 日志、请求/响应、确认记录、错误日志 |

## 指标体系

端侧指标要同时覆盖模型质量和系统可用性。任何单一指标都不足以支撑部署决策。

| 维度 | 需要回答的问题 | 常见记录项 |
| --- | --- | --- |
| 任务能力 | 模型是否完成核心任务 | accuracy、F1、人工评分、格式正确率、失败样例 |
| 交互体验 | 用户是否觉得可用 | 首 token 延迟、端到端延迟、tokens/s、卡顿点 |
| 资源占用 | 设备是否承受得住 | 模型文件大小、RAM/VRAM 峰值、KV Cache、磁盘占用 |
| 稳定性 | 连续运行是否退化 | 温度、功耗、降频、崩溃、重启、错误率 |
| 工程成本 | 是否能维护和发布 | runtime 复杂度、依赖大小、许可证、更新方式 |
| 安全边界 | 是否会越权或泄露 | 本地数据范围、工具权限、日志脱敏、云端 fallback 规则 |

课程中的所有实验都不编造 benchmark 数字。学习者需要在自己的设备上填写这些表，并解释差异来自哪里。

其中两个指标值得形式化，它们会贯穿后续全部实验：

第一个是交互延迟的拆解：

$$
T_{total} = T_{first} + \frac{n_{gen}}{v_{decode}}
$$

首 token 延迟 $T_{first}$ 和稳定生成速度 $v_{decode}$ 必须分开记录，因为两者的瓶颈和优化手段不同（详见[推理加速基础](/docs/inference-acceleration)）。

第二个是能耗效率：

$$
E = \frac{P}{v} \;\; \text{(J/token)}
$$

$P$ 是平均功耗（W），$v$ 是 tokens/s。设备对比不能只比速度：服务器 100 tokens/s、300 W 是 3 J/token；Jetson 20 tokens/s、15 W 是 0.75 J/token。换成能耗口径，结论可能完全反转——这正是端侧部署存在的理由之一。

## 任务分型

端侧部署的决策首先由任务类型决定。

| 任务类型 | 常见端侧形态 | 核心约束 | 适合的第一步实验 |
| --- | --- | --- | --- |
| 传统视觉 | 检测、分类、分割、OCR 前处理 | 分辨率、帧率、功耗、摄像头输入 | ONNX/TensorRT/TFLite baseline |
| 小型 LLM | 摘要、改写、问答、结构化抽取 | 内存、KV Cache、首 token、tokens/s | Qwen GGUF + llama.cpp |
| VLM | 图片问答、OCR 理解、场景描述 | 视觉 token、图像分辨率、projector、LLM | 先拆解视觉侧和文本侧瓶颈 |
| Local Agent | 本地文件整理、轻量工具调用 | 权限、状态、失败恢复、输出格式 | 本地 LLM server + 白名单工具 |
| Hybrid Agent | 端侧隐私处理、云端复杂推理 | routing、脱敏、网络、兜底策略 | 本地/云端双路径设计 |

## 部署决策矩阵

立项时可以先填下面这张矩阵。它不是最终报告，而是判断方案是否值得继续投入的第一版依据。

| 决策项 | 选择 | 需要的证据 | 风险 |
| --- | --- | --- | --- |
| 模型规模 | 待填 | 任务样例、质量基线 | 过大导致无法端侧运行 |
| 量化格式 | 待填 | 质量对比、模型大小、runtime 支持 | 低比特不可用或质量下降 |
| Runtime | 待填 | 硬件后端、API、benchmark | fallback 到 CPU 或 kernel 不匹配 |
| 硬件路径 | 待填 | Ubuntu/Jetson/目标设备信息 | 开发机结果不可迁移 |
| 上下文长度 | 待填 | 真实请求长度分布 | KV Cache 超出内存 |
| 服务形态 | 待填 | CLI、HTTP、OpenAI-compatible API | Demo 无法集成到产品 |
| 端云协同 | 待填 | 隐私规则、网络条件、fallback 策略 | 离线场景不可用或隐私风险 |
| 验收阈值 | 待填 | 产品需求、用户体验标准 | 结果无法判断是否达标 |

## Ubuntu Server 与 Jetson 的差异

Ubuntu Server 和 Jetson 都可以运行 NVIDIA 生态工具，但它们在课程中的定位不同。

| 维度 | Ubuntu Server + NVIDIA GPU | Jetson |
| --- | --- | --- |
| 主要价值 | 快速验证、调参、较高算力、便于构建 | 接近真实边缘设备，能观察功耗和热稳定性 |
| 内存形态 | 独立显存常见 | 统一/共享内存更常见 |
| 监控工具 | `nvidia-smi`、Nsight、系统日志 | `tegrastats`、`nvpmodel`、`jetson_clocks` |
| 构建体验 | 依赖安装和编译更宽松 | 存储、内存、架构和版本更敏感 |
| 主要风险 | GPU offload、driver/CUDA、服务化 | 功耗模式、温度、热降频、存储和内存限制 |
| 课程用途 | 建立 baseline，快速比较量化方案 | 验证边缘约束，训练部署判断 |

课程实作会先在 Ubuntu Server 上建立 baseline，再迁移到 Jetson，观察同一模型在不同硬件约束下的表现。Jetson 的目的不是追求最高速度，而是让学习者理解“端侧约束”本身。

## 端云协同决策

端云协同不是妥协，而是端侧系统常见的正式架构。

| 场景 | 本地处理 | 云端处理 | 路由依据 |
| --- | --- | --- | --- |
| 隐私文本摘要 | 脱敏、摘要草稿、格式化 | 复杂润色或长文推理 | 用户授权、文本敏感级别 |
| 工业视觉告警 | 本地检测和初筛 | 历史趋势分析、跨站点诊断 | 网络可用性、误报成本 |
| 车载/机器人交互 | 唤醒、短指令、状态查询 | 复杂规划、多轮解释 | 实时性、风险等级 |
| 本地文件 Agent | 文件索引、摘要、分类 | 复杂推理、知识补全 | 工具权限、数据是否可上传 |

设计端云协同时，必须把 fallback 写清楚：

- 网络断开时能否继续工作。
- 云端失败时本地是否能返回受限结果。
- 本地模型不确定时是否请求用户确认。
- 上传云端前是否需要脱敏、摘要或结构化过滤。

## 代码/命令示例

建立部署档案时，先记录设备和软件栈，而不是直接调模型。

```bash
uname -a
lscpu
free -h
df -h
nvidia-smi
python3 --version
cmake --version
git --version
```

Jetson 上补充：

```bash
cat /etc/nv_tegra_release
tegrastats
sudo nvpmodel -q
sudo jetson_clocks --show
```

推荐把这些输出保存到实验报告，作为解释后续速度、内存和稳定性差异的证据。

## 配套实作

对应实作章节：

- [Ubuntu Server 与 NVIDIA GPU 环境](/docs/lab-ubuntu-nvidia)
- [Jetson 环境与 Qwen 迁移](/docs/lab-jetson-setup)
- [Profiling 与结果记录](/docs/lab-profiling)
- [本地 OpenAI-compatible 服务](/docs/lab-local-service)

本章实作任务是建立“部署基线”：

| 任务 | Ubuntu Server | Jetson |
| --- | --- | --- |
| 设备信息 | OS、CPU、RAM、GPU、driver、CUDA | JetPack、Jetson Linux、内存、功耗模式 |
| 模型来源 | Qwen GGUF 或课程指定模型 | 同一模型或更小模型 |
| Runtime | llama.cpp baseline | llama.cpp / TensorRT 路径评估 |
| 监控 | `nvidia-smi`、日志、benchmark | `tegrastats`、温度、功耗模式 |
| 报告 | baseline 表 | 迁移差异表 |

## 验收结果

完成本章后应得到：

| 产物 | 验收标准 |
| --- | --- |
| 端侧任务描述表 | 能说明任务、输入、输出、质量阈值和实时性要求 |
| 部署决策矩阵 | 能解释模型、量化、runtime、硬件和端云协同选择 |
| 设备信息表 | 能说明后续实验跑在哪台机器上 |
| GPU/Jetson 状态记录 | `nvidia-smi` 或 `tegrastats` 输出可追溯 |
| 风险清单 | 至少覆盖质量、延迟、内存、功耗、温度、许可证和维护 |

## 案例模板

```markdown
## 项目名称

- 任务：
- 目标用户：
- 端侧必要性：
- 输入类型：
- 输出类型：
- 目标设备：
- 网络条件：
- 隐私约束：

## 候选方案

| 方案 | 模型 | 量化 | Runtime | 硬件 | 风险 |
| --- | --- | --- | --- | --- | --- |
| A | 待填 | 待填 | 待填 | 待填 | 待填 |
| B | 待填 | 待填 | 待填 | 待填 | 待填 |

## 验收指标

| 指标 | 阈值 | 测量方法 | 当前结果 |
| --- | --- | --- | --- |
| 质量 | 待填 | 待填 | 待填 |
| 首 token | 待填 | 待填 | 待填 |
| tokens/s | 待填 | 待填 | 待填 |
| 峰值内存 | 待填 | 待填 | 待填 |
| 温度/功耗 | 待填 | 待填 | 待填 |
```

## 复盘问题

- 端侧部署的硬约束是什么，哪些只是优化目标？
- 如果模型质量不够，是换模型、做 QAT、做 prompt 约束，还是改系统架构？
- 如果速度不够，是量化、GPU offload、runtime、batch、上下文长度还是硬件问题？
- 如果 Jetson 上变慢，是否能从功耗模式、温度、内存和 kernel 支持解释？
- 如果必须端云协同，哪些数据可以上传，哪些数据只能留在本地？

## 常见问题

- **只看模型文件大小**：文件变小不代表推理更快，低比特 kernel 和 runtime 支持更关键。
- **只看平均延迟**：交互式 LLM 还要单独看首 token 延迟和 tokens/s。
- **忽略热稳定性**：端侧设备短跑结果可能很好，连续运行后会因温度和功耗限制变慢。
- **混淆开发机与目标设备**：在服务器上跑通不等于 Jetson、车机或嵌入式设备可用。
- **把端云协同当成失败**：真实产品中，本地和云端的分工往往比单一路径更稳定。

## 作业

### 阅读题

1. 浏览 MIT 6.5940 课程大纲，找出与本章“部署判断框架”最接近的一讲，比较两者指标体系的差异。

### 检查题

1. 用 $E = P/v$ 计算：设备 A 为 50 tokens/s、200 W，设备 B 为 10 tokens/s、10 W。哪个每 token 更省电？哪个更适合实时交互？解释两个问题为什么答案不同。
2. 给定“车载离线语音助手”场景，从指标体系的六个维度各写一条不可妥协的约束。

### 实验题

1. 用部署决策矩阵完整填写一个你熟悉的场景，对每个被排除的候选方案标注排除原因。

## 参考资料

本章吸收方式：

- **知识点**：从 ML Systems Book、MIT/EfficientML 和 Jetson 文档吸收“指标、硬件约束、部署生命周期”三类判断框架。
- **图解**：吸收 Hugging Face 参数量与碳足迹图的结构，再把外部系统图重画为端侧部署决策闭环和端云协同路由图。
- **实验**：把框架落到目标设备、验收指标、风险清单和后续 Qwen/Jetson 实验记录。
- **取舍**：不展开完整 MLOps 平台治理，也不把 Jetson 写成唯一端侧路线。

- [40/60 学时教学安排](/docs/course-hours)
- [资料对比与课程取舍](/docs/source-comparison)
- [Hugging Face Course documentation-images dataset](https://huggingface.co/datasets/huggingface-course/documentation-images)
- [The Machine Learning Systems Book](https://www.mlsysbook.ai/)
- [MIT 6.5940 TinyML and Efficient Deep Learning Computing](https://hanlab.mit.edu/courses/2024-fall-65940)
- [EfficientML.ai](https://efficientml.ai/)
- [microsoft/edgeai-for-beginners](https://github.com/microsoft/edgeai-for-beginners)
- [Ubuntu Server NVIDIA driver guide](https://ubuntu.com/server/docs/how-to/graphics/install-nvidia-drivers/)
- [NVIDIA CUDA Installation Guide for Linux](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/)
- [NVIDIA Jetson documentation](https://docs.nvidia.com/jetson/)
- [NVIDIA Container Toolkit Install Guide](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
