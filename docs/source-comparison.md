---
title: 资料对比与课程取舍
---

# 资料对比与课程取舍

## 建议学时

2 学时。

本页适合放在课程导读或教师备课阶段使用。它回答一个关键问题：为什么本课程不是简单拼接量化论文、runtime 文档、Jetson 教程和 LLM 实作，而要重新组织成一门端侧部署课程。

学生首次学习可以先跳过本页，等写最终报告、选择参考资料或做课程扩展时再回来查。

## 本页目标

本课程参考公开课程、在线教材、论文和官方文档，但不会照搬任何一个来源。我们要做的是：吸收它们对知识结构、方法边界、实验设计和工程指标的优点，同时去掉不适合本课程目标的内容。

课程目标是端侧模型量化部署，不是泛 AI 课程、论文综述课、厂商 API 手册或数据中心 serving 课程。

## 取舍原则

| 原则 | 保留 | 舍弃 |
| --- | --- | --- |
| 面向部署 | 真实设备、runtime、profiling、功耗、稳定性 | 只在论文 benchmark 中成立的结论 |
| 面向课程 | 可讲、可学、可实验、可复盘 | 零散命令堆砌 |
| 面向端侧 | 内存、带宽、功耗、Jetson、边缘设备、端云协同 | 纯云端高并发集群优化 |
| 面向工程判断 | 方法适用条件、风险、失败模式 | 只给“最佳实践”口号 |
| 面向项目产出 | 部署评估报告、实验表格、复盘问题 | 只展示 demo 成功 |

## 对比框架

```mermaid
flowchart TD
  A["外部资料"] --> B{"资料类型"}
  B --> C["课程/教材"]
  B --> D["论文"]
  B --> E["官方文档"]
  B --> F["工具项目"]
  C --> G["吸收结构和教学顺序"]
  D --> H["吸收问题定义和方法动机"]
  E --> I["吸收术语、流程和约束"]
  F --> J["吸收可执行实验"]
  G --> K["本课程章节"]
  H --> K
  I --> K
  J --> K
  K --> L["Ubuntu + Jetson + Qwen 实作"]
  K --> M["最终部署评估报告"]
```

这张图强调：不同资料的价值不同。课程资料提供结构，论文提供方法动机，官方文档提供可靠术语和流程，工具项目提供可执行实验。

## 外部图解如何进入取舍

外部图来自不同类型资料。本页把它们放在一起，是为了说明“用图”也要有取舍：能帮助学生理解主线、证据和边界的图进入正文；只展示厂商能力或外部排名的图不进入课程结论。课程正文保留来源链接，并重画成下面的取舍流程。

```mermaid
flowchart LR
  A["外部图解"] --> B{"是否服务主线?"}
  B -- "是" --> C["提取字段和结构"]
  B -- "否" --> D["只保留参考链接"]
  C --> E["重画为课程图 / 表"]
  E --> F["映射到 Qwen 实验和报告"]
```

| 原图类型 | 可以吸收什么 | 取舍规则 |
| --- | --- | --- |
| [model card](https://huggingface.co/datasets/huggingface-course/documentation-images/resolve/main/en/chapter4/model_card.png) | 模型来源、许可证、文件和限制 | 进入报告证据，不替代模型实测 |
| [benchmarking lab](https://raw.githubusercontent.com/vllm-project/vllm-project.github.io/main/assets/figures/2026-06-03-deeplearning-ai-course/benchmarking-lab.png) | workload、硬件、参数、结果绑定 | 学习记录口径，不复制外部数字 |
| [ExecuTorch stack](https://docs.pytorch.org/executorch/stable/_images/executorch_stack.png) | 端侧 runtime 有导出、lowering、backend、device 层 | 作为移动端路线，不扩成必做实验 |
| [local-first agent](https://raw.githubusercontent.com/microsoft/edgeai-for-beginners/main/WorkshopForAgentic/imgs/arch.png) | 端侧 Agent 需要工具、权限、fallback 和观测 | 进入系统复盘，不做完整平台开发 |

对外部资料做“先贴入、后取舍”时，按下面规则处理，避免后续改稿时混乱。

| 资料形态 | 先贴什么 | 取舍时删什么 | 保留成什么 |
| --- | --- | --- | --- |
| 原图 | 图、来源链接、许可说明 | 和主线无关的营销文案 | 中文图注、吸收字段、章节落点 |
| 课程段落 | 只贴要点，不贴长正文 | 外部课程自己的背景铺陈 | 本课程讲解、误区和实验提示 |
| 实验命令 | 关键参数和前置条件 | 外部目录、账号、平台绑定 | Qwen/llama.cpp 命令和日志路径 |
| benchmark 表 | 字段名和条件 | 外部成绩和排名 | 本课程结果表模板 |
| 项目要求 | rubric 结构 | 与本课程无关的交付物 | 最终报告章节和评分锚点 |

## 资料对比

| 来源 | 取其精华 | 去其糟粕 |
| --- | --- | --- |
| MIT 6.5940 / EfficientML | 高效模型、量化、剪枝、硬件感知优化的课程骨架 | TinyML 电路级和硬件设计细节不作为主线 |
| The Machine Learning Systems Book | 指标、部署、可靠性、性能评估、系统边界 | 泛 MLOps、组织流程、平台治理不展开 |
| Hugging Face LLM Course / Transformers / TRL | tokenizer、Transformer、生成、chat template、SFT 数据和微调入口 | 不把课程变成完整 LLM 训练课 |
| PyTorch / ONNX / TFLite / OpenVINO | PTQ/QAT、校准、静态/动态量化、误差分析 | 不做逐 API 讲解，避免成为工具手册 |
| GPTQ / AWQ / SmoothQuant / LLM.int8 | LLM 量化方法动机、误差来源、outlier 处理 | 复杂证明和榜单复述不作为课堂重点 |
| llama.cpp / Qwen | GGUF、本地 LLM、server、benchmark、低比特实作 | 不追逐全部模型格式和参数枚举 |
| vLLM / TensorRT-LLM / MLC LLM | KV Cache、服务化、GPU/跨平台部署思路 | 高并发集群级 serving 只作为延伸 |
| Jetson / JetPack / TensorRT | 边缘设备环境、功耗、`tegrastats`、TensorRT、DLA 概念 | 不展开所有 Jetson 型号和硬件细节 |
| MLPerf / Nsight / llama-bench | profiling 和 benchmark 方法 | 竞赛级 benchmark 流程不作为必做实验 |
| VLM / Agent 资料 | 组件拆解、工具权限、端云协同、失败恢复 | 追逐快速变化的框架接口和营销式 agent demo |

## 组合参考体系

很少有单门课完整覆盖“端侧模型量化部署工程链路”。本课程的做法是把不同来源拼成一套可执行参考体系，但所有内容都收束到同一个模型、同一套设备约束、同一组量化版本和同一份部署评估报告。

| 本课程模块 | 重点参考来源 | 吸收方式 |
| --- | --- | --- |
| 前置知识：推理指标、Transformer/LLM、量化数学 | MIT 6.5940、DeepLearning.AI Quantization Fundamentals / Quantization in Depth | 用 MIT 做高效 AI 理论骨架，用 DeepLearning.AI 补量化术语、粒度和误差直觉 |
| 端侧部署问题框架：延迟、内存、功耗、场景约束 | NVIDIA TensorRT Edge-LLM、Jetson AI Lab | 用 Jetson/edge 示例解释边缘设备和数据中心 serving 的目标差异 |
| PTQ/QAT、INT8/INT4、AWQ/GPTQ/GGUF | Coursera Deploying Deep Learning、Qwen 文档、Arm Advanced Quantization | 用 Coursera 组织链路，用 Qwen 作为主实验入口，用 Arm 作为极端量化和逐层 bit-width 扩展 |
| KV Cache、runtime、serving、profiling | DeepLearning.AI vLLM、Efficiently Serving LLMs、Coursera Deploying Deep Learning | 补 TTFT、throughput、PagedAttention、continuous batching、benchmark 和 API 化 |
| LoRA/QLoRA、adapter、chat template、再量化 | 大模型微调与部署指南、LLM 后训练实践、Qwen 文档 | 补数据适配、adapter 去留、chat template 一致性和部署回归 |
| llama.cpp / GGUF / Q8-Q5-Q4 对比 | Qwen llama.cpp、llama.cpp、Coursera Edge AI 模块 | 保持 Qwen GGUF 作为主线实验，不把工具枚举变成课程目标 |
| Jetson / Ubuntu / API 服务 | NVIDIA Jetson AI Lab、TensorRT Edge-LLM、Qwen、llama.cpp server | 把环境、量化、profiling、本地服务和失败日志连成可复查实验 |
| 移动端路线 | MLC LLM、LiteRT、Arm Android lab、Microsoft EdgeAI 样例 | 做路线图和选做方向，不在第一轮新增完整 Android 实验 |
| VLM / Agent / 最终复盘 | LLM 后训练实践、NVIDIA Edge-LLM VLM 示例、Microsoft EdgeAI for Beginners | 用于系统拆解、端云协同、权限边界和最终项目复盘 |

## 学生阅读版

学生不需要一次读完全部外部资料。每个阶段只保留“必读 1 个 + 选读 2 个”：

| 阶段 | 必读 | 选读 |
| --- | --- | --- |
| 推理指标和量化数学 | MIT 6.5940 相关章节 | DeepLearning.AI Quantization、MLPerf Inference |
| Qwen/GGUF 主线 | Qwen llama.cpp 文档 | Coursera edge/llama.cpp 模块、llama.cpp README |
| Runtime 与服务化 | DeepLearning.AI vLLM | Efficiently Serving LLMs、Coursera serving 模块 |
| Jetson/端侧实作 | NVIDIA Jetson AI Lab | TensorRT Edge-LLM、Arm Android lab |
| 移动端扩展 | MLC LLM | LiteRT、ExecuTorch |

教师设计和课程裁剪建议放在 [教师使用指南](/docs/instructor-guide)，学生优先按 [Start Here](/docs/start-here) 走主线。

## 吸收到课程结构中

| 课程部分 | 主要吸收来源 | 课程化处理 |
| --- | --- | --- |
| Part I 前置知识与工具链 | Hugging Face、ML Systems Book | 用 tokenizer、chat template、prefill/decode、latency/memory 建立共同语言 |
| Part II 端侧部署问题框架 | ML Systems Book、EfficientML、Jetson docs | 把质量、延迟、内存、功耗、维护成本放到同一决策表 |
| Part III 量化与压缩 | PyTorch、ONNX、TFLite、OpenVINO、GPTQ/AWQ/SmoothQuant | 用方法路线和失败模式组织，不按 API 罗列 |
| Part IV 模型微调与数据适配 | Hugging Face、TRL、PEFT、Qwen、LLaMA-Factory | 从是否微调、数据、template、adapter、再量化和部署回归组织 |
| Part V Runtime 与推理加速 | TensorRT、TensorRT-LLM、vLLM、llama.cpp、MLC LLM | 从图、kernel、memory、runtime、hardware 五层讲 |
| Part VI Ubuntu / Jetson / 移动端实作 | Qwen、llama.cpp、Jetson、NVIDIA 文档、移动端 on-device 资料 | 统一落到 Qwen 小模型部署评估报告，并保留移动端路线图 |
| Profiling | MLPerf、Nsight、llama-bench、`nvidia-smi`、`tegrastats` | 建立课堂可操作的实验记录模板 |
| Part VII VLM、Agent 与最终复盘 | HF 多模态、OpenAI tool/agent 文档、系统资料 | 讲系统设计、权限、端云协同和最终报告，不做完整平台课 |

## 课程主线的形成

外部资料覆盖面很广，本课程把它们收束成一条主线：

```mermaid
flowchart LR
  A["前置知识"] --> B["端侧部署决策"]
  B --> C["量化与压缩"]
  C --> D["模型微调与数据适配"]
  D --> E["Runtime 与推理加速"]
  E --> F["Ubuntu / Jetson / 移动端实作"]
  F --> G["VLM / Agent 与复盘"]
  G --> H["最终项目报告"]
```

这条主线的好处是每个知识点都有落点：

- 学 tokenizer，是为了理解本地模型输入格式和上下文。
- 学 KV Cache，是为了解释内存和首 token/tokens/s。
- 学 PTQ/QAT，是为了理解模型质量和部署格式。
- 学微调，是为了判断数据、输出格式和领域适配问题是否应该进入训练闭环。
- 学 runtime，是为了理解模型为什么“能跑但不快”。
- 学 Jetson，是为了看到功耗、温度和边缘硬件限制。
- 学 VLM/Agent，是为了从单模型走向系统设计。

## 为什么采用 Part I-VII 结构

导读 + Part I-VII 的结构能把课程从“大纲列表”变成“完整学习路径”，并把模型微调从量化压缩中拆出来，形成独立的数据适配和部署回归闭环。

| 部分 | 功能 | 如果删除会怎样 |
| --- | --- | --- |
| 导读 | 说明课程定位、资料取舍和学时 | 学生不知道课程边界 |
| Part I 前置知识与工具链 | 补齐 LLM、系统、Linux/GPU 基础 | 实作时只会复制命令 |
| Part II 端侧部署框架 | 建立决策矩阵和端云协同视角 | 量化和 runtime 会变成零散技巧 |
| Part III 量化与压缩 | 讲模型侧优化 | 无法解释低比特、PTQ/QAT 和精度风险 |
| Part IV 模型微调与数据适配 | 讲数据、template、adapter 和部署回归 | 会把所有质量问题都粗暴塞回量化或 prompt |
| Part V Runtime 与推理加速 | 讲执行侧优化 | 无法解释速度瓶颈和硬件后端 |
| Part VI Ubuntu / Jetson / 移动端实作 | 建立可验证经验 | 课程会停留在理论 |
| Part VII VLM、Agent 与最终复盘 | 形成系统设计、项目报告和评审能力 | 学生缺少收束和迁移能力 |

每个 Part 都必须同时写清两条线：技术点如何循序渐进，工程实作如何落到命令、日志、记录表和最终报告。否则课程会重新退化成资料列表或命令合集。

## 为什么体量要做到 40+/60 学时

如果只讲量化概念和几个命令，8 到 12 学时也能完成。但那样学生通常只能获得“跑过一次 demo”的经验。

要让学生具备端侧部署判断能力，至少需要覆盖：

| 能力 | 需要内容 | 不足时的表现 |
| --- | --- | --- |
| 理解模型输入输出 | tokenizer、chat template、prefill/decode | 本地模型答非所问，不知道原因 |
| 选择量化方案 | PTQ/QAT、GGUF、GPTQ/AWQ、质量风险 | 只会选最小文件 |
| 判断是否微调 | 数据格式、LoRA/QLoRA、训练日志、输出对比 | 把所有质量问题都误判成“要训练” |
| 判断速度瓶颈 | runtime、kernel、KV Cache、GPU offload | 模型慢时只会换模型 |
| 处理硬件差异 | Ubuntu Server、Jetson、功耗、温度 | 服务器结果无法迁移 |
| 服务化 | 本地 API、日志、失败恢复 | 命令行 demo 无法集成 |
| 系统设计 | VLM/Agent、端云协同、权限 | 不知道真实产品如何落地 |
| 项目复盘 | 指标、表格、失败样例、结论 | 只有结果，没有判断 |

因此本课程设计为 60 学时完整版，并可裁剪为 40 学时。40 学时版本应保留主线，减少论文精读、多 runtime 展开和微调长训练，但仍保留 LoRA smoke test、数据检查和输出对比。

## 借鉴后的章节粒度

对照公开教材和官方教程后，本课程每个核心章节都要写到自学可执行粒度，而不是只列概念。

| 外部资料做法 | 本课程转化 |
| --- | --- |
| Hugging Face 文档把 chat template 写到 `messages`、role、`apply_chat_template` 和生成提示 | 微调章节明确训练和部署 prompt 必须使用同一 template |
| TRL/PEFT 文档把 SFTTrainer、adapter 和训练参数写成最小入口 | 微调实验提供 5-step Qwen LoRA smoke test |
| Qwen/LLaMA-Factory 教程把模型、数据、配置和训练命令串成流程 | 本课程把数据检查、训练日志、adapter 保存和输出对比连成闭环 |
| MIT EfficientML 课程有 lecture、lab、final project | 本课程把理论章、实验章和部署评估报告贯通 |
| ML systems 资料强调指标、可靠性和报告 | 本课程每个实验都要求日志路径、失败原因和工程结论 |

## 量化压缩与推理加速的边界

量化压缩和推理加速经常被混在一起，但课程中要区分清楚。

| 类别 | 解决什么 | 不保证什么 |
| --- | --- | --- |
| 量化 | 降低精度、模型大小、部分内存和带宽 | 不保证速度一定变快 |
| 剪枝 | 移除不重要连接、通道或结构 | 不保证 runtime 能利用稀疏性 |
| 蒸馏 | 用小模型逼近大模型行为 | 不保证所有任务质量保持 |
| 图优化 | 融合算子、删除冗余、改变执行图 | 不改变模型能力本身 |
| Kernel 优化 | 提升具体算子执行效率 | 依赖硬件和 runtime |
| KV 管理 | 降低长上下文服务内存压力 | 不直接提升模型知识能力 |
| 服务化优化 | 提升并发、稳定性和接口可用性 | 不解决单次质量问题 |

课程要让学生知道：模型变小、执行变快、服务稳定是三个相关但不同的问题。

## Ubuntu 与 Jetson 的课程取舍

Ubuntu Server 和 Jetson 都保留，是因为它们分别服务于不同学习目标。

| 路径 | 保留原因 | 课程边界 |
| --- | --- | --- |
| Ubuntu Server | 构建快、调参快、适合建立 baseline | 不把服务器结果当成端侧最终结论 |
| Jetson | 能观察功耗、温度、共享内存、边缘部署 | 不展开所有板卡型号和硬件设计 |
| 双路径对比 | 训练迁移和解释能力 | 不追求两个平台结果完全一致 |

Jetson 是本课程的边缘硬件主线，但不是唯一硬件答案。课程也会提到移动端、Apple、ONNX Runtime、TFLite、ExecuTorch 和 MLC LLM，用于建立广义端侧视野。

## VLM/Agent 的课程取舍

VLM/Agent 很容易让课程发散。这里的取舍是：

| 保留 | 舍弃 |
| --- | --- |
| VLM 组件拆解：预处理、vision encoder、projector、LLM | 从零训练 VLM |
| VLM 端侧瓶颈：视觉 token、分辨率、OCR、小目标 | 追逐模型排行榜 |
| Agent 权限、工具、状态、失败恢复 | 复杂 agent 框架全栈开发 |
| 端云协同：隐私、本地初筛、云端兜底 | 把所有任务强行本地化 |
| Jetson 作为边缘节点的角色 | 把 Jetson 当成云端 GPU 替代品 |

这样处理能让 VLM/Agent 成为系统设计能力的延伸，而不是把课程变成另一个主题。

## 最终产出取舍

课程最终产出不是“一个能跑的脚本”，而是一份部署评估报告。

| 产出 | 必须包含 | 不接受 |
| --- | --- | --- |
| 实验记录 | 命令、参数、日志、设备信息 | 只写“运行成功” |
| 量化对比 | 至少两个方案和质量观察 | 只看模型文件大小 |
| 性能记录 | 延迟、tokens/s、内存、温度/功耗 | 只贴一次输出截图 |
| 系统设计 | API、端云协同、fallback、权限 | 只给命令行 demo |
| 复盘结论 | 达标与否、瓶颈、下一步 | 没有判断标准 |

这个产出设计来自 ML systems、benchmark 和工程课程的共同经验：结果必须可解释，才能指导下一轮优化。

## 课程不做什么

- 不把所有量化论文做成详细数学证明课。
- 不把 PyTorch、ONNX Runtime、TensorRT、TFLite 每个 API 都讲一遍。
- 不把 Jetson 硬件型号和电气细节作为主线。
- 不做数据中心 LLM serving 集群课程。
- 不做完整 MLOps 平台建设课程。
- 不做完整 Agent 平台开发课程。
- 不承诺任何硬件上的固定性能数字。

## 课程要做什么

- 让学习者能解释端侧部署为什么难。
- 让学习者能选择量化、压缩、推理加速和 runtime 路线。
- 让学习者能在 Ubuntu Server 和 Jetson 上跑通小模型实验。
- 让学习者能记录和解释性能、内存、功耗、温度、质量下降和 fallback。
- 让学习者能设计本地推理、云端推理和端云协同的边界。
- 让学习者能输出一份可评审的端侧部署方案。

## 教师备课检查表

```markdown
## 备课检查

- 本章是否对应 Part I-VII 结构中的明确位置：
- 本章所在 Part 是否写清技术递进和工程闭环：
- 本章是否有可执行实验或案例：
- 本章是否说明了方法适用条件：
- 本章是否避免编造性能数字：
- 本章是否有失败模式：
- 本章是否能连接最终项目报告：
- 本章参考资料是否以官方文档/论文/成熟课程为主：
```

## 学生阅读检查表

```markdown
## 资料取舍记录

- 我阅读的资料：
- 资料解决的问题：
- 我吸收到课程项目中的内容：
- 我没有采用的内容：
- 不采用的原因：
- 对实验设计的影响：
```

## 本页吸收方式总览

本页本身就是资料取舍页，所以不再重复整理外部课程目录。它只把公开资料的价值压成一条课程化闭环：先判断资料类型，再抽取可迁移内容，最后落到 Qwen/llama.cpp 实验和部署报告证据。

```mermaid
flowchart LR
  A["外部资料"] --> B["吸收: 结构 / 动机 / 术语 / 实验"]
  B --> C["课程化: Part I-VII"]
  C --> D["主线: Qwen / GGUF / llama.cpp"]
  D --> E["证据: Q8-Q5-Q4 / profiling / local API"]
  E --> F["部署报告: recommendation + risk"]
```

| 吸收维度 | 本页怎么处理 | 课程落点 |
| --- | --- | --- |
| 知识点 | 只保留会影响端侧部署判断的概念和边界 | Part I-VII 的章节定位 |
| 图解 | 保留来源链接，把图示结构重画为课程自己的对比框架和主线图 | 导读、技术细纲、教师备课、原始资料暂存 |
| 实验 | 把可执行内容收束到 Qwen GGUF、量化、profiling、API 和报告 | Ubuntu / Jetson / 最终项目 |
| 取舍 | 明确不复制外部目录、榜单、厂商 API 手册或完整平台课 | 40/60 学时裁剪和课程边界 |

## 参考资料

本章吸收方式：

- **知识点**：从课程、论文、官方文档和工具项目中吸收结构、方法动机、术语和可执行实验。
- **图解**：吸收 model card、benchmark、ExecuTorch 和 EdgeAI 的结构；其余图示重画为资料类型对比、课程主线和资料吸收闭环三类 Mermaid 图。
- **实验**：所有可吸收内容必须能回到 Qwen、GGUF、llama.cpp、Q8/Q5/Q4、profiling、local API 或最终报告。
- **取舍**：开放许可原图需保留来源和许可；不把外部正文、未授权图表或 benchmark 数字并入本课程结论。

- [可吸收原始资料暂存](/docs/raw-reference-intake)
- [Hugging Face Course documentation-images](https://huggingface.co/datasets/huggingface-course/documentation-images)
- [vLLM / DeepLearning.AI course screenshots](https://github.com/vllm-project/vllm-project.github.io/tree/main/assets/figures/2026-06-03-deeplearning-ai-course)
- [ExecuTorch](https://docs.pytorch.org/executorch/stable/index.html)
- [Microsoft Edge AI for Beginners](https://github.com/microsoft/edgeai-for-beginners)
- [MIT 6.5940 TinyML and Efficient Deep Learning Computing](https://hanlab.mit.edu/courses/2024-fall-65940)
- [EfficientML.ai](https://efficientml.ai/)
- [The Machine Learning Systems Book](https://www.mlsysbook.ai/)
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1)
- [Qwen llama.cpp 本地运行指南](https://qwen.readthedocs.io/en/v2.5/run_locally/llama.cpp.html)
- [llama.cpp 项目](https://github.com/ggml-org/llama.cpp)
- [NVIDIA Jetson documentation](https://docs.nvidia.com/jetson/)
- [NVIDIA JetPack SDK](https://developer.nvidia.com/embedded/jetpack)
- [TensorRT documentation](https://docs.nvidia.com/deeplearning/tensorrt/latest/)
- [vLLM Documentation](https://docs.vllm.ai/)
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference/)
