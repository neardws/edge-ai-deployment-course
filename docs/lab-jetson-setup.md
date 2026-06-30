---
title: Jetson 环境与 Qwen 迁移
---

# Jetson 环境与 Qwen 迁移

## 建议学时

2 学时。

建议安排：

| 课时 | 内容 | 产出 |
| --- | --- | --- |
| 1 | Jetson 环境、JetPack、功耗模式、`tegrastats` 检查 | Jetson 环境日志 |
| 2 | 迁移 Qwen GGUF 和 llama.cpp 运行方式 | Ubuntu vs Jetson 对比表 |

本实验对应理论章节：

- [Jetson 部署基础](/docs/jetson-deployment)
- [推理框架与部署链路](/docs/runtime-deployment)
- [推理加速基础](/docs/inference-acceleration)

## 学习目标

完成本实验后，学习者应能：

- 在 Jetson 上确认 JetPack、Jetson Linux、CUDA、TensorRT 和基础工具状态。
- 复用 Ubuntu Server 实验中的 Qwen/llama.cpp 思路，在 Jetson 上建立 baseline。
- 使用 `tegrastats` 记录 CPU、GPU、内存、温度和功耗相关信息。
- 解释 Jetson 与普通 Ubuntu Server 在内存、功耗、散热和监控方式上的差异。
- 判断同一 Qwen GGUF 在 Jetson 上是否适合作为后续实验模型。

## 本章定位

| 项目 | 内容 |
| --- | --- |
| 本章解决的问题 | Ubuntu 上的 Qwen/llama.cpp 路线迁移到 Jetson 后，内存、功耗、温度和速度会怎样变化。 |
| 你需要先知道 | 已完成 Ubuntu baseline，知道 `tegrastats`、功耗模式和统一内存的含义。 |
| 你会产出 | Jetson 环境日志、`tegrastats` 日志、Ubuntu vs Jetson 对比表。 |
| 最终报告位置 | 第 2 节实验环境、第 7 节端侧部署风险。 |

## 问题背景

Jetson 不是一台“小号服务器”。

它通常有以下特点：

- CPU、GPU 和内存处在同一板级系统中。
- 内存预算比服务器更紧。
- 功耗模式会影响频率和持续性能。
- 散热条件会影响长时间运行稳定性。
- 软件栈由 JetPack、Jetson Linux、CUDA、TensorRT 等组合决定。

因此，同一条命令在 Ubuntu Server 上可用，并不代表在 Jetson 上也能得到相同性能。

本实验的目标不是追求最高速度，而是建立可复查的 Jetson baseline。

## 实验边界

本实验默认：

- Jetson 已能正常启动。
- 学员可以通过终端访问设备。
- 模型文件由教师提供或学员自行下载到 `~/edge-ai-lab/models/qwen`。
- 不把模型权重、第三方源码和构建产物提交到课程仓库。

如果课程设备不允许修改功耗模式，只记录当前功耗模式，不强行修改。

## 图示讲解

```mermaid
flowchart TD
  A[Jetson Board] --> B[JetPack / Jetson Linux]
  B --> C[CUDA / TensorRT]
  C --> D[llama.cpp CUDA Build]
  D --> E[Qwen GGUF]
  E --> F[CLI 推理]
  F --> G[tegrastats]
  G --> H[Ubuntu vs Jetson 对比]
```

与服务器的主要差异：

```mermaid
flowchart LR
  A[Ubuntu Server] --> B[独立 GPU 显存]
  A --> C[nvidia-smi]
  A --> D[较高功耗预算]
  E[Jetson] --> F[统一内存]
  E --> G[tegrastats]
  E --> H[功耗模式/温度约束]
```

## 前置条件

| 项目 | 要求 | 检查方式 |
| --- | --- | --- |
| Jetson 设备 | 已刷好系统并可登录 | SSH 或本机终端 |
| 存储空间 | 能放模型和源码 | `df -h` |
| 网络 | 能获取源码和模型，或已离线准备 | `git`、模型文件 |
| 散热 | 能持续运行实验 | 观察温度 |
| 电源 | 满足设备要求 | 按板卡说明确认 |

实跑记录：

- [Jetson 登录预检](https://github.com/neardws/edge-ai-deployment-course-runs/tree/main/runs/2026-06-29-jetson-login-check)
- [Jetson 环境与构建预检](https://github.com/neardws/edge-ai-deployment-course-runs/tree/main/runs/2026-06-29-jetson-env-build-preflight)
- [Jetson Qwen baseline](https://github.com/neardws/edge-ai-deployment-course-runs/tree/main/runs/2026-06-29-jetson-qwen-baseline)
- [Jetson 本地 API 服务](https://github.com/neardws/edge-ai-deployment-course-runs/tree/main/runs/2026-06-29-jetson-local-service)

## 公开资料怎么转成本章内容

Jetson documentation、JetPack SDK、Jetson AI Lab、TensorRT 和 Qwen/llama.cpp 资料都能提供边缘设备部署线索。本实验不整理 Jetson 型号百科，也不要求学生复现所有 Jetson AI demo；只把这些资料转成迁移检查：软件栈是否清楚、功耗模式是否记录、`tegrastats` 是否覆盖推理过程、Qwen GGUF 是否能形成 Ubuntu vs Jetson 对比。

```mermaid
flowchart LR
  A["公开资料: Jetson / JetPack / Jetson AI Lab"] --> B["环境证据: L4T / JetPack / CUDA / TensorRT"]
  B --> C["构建证据: llama.cpp CUDA / arch / build log"]
  C --> D["运行证据: Qwen GGUF baseline"]
  D --> E["设备证据: tegrastats / nvpmodel / temperature / power"]
  E --> F["对比: Ubuntu Server vs Jetson"]
  F --> G["部署报告: 继续量化 / 降 ctx / 换模型 / 改散热"]
```

| 外部资料中的经典内容 | 本实验吸收什么 | 课程里的落点 |
| --- | --- | --- |
| Jetson documentation | Jetson 软件栈、设备概念和系统检查入口 | Step 2-4 的 L4T、内存、功耗模式记录 |
| JetPack SDK | CUDA、TensorRT、Jetson Linux 的版本关系 | 用于解释为什么要记录 JetPack/Jetson Linux |
| Jetson AI Lab | 边缘 AI demo 和设备约束示例 | 作为案例参考，不替代 Qwen/llama.cpp 主线 |
| TensorRT / TensorRT Edge-LLM | NVIDIA edge runtime 和加速路线 | 说明 Jetson 上还有 TensorRT 路线，但本实验先跑 GGUF baseline |
| Qwen / llama.cpp | Qwen GGUF、本地推理、server 和 benchmark | Step 6-8 的构建、baseline 和短 benchmark |
| 课程实跑记录 | 登录、构建、baseline、local service 的真实日志 | 用失败和成功样例提醒学生保留证据 |

### 本课程重绘：Jetson 迁移预检

Jetson AI Lab 的设备族图提示我们：Jetson 路线必须先写清设备和软件栈。本实验把它重画成迁移预检链路。

```mermaid
flowchart LR
  A["Jetson 型号 / 内存"] --> B["JetPack / L4T"]
  B --> C["CUDA / TensorRT / cuDNN"]
  C --> D["功耗模式 / 散热 / 电源"]
  D --> E["llama.cpp build log"]
  E --> F["Qwen GGUF baseline"]
  F --> G["Ubuntu vs Jetson 对比"]
```

| 来源图思路 | 本实验要补的记录 |
| --- | --- |
| [Jetson AI Lab device family](https://www.jetson-ai-lab.com/images/hero/jetson-family-line_50pcnt.png) | 写清楚具体设备型号、内存、JetPack/L4T |
| 边缘设备受功耗和散热影响 | 记录 `nvpmodel -q`、`tegrastats`、散热/电源条件 |
| demo 不能替代本课程实测 | 保存 Qwen GGUF 命令、stdout/stderr、质量样例和 Ubuntu 对照 |

把官方资料转成实验动作时，只保留会影响 Qwen 迁移判断的字段：

| 字段 | 采集命令或证据 | 写入哪里 |
| --- | --- | --- |
| Jetson Linux / L4T | `cat /etc/nv_tegra_release` | 环境摘要、报告第 2 节 |
| 功耗模式 | `nvpmodel -q` | Jetson 对比表 |
| 内存和温度 | `tegrastats --logfile ...` | profiling 记录和风险登记 |
| CUDA 构建 | llama.cpp build log | runtime 参数说明 |
| 模型运行 | Qwen baseline stdout/stderr | baseline 与量化对比 |
| 本地服务 | API 请求、响应、server 日志 | local API smoke test |

所以，本章验收的是迁移判断能力：同一模型到了 Jetson 后，是内存、功耗、温度、构建参数还是模型尺寸限制了下一步。

外部 Jetson 教程里的截图、demo 和设备介绍只能作为结构参考，必须同时改写成下面这张迁移记录表。否则学生容易只看到“Jetson 能跑 AI demo”，看不到自己的 Qwen 主线到底卡在哪里。

| 外部资料常见内容 | 本实验吸收成什么 | 学生需要填写 |
| --- | --- | --- |
| 设备家族图 | 设备不是同一类服务器 GPU，内存、功耗和散热不同 | Jetson 型号、内存、存储、电源、散热 |
| JetPack 安装页 | JetPack、L4T、CUDA、TensorRT 是一组绑定版本 | `nv_tegra_release`、JetPack 版本、CUDA/TensorRT 版本 |
| AI demo 截图 | demo 证明平台能力，不证明本课程模型可用 | Qwen GGUF 是否加载、日志路径、失败原因 |
| TensorRT 示例 | Jetson 有图优化和加速路线 | 本实验是否仍使用 llama.cpp，是否另列 TensorRT 选做 |
| 性能宣传图 | 只能提供设备背景 | 不写入课程结论，结论只来自本机日志 |
| tegrastats 示例 | 边缘设备必须看温度、功耗和统一内存 | `tegrastats` logfile、峰值内存、温度区间 |

NVIDIA Jetson Linux Developer Guide 里的软件栈图适合说明为什么 JetPack/L4T/CUDA/TensorRT 不能分开乱记。本实验把它们重画成按层排查的记录图。

```mermaid
flowchart TD
  A["Jetson Linux / L4T"] --> B["JetPack libraries"]
  B --> C["CUDA / TensorRT / cuDNN"]
  C --> D["runtime: llama.cpp / optional TensorRT"]
  D --> E["model: Qwen GGUF"]
  E --> F["monitor: tegrastats / logs"]
```

| 来源栈图 | 本实验吸收什么 | 记录字段 |
| --- | --- | --- |
| [Jetson software stack](https://docs.nvidia.com/jetson/archives/r38.4/DeveloperGuide/_images/jetson-software-stack.jpg) | JetPack 把系统、库、AI 组件和工具组合在一起 | JetPack、L4T、CUDA、TensorRT、cuDNN |
| [Jetson Linux stack](https://docs.nvidia.com/jetson/archives/r38.4/DeveloperGuide/_images/jetson-linux-stack.jpg) | 板级系统不是普通 Ubuntu 镜像 | `nv_tegra_release`、kernel、Ubuntu 版本 |
| [NVIDIA AI compute stack](https://docs.nvidia.com/jetson/archives/r38.4/DeveloperGuide/_images/jetson-ai-compute-stack.jpg) | 推理性能受 CUDA/TensorRT/框架层共同影响 | llama.cpp 构建参数、是否使用 TensorRT 路线、fallback 说明 |
| 三张图合在一起 | Jetson 问题要按层排查 | 环境层、runtime 层、模型层、设备监控层 |

## Step 0：确认能登录 Jetson

先确认 SSH 账号、密钥或密码可用，再进入环境检查。

```bash
ssh -o BatchMode=yes -o ConnectTimeout=8 \
  <jetson-user>@<jetson-host> \
  'echo SSH_OK; hostname; whoami'
```

如果看到 `Permission denied`，先找教师确认账号、SSH key 或密码。不要继续执行后面的环境命令。

如果看到 `Host key verification failed`，说明本机记录的 host key 和当前设备不一致。常见原因是设备重刷、IP 被复用或你连到了另一台机器。先让教师确认设备指纹，再处理本机 SSH known_hosts 记录。

如果教师说明设备必须通过实验室网关访问，要确认是哪一种方式：`ProxyJump` 使用的是你本机的 SSH key；先登录网关再从网关登录 Jetson，使用的是网关上的认证材料。两者失败原因不同。

## Step 1：建立实验目录

```bash
mkdir -p ~/edge-ai-lab/{models/qwen,src,logs,results}
cd ~/edge-ai-lab
```

记录目录：

```bash
find ~/edge-ai-lab -maxdepth 2 -type d | sort
```

## Step 2：检查 Jetson 系统信息

```bash
cat /etc/nv_tegra_release
uname -a
cat /etc/os-release
free -h
df -h
```

记录：

| 字段 | 说明 |
| --- | --- |
| Jetson Linux / L4T 版本 | 决定底层软件栈 |
| Ubuntu 版本 | 系统包和工具链相关 |
| 内核版本 | 驱动问题排查 |
| 内存总量 | 判断模型和 KV Cache 能力 |
| 存储空间 | 判断是否能放模型和构建产物 |

## Step 3：检查工具链和 NVIDIA 组件

```bash
python3 --version
cmake --version
git --version
gcc --version
g++ --version
```

如果系统提供 CUDA 编译器，也可记录：

```bash
nvcc --version
```

Jetson 上 `nvcc` 可能已安装但不在默认 `PATH`。如果 `nvcc` 找不到，先检查：

```bash
ls -ld /usr/local/cuda*
find /usr/local -maxdepth 3 -name nvcc 2>/dev/null
export PATH=/usr/local/cuda-12.6/bin:$PATH
nvcc --version
```

如果能查询 TensorRT Python 包：

```bash
python3 -c "import tensorrt as trt; print(trt.__version__)"
```

如果没有 TensorRT Python 包，不代表本实验不能继续。

本实验主线是 llama.cpp + GGUF。

## Step 4：检查功耗模式和频率状态

查询功耗模式：

```bash
nvpmodel -q
```

查看时钟状态：

```bash
sudo jetson_clocks --show
```

部分设备允许普通用户查询 `nvpmodel`，但 `jetson_clocks --show` 仍需要 root。如果没有 sudo 权限，记录“无权限查询/固定频率”即可。

如果课程允许固定频率，可由教师统一执行：

```bash
sudo jetson_clocks
```

如果不允许修改，只记录当前状态。

不要在不了解散热和电源条件的情况下强行提高功耗模式。

## Step 5：启动 `tegrastats`

另开一个终端运行，并按本次 baseline 命名日志：

```bash
{
  date
  tegrastats --interval 1000
} | tee ~/edge-ai-lab/logs/jetson-tegrastats-baseline.txt
```

运行实验结束后，用 `Ctrl+C` 停止。

关注：

| 项目 | 说明 |
| --- | --- |
| RAM | 统一内存占用 |
| CPU | CPU 负载 |
| GPU/GR3D | GPU 使用情况 |
| 温度 | 是否接近热限制 |
| 功耗 | 如果设备输出功耗字段，记录变化 |

为了和 Qwen 运行日志对齐，开始推理前后各记录一次时间：

```bash
date | tee -a ~/edge-ai-lab/logs/jetson-qwen-baseline.txt
```

## Step 6：构建 llama.cpp

```bash
cd ~/edge-ai-lab/src
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
export PATH=/usr/local/cuda-12.6/bin:$PATH
cmake -B build-jetson -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=87
cmake --build build-jetson --config Release --target llama-cli llama-bench llama-completion -j2
```

`CMAKE_CUDA_ARCHITECTURES=87` 面向 Jetson Orin。不要在 Orin NX 上默认编译多套 CUDA 架构，否则首次构建会明显变慢。

即使只构建 `llama-cli`、`llama-bench` 和 `llama-completion`，当前上游构建也可能编译 `server-context`、`mtmd` 和大量模型适配器。看到这些输出不代表走错了。

如果 Jetson 不能直接访问 GitHub，可以使用教师提供的源码包或内网镜像。不要把第三方源码提交进课程仓库。

如果内存紧张或温度较高，可以降低并行度：

```bash
cmake --build build-jetson --config Release --target llama-cli llama-bench llama-completion -j1
```

记录构建日志：

```bash
cmake -B build-jetson -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=87 \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-cmake.txt
cmake --build build-jetson --config Release --target llama-cli llama-bench llama-completion -j2 \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-build.txt
```

检查工具：

```bash
./build-jetson/bin/llama-cli --help | head
./build-jetson/bin/llama-bench --help | head
./build-jetson/bin/llama-completion --help | head
```

## Step 7：准备 Qwen GGUF

把模型放在：

```bash
~/edge-ai-lab/models/qwen/
```

检查文件：

```bash
ls -lh ~/edge-ai-lab/models/qwen/*.gguf
```

记录：

| 字段 | 示例 |
| --- | --- |
| 模型来源（报告第 2 节） | 待填 |
| 模型许可证（报告第 2 节） | 待填，查不到写“未记录” |
| 文件名 | 待填 |
| SHA256（报告第 2 节） | `sha256sum *.gguf` |
| 量化格式 | Q4/Q5/Q8 等 |
| 文件大小 | 待填 |
| 下载日期 | 待填 |

## Step 8：运行 Qwen baseline

```bash
cd ~/edge-ai-lab/src/llama.cpp

./build-jetson/bin/llama-completion \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -p "用三句话解释 Jetson 上做端侧模型部署需要关注什么。" \
  -n 128 \
  --ctx-size 2048 \
  -ngl 99 \
  -cnv \
  -st \
  --no-display-prompt \
  --perf \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-qwen-baseline.txt
```

如果失败，先尝试降低上下文：

```bash
./build-jetson/bin/llama-completion \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -p "用三句话解释 Jetson 上做端侧模型部署需要关注什么。" \
  -n 96 \
  --ctx-size 1024 \
  -ngl 99 \
  -cnv \
  -st \
  --no-display-prompt \
  --perf \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-qwen-baseline-ctx1024.txt
```

如果仍失败，再比较 CPU 路径：

```bash
./build-jetson/bin/llama-completion \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -p "用三句话解释 Jetson 上做端侧模型部署需要关注什么。" \
  -n 96 \
  --ctx-size 1024 \
  -ngl 0 \
  -cnv \
  -st \
  --no-display-prompt \
  --perf \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-qwen-cpu.txt
```

可再补一个短 benchmark。Jetson smoke test 可以先用较小的 `p/n`，避免把首次验证拖太久：

```bash
./build-jetson/bin/llama-bench \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -ngl 99 \
  -p 64 \
  -n 64 \
  -r 2 \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-qwen-bench.txt
```

## Step 9：填写 Ubuntu vs Jetson 对比

| 项目 | Ubuntu Server | Jetson |
| --- | --- | --- |
| 设备型号 | 待填 | 待填 |
| GPU | 待填 | 待填 |
| 内存/显存 | 待填 | 待填 |
| 驱动/JetPack | 待填 | 待填 |
| 模型文件 | 待填 | 待填 |
| 量化格式 | 待填 | 待填 |
| `ctx-size` | 待填 | 待填 |
| `-ngl` | 待填 | 待填 |
| 首 token | 待填 | 待填 |
| tokens/s | 待填 | 待填 |
| 峰值内存/显存 | 待填 | 待填 |
| 温度 | 待填 | 待填 |
| 功耗模式 | 不适用/待填 | 待填 |
| 质量备注 | 待填 | 待填 |
| 原始日志 | 待填 | 待填 |

Qwen2.5 0.5B Q4_K_M 在一台 Orin NX Super 类设备上的实测参考：

| 指标 | 结果 |
| --- | --- |
| `ctx-size` | 1024 |
| `-ngl` | 99 |
| prompt eval | 57.06 ms / 24 tokens，420.64 tokens/s |
| eval | 753.86 ms / 75 runs，99.49 tokens/s |
| `llama-bench pp64` | 2231.94 +/- 714.71 tokens/s |
| `llama-bench tg64` | 115.88 +/- 9.03 tokens/s |
| `tegrastats` | GR3D 最高约 97%，GPU 温度约 57-61 C，VDD_IN 峰值样本约 15 W |
| 输出质量 | 相关但偏泛，建议记为“部分满足” |

这张表是参考样例，不是评分标准。不同功耗模式、散热、模型文件和 runtime commit 都会改变结果。

## 验收结果

选择 Jetson 作为目标设备时的通过标准：

```text
[ ] Jetson 环境日志已保存
[ ] 功耗模式已记录，或说明无权限
[ ] 至少一次 Qwen 推理过程有 `tegrastats` 记录
[ ] 能填出 Ubuntu vs Jetson 的关键差异
[ ] 能写出 Jetson 上下一步该降模型、降 ctx 还是改善散热
```

40 学时如果选择 Ubuntu Server + NVIDIA GPU 作为目标设备，本章可以作为路线阅读；最终报告写“Jetson 不适用（未测）”并说明未测原因。60 学时或教师明确布置 Jetson 对照时，再按本章标准验收。
本章只适用于选择 Jetson 路线或做扩展对照的学生；Ubuntu-only 最终项目可跳过本章。

| 产物 | 验收标准 |
| --- | --- |
| Jetson 环境日志 | 包含 JetPack/Jetson Linux、OS、内存、磁盘 |
| 功耗模式记录 | 包含 `nvpmodel` 或说明无权限 |
| `tegrastats` 日志 | 覆盖一次 Qwen 推理过程 |
| llama.cpp 构建记录 | 能说明是否启用 CUDA |
| Qwen baseline 输出 | 固定 prompt 能生成文本 |
| Ubuntu vs Jetson 表 | 60 学时或已有 Ubuntu baseline 时填写；40 学时 Jetson-only 路线至少写 Jetson 环境、`tegrastats`、Qwen baseline 和下一步判断 |

## 失败排查

### 构建过程中内存不足

处理：

- 降低并行度，例如 `-j2`。
- 关闭不必要进程。
- 确认磁盘空间足够。

### `-ngl 99` 运行失败

处理：

- 先确认 CUDA 构建是否成功。
- 降低 `ctx-size`。
- 换更小模型或更低量化文件。
- 尝试 `-ngl 0` 判断是否是 GPU 路径问题。

### 推理过程中设备变慢

检查：

- `tegrastats` 中温度是否升高。
- 功耗模式是否限制性能。
- 电源和散热是否可靠。
- 是否同时运行其他高负载任务。

### 结果与 Ubuntu Server 差异很大

这是正常现象。

需要解释差异来自：

- 独立显存 vs 统一内存。
- GPU 规模和带宽。
- 功耗和散热。
- Runtime 后端和 kernel 行为。
- 模型是否适合该设备。

## 作业

提交一份 Jetson 迁移记录，包含：

1. Jetson 环境摘要。
2. `tegrastats` 关键片段。
3. Qwen baseline 输出摘要。
4. Ubuntu Server 与 Jetson 对比表。
5. 是否建议在该 Jetson 上继续做 Qwen 量化实验，以及原因。

## 参考资料

本章吸收方式：

- **知识点**：从 Jetson AI Lab、Jetson docs、Developer Guide 和 llama.cpp 构建文档吸收设备环境、功耗、散热、构建和迁移检查。
- **图解**：吸收 Jetson AI Lab 设备图和 NVIDIA 栈图的结构，再把 Jetson 官方资料重画为环境预检、运行监控和 Ubuntu vs Jetson 对比表。
- **实验**：至少保存 Jetson 环境摘要、`tegrastats`、Qwen baseline 和迁移判断。
- **取舍**：Ubuntu-only 项目可把本章作为路线阅读；不强制新增完整 Jetson 项目。

- [Jetson AI Lab](https://www.jetson-ai-lab.com/)
- [NVIDIA Jetson documentation](https://docs.nvidia.com/jetson/)
- [NVIDIA JetPack SDK](https://developer.nvidia.com/embedded/jetpack)
- [NVIDIA Jetson Linux Developer Guide](https://docs.nvidia.com/jetson/archives/r36.4.4/DeveloperGuide/)
- [TensorRT documentation](https://docs.nvidia.com/deeplearning/tensorrt/latest/)
- [Qwen llama.cpp 本地运行指南](https://qwen.readthedocs.io/en/v2.5/run_locally/llama.cpp.html)
- [llama.cpp build documentation](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)
