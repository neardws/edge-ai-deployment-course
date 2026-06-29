---
title: 排障索引
---

# 排障索引

先按现象定位，再回到对应实验页。不要一开始就重装环境。

| 现象 | 先看什么 | 常见原因 | 报告位置 / 第 7 节风险项 | 回看章节 |
| --- | --- | --- | --- | --- |
| CUDA 找不到 | `nvidia-smi`、CMake 日志 | 驱动可见但开发库缺失 | 第 2 节环境限制；未解决再写内存/显存或 runtime 风险 | [Ubuntu 环境](/docs/lab-ubuntu-nvidia) |
| `llama-cli` 不存在 | `build/bin` | 构建失败或路径不对 | 附录失败日志；影响实验完成时写 runtime 风险 | [Qwen 基线推理](/docs/lab-qwen-baseline) |
| 模型文件缺失或加载失败 | `ls -lh ~/edge-ai-lab/models/qwen/*.gguf`、`-m` 参数、文件大小、来源、SHA256 | 未下载、路径错误、GGUF 下载不完整或版本不兼容 | 第 3 节写“缺失/失败”；最终验收前必须补模型文件和成功 baseline | [Qwen 基线推理](/docs/lab-qwen-baseline) |
| baseline 命令执行失败 | baseline 日志、stderr、模型输出 | OOM、fallback、unsupported、CUDA offload 参数不匹配 | 第 3 节 baseline 失败；第 7 节按内存/显存或 runtime 风险登记 | [Qwen 基线推理](/docs/lab-qwen-baseline) |
| baseline 命令一直停在 `>` 提示符 | 是否用了 `llama-cli --no-conversation`，日志是否提示 `please use llama-completion instead` | 当前 llama.cpp 版本进入了交互模式 | 第 3 节写 baseline 命令失败；改用 `llama-completion -cnv -st` 后重跑 | [Qwen 基线推理](/docs/lab-qwen-baseline) |
| Jetson SSH 返回 `Permission denied` | 账号、SSH key、密码、是否能本机登录 | 课程账号未配置、key 未下发、root 登录被禁用 | 第 2 节写“Jetson 登录未通过”，不要伪造环境结果 | [Jetson 环境](/docs/lab-jetson-setup) |
| Jetson 只能通过网关访问 | 教师给的是 ProxyJump 还是先登录网关再登录 Jetson | 本机 key 和网关上的 key 不同 | 第 2 节写明访问方式，不公开内网地址 | [Jetson 环境](/docs/lab-jetson-setup) |
| Jetson 上 `nvcc` 找不到 | `/usr/local/cuda*`、`find /usr/local -name nvcc` | CUDA 已装但不在默认 `PATH` | 第 2 节写 CUDA 路径；构建前导出 PATH | [Jetson 环境](/docs/lab-jetson-setup) |
| Jetson CUDA 构建特别慢 | CMake 日志里的 `CMAKE_CUDA_ARCHITECTURES` | 默认编译了多套 CUDA 架构 | 第 7 节写构建风险；Orin 先用 `-DCMAKE_CUDA_ARCHITECTURES=87` | [Jetson 环境](/docs/lab-jetson-setup) |
| 首 token 很慢 | prompt eval、prompt 长度 | prefill 成本、冷启动、长上下文 | 第 3/5 节指标；第 7 节写长上下文或并发/超时风险 | [机器学习推理基础](/docs/ml-inference-basics) |
| tokens/s 很低 | eval time、GPU 是否参与 | CPU fallback、低比特 kernel 不匹配 | 第 5 节加速实验；第 7 节写 runtime/GPU offload 风险 | [推理加速实验](/docs/lab-inference-acceleration) |
| Q4 更小但不更快 | offload 日志、kernel 支持 | 反量化开销或瓶颈不在权重读取 | 第 4 节量化判断；第 7 节写性能或输出质量风险 | [推理加速基础](/docs/inference-acceleration) |
| 量化后质量下降、重复或不满足固定 prompt | 固定 prompt、Q8/Q5/Q4 输出对比 | 低比特误差、采样参数、模型不匹配 | 第 4 节质量观察；第 7 节写输出质量风险 | [Qwen 量化对比](/docs/lab-qwen-quantization) |
| 显存或内存爆 | `ctx-size`、KV Cache、资源监控 | 上下文过长、模型过大、系统进程占用 | 第 7 节写内存/显存 + 长上下文风险 | [大模型量化与 KV Cache](/docs/llm-quantization) |
| 输出乱码或风格异常 | tokenizer、chat template | 模型不是 instruct 版或模板不一致 | 第 7 节写输出质量风险 | [Transformer 与 LLM 基础](/docs/transformer-llm-basics) |
| API 无响应 | server 日志、端口、host | 服务未启动、端口不一致、防火墙 | 第 6 节服务失败；第 7 节写并发/超时或安全风险 | [本地 API](/docs/lab-local-service) |
| API 返回非 200 或非 JSON | `api-curl-meta.txt`、`api-curl-response.json`、server 日志 | endpoint 路径、请求 JSON、模型未加载、服务端异常 | 第 6 节写失败；附 HTTP 状态、响应 JSON/原始响应和 server 日志 | [本地 API](/docs/lab-local-service) |
| API 成功但很慢或超时 | server 日志、请求耗时、模型加载 | 冷启动、请求排队、上下文过长 | 第 6 节服务记录；第 7 节写并发/超时风险 | [本地 API](/docs/lab-local-service) |
| Jetson 速度越跑越慢 | `tegrastats`、温度、功耗模式 | 热降频、电源或散热不足 | 第 7 节写温度/功耗风险；RAM 接近上限时补内存风险 | [Jetson 环境](/docs/lab-jetson-setup) |
| 模型许可证未记录 | 模型卡、教师说明、下载来源 | 来源不清或离线包缺说明 | 第 2 节写未记录；第 7 节写许可证风险 | [Qwen 基线推理](/docs/lab-qwen-baseline) |
| 服务端口暴露到公网 | host、端口、防火墙 | 绑定 `0.0.0.0` 且无鉴权 | 第 7 节写安全和日志风险 | [本地 API](/docs/lab-local-service) |
| 日志含敏感输入 | prompt、请求 JSON、server 日志 | 未脱敏记录用户输入 | 第 7 节写安全和日志风险，附录只放脱敏摘要 | [本地 API](/docs/lab-local-service) |
| 需要云端兜底但未验证 | fallback 触发条件、网络、错误处理 | 只做了本地单机 smoke test | 第 7 节写端云 fallback 风险 | [最终项目](/docs/final-project) |

## 排障顺序

1. 保存原始日志。
2. 判断是环境、模型、runtime、参数还是服务层问题。
3. 先判断它属于报告第 2/3/4/5/6 节的哪类实验结果，再判断是否需要进入第 7 节风险登记表。
4. 只改变一个变量重试。
5. 在报告中记录失败现象、证据日志、影响和下一步。

失败日志不是脏数据。端侧部署报告需要失败样例来说明边界。
