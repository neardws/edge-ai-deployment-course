---
title: Profiling 与结果记录
---

# Profiling 与结果记录

## 建议学时

2 学时。1 学时讲指标和记录规范，1 学时分析 Ubuntu Server 与 Jetson 的实验日志。

## 学习目标

- 把端侧部署结果拆成质量、速度、显存、功耗/温度和稳定性。
- 区分首 token、prefill、decode 和稳定 tokens/s。
- 建立可复查的实验记录模板。
- 记录 Jetson 上的温度、功耗模式和 `tegrastats` 输出。

## 问题背景

“跑起来了”不是验收标准。端侧部署要证明模型在真实设备上稳定达到业务可用标准。对小型 LLM 来说，首 token 决定交互等待感，tokens/s 决定生成流畅度，KV Cache 决定长上下文能力，VRAM/RAM 决定能否常驻。

## 图示讲解

```mermaid
flowchart TD
  A[运行实验] --> B[收集日志]
  B --> C[记录速度]
  B --> D[记录显存]
  B --> E[记录输出质量]
  C --> F[对比表]
  D --> F
  E --> F
  F --> G{是否达标?}
  G -- 否 --> H[换量化/调参数/换模型]
  G -- 是 --> I[服务化验证]
```

## 核心概念

| 指标 | 含义 | 记录建议 |
| --- | --- | --- |
| 首 token 延迟 | 从请求到第一个 token 的等待 | 单独记录 |
| tokens/s | decode 阶段生成速度 | 多次运行取中位数更稳 |
| 峰值 VRAM | 推理过程 GPU 显存高点 | 结合 `nvidia-smi` |
| 输出质量 | 是否满足任务 | 固定 prompt + 备注 |
| 失败日志 | fallback、OOM、格式错误 | 保存原始日志 |
| 温度/功耗 | Jetson 或边缘设备是否稳定 | `tegrastats`、功耗模式、热降频 |

## 实验设计

为了让结果可比较，profiling 至少分三组：

| 实验 | 固定变量 | 改变变量 | 观察重点 |
| --- | --- | --- | --- |
| 量化格式对比 | 模型基座、prompt、ctx、`-ngl` | Q8/Q5/Q4 | 文件、显存、速度、质量 |
| 上下文长度对比 | 模型文件、prompt、`-ngl` | ctx 1024/2048/4096 | KV Cache 和首 token |
| 服务化 smoke test | 模型文件、ctx、采样参数 | CLI vs server | API 可用性和额外开销 |
| Jetson 对比 | 模型、prompt、ctx | Ubuntu Server vs Jetson | 速度、内存、温度、功耗 |

如果有时间，可以加 `llama-bench` 作为更标准化的 benchmark，但课堂主线仍以“业务 prompt + 日志记录”为主，因为最终要回答模型是否满足实际任务。

## 代码/命令示例

运行时用另一窗口观察显存：

```bash
watch -n 0.5 nvidia-smi
```

Jetson 上使用：

```bash
tegrastats --interval 1000 | tee ~/edge-ai-lab/logs/tegrastats.txt
```

保存 profiling 记录模板：

```bash
cp labs/templates/profiling-results.md ~/edge-ai-lab/results/profiling-results.md
```

可选：使用 llama.cpp 自带 benchmark 工具做补充记录：

```bash
./build/bin/llama-bench \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -ngl 99 \
  -p 512 \
  -n 128
```

## 配套实作

为每个量化变体至少记录一次完整结果。课堂中不追求严格统计显著性，但要保证每次运行条件相同。

建议结果表：

| 硬件 | 模型 | 量化 | ctx | 文件大小 | 峰值内存 | 首 token | tokens/s | 温度/功耗 | 质量备注 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Ubuntu Server | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| Jetson | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

## 验收结果

| 产物 | 验收标准 |
| --- | --- |
| profiling 表 | 至少三行模型结果，字段完整 |
| 日志目录 | 每次实验有对应原始日志 |
| 结论段落 | 明确推荐量化格式和不推荐原因 |

## 常见问题

- **只跑一次就下结论**：第一次运行可能受缓存、温度或系统负载影响。
- **混用不同采样参数**：温度、top-p、生成长度变化会影响输出和速度。
- **不保存失败日志**：失败日志往往比成功结果更能解释下一步优化方向。

## 参考资料

- [llama.cpp 项目](https://github.com/ggml-org/llama.cpp)
- [llama.cpp llama-bench](https://github.com/ggml-org/llama.cpp/tree/master/tools/llama-bench)
- [NVIDIA Nsight Systems](https://developer.nvidia.com/nsight-systems)
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference/)
- [NVIDIA CUDA Installation Guide for Linux](https://docs.nvidia.com/cuda/cuda-installation-guide-linux/)
- [NVIDIA Jetson documentation](https://docs.nvidia.com/jetson/)
