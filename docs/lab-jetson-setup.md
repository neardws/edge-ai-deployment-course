---
title: Jetson 环境与 Qwen 迁移
---

# Jetson 环境与 Qwen 迁移

## 建议学时

2 学时。1 学时完成 Jetson 环境检查，1 学时迁移 Qwen GGUF 推理并记录 `tegrastats`。

## 学习目标

- 在 Jetson 上确认 JetPack、CUDA、TensorRT 和基础工具状态。
- 复用 Ubuntu Server 实作中的 Qwen/llama.cpp 思路，在 Jetson 上建立 baseline。
- 使用 `tegrastats` 记录 CPU、GPU、内存、温度和功耗相关信息。

## 环境检查

```bash
mkdir -p ~/edge-ai-lab/{models,src,logs,results}
cd ~/edge-ai-lab

cat /etc/nv_tegra_release
uname -a
free -h
df -h
python3 --version
cmake --version
git --version
tegrastats
```

可选检查：

```bash
sudo nvpmodel -q
sudo jetson_clocks --show
```

## llama.cpp 构建

Jetson 上的构建参数可能随 JetPack、CUDA 和 llama.cpp 版本变化。课程中建议先使用 llama.cpp 官方构建文档确认当前推荐参数，再记录 commit 和构建日志。

```bash
cd ~/edge-ai-lab/src
git clone https://github.com/ggml-org/llama.cpp.git
cd llama.cpp
cmake -B build -DGGML_CUDA=ON
cmake --build build --config Release -j
```

## Qwen baseline

```bash
./build/bin/llama-cli \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -p "用三句话解释 Jetson 上做端侧模型部署需要关注什么。" \
  -n 128 \
  --ctx-size 2048 \
  -ngl 99 \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-qwen-baseline.txt
```

另开窗口记录：

```bash
tegrastats --interval 1000 | tee ~/edge-ai-lab/logs/jetson-qwen-tegrastats.txt
```

## 记录模板

| 项目 | Ubuntu Server | Jetson |
| --- | --- | --- |
| 模型文件 | 待填 | 待填 |
| 量化格式 | 待填 | 待填 |
| ctx-size | 待填 | 待填 |
| 首 token | 待填 | 待填 |
| tokens/s | 待填 | 待填 |
| 峰值内存/显存 | 待填 | 待填 |
| 温度 | 待填 | 待填 |
| 功耗模式 | 不适用/待填 | 待填 |
| 质量备注 | 待填 | 待填 |

## 验收结果

- Jetson 环境检查日志。
- llama.cpp 构建记录。
- Qwen baseline 输出日志。
- `tegrastats` 记录。
- Ubuntu Server vs Jetson 对比表。

## 常见问题

- **只看 Qwen 是否能输出**：Jetson 上还要看温度、功耗和长期稳定性。
- **没有记录 JetPack 版本**：JetPack 决定 CUDA/TensorRT 等依赖组合。
- **复制服务器参数**：Jetson 的内存、功耗和散热约束不同，参数需要单独验证。

## 参考资料

- [Jetson AI Lab](https://www.jetson-ai-lab.com/)
- [NVIDIA Jetson documentation](https://docs.nvidia.com/jetson/)
- [llama.cpp build docs](https://github.com/ggml-org/llama.cpp/blob/master/docs/build.md)
