---
title: 课程导读
---

# 端侧模型量化部署技术专题

这本课程书面向需要把 AI 模型落到手机、PC、车载、IoT、工业终端、摄像头、机器人或本地服务器的技术团队。课程不把量化当成孤立算法，而是把模型能力、目标设备、runtime、低比特 kernel、上下文长度、功耗散热和产品体验放在同一个工程目标下分析。

本次版本以“课程书优先”为主。内容保留原始八个专题的知识骨架，但会扩展成更细的在线 book：每章都包含图示、核心概念、代码或命令示例、配套实作、验收标准和参考资料。HTML 课件用于讲授演示，PPTX 输出留作后续交付。

## 学完后应能做到

- 用统一的部署判断框架拆解端侧项目，而不是只问“模型能不能量化”。
- 解释 PTQ、QAT、GPTQ、AWQ、SmoothQuant、LLM.int8()、KV Cache 量化等方法的适用边界。
- 基于 Ubuntu Server、NVIDIA GPU 和 Qwen 小模型完成本地推理、量化对比、profiling 和 API 服务验证。
- 系统排查量化后的精度、延迟、内存和服务稳定性问题。
- 把量化与剪枝、蒸馏、runtime 选型、VLM/Agent 系统架构放到同一个产品落地流程里比较。

## 课程书怎么读

```mermaid
flowchart LR
  A[问题框架] --> B[量化基础]
  B --> C[大模型量化]
  C --> D[精度修复]
  D --> E[压缩与蒸馏]
  E --> F[部署链路]
  F --> G[VLM 与 Agent]
  G --> H[案例复盘]
  C --> I[Ubuntu/Qwen 实作]
  F --> I
  I --> H
```

建议按两条线阅读：

| 阅读线 | 适合对象 | 重点产出 |
| --- | --- | --- |
| 概念线 | 需要建立判断框架的工程负责人、算法工程师、产品技术负责人 | 端侧部署决策图、量化方法选择、风险清单 |
| 实作线 | 需要动手验证小模型部署的算法/推理工程师 | Ubuntu 环境检查、Qwen GGUF 推理、量化对比、profiling 表、API smoke test |

## 实作环境基线

本书的实作默认使用 Ubuntu Server、NVIDIA GPU、CUDA、llama.cpp 和 Qwen 小模型。所有命令都以“可复现教学”为目标，避免假设某个固定设备性能。实验表格会保留空位，由学员在自己的机器上记录真实结果。

> 课程书里的命令片段是教学骨架。正式跑实验前，应先按本书实作章节确认驱动、CUDA、模型许可证、磁盘空间和网络访问条件。

## 输出形态

- **课程书**：主交付物，图文并茂，包含代码和实作任务。
- **HTML 课件**：使用 reveal.js 构建，服务于课堂投屏和在线演示。
- **PPTX**：后续可由课程书和 HTML 课件继续生成，不作为当前版本范围。

## 参考资料

- [Docusaurus Mermaid diagrams](https://docusaurus.io/docs/markdown-features/diagrams/)
- [Qwen llama.cpp 本地运行指南](https://qwen.readthedocs.io/en/v2.5/run_locally/llama.cpp.html)
- [llama.cpp 项目](https://github.com/ggml-org/llama.cpp)
