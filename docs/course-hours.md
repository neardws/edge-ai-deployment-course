---
title: 40/52 学时教学安排
---

# 40/52 学时教学安排

## 本页目标

本课程按正式课程体量设计，而不是一次性的专题分享。完整版本为 **52 学时**，可以裁剪为 **40 学时基础版**。这里的“学时”按 45-50 分钟理解，包含讲授、演示、实验、讨论、作业说明和项目复盘。

课程的主线是：从端侧部署问题框架出发，学习量化压缩与推理加速方法，再在 Ubuntu Server 和 NVIDIA Jetson 两类硬件上完成 Qwen 小模型部署评估。

## 52 学时完整版

| 部分 | 内容 | 学时 | 产出 |
| --- | --- | ---: | --- |
| 导读 | 课程定位、资料取舍、项目主线、学习路径 | 2 | 学习路线图 |
| Part I 前置知识 | ML 推理、Transformer/LLM、量化数学、Linux/GPU/Jetson 工具链 | 8 | 基础概念检查表 |
| Part II 端侧部署问题框架 | 场景、指标、端云协同、硬件约束、项目评估 | 6 | 端侧部署评估模板 |
| Part III 量化与压缩方法 | PTQ/QAT、INT8/INT4、LLM 量化、KV Cache、精度修复、蒸馏压缩 | 12 | 量化路线选择表 |
| Part IV 推理加速与 Runtime | 图优化、算子融合、TensorRT、TensorRT-LLM、llama.cpp、vLLM、MLC、fallback | 10 | Runtime 选型矩阵 |
| Part V Ubuntu / Jetson 实作 | Ubuntu Server、Jetson Orin、Qwen GGUF、profiling、API 服务 | 10 | 实验日志和性能对比 |
| Part VI 案例复盘与扩展路线 | 视觉、小型 LLM、VLM、Agent、最终项目报告 | 4 | 端侧部署评估报告 |
| **合计** |  | **52** |  |

## 40 学时裁剪版

40 学时版本保留课程主线，但减少横向框架比较和高级推理服务内容：

| 裁剪项 | 处理方式 | 节省学时 |
| --- | --- | ---: |
| 前置知识中的部分数学推导 | 保留 scale/zero-point/outlier，减少推导练习 | 2 |
| 量化论文细节 | 保留方法动机和适用边界，减少论文实验讨论 | 3 |
| Runtime 横向比较 | 保留 llama.cpp、TensorRT、ONNX Runtime，其他作为阅读 | 3 |
| Jetson 深入优化 | 保留环境和 tegrastats，减少 DLA/power mode 深入 | 2 |
| VLM/Agent 案例 | 保留系统图和风险点，减少案例讨论 | 2 |
| **合计节省** |  | **12** |

## 理论、实验、项目比例

| 类型 | 52 学时 | 40 学时 | 说明 |
| --- | ---: | ---: | --- |
| 理论讲授 | 24 | 19 | 前置知识、方法、runtime 原理 |
| 演示与讨论 | 8 | 6 | 框架选型、案例分析、日志阅读 |
| 实验 | 14 | 11 | Ubuntu / Jetson / Qwen / profiling |
| 项目与复盘 | 6 | 4 | 最终报告、风险清单、方案评审 |

## 贯穿项目

最终项目是 **端侧 Qwen 小模型部署评估报告**。报告至少包含：

- 目标硬件：Ubuntu Server 或 Jetson。
- 模型与 runtime：Qwen GGUF、llama.cpp、可选 TensorRT/ONNX Runtime 演示。
- 量化对比：至少 Q8/Q5/Q4 或同类低比特变体。
- 推理加速实验：GPU offload、ctx-size、threads、batch 或 FlashAttention 相关参数。
- Profiling 结果：首 token、tokens/s、峰值内存、功耗/温度、失败日志。
- 结论：推荐部署方案、不推荐方案、风险和下一步。

## 学时安排图

```mermaid
gantt
  title 52 学时课程结构
  dateFormat X
  axisFormat %s
  导读 :0, 2
  Part I 前置知识 :2, 8
  Part II 部署框架 :10, 6
  Part III 量化压缩 :16, 12
  Part IV 推理加速 :28, 10
  Part V 实作 :38, 10
  Part VI 复盘 :48, 4
```

## 课后作业形态

- 阅读题：每个 Part 选 2-3 个官方资料或论文摘要。
- 检查题：概念解释、方法选择、日志判断。
- 实验题：运行命令、保存日志、填表。
- 项目题：把实验结果写成可评审的部署报告。

## 取舍说明

本课程不是论文精读课，也不是某个框架的 API 手册。课程体量虽然达到 40+ 学时，但主线仍然聚焦端侧量化部署：能解释方法，能跑实验，能读懂日志，能给出工程判断。
