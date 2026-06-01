---
title: 推理加速实验
---

# 推理加速实验

## 建议学时

2 学时。1 学时做参数对比实验，1 学时整理结果并解释瓶颈来源。

## 学习目标

- 用实验验证推理加速手段是否真实有效。
- 区分模型量化、GPU offload、上下文长度、线程和 batch 对性能的影响。
- 建立“不凭感觉调参”的实验记录方式。

## 实验矩阵

| 实验 | 变量 | 固定项 | 观察 |
| --- | --- | --- | --- |
| GPU offload | `-ngl 0` / `-ngl 99` | 模型、prompt、ctx、生成长度 | 首 token、tokens/s、内存 |
| 上下文长度 | `--ctx-size 1024/2048/4096` | 模型、prompt、`-ngl` | KV Cache、内存、首 token |
| 量化格式 | Q8/Q5/Q4 | prompt、ctx、`-ngl` | 文件大小、速度、质量 |
| 线程参数 | `-t` 不同值 | CPU 路径或混合路径 | CPU 利用率、速度 |
| benchmark | `llama-bench` 参数 | 模型、硬件 | prompt eval、token eval |

## 命令示例

GPU offload：

```bash
for ngl in 0 99
do
  ./build/bin/llama-cli \
    -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
    -p "解释端侧模型推理加速的主要手段。" \
    -n 128 \
    --ctx-size 2048 \
    -ngl ${ngl} \
    2>&1 | tee ~/edge-ai-lab/logs/qwen-ngl-${ngl}.txt
done
```

上下文长度：

```bash
for ctx in 1024 2048 4096
do
  ./build/bin/llama-cli \
    -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
    -p "请用项目复盘方式解释 KV Cache 对端侧部署的影响。" \
    -n 128 \
    --ctx-size ${ctx} \
    -ngl 99 \
    2>&1 | tee ~/edge-ai-lab/logs/qwen-ctx-${ctx}.txt
done
```

benchmark：

```bash
./build/bin/llama-bench \
  -m ~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf \
  -p 512 \
  -n 128 \
  -ngl 99
```

## 结果表

| 实验 | 参数 | 首 token | tokens/s | 峰值内存 | 温度/功耗 | 质量备注 | 日志 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GPU offload | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| ctx-size | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |
| 量化格式 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 | 待填 |

## 验收结果

- 至少三组加速实验日志。
- 对每组实验写出“是否有效”和“为什么”。
- 指出当前瓶颈更像模型、runtime、内存、GPU offload、温度还是服务化问题。

## 常见问题

- **一次改多个变量**：无法判断提升来自哪里。
- **只记录最快结果**：需要保留失败和变慢的参数。
- **忽略质量**：推理加速不能以破坏业务输出为代价。

## 参考资料

- [llama.cpp llama-bench](https://github.com/ggml-org/llama.cpp/tree/master/tools/llama-bench)
- [vLLM documentation](https://docs.vllm.ai/)
- [TensorRT-LLM documentation](https://nvidia.github.io/TensorRT-LLM/)
