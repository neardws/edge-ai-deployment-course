---
title: 资料对比与课程取舍
---

# 资料对比与课程取舍

## 本页目标

本课程参考公开课程、在线教材、论文和官方文档，但不会照搬任何一个来源。我们要做的是：吸收它们对知识结构、方法边界、实验设计和工程指标的优点，同时去掉不适合本课程目标的内容。

课程目标是端侧模型量化部署，不是泛 AI 课程、论文综述课或厂商 API 手册。

## 取舍原则

| 原则 | 保留 | 舍弃 |
| --- | --- | --- |
| 面向部署 | 真实设备、runtime、profiling、功耗、稳定性 | 只在论文 benchmark 中成立的结论 |
| 面向课程 | 可讲、可学、可实验、可复盘 | 零散命令堆砌 |
| 面向端侧 | 内存、带宽、功耗、Jetson、边缘设备 | 纯云端高并发集群优化 |
| 面向工程判断 | 方法适用条件、风险、失败模式 | 只给“最佳实践”口号 |

## 资料对比

| 来源 | 取其精华 | 去其糟粕 |
| --- | --- | --- |
| MIT 6.5940 / EfficientML | 高效模型、量化、剪枝、硬件感知优化的课程骨架 | TinyML 电路级和硬件设计细节不作为主线 |
| The Machine Learning Systems Book | 指标、部署、可靠性、性能评估、系统边界 | 泛 MLOps、组织流程、平台治理不展开 |
| Hugging Face LLM Course | tokenizer、Transformer、生成、chat template 基础 | 训练/微调长线内容只保留必要背景 |
| PyTorch / ONNX / TFLite / OpenVINO | PTQ/QAT、校准、静态/动态量化、误差分析 | 不做逐 API 讲解，避免成为工具手册 |
| GPTQ / AWQ / SmoothQuant / LLM.int8 | LLM 量化方法动机、误差来源、outlier 处理 | 复杂证明和榜单复述不作为课堂重点 |
| llama.cpp / Qwen | GGUF、本地 LLM、server、benchmark、低比特实作 | 不追逐全部模型格式和参数枚举 |
| vLLM / TensorRT-LLM / MLC LLM | KV Cache、服务化、GPU/跨平台部署思路 | 高并发集群级 serving 只作为延伸 |
| Jetson / JetPack / TensorRT | 边缘设备环境、功耗、`tegrastats`、TensorRT、DLA 概念 | 不展开所有 Jetson 型号和硬件细节 |
| MLPerf / Nsight / llama-bench | profiling 和 benchmark 方法 | 竞赛级 benchmark 流程不作为必做实验 |

## 吸收到课程结构中

| 课程部分 | 主要吸收来源 | 课程化处理 |
| --- | --- | --- |
| 前置知识 | Hugging Face、MLSys Book | 用 tokenizer、prefill/decode、latency/memory 建立共同语言 |
| 端侧部署框架 | MLSys Book、EfficientML | 把精度、延迟、内存、功耗、维护成本放到同一决策表 |
| 量化压缩 | PyTorch、ONNX、TFLite、OpenVINO、GPTQ/AWQ/SmoothQuant | 用方法路线和失败模式组织，不按 API 罗列 |
| 推理加速 | TensorRT、TensorRT-LLM、vLLM、llama.cpp、MLC LLM | 从图、kernel、memory、runtime、hardware 五层讲 |
| Ubuntu / Jetson 实作 | Qwen、llama.cpp、Jetson、NVIDIA 文档 | 统一落到 Qwen 小模型部署评估报告 |
| Profiling | MLPerf、Nsight、llama-bench、`nvidia-smi`、`tegrastats` | 建立课堂可操作的实验记录模板 |

## 课程不做什么

- 不把所有量化论文做成详细数学证明课。
- 不把 PyTorch、ONNX Runtime、TensorRT、TFLite 每个 API 都讲一遍。
- 不把 Jetson 硬件型号和电气细节作为主线。
- 不做数据中心 LLM serving 集群课程。
- 不做完整 MLOps 平台建设课程。

## 课程要做什么

- 让学习者能解释端侧部署为什么难。
- 让学习者能选择量化、压缩、推理加速和 runtime 路线。
- 让学习者能在 Ubuntu Server 和 Jetson 上跑通小模型实验。
- 让学习者能记录和解释性能、内存、功耗、温度、质量下降和 fallback。
- 让学习者能输出一份可评审的端侧部署方案。

## 参考资料

- [MIT 6.5940 TinyML and Efficient Deep Learning Computing](https://hanlab.mit.edu/courses/2024-fall-65940)
- [The Machine Learning Systems Book](https://www.mlsysbook.ai/)
- [Hugging Face LLM Course](https://huggingface.co/learn/llm-course/chapter1/1)
- [Qwen llama.cpp 本地运行指南](https://qwen.readthedocs.io/en/v2.5/run_locally/llama.cpp.html)
- [NVIDIA Jetson documentation](https://docs.nvidia.com/jetson/)
- [TensorRT documentation](https://docs.nvidia.com/deeplearning/tensorrt/latest/)
