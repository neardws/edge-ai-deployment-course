---
title: 本地 OpenAI-compatible 服务
---

# 本地 OpenAI-compatible 服务

## 建议学时

2 学时。

建议安排：

| 课时 | 内容 | 产出 |
| --- | --- | --- |
| 1 | 启动 `llama-server`，用 `curl` 完成 API smoke test | server 日志和 JSON 响应 |
| 2 | 用 Python 客户端调用，记录超时、错误和服务化开销 | 服务验收记录 |

最终报告最低验收只要求 curl 或 Python 客户端任选其一；如果课堂安排 2 学时，建议两种客户端都试一次。

本实验对应理论章节：

- [推理框架与部署链路](/docs/runtime-deployment)
- [推理加速基础](/docs/inference-acceleration)
- [VLM 与 Agent 端侧扩展](/docs/vlm-agent)

## 学习目标

完成本实验后，学习者应能：

- 用 llama.cpp 启动本地 OpenAI-compatible API。
- 使用 `curl` 或 Python 客户端调用 `/v1/chat/completions`。
- 把模型推理从 CLI 推进到可被应用、VLM 或 Agent 调用的服务形态。
- 记录 server 日志、请求参数、响应内容、错误和资源占用。
- 解释 CLI 推理达标后为什么仍需要 API 层验收。

## 本章定位

| 项目 | 内容 |
| --- | --- |
| 本章解决的问题 | 量化模型从 CLI 实验进入本地 serving、benchmark 和 API 化时新增了哪些成本和风险。 |
| 你需要先知道 | 已完成 Qwen baseline 或量化对比，知道 CLI 指标不能直接代表 API 端到端延迟。 |
| 你会产出 | `llama-server` 日志、curl 或 Python 响应、服务记录表。 |
| 最终报告位置 | 第 6 节 API 服务测试。 |

## 问题背景

前面的实验解决“模型能否在本机跑起来”。

真实应用还需要：

- 稳定服务接口。
- 请求超时控制。
- 错误日志。
- 模型加载和预热策略。
- 客户端调用边界。
- 后续与 VLM、Agent、业务系统集成的接口。

本章只做最小服务化验证。

不展开复杂并发、鉴权、网关、限流和多模型路由。

## 实验边界

本实验默认：

- 已完成 [Qwen 基线推理](/docs/lab-qwen-baseline)。
- `llama-server` 可执行文件存在，或能在已有 llama.cpp 构建目录中补构建。
- 模型文件在 `~/edge-ai-lab/models/qwen`。
- 本机或同一内网可以访问服务端口。

安全边界：

- 课堂实验建议只绑定本机或受控内网。
- 不要把未加鉴权的端口暴露到公网。
- 不要在请求里放真实敏感数据。

## 图示讲解

```mermaid
flowchart LR
  A[Python/curl Client] --> B[HTTP /v1/chat/completions]
  B --> C[llama-server]
  C --> D[Qwen GGUF]
  C --> E[GPU/CPU Runtime]
  D --> F[Response JSON]
  E --> F
  F --> A
```

服务化验收链路：

```mermaid
flowchart TD
  A[CLI baseline 达标] --> B[启动 llama-server]
  B --> C[curl smoke test]
  C --> D[可选：Python client smoke test]
  D --> E[记录 server 日志]
  E --> F[观察资源占用]
  F --> G{API 是否可集成?}
  G -- 否 --> H[排查端口/模型/超时/参数]
  G -- 是 --> I[进入应用或 Agent 集成]
```

## 公开资料怎么转成本章内容

llama.cpp server、OpenAI API reference、vLLM serving 课程和 Qwen 本地运行文档都能解释服务化接口。本章只吸收最小可验收路径：把已经通过 CLI baseline 的 Qwen GGUF 暴露成本地 OpenAI-compatible API，并证明请求、响应、日志、端口、安全边界和资源占用都能被记录。

```mermaid
flowchart LR
  A["公开资料: llama.cpp server / OpenAI API / serving docs"] --> B["接口契约: /v1/chat/completions"]
  B --> C["本地服务: host / port / model / ctx / ngl"]
  C --> D["客户端证据: curl or Python request"]
  D --> E["响应证据: HTTP status / JSON / elapsed"]
  C --> F["运行证据: server log / GPU-RAM monitor"]
  E --> G["服务化判断"]
  F --> G
  G --> H["最终报告: API usable / risk / next guardrails"]
```

| 外部资料中的经典内容 | 本实验吸收什么 | 课程里的落点 |
| --- | --- | --- |
| llama.cpp server 文档 | 本地 server 参数、OpenAI-compatible endpoint 和日志入口 | Step 1-2 的启动命令、健康检查和 chat completions smoke test |
| OpenAI API reference | chat completions 的请求/响应形态 | Step 2-3 的 JSON 请求和客户端验证，不调用云端 API |
| Qwen llama.cpp 本地运行指南 | Qwen GGUF、llama.cpp 和本地部署主线 | 约束模型来源，保证 API 测试接在 baseline/量化之后 |
| vLLM / serving 课程 | serving 开销、KV Cache、吞吐和接口稳定性问题 | Step 4 的 CLI vs API 记录，作为扩展阅读 |
| VLM / Agent 资料 | 应用或 Agent 需要稳定工具接口 | 本章只验证接口可被调用，不实现完整 Agent |
| 课程实跑记录 | Jetson local service 的日志和失败边界 | 验收表要求保存 server 日志、请求响应和资源证据 |

Microsoft EdgeAI 的本地 SLM 部署资料提醒：local API 不只是“能返回文本”，还要能说明 endpoint、模型别名、stream、timeout、模型加载状态、硬件后端和日志边界。本实验把这些内容改成最低记录项。

### 本课程重绘：Local API 记录链路

vLLM/DeepLearning.AI 的 metrics 图提醒我们：本地 API 不是“能返回文本”就结束。本实验仍使用 `llama-server`，把 serving 指标重画成最小 API 证据链。

```mermaid
flowchart LR
  A["llama-server 启动"] --> B["backend / model / port 日志"]
  B --> C["curl 或 Python 请求"]
  C --> D["HTTP 状态 + JSON 响应"]
  D --> E["elapsed / server timing"]
  E --> F["资源监控"]
  F --> G["CLI vs API 对照"]
  G --> H["应用集成风险"]
```

| 来源图思路 | 本实验吸收什么 | 转成哪个记录 |
| --- | --- | --- |
| [vLLM metrics](https://raw.githubusercontent.com/vllm-project/vllm-project.github.io/main/assets/figures/2026-06-03-deeplearning-ai-course/vllm-metrics.png) | API elapsed、TTFT、tokens/s 和资源占用要分开看 | curl/Python elapsed、server timing、monitor log |
| serving metrics 链路 | CLI 快不代表 API 快 | CLI baseline vs local API smoke test |
| failure metrics | 慢请求、OOM、timeout 都要能回到日志 | HTTP 状态、错误 JSON、server stderr |

| 检查项 | 为什么重要 | 本实验最低记录 |
| --- | --- | --- |
| endpoint / base URL | 应用集成首先依赖稳定地址 | `http://127.0.0.1:8000/v1/chat/completions` 或实际端口 |
| 模型别名 | client 看到的是 model id，不一定等于文件名 | 请求里的 `model` 字段和 server 启动日志 |
| stream / non-stream | 流式输出影响前端体验和超时处理 | 本章至少记录 non-stream；选做记录 stream |
| timeout | 本地 API 也可能被长 prompt 卡住 | 客户端超时设置和失败时的错误摘要 |
| 模型加载与缓存 | 第一次请求和热启动请求可能差很多 | server 启动时间、首个请求耗时、后续请求耗时 |
| backend / offload | API 成功不代表 GPU 已经启用 | `ngl` 参数、GPU/Jetson 监控和 server backend 日志 |
| 错误响应 | 后续应用需要判断失败类型 | HTTP 状态、错误 JSON 或 server stderr 摘要 |
| 隐私边界 | local-first 的价值来自数据留在本机或内网 | host 绑定、访问范围、是否调用外部云 API |

MLC LLM 的官方教程也提供了本地引擎和 REST server 的接口形态。本实验吸收它的“runtime 可以暴露为 HTTP 服务”这一点，但仍用 `llama-server` 完成 OpenAI-compatible smoke test。

把这类 serving 教程贴进本章时，建议统一改写成下面的验收字段，而不是照抄框架自己的代码：

| Serving 教程常见内容 | 本实验直接吸收 | 报告字段 |
| --- | --- | --- |
| server 启动命令 | host、port、model path、ctx、backend | `server_command`、`base_url`、`model_file` |
| client 请求示例 | method、endpoint、headers、JSON body | `request_json_path`、`endpoint` |
| 响应截图 | HTTP status、JSON 是否可解析、message content | `http_status`、`response_json_path` |
| 首次请求和后续请求 | cold start、warm request 差异 | `first_request_elapsed`、`second_request_elapsed` |
| 服务日志 | 模型加载、backend、warning、error | `server_log_path`、`risk_notes` |
| 本地/公网地址 | 数据是否只在本机或内网流动 | `host_binding`、`privacy_boundary` |

因此，本章不追求完整后端工程；它只回答一个部署问题：这个本地模型是否已经有足够证据进入应用接口。

## 核心概念

| 项目 | 第一阶段要求 | 后续扩展 |
| --- | --- | --- |
| API | 本地可调用 | 鉴权、限流、日志 |
| 超时 | smoke test 可控 | 请求队列、取消生成 |
| 模型 | 单模型服务 | 多模型 routing |
| 流式输出 | 可选 | 前端实时显示 |
| 安全 | 本机或内网验证 | 权限隔离、工具调用审计 |
| 稳定性 | 单请求成功 | 并发、长时间运行、自动重启 |

## 前置条件

检查 `llama-server`：

```bash
cd ~/edge-ai-lab/src/llama.cpp

SERVER_BIN=./build/bin/llama-server
if [ -x ./build-jetson/bin/llama-server ]; then
  SERVER_BIN=./build-jetson/bin/llama-server
fi

"$SERVER_BIN" --help | head
```

如果 Jetson 上已经能运行 `llama-cli` 或 `llama-completion`，但没有 `llama-server`，可以只补构建 server 目标：

```bash
cmake --build build-jetson --target llama-server -j 4 \
  2>&1 | tee ~/edge-ai-lab/logs/jetson-build-llama-server.txt
```

当前 llama.cpp 版本构建 `llama-server` 时可能会触发 Web UI 的 `npm install` 和 `vite build`。这一步可能持续数分钟，课堂演示前建议提前完成。

检查模型：

```bash
ls -lh ~/edge-ai-lab/models/qwen/*.gguf
```

检查端口是否被占用：

```bash
PORT=8080
ss -ltnp | grep -E ":${PORT}\b"
```

如果 `ss` 不可用，可以直接尝试启动服务。

端口被占用时换一个端口，例如 8081。不要随意杀掉不属于本实验的进程。

## Step 1：启动本地服务

Ubuntu Server 或 Jetson 都可以使用类似命令。

```bash
cd ~/edge-ai-lab/src/llama.cpp

PORT=8080
MODEL=~/edge-ai-lab/models/qwen/qwen2.5-1.5b-instruct-q4_k_m.gguf
SERVER_BIN=./build/bin/llama-server
if [ -x ./build-jetson/bin/llama-server ]; then
  SERVER_BIN=./build-jetson/bin/llama-server
fi

"$SERVER_BIN" \
  -m "$MODEL" \
  -ngl 99 \
  --ctx-size 2048 \
  --host 127.0.0.1 \
  --port "$PORT" \
  2>&1 | tee ~/edge-ai-lab/logs/llama-server.txt
```

如果需要让同一内网其他机器访问，可以改成：

```bash
--host 0.0.0.0
```

但课堂实验默认使用 `127.0.0.1` 更安全。

启动后观察日志：

- 模型是否加载成功。
- 是否启用 CUDA 或目标 backend。
- `ctx-size` 是否按预期设置。
- 是否出现 OOM、fallback 或 error。
- server 是否监听指定端口。

另开终端请求前，先等服务 ready：

```bash
PORT=8080
for i in $(seq 1 60); do
  curl -fsS "http://127.0.0.1:${PORT}/health" >/dev/null 2>&1 && break
  curl -fsS "http://127.0.0.1:${PORT}/v1/models" >/dev/null 2>&1 && break
  sleep 1
done
```

## Step 2：用 curl 验证 chat completions

另开终端运行：

```bash
cat > ~/edge-ai-lab/logs/api-curl-request.json <<'JSON'
{
  "model": "qwen-local",
  "messages": [
    {"role": "user", "content": "用三句话解释端侧模型量化。"}
  ],
  "temperature": 0.2,
  "max_tokens": 128
}
JSON

PORT=8080

curl -sS "http://127.0.0.1:${PORT}/v1/chat/completions" \
  -H "Content-Type: application/json" \
  -d @~/edge-ai-lab/logs/api-curl-request.json \
  -o ~/edge-ai-lab/logs/api-curl-response.json \
  -w "HTTP status: %{http_code}\nelapsed: %{time_total}s\n" \
  | tee ~/edge-ai-lab/logs/api-curl-meta.txt
```

如果终端输出不方便阅读，可以保存后再查看：

```bash
python3 -m json.tool ~/edge-ai-lab/logs/api-curl-response.json
```

如果返回不是标准 JSON，也要保存原始输出。

## Step 3：可选：用 Python smoke test

课程仓库提供了一个简单脚本。

从课程仓库根目录运行：

```bash
python3 labs/scripts/openai_compatible_smoke_test.py \
  --base-url http://127.0.0.1:8080/v1 \
  --prompt "用三句话解释端侧模型量化。" \
  2>&1 | tee ~/edge-ai-lab/logs/api-python-smoke-test.txt
```

如果脚本依赖缺失，先看错误信息。

也可以用最小 Python 标准库版本验证：

```bash
python3 - <<'PY'
import json
import urllib.request

payload = {
    "model": "qwen-local",
    "messages": [
        {"role": "user", "content": "用三句话解释端侧模型量化。"}
    ],
    "temperature": 0.2,
    "max_tokens": 128,
}

req = urllib.request.Request(
    "http://127.0.0.1:8080/v1/chat/completions",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"},
)

with urllib.request.urlopen(req, timeout=60) as resp:
    print(resp.read().decode("utf-8"))
PY
```

该代码只用于本地 smoke test。

正式应用应使用更完整的错误处理和超时策略。

## Step 4：记录服务化开销

服务化之后，除了模型推理，还要记录 API 层行为。

| 项目 | 记录 |
| --- | --- |
| server 启动时间 | 待填 |
| 首次请求是否慢 | 待填 |
| 第二次请求是否变化 | 待填 |
| 请求 prompt | 待填 |
| `max_tokens` | 待填 |
| HTTP 状态码 | 待填 |
| elapsed | 待填 |
| 响应是否 JSON | 待填 |
| 响应内容是否正确 | 待填 |
| 请求 JSON 路径 | 待填 |
| 响应 JSON 路径 | 待填 |
| curl meta 路径 | 待填 |
| 是否超时 | 待填 |
| server 日志异常 | 待填 |
| GPU/内存变化 | 待填 |

如果要比较 CLI 与 API：

| 形态 | 参数 | 首 token / 总耗时 | tokens/s 或主观流畅度 | 备注 |
| --- | --- | --- | --- | --- |
| CLI | 待填 | 待填 | 待填 | 待填 |
| API curl | 待填 | 待填 | 待填 | 待填 |
| API Python | 待填 | 待填 | 待填 | 待填 |

不要把 curl 命令耗时直接等同于模型 decode 性能。

它还包含 HTTP、JSON 和客户端等待开销。

也不要把 HTTP 200 等同于模型质量合格。实跑中出现过 API 请求成功，但 0.5B Q4 模型对“端侧模型量化”的解释概念跑偏的情况。报告里应分开写：服务是否可用、端到端耗时如何、回答质量是否满足任务。

回填报告时按下面分开：

| API 记录 | 报告位置 |
| --- | --- |
| 启动命令、绑定地址、端口、请求样例、HTTP 状态 | 第 6 节 API 服务测试 |
| 是否超时、server 日志异常、资源变化 | 第 6 节和第 7 节端侧部署风险 |
| CLI 与 API 差异 | 第 6 节说明，不直接替代第 3-5 节 CLI 指标 |
| 是否建议进入应用/VLM/Agent 集成 | 第 8 节最终部署建议 |

## Step 5：观察资源

Ubuntu Server：

```bash
watch -n 0.5 nvidia-smi
```

Jetson：

```bash
tegrastats --interval 1000 | tee ~/edge-ai-lab/logs/jetson-server-tegrastats.txt
```

服务化时要额外关注：

- server 常驻后模型占用是否一直存在。
- 第一次请求和后续请求是否差异明显。
- 端口空闲时是否仍有较高负载。
- Jetson 长时间运行是否升温。

## Step 6：停止服务

在 server 终端按：

```text
Ctrl+C
```

确认端口释放：

```bash
ss -ltnp | grep 8080
```

如果端口仍被占用，找到对应进程后再处理。

不要随意杀掉不属于本实验的进程。

## 验收结果

本章课堂记录标准：

```text
[ ] `llama-server` 能启动或失败日志已保存
[ ] `/v1/chat/completions` 有 curl 或 Python 响应，或清晰错误
[ ] 记录了端口、模型、参数、HTTP 状态、响应内容质量和异常
[ ] 能说明 API 相比 CLI 新增了哪些成本和风险
```

最终项目最低验收必须有一次成功的 curl 或 Python API 请求。只有失败日志可以作为阶段记录或限制说明，不能算最终验收通过。

| 产物 | 验收标准 |
| --- | --- |
| server 日志 | 模型加载成功，无明显 OOM 或 fallback 异常 |
| 客户端响应 | curl 或 Python 至少一种返回可读响应或清晰错误 |
| 请求/响应/meta | 请求 JSON 或命令、响应 JSON、HTTP 状态和 elapsed 都能追溯 |
| 资源记录 | Ubuntu 有 `nvidia-smi`，Jetson 有 `tegrastats` |
| 服务记录表 | 端口、模型、参数、响应、异常都已记录 |
| 安全说明 | 明确服务只在本机或受控内网暴露 |

实跑记录：

- [Jetson local service run](https://github.com/neardws/edge-ai-deployment-course-runs/tree/main/runs/2026-06-29-jetson-local-service)

## 失败排查

### 服务端口不可访问

检查：

- server 是否仍在运行。
- 端口是否和请求一致。
- `--host` 是否绑定到可访问地址。
- 防火墙或容器网络是否阻断。

### curl 返回连接失败

处理：

- 查看 `llama-server.txt` 是否启动成功。
- 确认端口没有被其他程序占用。
- 用 `localhost` 和 `127.0.0.1` 分别尝试。

### 请求返回但内容异常

检查：

- 模型路径是否正确。
- 模型是否 instruction/chat 版本。
- prompt 是否适合该模型。
- chat template 是否匹配。
- 采样参数是否过高。

### API 成功但很慢

可能原因：

- 首次请求触发模型加载或预热。
- `ctx-size` 太大。
- `max_tokens` 太高。
- GPU offload 未生效。
- Jetson 温度或功耗限制。
- 客户端等待完整响应而非流式输出。

处理：

- 比较第一次和第二次请求。
- 与 CLI baseline 对照。
- 降低 `ctx-size` 或 `max_tokens`。
- 查看资源监控。

### Python 脚本失败

检查：

- Python 版本。
- base URL 是否写成 `http://localhost:8080/v1`。
- server 是否支持 OpenAI-compatible endpoint。
- 错误是连接错误、超时还是 JSON 解析错误。

## 作业

提交一份服务化验收记录，包含：

1. `llama-server` 启动命令。
2. server 日志关键摘要。
3. curl 或 Python 请求与响应摘要。
4. 如果使用了第二种客户端，补充输出摘要。
5. 资源占用记录。
6. 是否可以进入应用集成，以及还需要补充哪些保护措施。

三句话复盘：

```text
我把 CLI 模型推进到了本地 API 服务。
API smoke test 的结果是 ______，主要新增开销或风险是 ______。
因此最终报告中会把服务化结论写成 ______。
```

## 参考资料

本章吸收方式：

- **知识点**：从 llama.cpp server、Qwen 文档、DeepLearning.AI/vLLM serving 截图和 Microsoft EdgeAI for Beginners 吸收 OpenAI-compatible API、server 参数、日志、模型生命周期和客户端请求形态。
- **图解**：吸收 vLLM/DeepLearning.AI metrics 截图的结构，再把命令行推理重画为“本地服务 -> HTTP 请求 -> 响应 JSON -> 应用集成”的链路。
- **实验**：API smoke test 必须记录请求、响应、HTTP 状态、elapsed/meta、server 日志和模型 hash。
- **取舍**：不扩展成完整 Web 后端课程，只证明模型可以进入服务化接口。

- [llama.cpp server documentation](https://github.com/ggml-org/llama.cpp/tree/master/tools/server)
- [Qwen llama.cpp 本地运行指南](https://qwen.readthedocs.io/en/v2.5/run_locally/llama.cpp.html)
- [OpenAI API reference](https://platform.openai.com/docs/api-reference)
- [vLLM documentation](https://docs.vllm.ai/)
- [DeepLearning.AI Efficiently Serving LLMs](https://www.deeplearning.ai/courses/efficiently-serving-llms/)
- [vLLM course announcement and screenshots](https://vllm.ai/blog/2026-06-03-deeplearning-ai-vllm-course)
- [Microsoft EdgeAI for Beginners](https://github.com/microsoft/edgeai-for-beginners)
