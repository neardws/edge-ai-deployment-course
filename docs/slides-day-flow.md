---
title: 一日课件流程与页数规划
---

# 一日课件流程与页数规划

本页用于先确定一整天培训到底需要多少课件内容，再扩 HTML 课件。当前 47 页版本只能做总览，不足以支撑 09:00-17:00 的完整授课。

## 结论

课件体量应按 **6 个主讲专题 x 每专题 40 页 = 240 页主课件** 规划。

这里的 6 个主讲专题不是照搬课程网站的 Part I-VII，而是把网站内容压成一日培训能讲完的 6 个课堂单元：

| 6 个主讲专题 | 对应课程网站内容 | 建议页数 |
| --- | --- | ---: |
| 1. 端侧部署共同语言与环境准入 | 导读 + Part I + Part II | 40 |
| 2. Qwen/GGUF Baseline 与 PTQ/QAT 量化证据 | Part III + Part VI 实验入口 | 40 |
| 3. 低比特 LLM、KV Cache 与质量归因 | Part III + 样例日志 | 40 |
| 4. 精度修复、压缩蒸馏与 LoRA/QLoRA 决策 | Part III + Part IV | 40 |
| 5. Runtime、Profiling 与 Local API 验收 | Part V + Part VI | 40 |
| 6. Jetson/移动端迁移、VLM/Agent 与最终报告 | Part VI + Part VII | 40 |
| **合计** |  | **240** |

一页课件不等于一分钟。方法页、命令页、日志页和排障页会讲得久；过渡页、标题页和总结页会讲得快。40 页/专题的目的不是堆文字，而是给讲师足够的讲解抓手：概念、图解、表格、命令、日志、失败样例和报告字段都要有单独页面。

## 完成路径

当前方向不应该继续盲目加页。HTML 已经有 240 页主课件和 48 页扩展页，后续工作要把它改成真正可讲的一日课程。

推荐路径是 **HTML 先成稿，再考虑导出 PPTX**。现在先不要把精力放到 native PPT 或新模板上，否则会把还没定稿的内容返工一遍。

1. 先锁住 6 个专题名称、240 页主线和最终报告证据链，不再扩页数、不重开大纲。
2. 206-240 已按 5 页闭环收完；后续只在全局 QA 中修真实版面和节奏问题。
3. 经典课程 PPT 只吸收讲法：图表类型、推导顺序、failure case 组织和课堂节奏；页面内容必须重写成我们自己的端侧 LLM / 小模型量化部署工程课。
4. 每轮改完同步本表、浏览器检查实际页面、再跑 typecheck 和 build。没有通过检查，不进入下一段。
5. 下一步做 001-240 全局 QA：专题标题、页脚来源、视觉密度、文字溢出、控制台错误、45 分钟节奏和最终报告落点。
6. 241-288 已整理为扩展参考页：只支撑备课、备用解释和来源索引，不承担主讲内容。
7. 最后才做交付形态：继续用 HTML 课件发布，或在内容稳定后导出/重制 PPTX。

当前最小可执行路径是从 **001-240 全局 QA** 继续，因为 6 个主讲专题已经成稿，剩下要确认它能连续放映和交付。

## 页数拆分原则

每个 45 分钟左右的专题至少要形成 8 个小闭环，每个闭环约 5 页：

```text
问题框架 -> 核心概念 -> 证据图表 -> 课堂实作 -> 风险与报告
```

这就是每专题 40 页的来源。

| 页面类型 | 每专题建议数量 | 用途 |
| --- | ---: | --- |
| 专题开场/转场 | 3-4 | 说明这一段解决什么工程问题 |
| 概念解释 | 8-10 | 给术语、公式、方法边界 |
| 图解/矩阵 | 8-10 | 把课程网页里的 Mermaid、表格、流程重画为讲授页 |
| 实验/命令/日志 | 8-10 | 固定变量、命令、结果表、验收点 |
| failure case | 4-6 | 讲排障路径，不只展示成功 |
| 报告落点/Q&A | 4-6 | 说明结果进入最终报告哪一节 |

## 240 页主课件总结构

| 页码范围 | 主讲专题 | 课堂作用 |
| --- | --- | --- |
| 001-040 | 端侧部署共同语言与环境准入 | 把场景、指标、token、prefill/decode、KV Cache、环境快照和最终报告放到同一条主线 |
| 041-080 | Qwen/GGUF Baseline 与 PTQ/QAT 量化证据 | 先让学员跑通 baseline，再把 PTQ/QAT、GGUF 量化和变量控制写成可复现实验 |
| 081-120 | 低比特 LLM、KV Cache 与质量归因 | 把 GGUF Q4/Q5、GPTQ、AWQ、SmoothQuant、KV Cache 和生成质量拆账记录 |
| 121-160 | 精度修复、压缩蒸馏与 LoRA/QLoRA 决策 | 讲质量下降怎么归因、修复，以及何时压缩、蒸馏、LoRA/QLoRA 或不训练 |
| 161-200 | Runtime、Profiling 与 Local API 验收 | 讲 runtime、fallback、profiling、bench、local API 和服务化报告证据 |
| 201-240 | Jetson/移动端迁移、VLM/Agent 与最终报告 | 从 Ubuntu 基线扩到 Jetson、移动端路线、VLM/Agent 和最终报告 |

当前 HTML 已经扩成 240 页主课件 + 48 页扩展参考页，下一步重点不是继续加页，而是按上面的专题边界重排讲授节奏。

## 专题一：端侧部署共同语言与环境准入，001-040

| 页码 | 小闭环 | 具体内容 | 主要来源 |
| --- | --- | --- | --- |
| 001-005 | 开场定位与专题地图 | 课程不是普通 Edge AI 入门；课程产出、学习对象、部署链路、课程网站 Part 到 6 个课堂专题的映射 | GitHub 大纲、`sidebars.ts`、`docs/course-hours.md` |
| 006-010 | 一日授课节奏与实验准入 | 上午/下午专题节奏、5 页闭环、变量控制方式、进入 Qwen/GGUF 量化实验前的准入检查 | `docs/slides-day-flow.md`、`docs/report-template.md`、`docs/final-project.md` |
| 011-015 | 端侧场景地图 | 手机、PC、车载、IoT、摄像头、Jetson 和本地服务器分别对应不同硬约束；先写场景画像，再决定第一轮证据和报告风险 | GitHub 大纲、`docs/01-framework.md`、`docs/environment-matrix.md` |
| 016-020 | 推理共同语言 | 先拆开一次 Qwen 请求，再固定输入契约、prefill/decode、KV Cache 和 baseline 字段；缺字段时 Q8/Q5/Q4 对比不能写成结论 | `docs/ml-inference-basics.md`、`docs/transformer-llm-basics.md` |
| 021-025 | 端云协同 | local-first 路由不是架构图，而是隐私、复杂度、风险三类规则；每条请求要留下本地、兜底、确认或拒绝的日志证据 | `docs/01-framework.md`、`docs/07-vlm-agent.md` |
| 026-030 | 环境准入 | Ubuntu GPU、Jetson、CPU-only、移动端路线；设备证据、工具链证据、模型证据决定今天能做哪条路线，缺项只能标“未验证” | `docs/environment-matrix.md`、`docs/lab-qwen-baseline.md` |
| 031-035 | 实验变量控制 | 进入 Qwen GGUF 量化前先交变量控制单；模型、输入、运行三类变量先锁定，TTFT、tokens/s、内存、质量和日志路径作为结果证据，变量漂移必须写进失败记录 | `docs/lab-qwen-quantization.md`、`docs/report-template.md` |
| 036-040 | 报告落点 | 专题一交付 M0/M1 材料：场景约束卡、环境记录表、baseline plan、模型清单、指标口径和量化空表；缺证据只能写“未记录”或“未测” | `docs/report-template.md`、`docs/final-project.md` |

## 专题二：Qwen/GGUF Baseline 与 PTQ/QAT 量化证据，041-080

| 页码 | 小闭环 | 具体内容 | 主要来源 |
| --- | --- | --- | --- |
| 041-045 | 专题开场 | 专题二先把 Qwen/GGUF 基线和量化实验口径立住；baseline 不只是能输出文本，而是要留下模型来源、llama.cpp commit、固定 prompt、stderr timing、资源和质量备注，才能作为 Q8/Q5/Q4 的参照物 | `docs/lab-qwen-baseline.md`、`docs/02-ptq-qat.md` |
| 046-050 | 数值格式 | baseline 合格后再讨论数值格式；bit 数只是入口，Q4/Q5/Q8 要同时核对模型同源、GGUF metadata、runtime/backend 支持和文件、内存、速度、质量四类端到端收益 | `docs/02-ptq-qat.md`、Arm Advanced Quantization |
| 051-055 | 线性量化 | 用 scale、zero-point、qmin/qmax、rounding 和 clipping 回答 Q4/Q8 质量差异从哪里来；报告第 4 节不能只写“Q4 变差”，必须区分量化误差、outlier、clipping、runtime fallback 和实验条件漂移 | `docs/02-ptq-qat.md` |
| 056-060 | 粒度和对象 | per-tensor、per-channel、per-group 决定误差由谁承担；Qwen GGUF 表格必须把量化格式、粒度、weight-only、activation、KV Cache 和 runtime/kernel 支持分列记录 | `docs/02-ptq-qat.md` |
| 061-065 | PTQ 工作流 | PTQ 先产生候选，不直接产出结论；现成 GGUF、自己量化和静态校准三条入口都必须回到同一 baseline、同一 prompt、同一 runtime 的文件、内存、速度和质量证据表 | `docs/02-ptq-qat.md`、`docs/lab-qwen-quantization.md` |
| 066-070 | QAT 决策门 | QAT 是质量修复决策，不是默认下一步；只有 PTQ 被同条件证伪且数据、预算、导出链路和回归测试都具备，才进入 QAT、LoRA 或蒸馏，否则写明不训练或回退 Q5/Q8 | `docs/02-ptq-qat.md`、`docs/course-hours.md` |
| 071-075 | 数据与实验口径 | 先给校准样本、评估样本、失败样例和脱敏边界分工；每行实验记录必须固定模型、prompt 集、chat template、ctx、seed、runtime 和日志路径，否则只能写风险不能写推荐 | `docs/02-ptq-qat.md`、`docs/report-template.md`、`docs/04-accuracy-repair.md` |
| 076-080 | 量化报告落点 | 专题二的 M2 交付是一张可审查的 Q8/Q5/Q4 量化证据表：同源、同条件、同口径记录模型、运行条件、资源收益、质量证据和 keep/fallback/risk/untested 判断；证据没闭合就不能带着结论进入专题三 | `docs/report-template.md`、`docs/lab-qwen-quantization.md`、`docs/final-project.md` |

## 专题三：低比特 LLM、KV Cache 与质量归因，081-120

| 页码 | 小闭环 | 具体内容 | 主要来源 |
| --- | --- | --- | --- |
| 081-085 | 专题开场 | 专题三从 M2 量化证据表继续拆账；先把权重文件、激活 outlier、KV Cache/runtime 状态和生成质量失败标签分开记录，再讨论 GPTQ/AWQ/SmoothQuant | `docs/03-llm-quantization.md`、`docs/lab-qwen-quantization.md`、`docs/report-template.md` |
| 086-090 | 推理成本 | tokens/s 不能解释一次请求的全部成本；M2 扩展表必须把 prompt eval/prefill、eval/decode、ctx-size、prompt/generated tokens、KV Cache、RAM/VRAM、warning/fallback 和质量备注写回同一行实验 | `docs/03-llm-quantization.md`、`docs/lab-profiling.md`、`docs/report-template.md` |
| 091-095 | 低比特失败归因 | Q4 失败不能直接怪量化方法；先排除 Q8/F16 baseline、prompt/template/tokenizer、ctx/采样参数和 runtime/fallback，再用 baseline_fail、prompt_issue、low_bit_regression、ctx_kv_issue、runtime_fallback 等标签决定回退、调参或进入修复专题 | `docs/03-llm-quantization.md`、`docs/04-accuracy-repair.md`、`docs/report-template.md` |
| 096-100 | GPTQ 决策边界 | GPTQ 先过格式和 runtime 闸门；课堂重点是校准输入 X 如何决定补偿方向、逐层补偿的跨层风险、safetensors + quantize_config.json 与 GGUF 的交付差异，以及未实跑时只能写候选或未测原因 | `docs/03-llm-quantization.md` |
| 101-105 | AWQ 候选闸门与端侧适配 | AWQ 用激活统计识别重要通道并通过缩放降低低比特损伤；课堂重点是校准覆盖、缩放边界、VLM projector 等敏感模块、格式/runtime 日志，以及为什么未实跑时只能写候选或未测原因 | `docs/03-llm-quantization.md` |
| 106-110 | activation outlier、W8A8 与 KV Cache 分账 | SmoothQuant、LLM.int8、GGUF Q4/Q5 和 KV Cache 不能混写；课堂重点是先判断问题在激活、权重还是 KV Cache，再分开记录校准、kernel/runtime、weight-only 文件收益、KV buffer、OOM 和长上下文质量，未跑通的路线只写扩展或风险 | `docs/03-llm-quantization.md` |
| 111-115 | Qwen/GGUF 主实验闭环 | GPTQ/AWQ/SmoothQuant 只能进入候选表，今天的推荐必须来自同源 Qwen GGUF、同 prompt、同 llama.cpp 和同一套日志；每一步都要落到第 2、4、5、6、7、8 节报告字段，主实验不闭合就只能写回退或继续验证 | `docs/03-llm-quantization.md`、`docs/lab-qwen-quantization.md`、`docs/report-template.md` |
| 116-120 | 专题三证据分级与收束 | 把 GGUF Q8/Q5/Q4、KV Cache、GPTQ/AWQ、SmoothQuant/LLM.int8 按证据等级收口为推荐候选、回退候选或继续验证；进入专题四前必须留下原始输出、timing/资源表、失败标签和未测路线风险 | `docs/03-llm-quantization.md`、`docs/report-template.md` |

## 专题四：精度修复、压缩蒸馏与 LoRA/QLoRA 决策，121-160

| 页码 | 小闭环 | 具体内容 | 主要来源 |
| --- | --- | --- | --- |
| 121-125 | 质量修复准入闸门 | 接住专题三证据包，先证明失败不是 baseline、prompt/template、ctx/KV、runtime 或设备状态问题，再决定 prompt 修复、量化回退、mixed precision、校准、蒸馏、LoRA/QLoRA 或不训练；每个失败样例都要有可重跑记录 | `docs/04-accuracy-repair.md`、`docs/report-template.md` |
| 126-130 | 质量问题分诊 | 质量问题不能混写成“效果不好”；先把失败分到指标型、生成型或链路型任务账本，再保存可回放证据、固定失败标签，并把第 4 节质量现象和第 7 节风险登记分开写 | `docs/04-accuracy-repair.md`、`docs/report-template.md` |
| 131-135 | baseline 与评估集 gate | 修复前先让 Q8/F16 在同 prompt、template、runtime 和 ctx-size 下站住；baseline 回答模型是否会做，评估集回答比较是否公平，只有同一 JSONL、同一运行条件和可追溯日志齐全，Q4/Q5 失败才允许进入量化退化判断 | `docs/04-accuracy-repair.md`、`docs/report-template.md` |
| 136-140 | 单变量误差归因 | 质量下降不能直接写成“量化导致”；一次只改一个变量，先排除 baseline、prompt/template、ctx/seed、runtime/backend 和设备状态，再把同条件低比特失败归到校准分布、敏感层、outlier、KV Cache 或混合精度候选，并为每个归因写出反证路径和日志证据 | `docs/04-accuracy-repair.md`、`docs/report-template.md` |
| 141-145 | 修复手段成本排序 | 归因闭合后先选择最便宜且可复测的动作：prompt/template、采样参数、Q5/Q8 回退优先，其次是校准集重构、imatrix、mixed precision 或局部回退；LoRA/QAT/蒸馏未实跑时只能写候选，所有修复都要用同一评估集复测质量、速度、内存和日志路径 | `docs/04-accuracy-repair.md`、`docs/finetuning-lora.md`、`docs/report-template.md` |
| 146-150 | 压缩路线瓶颈判断 | 压缩不再从剪枝、低秩或蒸馏方法名出发，而是先证明瓶颈在文件、峰值内存、算子延迟、输出质量或设备稳定性；课堂只做低成本判断，优先用 Q8/Q5/Q4 和更小模型形成可复测对照，剪枝、低秩、蒸馏只写进入条件和验证计划，所有路线必须回到质量、速度、内存、设备日志和 runtime 支持 | `docs/05-compression-distillation.md`、`docs/report-template.md` |
| 151-155 | 蒸馏进入门槛 | 蒸馏不是质量下降后的默认动作，只有任务稳定、教师可靠、学生可部署、评估能回归时才进入第二阶段；课堂只交付蒸馏准备度，填写教师输出卡、学生部署卡和数据回归卡，标记先蒸馏后量化或量化后补偿，未实跑训练时只能写进入条件和验证计划 | `docs/05-compression-distillation.md`、`docs/finetuning-lora.md`、`docs/report-template.md` |
| 156-160 | 专题四报告收口 | 质量修复、压缩和蒸馏不以方法跑过结束，而以报告第 7 节风险登记和第 8 节部署建议结束；课堂用一个固定失败样例写出推荐、回退和暂不推荐，缺证据的字段只能写未记录、失败或下一轮验证 | `docs/04-accuracy-repair.md`、`docs/report-template.md` |

## 专题五：Runtime、Profiling 与 Local API 验收，161-200

| 页码 | 小闭环 | 具体内容 | 主要来源 |
| --- | --- | --- | --- |
| 161-165 | 专题五验收入口 | 专题四得到的推荐、回退或暂不推荐，进入专题五后必须用同一 Qwen GGUF 在 CLI、bench、profiling 和 local API 下复查；CLI stderr timing、llama-bench、系统采样和 API smoke test 不能混成一个速度，缺任一类证据时第 8 节只能写未完全验证 | `docs/inference-acceleration.md`、`docs/06-runtime-deployment.md`、`docs/lab-profiling.md`、`docs/lab-local-service.md` |
| 166-170 | 对象连续性验收 | CLI、llama-bench 和 llama-server 的结果只有在模型文件、tokenizer/template 和 runtime 参数一致时才能放进同一张表；课堂先填对象核对表，逐列核对模型路径、hash、量化格式、ctx、`-ngl`、threads、backend、server model id 和 warning，对不上时不能写同一个部署建议 | `docs/06-runtime-deployment.md`、`docs/lab-qwen-baseline.md`、`docs/lab-local-service.md`、`docs/report-template.md` |
| 171-175 | Runtime 选型证据矩阵 | runtime 不是框架名投票，必须按证据等级排序：llama.cpp 是本课主线实测，ONNX/TensorRT 是候选对照，LiteRT/Core ML/ExecuTorch 是端侧路线图，MLC/vLLM/TensorRT-LLM 是进阶 serving；课堂只填主线和一个替代路线，推荐路线必须有日志，替代路线要写适用条件、未测原因和下一步验证 | `docs/06-runtime-deployment.md`、`docs/report-template.md`、MLSysBook/TinyML |
| 176-180 | 性能陷阱排查闭环 | 文件变小、写了 `-ngl` 或换了 runtime 都不等于端到端更快；课堂先给速度没有提升的记录贴 fallback、dequant、shape、API overhead、quality regression 或 untested 标签，并用 runtime log、pp/tg、资源采样、curl elapsed 和 server log 反证，证据不足只能写未记录或下一轮 profiling | `docs/06-runtime-deployment.md`、`docs/inference-acceleration.md`、`docs/lab-profiling.md`、`docs/report-template.md` |
| 181-185 | llama.cpp baseline 实作闭环 | 这 45 分钟先留下一份能复跑的 Qwen GGUF baseline：记录 llama.cpp commit、CUDA build、模型来源/许可证/SHA256、固定 prompt、ctx、`-ngl`、seed、stderr timing、显存采样和质量样例；后续 Q8/Q5/Q4、offload、ctx-size、llama-bench 和 local API 都必须回到这条 baseline | `docs/lab-qwen-baseline.md`、`docs/06-runtime-deployment.md`、`docs/report-template.md` |
| 186-190 | Profiling 记录闭环 | profiling 不是 tokens/s 截图；课堂每次实验只改一个主变量，并把 workload、stderr timing、`llama-bench` pp/tg、`nvidia-smi` 或 `tegrastats` 资源采样、质量样例和日志路径写成同一行；短实验 GPU utilization 可能采到 0%，必须同时看显存、功耗和 llama.cpp timing | `docs/lab-profiling.md`、`docs/report-template.md` |
| 191-195 | Local API 服务化验收闭环 | local API 不等于 HTTP 200；课堂用同一条 Qwen GGUF/llama.cpp baseline 启动 `llama-server`，分别保存 server log、请求 JSON、响应 JSON、HTTP 状态、elapsed/meta、model alias、资源变化和绑定范围，明确 CLI 快不代表 API 快，服务化是否进入应用/VLM/Agent 集成要写风险边界 | `docs/lab-local-service.md`、`docs/report-template.md` |
| 196-200 | 专题五报告收口闸门 | 专题五结束前要交付 runtime、profiling、API 三包证据，并把它们写入报告第 5-8 节：第 5 节写 runtime 参数、pp/tg、资源采样和日志路径，第 6 节写 server log、请求/响应、HTTP meta 和模型 hash，第 7 节写 warning、fallback、timeout、OOM 和质量退化，第 8 节只写证据闭合的推荐、不推荐、回退参数和下一步验证 | `docs/report-template.md`、`docs/final-project.md`、`docs/06-runtime-deployment.md` |

## 专题六：Jetson/移动端迁移、VLM/Agent 与最终报告，201-240

| 页码 | 小闭环 | 具体内容 | 主要来源 |
| --- | --- | --- | --- |
| 201-205 | 真实端侧迁移验收入口 | 专题六不重开模型路线，而是把专题五闭合的 Ubuntu baseline 迁移到 Jetson 或写成移动端路线图；课堂先证明模型 hash、量化格式、prompt、ctx、`-ngl` 和 runtime commit 同源，再记录 Jetson 型号、内存、JetPack/L4T、功耗模式、`tegrastats`、stdout/stderr 和质量样例；没有本机日志的移动端、VLM 或 Agent 扩展只能写路线图、未测原因和下一步验证 | `docs/jetson-deployment.md`、`docs/lab-jetson-setup.md`、`docs/final-project.md` |
| 206-210 | VLM 链路证据 | VLM 先定位失败发生在哪一段，再按输入账、对齐账和生成账记录；课堂要保存输入图、crop/resize、visual token、encoder latency、mmproj 文件/hash/精度、LLM pp/tg、ctx、峰值内存、原始回答和失败标签；没有输入图和 mmproj 记录时，不能写端侧 VLM 结论 | `docs/07-vlm-agent.md` |
| 211-215 | VLM 优化路线 | VLM 优化不先追求完整端侧化，而是先让系统少看一点图：ROI、降分辨率、降帧率、缓存、去重和传统视觉/OCR 初筛先减少 visual token 与预处理成本；再判断 vision encoder INT8、LLM Q5/Q4、ctx/KV 策略和 mmproj 回归；端云协同必须写清隐私规则、fallback trace 和授权记录 | `docs/07-vlm-agent.md`、`docs/06-runtime-deployment.md` |
| 216-220 | Agent 权限与 trace 闭环 | Agent 能生成 JSON 不等于可以执行动作；课堂先检查 allowed、confirm_required、blocked 三个集合互斥，高风险 denylist 不能进入 allowed，再记录 planner output、tool intent、args、schema result、policy result、permission decision、execution status、observation、error 和 recovery action；没有可重放 trace 时只能写路线图 | `docs/07-vlm-agent.md`、Microsoft EdgeAI |
| 221-225 | Function Calling 契约闭环 | Function Calling 只能生成工具意图，执行权必须留在应用层；课堂把工具调用拆成 schema gate、policy gate、confirm gate 和 executor gate，记录 tool name、args、schema result、policy result、confirm flag、status/error、observation 和脱敏 trace；没有 validator、policy、executor 或可重放 trace 时只能写接入条件，不能写可部署 Agent | `docs/07-vlm-agent.md` |
| 226-230 | 端云协同路由闭环 | 端云协同不能写成“本地不行就上云”；课堂先按 privacy gate、capability gate、failure gate 判定 local、cloud fallback、人工确认或拒绝，再记录 task_type、sensitivity、upload_allowed、local result、quality check、fallback reason、uploaded_fields、authorization、final_source、output schema 和 trace；没有授权记录、脱敏字段表或 fallback trace 时只能写概念路线图 | `docs/07-vlm-agent.md` |
| 231-235 | 案例复盘证据闭环 | 传统视觉、小型 LLM、VLM 和 Hybrid Agent 不能套同一套 Q4 结论；课堂先写目标、workload、主瓶颈和证据，再判断量化、runtime、架构或权限是否解决问题；每个案例交一张复盘卡，包含场景、设备、条件、结果、失败标签、主瓶颈和推荐/回退/暂不推荐/下一轮验证 | `docs/08-cases-qa.md` |
| 236-240 | 最终报告验收闭环 | 最终收束不是 demo 展示，而是证据索引；报告按第 1-9 节检查场景环境、baseline 量化、runtime API、风险建议和附录证据，最终建议只能写推荐上线候选、暂不推荐或继续验证；缺字段必须标注未记录、未完成或未测 | `docs/final-project.md`、`docs/report-template.md` |

## 备份页

备份页不计入 240 页主课件，但应另备：

| 备份内容 | 页数 |
| --- | ---: |
| 量化公式推导：linear quantization、clipping、outlier | 6 |
| GPTQ/AWQ/SmoothQuant 论文细节 | 8 |
| llama.cpp、server、profiling、日志路径命令附录 | 8 |
| LiteRT、ExecuTorch、Core ML、MLC 移动端路线 | 6 |
| Jetson 功耗、温度、长稳测试补充 | 6 |
| 参考资料和阅读清单 | 4 |

## 下一版课件改造规则

1. 保留 reveal.js 和现有视觉系统，直接扩充 `static/slides/deck/index.html`。
2. 不再按 108 页做 V3；下一版目标是 **240 页主课件**。
3. 每个主讲专题固定 40 页，每 5 页形成一个小闭环。
4. 课程网页已有详细内容时，课件只抽“可讲的图、表、命令、日志和失败样例”。
5. 每个主讲专题最后 5 页必须回到最终部署评估报告。
6. 参考页保留公开资料来源，但课堂结论只来自本课程实验、日志和报告证据。

最小可交付版本已经从 47 页扩到 240 页主课件。现在不再继续堆页数，剩下的工作是全局放映验收和交付形态稳定。

## 当前扩展参考页

当前 HTML 课件在 240 页主线之后追加了 **241-288** 共 48 页扩展参考页，来源包括 HarvardX/TinyML selected slides、tinyML Foundation Peter Ing deck 解析内容、MIT 6.5940 和 MLSys 公开课件。它们只作为备课参考、备用解释和来源索引，不替代 001-240 的主讲页。

## 完成方式

当前 288 页版本已经够做内容底稿，主课件也已经按 001-240 拆成 6 个专题。后面不要继续堆页数，优先把它做成能连续讲一天、能验收、能交付的课程 PPT。

实际完成路径分四步：

1. **主课件成稿**：001-240 已拆成 6 个专题，206-240 也已按 5 页闭环收完。
2. **做整套视觉和讲授节奏检查**：统一专题入口、页脚来源、标题长度、表格密度和文字溢出，不重写内容架构。
3. **然后补讲师材料**：为每个 45 分钟专题补 1 页讲师提示，写清本段讲多久、现场问什么、学生交什么。
4. **最后导出交付包**：保留 HTML 课件作为主版本，再按需要导出 PDF 或 PPTX；只有 HTML 稳定后才做导出，避免两套内容不同步。

验收标准也按这四步来：001-240 能连续讲完，6 个专题各有 40 页，所有建议都能回到日志、表格或报告字段，浏览器无明显越界，`typecheck` 和 `build` 通过。

| 方式 | 适合情况 | 取舍 |
| --- | --- | --- |
| A. 继续打磨 HTML 课件 | 现在这个项目的主交付 | 最快，能直接预览和发布；推荐路线 |
| B. 内容锁定后导出 PDF/PPT | 需要离线发给学员或现场备用 | 先锁内容和版式，再做导出，避免重复返工 |
| C. 重新做原生 PPTX | 对方明确要求可编辑 PowerPoint | 成本最高，只在 HTML 版定稿后再做 |

推荐采用 A，必要时补 B。C 不作为当前主线。

## 完成路径

| 阶段 | 产出 | 验收 |
| --- | --- | --- |
| 1. 锁主线 | 001-240 保持 6 个主讲专题，241-288 只做备课/备份页 | 每专题 40 页，不新增主讲专题 |
| 2. 全量叙事审稿 | 每页都有一句清楚的课堂主张，前后页能自然接上 | 001-240 能从问题讲到报告 |
| 3. 内容密度压缩 | 长 bullet 改成流程图、矩阵表、命令页、日志页和 failure case | 单页只承担一个讲授点 |
| 4. 证据链校对 | 课程网站、参考课件、本课实验、报告字段能互相对上 | 外部资料只做来源，不直接替代本课结论 |
| 5. 备份页整理 | 241-288 拆成真正备用页，或者迁回相关专题 | 附录不承担主讲内容 |
| 6. 放映验收 | 浏览器逐段检查、`typecheck`、`build` | 1280x720 无溢出，能直接放映 |

## 从当前状态继续做的执行队列

当前不需要换技术路线，也不需要重做课件框架。206-240 已经按 5 页闭环收完；下一步只做全局放映验收、必要的版面修正，以及最后的交付包导出。

| 顺序 | 范围 | 任务 | 完成标准 |
| --- | --- | --- | --- |
| 1 | 206-210 | 已精修 VLM 链路证据：输入账、对齐账、生成账和组件风险 | VLM 页能回答失败来自输入、视觉侧还是语言侧 |
| 2 | 211-215 | 已精修 VLM 优化路线：输入先减负、模型再取舍、系统最后兜底 | 优化建议能回到分辨率、token、内存、延迟、隐私边界和失败样例 |
| 3 | 216-220 | 已精修 Agent 权限与 trace 闭环：策略集合、denylist、执行状态和恢复记录 | Agent 页不写自动化口号，只写可校验的工具边界和 trace |
| 4 | 221-225 | 已精修 Function Calling：schema validation、policy check、confirm gate 和应用层 executor | Function Calling 不等同于模型直接执行工具 |
| 5 | 226-230 | 已精修端云协同：privacy gate、capability gate、failure gate 和 fallback trace | 端云协同页不写概念连线，只写可复核的路由判定和授权记录 |
| 6 | 231-235 | 已精修案例复盘：目标、条件、结果、失败标签、主瓶颈和下一步 | 案例页不套同一量化答案，每个判断都能回到日志或复盘卡 |
| 7 | 236-240 | 已精修最终报告验收：证据索引、三类建议、九节报告检查和证据缺口 | 最终建议只引用已闭合日志、表格、风险登记和未测说明 |
| 8 | 241-288 | 已整理为扩展参考页：TinyML、嵌入式系统、传感器、runtime、安全和来源索引 | 附录明确不承担主讲内容，只支撑备课和备用解释 |
| 9 | 001-240 | 主课件全局放映验收 | 6 个专题各 40 页，能从问题讲到报告，浏览器无明显溢出 |
| 10 | 交付包 | HTML 主版本稳定后再导出 PDF/PPTX | `typecheck`、`build` 通过，导出版不和 HTML 内容分叉 |

叙事审稿第一轮已经先处理 001-240 的明显模板化标题：章节开场页、专题一核心概念内容和案例复盘页都改成课堂主张。后续重点转到内容密度和单页可讲性。

内容密度第一轮先处理章节开场页：把章节开场改成“输入 / 方法 / 交付”的课程口径。后续再处理单页长列表和扩展参考页。

内容密度第二轮先压缩 035、085、090、110、115 五个风险与报告页：每页从 4 个失败样例 + 3 个报告落点，合并成 3 个失败样例 + 2 个报告落点，保留证据链但减少放映时的文字负担。

内容密度第三轮继续压缩专题五 170、175、180、185、190 五个风险与报告页：把模型链路、runtime 选型、性能陷阱、CLI baseline 和 profiling 风险都控制在 3 条失败样例 + 2 条报告落点内。

专题主题对齐课程网站目录后，6 个专题改成“Part I-VII 的一日压缩版”：Part I/II 合并为端侧部署共同语言，Part III 拆成 baseline/PTQ 与 LLM/KV 两段，Part IV 显式写入 LoRA/QLoRA，Part V/VI 拆成 runtime/profiling/API 与 Ubuntu/Jetson/移动端迁移，Part VII 收束到 VLM/Agent 和最终报告。

专题主题第二轮按课程网站细纲再收紧：专题一明确为项目启动和环境证据，专题二改成 Qwen/GGUF 基线与 PTQ/QAT 实验，专题三把 GPTQ/AWQ 与 KV Cache 写入标题，专题五把推理加速、bench 和 API 验收前置到主题名，专题六改成真实端侧迁移与最终报告。

课件成稿质量第一轮清掉 6 张专题开场页上的可见时间段，时间只作为备课节奏，不作为普通内容页文本；同时补强 006、008 两张短页，让端侧必要性和“部署不是搬模型”都能落到报告证据字段。

课件成稿质量第二轮清理 241-288 附录页的制作过程语言：附录页改成“扩展参考 / 专题扩展 / 主课证据链”的学员可见表达，但仍不替代 001-240 主课。

课件成稿质量第三轮继续清理 241-288 附录页更隐蔽的制作型标题：改成直接面向学员的设备、runtime、传感器和报告证据表述。

课件成稿质量第四轮从 001-240 主课件里清理少数占位式标题：把“常见失败样例 / 判断表 / 结果表字段 / API 命令页 / 记录表”改成课堂可直接讲的主张句，优先保证讲师看到标题就知道这一页要证明什么。

课件成稿质量第五轮清理所有可见页眉里的制作型标签：统一改成“问题框架 / 核心概念 / 证据图表 / 课堂实作 / 风险与报告 / 总结归纳”，页眉只服务学员听课，不暴露课件生产分工。

课件成稿质量第六轮继续清理 001-240 主课件里的表名式标题：把“矩阵 / 最小闭环 / 归因路径 / 选择表 / 排查动作 / 命令页 / 材料清单 / 新增字段”改成“这一页要证明什么”的主张句，正文表格和命令不变。

课件成稿质量第七轮清理正文里的备课语气：把内部说明改成面向学员和报告的工程边界表述。

课件成稿质量第八轮按课程网站细纲微调 6 个主讲专题命名：同步流程文档和 HTML 封面/专题开场页，并检查 001、041、081、121、161、201 六个改动页没有文字越界。

课件成稿质量第九轮补做 001-288 全 deck 放映风险检查：静态扫描确认 288 页完整、旧制作词为 0；浏览器分段遍历 288 页，发现并修正 114 和 239 两处不够正式的表述，复查改动页无越界、无控制台告警。

课件成稿质量第十轮先改开头的课程感：把 003 从报告证据链重复页改成 6 个工程专题地图，让学员在前 3 页就看到一天课程的完整学习路径。

课件成稿质量第十一轮继续改开头的课程感：把 002 从验收规则页改成学习产出页，明确学完后要能判断端侧化可行性、量化可用性和交付状态。

课件成稿质量第十二轮继续压实开头实作主线：把 004 从字段清单页改成“Qwen GGUF baseline -> Q8/Q5/Q4 -> profiling/local API -> 部署评估报告”的可复现部署链路页。

课件成稿质量第十三轮继续改 005-010 的课程感：把旧的端侧价值小节前移为“一日课程怎么讲”的导航段，明确课程网站 Part I-VII 如何压成 6 个课堂专题、上午/下午各讲什么、每个专题按五页闭环推进，以及进入 Qwen/GGUF 量化实验前需要哪些报告和日志字段。

课件成稿质量第十四轮继续改 011-015 的课程感：把设备列表改成“目标场景 -> 使用边界 -> 第一轮证据 -> 小组画像 -> 报告风险”的闭环，让手机、PC、车载、IoT、摄像头、Jetson 和本地服务器都回到可检查的场景画像和报告字段。

课件成稿质量第十五轮继续改 016-020 的课程感：修正“第四组词”与三张卡片不一致的问题，并把这一组改成“拆开一次 Qwen 请求 -> 固定三组推理词 -> 记录 baseline 字段 -> 避免量化对比失真”的闭环。

课件成稿质量第十六轮继续改 021-025 的课程感：把端云协同从概念页改成“路由证据”闭环，要求按隐私、复杂度和风险分三类任务，并用 request_id、敏感等级、fallback_reason、uploaded_fields、confirm_required 等字段证明本地、兜底、确认或拒绝路径。

课件成稿质量第十七轮继续改 026-030 的课程感：把“环境闸门”改成“环境准入”，明确设备证据、工具链证据、模型证据三类材料如何决定 Ubuntu GPU、Jetson、CPU-only 或移动端路线；缺项时报告只能标未验证，不能写推荐。

每一组 5 页的实际改法保持同一个模板：

```text
读课程网站对应章节 -> 抽一个工程问题 -> 改 5 页 -> 更新本流程文档 -> typecheck/build -> 浏览器看 5 页
```

完成定义也很简单：不是“页数够了”，而是讲师可以顺着 001-240 连续讲完一天课程，并且每个专题最后都能落到最终部署评估报告。

专题一的样板标准已经先落到 016-020：同一个 5 页闭环必须把网站章节里的概念转成课堂可讲的工程链路。以“推理共同语言”为例，5 页分别承担：问题定义、关键术语、流程图、baseline 记录字段、失败样例和报告落点。后续专题二到专题六也按这个标准改，不再只堆术语。

专题一第二个样板标准落到 021-025：端云协同不能只画“本地 + 云端”架构图，必须写清哪些请求必须本地、哪些允许脱敏后云端兜底、哪些必须人工确认，并用路由日志证明 fallback 真的发生。

专题一第三个样板标准落到 026-030：目标设备和工具链不能只列名词，必须先做环境闸门；环境日志、模型清单、llama.cpp commit、构建目标和 API 端口缺一项时，后续 baseline、量化、profiling 或 local API 结论都要标为未完全验证。

专题一第四个样板标准落到 031-035：Q8/Q5/Q4 量化对比前必须先锁定实验变量；模型基座、prompt、ctx-size、seed、采样、runtime commit、offload、设备状态和日志路径要进入同一张实验单，否则速度、内存或质量差异只能写成风险，不能写成部署结论。

专题一第五个样板标准落到 036-040：每个专题最后 5 页不能只做总结，要落成报告字段和下一专题准入门槛。专题一的交付物是第 1-2 节草稿、四张基础表和进入量化前的准入检查。

专题二的样板标准先落到 042-045：量化课不能直接从 bit-width 开始，必须先建立 Qwen/GGUF baseline 证据链，再进入 Q8/Q5/Q4、PTQ/QAT 和量化变量控制。

专题二第二个样板标准落到 046-050：数值格式页不能做 FP32/FP16/INT8/INT4 名词表，而要让学生知道低 bit 文件、量化格式、runtime backend、硬件 kernel 和输出质量必须一起验证。

专题二第三个样板标准落到 051-055：线性量化不应停在公式推导，要用 scale、zero-point、rounding 和 clipping 解释 outlier 为什么会放大量化误差，并把 Q8/Q5/Q4 质量退化的可能原因写进报告第 4、5、7 节。

专题二第四个样板标准落到 056-060：粒度和对象不能混写成“模型 4bit”；per-tensor、per-channel、per-group 决定误差和 metadata 怎么分摊，weight-only、activation、KV Cache 影响的资源不同，报告第 4、5、7 节必须分列。

专题二第五个样板标准落到 061-065：PTQ 不是文件生成作业，而是快速产生可证伪候选。现成 GGUF、自己转换和静态校准都要回到同一 prompt、同一设备、同一 runtime 的质量、速度、内存和失败样例记录。

专题二第六个样板标准落到 066-070：QAT 不能作为默认答案；只有在 PTQ 退化被固定样例证明，并且数据、训练预算、导出链路和回归测试都成立时，才进入训练型修复，否则优先回退 Q5/Q8、mixed precision、换模型或记录“不训练”理由。

专题二第七个样板标准落到 071-075：校准集、评估集和失败样例必须分工记录；校准样本只证明量化范围覆盖，评估样本才证明任务质量，失败样例进入风险登记，任何数据来源、prompt template 或脱敏边界不清都不能支撑部署结论。

专题二第八个样板标准落到 076-080：专题收束不能只留下“低 bit 更小”的口号，必须形成报告第 4 节的量化证据表；同源模型、同条件运行、同口径质量和资源记录齐全后，才能进入专题三讨论 GPTQ、AWQ、SmoothQuant、KV Cache 和生成质量账。

专题三第一个样板标准落到 081-085：LLM 量化不能照搬传统 INT8 经验，也不能只看权重文件大小；课堂一开始就要把权重、激活 outlier、KV Cache 和生成质量拆成四本账，并让 Qwen Q8/Q5/Q4 对比表同时记录文件、速度、内存、warning/fallback 和质量失败标签。

专题三第二个样板标准落到 086-090：推理成本不能用一个总耗时概括；prefill、decode 和 KV Cache 必须分开讲、分开记，`prompt eval time`、`eval time`、tokens/s、ctx-size、prompt/generated tokens 和 RAM/VRAM 峰值都要进入同一张 profiling 表。

专题三第三个样板标准落到 091-095：LLM 量化难点不能停在 outlier、敏感层、长上下文这些名词上；每个低比特失败都要先排除 baseline、prompt/template、ctx 和 runtime，再用原始输出与失败标签判断是否来自 outlier、敏感层、长上下文或生成稳定性。

专题三第四个样板标准落到 096-100：GPTQ 不能只讲方法名或论文结论；必须说明校准输入 X 如何决定补偿方向、逐层补偿不能消除跨层累积风险、产物格式通常不是 GGUF，并把是否实跑、runtime 支持和设备 profiling 写进报告。

专题三第五个样板标准落到 101-105：AWQ 不能只讲 activation-aware 这个名词；必须说明校准文本如何决定重要通道、缩放保护不是高精度保留、VLM projector 等敏感模块要单独评估，并把模型格式、runtime 加载、profiling 和 AWQ 与 GGUF 主实验的层级关系写清。

专题三第六个样板标准落到 106-110：SmoothQuant、LLM.int8、GGUF Q4/Q5 和 KV Cache 不能混写；必须先判断问题在激活、权重还是 KV Cache，再把 activation outlier、W8A8 kernel、weight-only 文件收益、KV buffer、OOM 和长上下文质量分开记录，未在本课设备上跑通的路线只能写成扩展或风险。

专题三第七个样板标准落到 111-115：Qwen/GGUF 主实验不能只贴命令；必须交付同源模型清单、固定 prompt、F16/Q8/Q5/Q4 原始输出、stdout/stderr、profiling 参数和 local API 记录，并确保每条命令能回溯到报告表格。

专题三第八个样板标准落到 116-120：专题三收束不能新增方法名，而要把 GGUF Q8/Q5/Q4、KV Cache、GPTQ/AWQ、SmoothQuant/LLM.int8 按证据等级收进同一张方法矩阵；推荐候选、回退候选、继续验证路线、失败样例和专题四要修复的问题都要写清。

专题四的样板标准先落到 122-125：精度修复不能从 LoRA、QAT 或蒸馏开始，必须先证明失败来自量化，再把失败样例归到 baseline、prompt/template、ctx/KV、runtime/设备或低比特退化，并把可复现条件写进报告。

专题四第二个样板标准落到 126-130：质量问题不能混写成“效果不好”；传统视觉、LLM、VLM 和 Agent 要分别绑定指标、原始输出、图片输入或 tool trace，并使用固定失败标签支撑第 4 节质量现象和第 7 节风险登记。

专题四第三个样板标准落到 131-135：baseline 与评估集不是背景材料，而是进入修复前的闸门；F16/Q8 baseline、固定 JSONL prompt 集、template/tokenizer/ctx/runtime 一致性和日志路径都通过后，Q4/Q5 的失败才可以归因到量化。

专题四第四个样板标准落到 136-140：误差归因必须是单变量排查，不是经验判断；先排除 baseline、prompt/template、ctx、runtime 和设备差异，再把失败归到校准分布、敏感层、outlier 或长上下文，并在第 7 节写清反证路径。

专题四第五个样板标准落到 141-145：修复手段必须按成本和证据排序；prompt/template、采样参数、Q5/Q8 回退、校准/imatrix、mixed precision、LoRA/QAT/蒸馏不能混成一个列表，只有修复前后用同一评估集复测质量、速度、内存和日志路径后，才能进入最终建议。

专题四第六个样板标准落到 146-150：压缩路线不能从方法名出发，必须先定位文件、内存、算子延迟、质量或设备稳定性瓶颈；量化、低秩、剪枝、换小模型、蒸馏和端云协同都要绑定目标设备证据，参数更少但没有 runtime/kernel、质量和 profiling 支撑时不能写成推荐。

专题四第七个样板标准落到 151-155：蒸馏不是质量下降后的默认动作，只有任务、教师输出、学生容量和评估集稳定后才进入；课堂最低交付是蒸馏数据卡、teacher/student 记录、训练成本和再量化回归计划，未实跑训练时不能把蒸馏写成最终推荐。

专题四第八个样板标准落到 156-160：专题收束必须把质量修复、压缩、蒸馏和微调取舍落成推荐采用、保留回退或暂不推荐三类结论；第 4 节写质量现象，第 7 节写风险和反证，第 8 节只写能回到日志、输出样例和同条件复测的工程建议。

专题五的样板标准先落到 162-165：Runtime 专题不能只列框架名，必须把模型格式、runtime、backend、profiling 和 API 分层记录，CLI、`llama-bench` 和本地 API 的指标不能混写。

专题五第二个样板标准落到 166-170：部署链路必须证明模型、tokenizer/template 和执行路径没有在 CLI、bench、server 之间被悄悄换掉；模型 hash、量化格式、runtime commit、backend/offload 日志、server 启动命令和请求记录要能互相对照。

专题五第三个样板标准落到 171-175：Runtime 选型不能做框架名罗列，而要同时回答模型格式、目标硬件、backend/kernel、接口形态和可观察性；主线 runtime 必须有实测证据，替代路线即使未实跑也要写清适用条件、未测原因和下一步验证。

专题五第四个样板标准落到 176-180：性能陷阱不能只讲 fallback、反量化和 dynamic shape 名词，而要用 stderr、runtime log、GPU/CPU 采样、`llama-bench` pp/tg、API elapsed 和 server log 反证理论加速是否兑现；没有反证日志时不能把参数调整写成推荐。

专题五第五个样板标准落到 181-185：CLI baseline 是后续量化、offload、ctx-size、bench 和 API 对比的锚点；模型路径、SHA256、量化格式、llama.cpp commit、prompt、ctx-size、seed、生成长度、stderr timing、GPU 采样和质量样例必须一次建齐。

专题五第六个样板标准落到 186-190：Profiling 不能只报 tokens/s，而要让每行结果同时绑定负载形状、CLI timing、`llama-bench` pp/tg、系统采样、质量备注和日志路径；缺少原始命令、资源状态或质量样例时，部署建议必须降级为不完整记录。

专题五第七个样板标准落到 191-195：Local API 验收不能停在 HTTP 200，而要同时保存 `llama-server` 启动日志、请求 JSON、响应 JSON/meta、模型别名、elapsed、server warning、资源采样、timeout 和 host 绑定边界；缺少请求响应或 server 证据时，第 6 节不能写成 API 已验收。

专题五第八个样板标准落到 196-200：专题收束要把 runtime 参数包、profiling 结果包和 API 验收包落到报告第 5-8 节；第 8 节只能引用已经闭合的模型、runtime、profiling、API 和风险证据，CLI、bench、API 指向对象不一致时不能写最终部署建议。

专题六的样板标准先落到 202-205：最后一个专题不是新增概念合集，而是把 Ubuntu baseline 推到 Jetson、移动端路线、VLM/Agent 和最终报告；没有设备日志、工具 trace 或策略边界时，只能写成路线图或未测风险。

专题六第二个样板标准落到 206-210：VLM 不能只评价语言模型输出，必须把图像输入、预处理、visual token、vision encoder、mmproj/projector、LLM pp/tg、KV Cache 和原始多模态输出分开记录；没有输入图、处理参数、组件日志和失败标签时，不能写端侧 VLM 结论。

专题六第三个样板标准落到 211-215：VLM 优化要按输入、模型、系统三层排序；先判断是否能通过 ROI、分辨率、帧率和传统视觉/OCR 初筛减少输入成本，再评估 vision encoder、LLM 量化和端云协同，未实跑时只能写场景化路线图和进入条件。

专题六第四个样板标准落到 216-220：Agent 端侧部署先定义工具权限和状态边界；planner output、tool schema、参数校验、permission decision、confirm/blocked reason、execution status、observation 和 recovery action 都要进入 trace，否则只能写 Agent 路线图，不能写已验收。

专题六第五个样板标准落到 221-225：Function Calling 不能等同于模型直接执行工具，必须经过 schema gate、policy gate、confirm gate 和应用层 executor；工具调用记录要保存 tool name、args、schema result、policy result、confirm flag、status/error、observation 和脱敏 trace，缺少 validator、policy、executor 或可重放 trace 时不能写成可部署 Agent。

专题六第六个样板标准落到 226-230：端云协同不能写成“本地不行就上云”，必须先过 privacy gate、capability gate 和 failure gate；路由记录要包含 task_type、sensitivity、upload_allowed、local result、quality check、fallback reason、uploaded_fields、authorization、final_source、output schema 和 trace，缺少授权记录、脱敏字段表或 fallback trace 时只能写概念路线图。

专题六第七个样板标准落到 231-235：案例复盘不能把传统视觉、小型 LLM、VLM 和 Agent 都套成同一个 Q4 问题，必须先定位主瓶颈在输入、模型、runtime、API 还是系统权限，再选择 accuracy/latency、Q8/Q5/Q4 profiling、VLM 组件日志或 Agent trace 作为证据；每个案例交一张复盘卡，写清目标、条件、结果、失败标签、主瓶颈和推荐/回退/暂不推荐/下一轮验证。

专题六第八个样板标准落到 236-240：最终收束必须变成可审查的端侧部署评估报告，报告要覆盖第 1-9 节的场景环境、baseline 量化、runtime API、风险建议和附录证据；最终建议只能写成推荐上线候选、暂不推荐或继续验证，缺证据时必须标注未记录、未完成或未测。

课件成稿质量第十八轮继续改 031-040 的课程感：把“变量控制”和“报告落点”合成专题一收束闭环，明确学生先交变量控制单和 M0/M1 报告材料，再进入 Qwen/GGUF 量化；第 2 节查不到写“未记录”，第 7 节没跑过写“未测”，避免把准备不足包装成部署结论。

课件成稿质量第十九轮继续改 041-050 的课程感：把专题二开场改成先交 Qwen/GGUF baseline 表和 Q8/Q5/Q4 模型清单，强调 baseline 要能复查模型、runtime、输入、资源和质量；数值格式页不再按 bit 数排序，而是要求先核对同源模型、GGUF metadata、backend 支持和端到端收益。

课件成稿质量第二十轮继续改 051-060 的课程感：把线性量化页改成“用公式做排障”，要求学生用 scale、zero-point、qmin/qmax、rounding 和 clipping 解释质量退化；把粒度和对象页改成“实验表分账”，明确 weight-only、activation、KV Cache、per-tensor、per-channel、per-group 不能混写成一个“4bit”标签。

课件成稿质量第二十一轮继续改 061-065 的课程感：把 PTQ 工作流改成“先产出可证伪候选”，修正入口为现成 GGUF、自己量化和静态校准三类；课堂验收强调只生成文件不算完成 PTQ，必须回到同一 baseline、同一 prompt、同一 runtime 的文件、内存、速度和质量证据表。

课件成稿质量第二十二轮继续改 066-070 的课程感：把 QAT 改成质量修复决策门，而不是 PTQ 后的默认下一步；课堂判断必须先证明低 bit 退化来自量化，再用数据预算、导出链路、回归测试和目标 runtime 决定训练、不训练或回退。

课件成稿质量第二十三轮先锁定 6 个主讲专题最终命名：专题名改成“课堂任务 + 工程证据”格式，分别覆盖端侧框架与环境准入、Qwen/GGUF PTQ/QAT 证据、LLM 低比特与 KV Cache 质量账、质量修复压缩蒸馏与训练取舍、Runtime/Profiling/API 验收、Jetson/移动端/VLM/Agent 与最终报告。

课件成稿质量第二十四轮继续改 071-075 的课程感：把数据口径小节从概念解释改成实验闸门，要求校准样本、评估样本、失败样例和脱敏边界先分工；每行 Q8/Q5/Q4 记录都要能按模型、prompt、template、ctx、seed、runtime 和日志路径重跑，否则量化差异只能写成风险。

课件成稿质量第二十五轮继续改 076-080 的课程感：把专题二收束改成 M2 量化证据表交付门槛；第 4 节必须同时记录同源模型、运行条件、资源收益、质量证据和 keep/fallback/risk/untested 判断，没有日志、输出样例或风险登记时不能带着推荐结论进入专题三。

课件成稿质量第二十六轮按课程网站内容微调 6 个专题名，并继续改 081-085 的课程感：专题三不再从方法名开始，而是从 M2 量化证据表继续拆账；先扩展权重文件、激活 outlier、KV Cache/runtime 和生成质量四类记录，再进入 GPTQ、AWQ、SmoothQuant、LLM.int8 和 GGUF 方法边界。

课件成稿质量第二十七轮继续改 086-090 的课程感：推理成本页不再只解释 prefill、decode 和 KV Cache，而是要求把 llama.cpp timing、ctx-size、prompt/generated tokens、RAM/VRAM、warning/fallback 和质量备注写回 M2 扩展表的同一行实验，避免用总耗时或 tokens/s 直接写部署建议。

课件成稿质量第二十八轮继续改 091-095 的课程感：低比特失败归因不再停在 outlier、敏感层和生成稳定性名词上，而是先排除 baseline、prompt/template/tokenizer、ctx/采样参数和 runtime/fallback，再用固定 failure_label 决定回退 Q5/Q8、调 ctx、查 runtime 或进入 mixed precision/校准修复。

课件成稿质量第二十九轮先根据课程网站进一步微调 6 个专题名：把专题一改为项目启动、端侧约束与环境准入，专题三改为 LLM 低比特、KV Cache 与质量归因，专题五改为 Runtime/Profiling、推理加速与本地服务验收，专题六改为真实端侧迁移、VLM/Agent 与部署评估报告；同时改 096-100，把 GPTQ 从方法介绍页改成格式、runtime、校准输入和设备日志的候选决策闸门。

课件成稿质量第三十轮继续改 101-105 的课程感：AWQ 不再停在“保护重要通道”方法介绍，而是进入候选闸门；先判断它要修复哪类 Q4 退化，再记录校准覆盖、缩放边界、VLM 敏感模块、模型格式、runtime 加载和 profiling，未实跑时只写候选或未测原因。

课件成稿质量第三十一轮继续按课程网站主线微调专题名，并改 106-110 的课程感：把 SmoothQuant、LLM.int8、GGUF Q4/Q5 和 KV Cache 从方法并列改成激活、权重、cache 三本账；课堂先判断失败来自哪一本账，再分别记录校准、kernel/runtime、weight-only 收益、KV buffer、OOM 和长上下文质量，未跑通的路线只写扩展或风险。

课件成稿质量第三十二轮继续改 111-115 的课程感：把 Qwen/GGUF 主线从“可复现实验链”压成报告闭合门槛；GPTQ/AWQ/SmoothQuant 只进候选表，课堂推荐只能来自同源 GGUF、固定变量、stdout/stderr、资源采样、输出质量和 API 证据，缺日志时只能写回退或继续验证。

课件成稿质量第三十三轮继续改 116-120 的课程感：专题三收束不再按方法热度排序，而按证据等级分成推荐候选、回退候选和继续验证；进入专题四前必须交付原始输出、timing/资源表、失败标签、未测路线风险和第 4 节可复查的量化证据表。

课件成稿质量第三十四轮继续改 121-125 的课程感：专题四开场不从 LoRA/QAT 等修复手段开始，而是接住专题三证据包做归因闸门；先排除 baseline、prompt/template、ctx/KV、runtime 和设备状态问题，再进入最低成本修复或训练门槛，所有失败样例都要能按 prompt、参数、输出和资源日志重跑。

课件成稿质量第三十五轮继续改 126-130 的课程感：质量问题分诊不再只是列传统视觉、LLM、VLM 和 Agent，而是先把失败分到指标型、生成型或链路型任务账本；每条失败都要保存可回放证据，Q8/Q5/Q4 使用固定失败标签对比，报告第 4 节写质量信号和样例，第 7 节写任务类型风险。

课件成稿质量第三十六轮继续改 131-135 的课程感：baseline 与评估集不再只是背景说明，而是修复前的 gate；Q8/F16 必须先在同 prompt、template、runtime 和 ctx-size 下站住，最小 JSONL 评估集要能重复跑，证据不齐时只能写 baseline 未通过或评估覆盖不足，不能写 LoRA/QAT/蒸馏等修复建议。

课件成稿质量第三十七轮继续改 136-140 的课程感：误差归因从名词表改成单变量排查；每次只改变一个条件，先排除 baseline、prompt/template、ctx/seed、runtime/backend 和设备状态，再讨论校准分布、敏感层、outlier、KV Cache 或 mixed precision，每个归因都要写出能推翻它的反证路径和日志证据。

课件成稿质量第三十八轮继续改 141-145 的课程感：修复手段不再按方法名罗列，而按证据门槛和成本排序；归因闭合后先做 prompt/template、采样、Q5/Q8 回退，再做校准/imatrix、mixed precision 或局部回退，LoRA/QAT/蒸馏未实跑时只能写候选，所有修复都必须回到同一评估集复测质量、速度、内存和日志。

课件成稿质量第三十九轮继续改 146-150 的课程感：压缩方法不再按剪枝、低秩、参数共享和架构重设计罗列，而是先证明部署瓶颈在哪里；文件、峰值内存、算子延迟、低比特质量和设备稳定性分别对应不同候选路线，课堂只做 Q8/Q5/Q4、更小模型和 runtime 支持的低成本判断，剪枝、低秩、蒸馏没有实跑证据时只能写进入条件和验证计划。

课件成稿质量第四十轮继续改 151-155 的课程感：蒸馏决策不再从 teacher/student 名词解释开始，而是先过任务稳定、教师可靠、学生可部署、评估能回归四个门槛；课堂最低交付是教师输出卡、学生部署卡和数据回归卡，未实跑训练、同集复测和再量化回归时，蒸馏只能写成第二阶段候选。

课件成稿质量第四十一轮继续改 156-160 的课程感：专题四结尾不再只是总结修复方法，而是把质量修复、压缩、蒸馏和训练取舍落到报告第 7 节风险登记与第 8 节部署建议；课堂用一条固定失败样例写出推荐、回退和暂不推荐，缺日志、输出样例、复测条件或风险登记时只能写未记录、失败或下一轮验证。

课件成稿质量第四十二轮继续改 161-165 的课程感：专题五开场从“runtime/profiling 名词”改成专题四建议的运行时验收入口；同一 Qwen GGUF 必须分别留下 CLI stderr timing、llama-bench、系统采样和 local API smoke test 四类证据，CLI 速度、benchmark 速度、资源状态和 API elapsed 不能混写，缺任一类证据时第 8 节只能写未完全验证。

课件成稿质量第四十三轮继续改 166-170 的课程感：部署链路不再泛讲 export、图优化和 kernel，而是先验收对象连续性；CLI、llama-bench 和 llama-server 必须分别证明模型路径、hash、量化格式、tokenizer/template、ctx、`-ngl`、threads、backend、server model id 和 warning 可对照，对不上时 CLI、bench 和 API 的数字不能支撑同一个部署建议。

课件成稿质量第四十四轮继续改 171-175 的课程感：Runtime 矩阵不再是框架名清单，而是按证据等级排序；llama.cpp 是本课主线实测，ONNX/TensorRT 是候选对照，LiteRT/Core ML/ExecuTorch 是端侧路线图，MLC/vLLM/TensorRT-LLM 是进阶 serving，推荐路线必须有日志，未实跑路线只能写适用条件、未测原因和下一步验证。

课件成稿质量第四十五轮继续改 176-180 的课程感：性能陷阱不再停在 fallback、反量化和 dynamic shape 名词，而是改成慢结果贴标签和反证流程；文件变小、写了 `-ngl` 或换了 runtime 都要先查 runtime log、pp/tg、资源采样、curl elapsed 和 server log，证据不足只能写未记录或下一轮 profiling。

课件成稿质量第四十六轮继续改 181-185 的课程感：llama.cpp 实作不再只是 CUDA、Qwen GGUF 和参数罗列，而是改成 baseline 验收闭环；课堂先交付可复跑命令、模型 hash、runtime commit、固定负载、stderr timing、显存采样和质量样例，后续量化、offload、ctx、bench 和 API 都必须回到同一条 baseline。

课件成稿质量第四十七轮继续改 186-190 的课程感：Profiling 不再是 TTFT、tokens/s、显存和功耗的指标罗列，而是改成采集、解析、判读、入报告闭环；课堂每次只改一个主变量，保存 stdout/stderr、资源采样、pp/tg、quality tag 和日志路径，短实验 GPU utilization 采到 0% 时不能单独下结论。

课件成稿质量第四十八轮继续改 191-195 的课程感：Local API 不再只是 OpenAI-compatible server、curl 和 HTTP 状态，而是改成服务化验收闭环；同一条 baseline 启动 llama-server 后，必须留下 server log、request JSON、response JSON、HTTP status、elapsed/meta、model alias、资源变化和绑定范围，再判断是否能进入应用、VLM 或 Agent 集成。

课件成稿质量第四十九轮继续改 196-200 的课程感：专题五结尾不再只是报告第 5-6 节落点，而是改成最终建议前的报告闸门；runtime、profiling、API 三包证据必须进入第 5-7 节，推荐、不推荐、回退参数和下一步验证只能引用已经闭合的日志、JSON、采样或失败证据，缺字段就写未记录。

课件成稿质量第五十轮继续改 201-205 的课程感：专题六开场不再泛讲 Jetson、移动端、VLM 和 Agent，而是改成真实端侧迁移验收入口；先证明同一 Qwen GGUF baseline 可迁移，再记录 Jetson 软件栈、功耗模式、tegrastats、stdout/stderr 和质量样例，没有本机日志的移动端、VLM 或 Agent 扩展只能写路线图和未测原因。

课件成稿质量第五十一轮根据课程网站 Part I-VII 再微调 6 个专题名：专题一改成端侧部署共同语言与环境准入，专题二突出 Qwen/GGUF baseline 和 PTQ/QAT 量化证据，专题三改成低比特 LLM、KV Cache 与质量归因，专题四显式写入 LoRA/QLoRA 决策，专题五收束为 Runtime、Profiling 与 Local API 验收，专题六改成 Jetson/移动端迁移、VLM/Agent 与最终报告。

课件成稿质量第五十二轮先把完成路径改成当前真实状态：主课件已经不是扩页阶段，而是 206-240 收口、001-240 全局验收、241-288 整理备课页、最后再导出交付包；后续每轮继续只处理一个 5 页闭环。

课件成稿质量第五十三轮继续改 206-210 的课程感：VLM 不再停在输入、encoder、projector 和 LLM 的组件列表，而是改成输入账、对齐账、生成账和组件风险闭环；课堂用视觉 token 公式解释 prefill/KV 成本，并要求保存输入图、处理参数、mmproj 文件/hash/精度、原始回答和失败标签，没有这些证据不能写端侧 VLM 结论。

课件成稿质量第五十四轮继续改 211-215 的课程感：VLM 优化不再按方法清单展开，而是按输入、模型、系统三层决策；先用 ROI、降分辨率、降帧率、缓存、去重和传统视觉/OCR 初筛减少 visual token，再评估 encoder INT8、LLM Q5/Q4、ctx/KV 和 mmproj 回归，端云协同必须写隐私规则、fallback trace 和授权记录。

课件成稿质量第五十五轮继续改 216-220 的课程感：Agent 端侧部署不再停在 planner、tools、state 名词，而是改成权限闸门和 trace 验收；课堂先检查 allowed、confirm_required、blocked 三个集合互斥和高风险 denylist，再记录 planner output、tool intent、schema result、policy result、execution status、observation、error 和 recovery action，没有可重放 trace 不能写已验收 Agent。

课件成稿质量第五十六轮继续改 221-225 的课程感：Function Calling 不再写成模型特权或 demo 展示，而是改成应用层契约闭环；课堂先让模型生成工具调用意图，再用 schema gate、policy gate、confirm gate 和 executor gate 判断是否执行，日志必须保存 tool name、args、schema result、policy result、confirm flag、status/error、observation 和脱敏 trace，没有 validator、policy、executor 或可重放 trace 时只能写接入条件。

课件成稿质量第五十七轮继续改 226-230 的课程感：端云协同不再写成“本地不行就上云”的概念图，而是改成可复核路由闭环；课堂先过 privacy gate、capability gate 和 failure gate，再记录 task_type、sensitivity、upload_allowed、local result、quality check、fallback reason、uploaded_fields、authorization、final_source、output schema 和 trace，缺少授权记录、脱敏字段表或 fallback trace 时只能写概念路线图。

课件成稿质量第五十八轮继续改 231-235 的课程感：案例串联不再把传统视觉、小型 LLM、VLM 和 Agent 都套成同一个量化答案，而是改成复盘卡闭环；每个案例先写目标、条件、结果、失败标签和主瓶颈，再判断推荐、回退、暂不推荐或下一轮只测一个变量，证据必须能回到日志、表格或 trace。

课件成稿质量第五十九轮继续改 236-240 的课程感：最终收束不再以 demo 成功结束，而是改成证据索引和报告验收；报告按第 1-9 节检查场景环境、baseline 量化、runtime API、风险建议和附录证据，最终建议只能写推荐上线候选、暂不推荐或继续验证，缺字段写未记录、未完成或未测。
