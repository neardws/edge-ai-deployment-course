---
title: 推理加速实验
---

# 推理加速实验

## 建议学时

2 学时。

建议安排：

| 课时 | 内容 | 产出 |
| --- | --- | --- |
| 1 | GPU offload、`ctx-size`、线程和 `llama-bench` 对比 | 原始实验日志 |
| 2 | 解释瓶颈来源，形成优化建议 | 推理加速结论表 |

本实验对应理论章节：

- [推理加速基础](/docs/inference-acceleration)
- [推理框架与部署链路](/docs/runtime-deployment)
- [LLM 量化与 KV Cache](/docs/llm-quantization)

## 学习目标

完成本实验后，学习者应能：

- 用实验验证推理加速手段是否真实有效。
- 区分模型量化、GPU offload、上下文长度、CPU 线程和 benchmark 参数对性能的影响。
- 解释 `ctx-size` 与 KV Cache、首 token、内存占用之间的关系。
- 使用 `llama-bench` 补充标准化性能记录。
- 在 Ubuntu Server 与 Jetson 上分别记录推理加速相关指标。
- 建立“不凭感觉调参”的实验记录方式。

## 本章定位

| 项目 | 内容 |
| --- | --- |
| 本章解决的问题 | GPU offload、ctx-size、threads 和 benchmark 参数是否真的改善目标瓶颈。 |
| 你需要先知道 | 已完成 baseline 或量化对比，能区分 prefill、decode、tokens/s 和内存。 |
| 你会产出 | offload/ctx/thread/llama-bench 日志、综合结果表、优化判断结论。 |
| 最终报告位置 | 第 5 节 Runtime 参数与加速实验。 |

## 问题背景

推理加速不是把参数随便调大或调小。

每次调参都应该回答：

- 改了哪个变量？
- 其他变量是否保持不变？
- 速度是否真的提升？
- 内存、温度、功耗是否变差？
- 输出质量是否仍然可用？

本实验围绕四类变量：

1. GPU offload：`-ngl 0` vs `-ngl 99`。
2. 上下文长度：`--ctx-size 1024/2048/4096`。
3. CPU 线程：`-t`。
4. 标准化 benchmark：`llama-bench`。

量化格式对比见 [Qwen GGUF 量化对比实验](/docs/lab-qwen-quantization)。

## 图示讲解

```mermaid
flowchart TD
  A[选择 baseline] --> B[一次只改变一个变量]
  B --> C[运行 llama-cli]
  B --> D[运行 llama-bench]
  C --> E[保存日志]
  D --> E
  E --> F[记录 nvidia-smi / tegrastats]
  F --> G[填写结果表]
  G --> H{是否真的改善?}
  H -- 否 --> I[解释原因]
  H -- 是 --> J[保留参数并进入服务化验证]
```

KV Cache 与上下文长度：

```mermaid
flowchart LR
  A[ctx-size 增大] --> B[可容纳更长上下文]
  A --> C[KV Cache 预算增大]
  C --> D[显存/内存压力上升]
  D --> E[首 token 或稳定速度变化]
  D --> F[OOM 风险]
```

## 公开资料怎么转成本章内容

vLLM、TensorRT-LLM、llama.cpp 和 MLPerf 资料都会讨论推理加速，但本实验不要求学生切换 runtime 或复现竞赛 benchmark。本章只吸收它们的判断框架：把 prefill、decode、KV Cache、GPU offload、线程和资源监控拆开，一次只改一个变量，用自己的 Qwen GGUF 日志说明参数是否真的改善目标瓶颈。

```mermaid
flowchart LR
  A["公开资料: vLLM / TensorRT-LLM / llama.cpp / MLPerf"] --> B["瓶颈拆分: prefill / decode / KV Cache"]
  B --> C["单变量实验: ngl / ctx-size / threads / bench"]
  C --> D["运行证据: llama-completion --perf / llama-bench"]
  D --> E["资源证据: nvidia-smi / tegrastats"]
  E --> F{"是否有效加速"}
  F --> G["有效: 保留参数并进入 local API"]
  F --> H["无效: 解释计算 / 内存 / runtime / 功耗瓶颈"]
```

| 外部资料中的经典内容 | 本实验吸收什么 | 课程里的落点 |
| --- | --- | --- |
| vLLM serving 资料 | prefill、decode、KV Cache 和吞吐/延迟分开看 | 解释为什么 `ctx-size`、首 token 和 tokens/s 要分开记录 |
| TensorRT-LLM 文档 | runtime、kernel、precision 和 GPU 执行路径影响性能 | 作为更高阶路线，不替代本章 llama.cpp 实验 |
| llama.cpp CLI 文档 | `-ngl`、`--ctx-size`、threads、`--perf` 等参数口径 | 实验 1-3 的固定变量与改变变量 |
| llama.cpp llama-bench | 标准化 prompt processing / text generation 记录 | 实验 4 和最终报告第 5 节 |
| MLPerf Inference | 指标、负载、条件、结果一起报告 | 综合结果表必须写硬件、参数、日志和解释 |
| 课程实跑记录 | 短 prompt 采样可能抓不到 GPU 峰值 | 提醒用连续采样或 `llama-bench` 补证据 |

### 本课程重绘：一次只改一个变量

vLLM/DeepLearning.AI 的课程结构、KV Cache 和 benchmarking 图提醒我们：推理加速要先拆变量，再看指标。本实验仍以 llama.cpp 为主，把这些结构重画为“一次只改一个变量”的实验流程。

```mermaid
flowchart LR
  A["固定 baseline"] --> B{"选择一个变量"}
  B -- "-ngl" --> C["GPU offload 对比"]
  B -- "ctx-size" --> D["KV Cache / 首 token"]
  B -- "quant" --> E["Q8/Q5/Q4"]
  B -- "threads/batch" --> F["CPU/吞吐影响"]
  C --> G["同 prompt 运行"]
  D --> G
  E --> G
  F --> G
  G --> H["timing + 资源 + 质量"]
  H --> I["瓶颈是否移动"]
```

| 来源图思路 | 本实验吸收什么 | 转成哪个实验字段 |
| --- | --- | --- |
| [vLLM course structure](https://raw.githubusercontent.com/vllm-project/vllm-project.github.io/main/assets/figures/2026-06-03-deeplearning-ai-course/course-structure.png) | serving 课程会先讲指标、KV Cache、调度和 benchmark | 本实验把指标、KV Cache、`llama-bench` 分开记录 |
| [vLLM KV Cache](https://raw.githubusercontent.com/vllm-project/vllm-project.github.io/main/assets/figures/2026-06-03-deeplearning-ai-course/kv-cache.png) | 上下文长度不是免费参数，会改变缓存和内存压力 | `ctx-size` 对比表必须写首 token、内存和失败原因 |
| [vLLM benchmarking lab](https://raw.githubusercontent.com/vllm-project/vllm-project.github.io/main/assets/figures/2026-06-03-deeplearning-ai-course/benchmarking-lab.png) | benchmark 需要固定输入、硬件和运行条件 | `llama-bench` 结果表必须写硬件、模型、参数、日志 |

把 vLLM / TensorRT-LLM / MLPerf 里的性能思路落到本实验时，只保留四类变量：

| 变量 | 本实验怎么改 | 应该观察什么 |
| --- | --- | --- |
| GPU offload | `-ngl 0` 对比 `-ngl 99` 或设备可用最大值 | tokens/s、显存、CPU/GPU 负载 |
| 上下文长度 | `ctx-size` 1024/2048/4096 | 首 token、KV Cache、OOM 风险 |
| 量化格式 | Q8/Q5/Q4 或教师指定变体 | 文件大小、内存、质量和速度 |
| 服务形态 | CLI 对比 `llama-server` smoke test | API 端到端耗时和日志异常 |

所以，本章不是“调到最快”，而是训练学生说清楚：快在哪里、代价是什么、能否进入后续服务化验证。

## 前置条件

已经完成：

- [Ubuntu Server 与 NVIDIA GPU 环境](/docs/lab-ubuntu-nvidia)
- [Qwen 基线推理](/docs/lab-qwen-baseline)

需要准备：

| 项目 | 要求 |
| --- | --- |
| 模型 | 至少一个 Qwen GGUF |
| llama.cpp | `llama-completion` 和 `llama-bench` 可运行 |
| 日志目录 | `~/edge-ai-lab/logs` |
| 结果目录 | `~/edge-ai-lab/results` |
| 监控 | Ubuntu 用 `nvidia-smi`，Jetson 用 `tegrastats` |

一份服务器实跑记录见：[inference acceleration server run](https://github.com/neardws/edge-ai-deployment-course-runs/tree/main/runs/2026-06-29-inference-acceleration-server)。

## 实验原则

| 原则 | 说明 |
| --- | --- |
| 一次只改一个变量 | 否则无法解释收益来源 |
| 保存失败日志 | 失败比成功更能说明边界 |
| 不编造数字 | 没有采集到就写“未记录” |
| 质量和速度一起看 | 快但不可用不是有效优化 |
| 记录设备状态 | Jetson 特别要记录温度和功耗模式 |

## 实验 1：GPU offload

目标：观察 GPU offload 对速度和显存的影响。

固定变量：

- 模型文件。
- prompt。
- `ctx-size`。
- 生成长度。

改变变量：

- `-ngl 0`
- `-ngl 99`

命令：

```bash
cd ~/edge-ai-lab/src/llama.cpp

for ngl in 0 99
do
  ./build/bin/llama-completion \
    -m ~/edge-ai-lab/models/qwen/qwen2.5-0.5b-instruct-q4_k_m.gguf \
    -p "解释端侧模型推理加速的主要手段。" \
    -n 96 \
    --ctx-size 2048 \
    -ngl ${ngl} \
    --temp 0.2 \
    --seed 42 \
    -cnv \
    -st \
    --no-display-prompt \
    --perf \
    2>&1 | tee ~/edge-ai-lab/logs/qwen-ngl-${ngl}.txt
done
```

Ubuntu 观察：

```bash
watch -n 0.5 nvidia-smi
```

短 prompt 运行很快，单次前后快照可能抓不到峰值。需要峰值时，用连续采样或 `llama-bench` 补充判断。

Jetson 观察：

```bash
tegrastats --interval 1000 | tee ~/edge-ai-lab/logs/jetson-ngl-tegrastats.txt
```

记录表：

| 硬件 | `-ngl` | 首 token / prefill | tokens/s | 峰值内存/显存 | GPU 是否参与 | 质量备注 | 日志 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 待填 | 0 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| 待填 | 99 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

解释问题：

- `-ngl 99` 是否明显更快？
- 显存或统一内存是否增加？
- 输出质量是否变化？
- 如果没有变快，可能是哪些原因？

注意：`-ngl 0` 运行时日志中仍可能出现 CUDA backend 信息，因为二进制是 CUDA 版本。判断 GPU offload 不能只看 `system_info`，还要看 `-ngl`、速度变化和 benchmark 输出。

## 实验 2：上下文长度与 KV Cache

目标：观察 `ctx-size` 对内存、首 token 和稳定速度的影响。

固定变量：

- 模型文件。
- prompt。
- `-ngl`。
- 生成长度。

改变变量：

- `--ctx-size 1024`
- `--ctx-size 2048`
- `--ctx-size 4096`

命令：

```bash
for ctx in 1024 2048 4096
do
  ./build/bin/llama-completion \
    -m ~/edge-ai-lab/models/qwen/qwen2.5-0.5b-instruct-q4_k_m.gguf \
    -p "请用项目复盘方式解释 KV Cache 对端侧部署的影响，并列出三个风险。" \
    -n 96 \
    --ctx-size ${ctx} \
    -ngl 99 \
    --temp 0.2 \
    --seed 42 \
    -cnv \
    -st \
    --no-display-prompt \
    --perf \
    2>&1 | tee ~/edge-ai-lab/logs/qwen-ctx-${ctx}.txt
done
```

如果 4096 失败，不要删除失败日志。

记录失败原因：

- OOM。
- 进程被杀。
- 速度明显下降。
- 启动日志出现异常。

记录表：

| 硬件 | `ctx-size` | 首 token / prefill | tokens/s | 峰值内存/显存 | 是否成功 | 质量备注 | 日志 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 待填 | 1024 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| 待填 | 2048 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| 待填 | 4096 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

解释问题：

- `ctx-size` 增大后内存如何变化？
- 首 token 是否变化？
- tokens/s 是否变化？
- Jetson 是否更容易受 `ctx-size` 影响？

如果 prompt 很短，`ctx-size` 变化可能不会表现出明显的速度差异。不要因此得出“上下文长度不影响内存”的结论；长上下文和多轮对话需要单独验证。

## 实验 3：CPU 线程参数

目标：观察 CPU 路径或混合路径中线程参数的影响。

该实验主要用于理解 CPU fallback 或 `-ngl 0` baseline。

命令：

```bash
for threads in 2 4 8
do
  ./build/bin/llama-completion \
    -m ~/edge-ai-lab/models/qwen/qwen2.5-0.5b-instruct-q4_k_m.gguf \
    -p "用三句话解释 CPU fallback 为什么会影响推理速度。" \
    -n 64 \
    --ctx-size 1024 \
    -ngl 0 \
    -t ${threads} \
    --temp 0.2 \
    --seed 42 \
    -cnv \
    -st \
    --no-display-prompt \
    --perf \
    2>&1 | tee ~/edge-ai-lab/logs/qwen-cpu-t${threads}.txt
done
```

如果机器 CPU 核心较少，不需要照抄 `8`。

按实际核心数选择。

记录表：

| 硬件 | `-t` | CPU 使用 | tokens/s | 质量备注 | 日志 |
| --- | --- | --- | --- | --- | --- |
| 待填 | 2 | 待填 | 待填 | 待填 | 待填 |
| 待填 | 4 | 待填 | 待填 | 待填 | 待填 |
| 待填 | 8 | 待填 | 待填 | 待填 | 待填 |

解释问题：

- 线程数增加是否总是更快？
- 是否出现 CPU 饱和或内存带宽瓶颈？
- 这对 CPU fallback 有什么启发？

## 实验 4：llama-bench

目标：用更标准化的工具补充记录。

命令：

```bash
./build/bin/llama-bench \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-0.5b-instruct-q4_k_m.gguf \
  -p 128 \
  -n 64 \
  -ngl 99 \
  2>&1 | tee ~/edge-ai-lab/logs/llama-bench-q4-ngl99.txt
```

比较 CPU 和 GPU：

```bash
for ngl in 0 99
do
  ./build/bin/llama-bench \
    -m ~/edge-ai-lab/models/qwen/qwen2.5-0.5b-instruct-q4_k_m.gguf \
    -p 128 \
    -n 64 \
    -ngl ${ngl} \
    -r 3 \
    2>&1 | tee ~/edge-ai-lab/logs/llama-bench-ngl-${ngl}.txt
done
```

记录表：

| 硬件 | 模型 | `-p` | `-n` | `-ngl` | prompt eval | token eval | 备注 | 日志 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 待填 | 待填 | 128 | 64 | 0 | 待填 | 待填 | 待填 | 待填 |
| 待填 | 待填 | 128 | 64 | 99 | 待填 | 待填 | 待填 | 待填 |

`llama-bench` 的输出格式可能随版本变化。

按实际字段记录。

## 服务器实测参考

Qwen2.5 0.5B Q4_K_M 在一台服务器 GPU 上的实测参考：

| 实验 | 变量 | prompt eval | eval / decode | 判断 |
| --- | --- | ---: | ---: | --- |
| GPU offload | `-ngl 0` | 323.82 tokens/s | 86.61 tokens/s | CPU 路径明显慢 |
| GPU offload | `-ngl 99` | 1746.99 tokens/s | 454.45 tokens/s | GPU offload 明显有效 |
| ctx-size | 1024 | 2231.96 tokens/s | 453.46 tokens/s | 短 prompt 下变化不大 |
| ctx-size | 2048 | 2531.41 tokens/s | 446.97 tokens/s | 短 prompt 下变化不大 |
| ctx-size | 4096 | 1740.03 tokens/s | 442.24 tokens/s | 不能据此忽略 KV Cache |
| CPU threads | 2 | 204.20 tokens/s | 60.85 tokens/s | 较慢 |
| CPU threads | 4 | 394.13 tokens/s | 85.81 tokens/s | 本轮最佳 |
| CPU threads | 8 | 333.90 tokens/s | 84.16 tokens/s | 没有继续提升 |

`llama-bench` 同轮结果：

| `-ngl` | `pp128` | `tg64` |
| ---: | ---: | ---: |
| 0 | 497.34 +/- 50.76 tokens/s | 85.30 +/- 1.90 tokens/s |
| 99 | 11225.55 +/- 1566.34 tokens/s | 494.28 +/- 2.05 tokens/s |

这张表是参考样例，不是评分标准。学生仍需记录自己的设备、模型、runtime commit 和日志路径。

## 实验 5：Jetson 功耗和温度观察

如果有 Jetson，补充这一组。

运行前记录功耗模式：

```bash
sudo nvpmodel -q | tee ~/edge-ai-lab/results/jetson-nvpmodel.txt
sudo jetson_clocks --show | tee ~/edge-ai-lab/results/jetson-clocks-before.txt
```

另开终端：

```bash
tegrastats --interval 1000 | tee ~/edge-ai-lab/logs/jetson-acceleration-tegrastats.txt
```

运行 `ctx-size` 或 `-ngl` 对比命令。

记录：

| 实验 | 温度变化 | RAM 变化 | GPU/GR3D | 是否降频 | 备注 |
| --- | --- | --- | --- | --- | --- |
| `-ngl` 对比 | 待填 | 待填 | 待填 | 待填 | 待填 |
| `ctx-size` 对比 | 待填 | 待填 | 待填 | 待填 | 待填 |

## 综合结果表

| 实验 | 硬件 | 变量 | 参数 | 首 token / prefill | tokens/s | 峰值内存/显存 | 温度/功耗 | 质量备注 | 是否有效 | 日志 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GPU offload | 待填 | `-ngl` | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| ctx-size | 待填 | `ctx-size` | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| CPU 线程 | 待填 | `-t` | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| llama-bench | 待填 | `-p/-n/-ngl` | 待填 | 待填 | 待填 | 待填 | 待填 | 不适用 | 待填 | 待填 |

只有同模型、同 prompt、同生成长度、同采样参数的行才能直接比较。变量一次只改一个；如果同时改了模型、量化格式和 runtime 参数，只能作为现象记录，不能作为单变量结论。

回填报告第 5 节时按下面整理：

| 报告行 | 来自本实验哪类结果 | 未做时怎么写 |
| --- | --- | --- |
| `-ngl` | GPU offload 对比 | 写“未记录”，说明是否因无 GPU 或构建限制。 |
| `ctx-size` | 上下文长度对比 | 写“未记录”，说明下一轮补 1024/2048/4096 哪组。 |
| threads | CPU 线程对比 | 写“不适用”或“未记录”，说明是否主要走 GPU/Jetson。 |
| llama-bench | 标准 benchmark 输出 | 写“失败”，附日志路径和失败原因。 |

## 如何写实验结论

结论建议按下面结构写：

```text
本次实验中，最明显影响速度的变量是 ______。
证据是 ______。
主要代价是 ______。
在 Ubuntu Server 上建议 ______。
在 Jetson 上需要额外注意 ______。
下一步应该验证 ______。
```

不要只写“更快”。

要写“在什么条件下、快在哪里、代价是什么”。

## 验收结果

本章完整实验通过标准：

```text
[ ] 至少完成一组 GPU offload 对比
[ ] 至少完成一组 ctx-size 对比
[ ] 至少有一份 llama-bench 或等价 benchmark 日志
[ ] 资源监控记录已保存
[ ] 能说明瓶颈更像计算、内存、runtime、服务化还是功耗
```

本章产出写入最终报告第 5 节，不能替代第 4 节的三组量化/模型变体对比。
最终报告最低要求至少保留一类可解释的 runtime/profiling 对比；未完成的实验项写“未记录”并说明原因。

| 产物 | 验收标准 |
| --- | --- |
| GPU offload 日志 | `-ngl 0` 与 `-ngl 99` 至少各一次 |
| `ctx-size` 日志 | 至少两个上下文长度，最好 1024/2048/4096 |
| `llama-bench` 日志 | 至少一组 benchmark 输出 |
| 资源监控 | Ubuntu 记录 `nvidia-smi`，Jetson 记录 `tegrastats` |
| 综合结果表 | 每组实验都有参数、日志和解释 |
| 结论 | 能指出瓶颈来源和下一步优化方向 |

## 失败排查

### `ctx-size 4096` 失败

处理：

- 保存失败日志。
- 降到 2048 或 1024。
- 记录是否为 OOM。
- 检查模型大小和 KV Cache 预算。

### `-ngl 99` 没有变快

可能原因：

- llama.cpp 未启用 CUDA。
- 模型太小，CPU 已足够快。
- 低比特 kernel 没有明显收益。
- 数据搬运或内存带宽成为瓶颈。
- 日志中的 GPU offload 未真正发生。

### 线程数增加后变慢

可能原因：

- CPU 核心数不足。
- 线程调度开销上升。
- 内存带宽瓶颈。
- 其他进程竞争资源。

### `llama-bench` 输出看不懂

处理：

- 先保存原始输出。
- 找 prompt eval 和 token eval 相关字段。
- 与 CLI 业务 prompt 结果分开解释。

## 作业

提交一份推理加速报告，包含：

1. GPU offload 对比。
2. `ctx-size` 对比。
3. `llama-bench` 结果。
4. 至少一段失败或无提升案例分析。
5. Ubuntu Server 与 Jetson 的差异说明，若没有 Jetson，则写预期差异。

三句话复盘：

```text
本次实验中最明显影响速度的变量是 ______。
证据是 ______，代价是 ______。
下一步应该验证 ______，再进入 API 服务化。
```

## 参考资料

本章吸收方式：

- **知识点**：从 llama-bench、llama-cli、TensorRT-LLM 和 vLLM 文档吸收 benchmark、GPU offload、KV Cache 和 serving 参数的解释。
- **图解**：把服务化推理资料重画为参数影响表和瓶颈判断流程。
- **实验**：一次只改一个变量，记录 `-ngl`、ctx、threads、batch、首 token、tokens/s 和资源变化。
- **取舍**：不要求学生部署 vLLM/TensorRT-LLM 集群；它们用于解释更高阶路线。

- [llama.cpp llama-bench documentation](https://github.com/ggml-org/llama.cpp/tree/master/tools/llama-bench)
- [llama.cpp llama-cli documentation](https://github.com/ggml-org/llama.cpp/tree/master/tools/cli)
- [TensorRT-LLM documentation](https://nvidia.github.io/TensorRT-LLM/)
- [vLLM documentation](https://docs.vllm.ai/)
- [MLPerf Inference](https://mlcommons.org/benchmarks/inference/)
