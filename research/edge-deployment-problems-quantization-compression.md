# 边缘部署问题候选资料池：量化、压缩与剪枝

> 本页是截至 **2026-07-10** 的第一阶段候选资料池，用于后续筛选、实测和课程改写，**不是课程结论，也不是跨硬件、跨版本的性能承诺**。每条只把来源直接支持的边界改写为可排障问题；真正吸收进课程前，仍需在课程选定的模型、runtime 与设备上复现。

## 阅读说明

- **最小诊断证据**：在尝试修复前至少应保留的现场，不等于完整实验方案。
- **覆盖状态**：`已有` 表示课程已有较完整主干；`扩展` 表示已有概念但缺少该诊断细节或平台边界；`新增` 表示当前指定章节基本未覆盖。
- 同一“INT4/INT8”名称不能跨 runtime 直接类推。下文涉及 ONNX Runtime、LiteRT/TFLite、TensorRT、Transformers/bitsandbytes 或 llama.cpp 的结论，只适用于对应来源明确描述的路径。

## 快速索引

| ID | 主题 | 覆盖状态 | 主要课程落点 |
| --- | --- | --- | --- |
| QCP-001 | 校准集与真实输入不匹配 | 已有 | PTQ/QAT、精度修复 |
| QCP-002 | 多输入校准张量顺序错位 | 新增 | PTQ/QAT、排障索引 |
| QCP-003 | ONNX 形状未知导致量化覆盖不足 | 扩展 | PTQ/QAT、推理加速 |
| QCP-004 | 图优化混在量化阶段导致误差难定位 | 扩展 | 精度修复 |
| QCP-005 | 动态量化反而增加端侧延迟 | 扩展 | PTQ/QAT、推理加速 |
| QCP-006 | x86 U8S8 饱和导致 INT8 精度突降 | 新增 | PTQ/QAT、精度修复 |
| QCP-007 | 整数量化模型仍含浮点回退 | 扩展 | PTQ/QAT、推理加速 |
| QCP-008 | QAT 只保存 fake-quant 模型，未得到可部署低比特产物 | 扩展 | PTQ/QAT、精度修复 |
| QCP-009 | 激活离群值使 W8A8 失真 | 已有 | PTQ/QAT、大模型量化 |
| QCP-010 | LLM.int8() 离群阈值造成质量/速度反向权衡 | 扩展 | 大模型量化、推理加速 |
| QCP-011 | 对已量化 GGUF 再量化导致质量严重下降 | 新增 | 大模型量化、精度修复 |
| QCP-012 | imatrix 语料与指令任务不匹配 | 扩展 | 大模型量化、精度修复 |
| QCP-013 | KV Cache 量化在短上下文反而更慢 | 扩展 | 大模型量化、推理加速 |
| QCP-014 | K/V 使用同一量化轴导致长上下文质量下降 | 扩展 | 大模型量化、精度修复 |
| QCP-015 | ONNX INT4 只覆盖部分常量权重算子 | 扩展 | PTQ/QAT、推理加速 |
| QCP-016 | 剪枝 mask/重参数化仍留在部署产物 | 新增 | 压缩与蒸馏 |
| QCP-017 | 满足 2:4 稀疏仍未选中稀疏 kernel | 扩展 | 压缩与蒸馏、推理加速 |
| QCP-018 | 输出头或 embedding 过度量化造成局部质量崩坏 | 已有 | 精度修复、大模型量化 |

## 候选问题记录

### QCP-001：校准集与真实输入不匹配，离线量化正常但业务任务集中退化

- **问题/现象**：PTQ、GPTQ、AWQ 或 GGUF imatrix 量化在通用文本/PPL 上可接受，但中文、长上下文、JSON、日志诊断或多轮指令任务明显退化。
- **常见原因**：激活范围或权重重要性来自不代表部署分布的样本；校准时的 tokenizer、chat template、输入长度或预处理也可能与部署不一致。
- **最小诊断证据**：校准集版本与哈希；语言、长度、任务类型分布；校准和部署的 tokenizer/template；同一评估集上的高精度与量化输出；必要时记录关键激活的 min/max、分位数和饱和比例。
- **解决/规避方案**：按真实流量分层抽样，覆盖短/长输入、格式任务、领域词和边界样例；让校准链路复用部署预处理；校准集与评估集分开；重算量化参数或 imatrix 后做固定回归。
- **适用边界或副作用**：增加无关样本不等于更代表；任务特化校准可能降低跨域泛化，必须保留通用回归集。
- **一手来源**：[TensorFlow Lite post-training quantization](https://www.tensorflow.org/lite/performance/post_training_quantization)（官方文档，代表性数据用于估计变量张量范围）；[About imatrix overfitting, and importance of input text](https://github.com/ggml-org/llama.cpp/discussions/5263)（llama.cpp 维护者/协作者实现讨论，指出 instruct 模型可能需要 instruct 数据而非固定长度通用文本块）。
- **课程映射**：`docs/02-ptq-qat.md` 的“校准集设计”；`docs/03-llm-quantization.md` 的 GPTQ/AWQ/imatrix；`docs/04-accuracy-repair.md` 的“校准集重构”。
- **覆盖状态**：**已有**。后续可把“覆盖表 + 产物哈希 + 饱和比例”补成统一最小证据模板。

### QCP-002：多输入模型的代表性数据按列表喂入时顺序错位

- **问题/现象**：TFLite 全整数量化能够完成，但精度异常、不同导出重复结果不稳定，或某一路输入的量化范围明显不合理。
- **常见原因**：多输入/多 signature 模型用位置列表提供代表性数据，张量顺序被翻转或与 signature 不一致；官方文档明确更推荐按 signature 和输入名提供数据。
- **最小诊断证据**：SavedModel signatures；每个输入的名称、shape、dtype、取值范围；代表性生成器实际 yield 的键/顺序；同一批样本在浮点模型和转换前 TFLite 模型的输出。
- **解决/规避方案**：使用 `(signature_key, {input_name: tensor})` 形式；为每一路输入增加 shape/dtype/range 断言；用一个可人工核对的样本先跑浮点与量化 A/B。
- **适用边界或副作用**：这是 TFLite 多输入/多 signature 路径的具体问题；基于 signature 的代表性数据接口存在版本要求，旧工具链要查对应版本文档。
- **一手来源**：[TensorFlow Lite post-training quantization](https://www.tensorflow.org/lite/performance/post_training_quantization)（官方文档；说明多 signature 校准写法，并提醒基于输入列表时顺序容易翻转）。
- **课程映射**：`docs/02-ptq-qat.md` 的校准数据代码；`docs/troubleshooting-index.md` 的模型/导出层最小证据包。
- **覆盖状态**：**新增**。

### QCP-003：ONNX 张量形状未知，量化后仍有大量浮点节点

- **问题/现象**：ONNX Runtime 量化产物生成成功，但 Q/DQ/量化算子覆盖率低，文件或延迟收益很小，部分激活也未进入校准统计。
- **常见原因**：量化前没有做 symbolic/ONNX shape inference；ONNX Runtime 的量化工具在 tensor shape 已知时效果更好。Transformer 更适合 symbolic shape inference。
- **最小诊断证据**：原图与量化图的未知维度；Q/DQ、`QLinear*`、`MatMulNBits` 和残留浮点算子计数；预处理日志；同一输入下各 execution provider 的节点分配。
- **解决/规避方案**：量化前单独运行 `quant_pre_process()`；Transformer 使用 symbolic shape inference，其他模型结合 ONNX shape inference；预处理、量化、验证分步保留产物。
- **适用边界或副作用**：shape inference 不能把 runtime 不支持的算子变成量化算子；ONNX Runtime 文档还指出其原生图优化不能输出大于 2 GB 的模型，大模型需跳过该优化步骤或使用适合的外部流程。
- **一手来源**：[Quantize ONNX models](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html)（ONNX Runtime 官方文档：预处理、shape inference、2 GB 优化限制）。
- **课程映射**：`docs/02-ptq-qat.md` 的 ONNX Runtime pre-processing；`docs/inference-acceleration.md` 的图优化与算子支持。
- **覆盖状态**：**扩展**。

### QCP-004：把图优化塞进量化步骤后，FP 与量化中间张量无法对应

- **问题/现象**：量化精度下降，但逐层误差工具无法稳定匹配原模型和量化模型的权重/激活，敏感层定位停滞。
- **常见原因**：量化过程中同时做融合、节点消除或重写，导致 tensor 名称和图结构变化；ONNX Runtime 官方不推荐在量化步骤内做优化，原因之一就是难以调试精度损失。
- **最小诊断证据**：优化前后节点/张量名称 diff；`qdq_loss_debug` 的匹配失败或缺失清单；浮点、预处理后浮点、量化三份模型及其哈希。
- **解决/规避方案**：先独立预处理并冻结优化后浮点模型，再量化；用 `create_weight_matching`、`modify_model_output_intermediate_tensors`、`collect_activations` 对齐差异；对高误差节点尝试排除量化或更换校准方法。
- **适用边界或副作用**：保存全量中间激活会占用大量内存和磁盘；边缘项目可先按可疑子图/少量样本做定向采集。
- **一手来源**：[Quantize ONNX models — Quantization Debugging](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html#quantization-debugging)（ONNX Runtime 官方文档）。
- **课程映射**：`docs/04-accuracy-repair.md` 的“敏感层分析”和“Runtime 与导出问题”；`docs/troubleshooting-index.md`。
- **覆盖状态**：**扩展**。

### QCP-005：动态量化精度较稳，但端侧小 batch 延迟反而上升

- **问题/现象**：模型变小或精度可接受，但单请求延迟没有改善，短序列/小 batch 甚至比静态量化慢。
- **常见原因**：动态量化在每次 forward 时计算激活 scale/zero-point，这部分在线统计和量化/反量化开销在小工作负载中占比过高。
- **最小诊断证据**：同一模型的 FP、动态量化、静态量化逐层/端到端延迟；输入长度和 batch；图中是否存在运行时量化参数计算；预热后重复测量。
- **解决/规避方案**：输入分布稳定且能准备代表性数据时比较 static PTQ；保留动态量化作为质量优先候选；按真实 batch/序列长度测量，不用大 batch 结果替代端侧单请求。
- **适用边界或副作用**：ONNX Runtime 一般建议 RNN/Transformer 先试动态、CNN 先试静态，但这不是速度保证；静态量化可能因校准不佳损失精度。
- **一手来源**：[Quantize ONNX models — Dynamic and static quantization](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html)（ONNX Runtime 官方文档，明确动态 qparams 带来额外推理成本）。
- **课程映射**：`docs/02-ptq-qat.md` 的“静态量化与动态量化”；`docs/inference-acceleration.md` 的端到端分账。
- **覆盖状态**：**扩展**。

### QCP-006：特定 x86 U8S8 路径发生 16 位中间结果饱和，精度突然下降

- **问题/现象**：ONNX Runtime INT8 模型在 AVX2/AVX512（非 VNNI）x86-64 CPU 上精度显著下降，而浮点或其他数据类型组合正常。
- **常见原因**：该路径为性能使用 `VPMADDUBSW`，中间结果超出 16 位后被饱和截断；官方文档把它限定在相关 U8S8 CPU 路径，并说明 VNNI 与 Arm 不存在同一问题。
- **最小诊断证据**：CPU flags（是否 AVX2/AVX512、是否 VNNI）；activation/weight signedness；QDQ/QOperator 格式；同一评估集上的 U8S8、U8U8、`reduce_range` 对比；逐层激活差异。
- **解决/规避方案**：先按官方建议比较 U8U8；或对相关路径启用 `reduce_range`；保留 S8S8 QDQ 作为默认起点，并用逐层误差确认是否真是饱和而非校准问题。
- **适用边界或副作用**：不要把该结论泛化到所有 CPU/INT8；U8U8 或 7-bit `reduce_range` 的性能与精度仍需目标机复测。
- **一手来源**：[Quantize ONNX models — Data type selection / U8U8](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html)（ONNX Runtime 官方文档）。
- **课程映射**：`docs/02-ptq-qat.md` 的 activation/weight dtype；`docs/04-accuracy-repair.md` 的 runtime 归因。
- **覆盖状态**：**新增**。

### QCP-007：转换成功的“整数模型”仍夹有浮点算子，整数加速器拒绝或回落 CPU

- **问题/现象**：TFLite 文件能够加载，但仅整数硬件不能运行；或 delegate 只接管部分图，端到端延迟远高于预期。
- **常见原因**：默认转换允许没有整数实现的算子保留浮点；浮点输入/输出也会使模型不满足纯整数设备要求。
- **最小诊断证据**：转换器日志与算子列表；输入/输出 dtype；delegate 分区/回退日志；CPU-only 与 delegate 的逐算子或端到端时间。
- **解决/规避方案**：用 `TFLITE_BUILTINS_INT8` 强制纯整数转换并把输入/输出设为 int8/uint8，让不支持算子在转换期失败；随后替换算子、改图或明确保留 CPU fallback。
- **适用边界或副作用**：严格模式提高可部署性但会让原本“可转换”的模型直接报错；是否值得改模型取决于目标 delegate/微控制器的算子集。
- **一手来源**：[TensorFlow Lite post-training quantization — Integer only](https://www.tensorflow.org/lite/performance/post_training_quantization)（TensorFlow 官方文档）。
- **课程映射**：`docs/02-ptq-qat.md` 的 TFLite representative dataset；`docs/inference-acceleration.md` 的 unsupported op/fallback；`docs/troubleshooting-index.md`。
- **覆盖状态**：**扩展**。

### QCP-008：完成 QAT 训练却只保存 fake-quant 模型，文件和推理速度没有低比特收益

- **问题/现象**：QAT 后验证精度改善，但部署模型仍是浮点参数/fake-quant 运算，模型大小与速度几乎不变，或后端无法接管。
- **常见原因**：QAT 的 `prepare` 只插入模拟量化数值的 fake-quant 节点，训练期间并未真正把权重/激活 cast 为低比特；遗漏 `convert` 和后端 lowering。
- **最小诊断证据**：训练 checkpoint 与部署 artifact 分开保存；参数/算子 dtype；图中 fake-quant 与真实 quantize/dequantize 节点；转换前后文件大小；目标后端 delegate/kernel 日志。
- **解决/规避方案**：执行完整 `prepare -> train -> convert -> lower/deploy`；确保 QAT 配方与 PTQ 部署配方产生同一量化结构；在目标后端重新测质量、大小与速度。
- **适用边界或副作用**：QAT 只能适配它模拟的量化数值；若目标 kernel 的粒度、group size、signedness 或 rounding 不一致，训练收益不能直接外推。
- **一手来源**：[Quantization-Aware Training for Large Language Models with PyTorch](https://pytorch.org/blog/quantization-aware-training/)（PyTorch 官方博客，给出 fake quant、`prepare`、`convert` 与 XNNPACK 下放流程）。
- **课程映射**：`docs/02-ptq-qat.md` 的 QAT 工作流；`docs/04-accuracy-repair.md` 的训练式补偿；`docs/inference-acceleration.md` 的 kernel 支持。
- **覆盖状态**：**扩展**。

### QCP-009：少数激活通道离群值把 W8A8 的量化网格拉得过粗

- **问题/现象**：权重量化尚可，但加入 INT8 激活后 PPL/任务精度明显恶化；激活绝大多数值很小，少数固定通道幅值极大。
- **常见原因**：per-tensor 激活范围被离群通道主导，普通值只剩很少有效量化级；这是 SmoothQuant 处理的核心困难。
- **最小诊断证据**：逐层、逐通道激活 `max/p99/p99.9`；离群通道在不同样本中是否持续；W8A16 与 W8A8 A/B；量化前后层输出误差。
- **解决/规避方案**：先试更细粒度/动态激活量化；W8A8 路径可评估 SmoothQuant，把部分难度离线迁移到权重；按层搜索/验证迁移强度并保留敏感层高精度回退。
- **适用边界或副作用**：平滑激活会扩大权重范围，迁移过度可能转而伤害权重量化；只有目标 runtime/kernel 支持该 W8A8 配方时才可能兑现速度。
- **一手来源**：[SmoothQuant: Accurate and Efficient Post-Training Quantization for Large Language Models](https://proceedings.mlr.press/v202/xiao23c.html)（ICML 原始论文）。
- **课程映射**：`docs/02-ptq-qat.md` 的 Outlier 与 clipping；`docs/03-llm-quantization.md` 的 SmoothQuant；`docs/04-accuracy-repair.md`。
- **覆盖状态**：**已有**。可吸收逐通道证据格式和“迁移过度”回归项。

### QCP-010：LLM.int8() 离群阈值不合适，质量与速度朝相反方向变化

- **问题/现象**：阈值较高时质量下降；阈值降低后质量恢复，但 FP16 路径占比、延迟或能耗上升。
- **常见原因**：LLM.int8() 把超过阈值的激活列交给 16-bit 矩阵乘，其余走 INT8；阈值决定“保护多少离群列”，不是无成本精度旋钮。
- **最小诊断证据**：`llm_int8_threshold`；每层/请求被识别为离群的列比例；INT8 与 FP16 kernel 时间；峰值显存；固定评估集质量。
- **解决/规避方案**：从库默认/论文设置起步，小范围扫阈值；把质量、离群列比例和延迟画在同一表；若少数模块异常，可用 skip-module/混合精度而非全局降低阈值。
- **适用边界或副作用**：这是 Transformers/bitsandbytes 的 LLM.int8() 路径，不等同于 GGUF Q8；具体硬件后端是否实现混合精度分解要查其支持表。
- **一手来源**：[LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale](https://arxiv.org/abs/2208.07339)（原始论文）；[LLM.int8() Linear8bitLt reference](https://huggingface.co/docs/bitsandbytes/en/reference/nn/linear8bit)（bitsandbytes 官方文档）。
- **课程映射**：`docs/03-llm-quantization.md` 的 LLM.int8()；`docs/inference-acceleration.md` 的低比特 kernel；`docs/04-accuracy-repair.md`。
- **覆盖状态**：**扩展**。

### QCP-011：从 Q8/Q5 等已量化 GGUF 再压到 Q4，质量严重劣于从 F16/BF16 直量化

- **问题/现象**：目标文件大小看似正确，但 PPL、事实性、格式遵循或重复问题远差于同名 Q4 产物。
- **常见原因**：二次量化在第一轮舍入误差之上再次舍入，丢失的信息不能恢复；llama.cpp 因此把 `--allow-requantize` 设为显式危险选项并警告质量可能严重下降。
- **最小诊断证据**：输入 GGUF 的 tensor types/metadata 与哈希；完整 `llama-quantize` 命令；“F16/BF16 -> Q4”和“Q8/Q5 -> Q4”的 PPL/任务回归；是否使用 `--allow-requantize`。
- **解决/规避方案**：始终保留原始 HF 权重或 F16/BF16 GGUF 作为量化母本；从母本直接生成每个档位；若被迫再量化，至少保护 output tensor 并把结果标记为实验产物。
- **适用边界或副作用**：`COPY` 用于更新/复制 GGUF 不等于再次低比特量化；保护张量会增大文件，仍不能保证修复累积误差。
- **一手来源**：[llama.cpp quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)（项目官方仓库，`--allow-requantize` 警告）。
- **课程映射**：`docs/03-llm-quantization.md` 的 GGUF 量化；`docs/04-accuracy-repair.md` 的 baseline/回退；`docs/troubleshooting-index.md` 的模型来源与哈希。
- **覆盖状态**：**新增**。

### QCP-012：imatrix 用通用连续文本生成，指令/格式任务反而退化

- **问题/现象**：使用 imatrix 后总体 PPL可能改善，但 instruct 模型的对话模板、JSON、工具调用或领域任务没有改善甚至变差。
- **常见原因**：imatrix 依据校准输入的激活平方估计权重重要性；固定长度切块的通用文本不一定代表指令样本边界和任务分布。
- **最小诊断证据**：imatrix 输入语料、token 数、chunk/context 参数与文件哈希；通用 PPL和任务级通过率；无 imatrix、通用 imatrix、任务 imatrix 三组 A/B。
- **解决/规避方案**：为 instruct 模型准备接近真实模板的指令语料；记录 `--chunks`、context、batch 等参数；只在固定评估集证明确有收益后保留 imatrix 产物。
- **适用边界或副作用**：关于 instruct 数据切分的建议来自维护者实现讨论而非稳定 API 契约，属于待复现实验假设；过度任务化也可能损害通用能力。
- **一手来源**：[llama.cpp imatrix README](https://github.com/ggml-org/llama.cpp/blob/master/tools/imatrix/README.md)（项目官方仓库）；[About imatrix overfitting, and importance of input text](https://github.com/ggml-org/llama.cpp/discussions/5263)（维护者/协作者讨论）。
- **课程映射**：`docs/03-llm-quantization.md` 的 imatrix；`docs/04-accuracy-repair.md` 的校准集重构。
- **覆盖状态**：**扩展**。

### QCP-013：KV Cache 量化节省内存，却让短上下文生成更慢

- **问题/现象**：启用 quantized cache 后峰值内存下降，但短 prompt、单会话的 TTFT 或 tokens/s 变差。
- **常见原因**：量化/反量化 cache 本身有开销；当上下文短且显存足够时，节省的访存不足以抵消转换成本。
- **最小诊断证据**：相同权重、prompt、输出长度下普通 cache 与 quantized cache 的峰值内存、TTFT、decode tokens/s；至少短/长两档上下文；cache backend、bit 数与轴配置。
- **解决/规避方案**：只在 KV 内存确为瓶颈时启用；用上下文长度阈值做策略选择；短上下文保留 FP16/BF16 cache，长上下文/OOM 场景再比较量化或 offload。
- **适用边界或副作用**：Hugging Face 文档的结论针对其 `QuantizedCache` 路径；llama.cpp/TensorRT-LLM 的 kernel 与代价不同，必须分别实测。
- **一手来源**：[Cache strategies — Quantized cache](https://huggingface.co/docs/transformers/kv_cache#quantized-cache)（Hugging Face Transformers 官方文档）。
- **课程映射**：`docs/03-llm-quantization.md` 的 KV Cache 量化；`docs/inference-acceleration.md` 的 prefill/decode 分账。
- **覆盖状态**：**扩展**。

### QCP-014：Key 和 Value 沿同一维度低比特量化，长上下文质量明显下降

- **问题/现象**：KV Cache 压到 2/4 bit 后，短文本看似正常，但长文档问答、信息回忆或生成稳定性下降。
- **常见原因**：KIVI 对多种 LLM 的分布研究发现，Key 更适合 per-channel，Value 更适合 per-token；朴素地用同一粒度/轴会让其中一侧的离群分布主导 scale。
- **最小诊断证据**：K/V 分别的 per-channel 与 per-token max/分位数；cache bit 数、group/axis、residual length；随上下文长度变化的 PPL/任务准确率和内存。
- **解决/规避方案**：优先使用明确实现 K/V 非对称粒度的 runtime；若 runtime 只暴露统一 cache dtype，则从 q8/较保守配置开始并做长上下文回归，不直接照搬 2-bit 论文结论。
- **适用边界或副作用**：KIVI 的质量与吞吐结果依赖其算法和硬件友好实现；只改存储 dtype、不具备对应 kernel，不能外推论文收益。
- **一手来源**：[KIVI: A Tuning-Free Asymmetric 2bit Quantization for KV Cache](https://arxiv.org/abs/2402.02750)（原始论文与作者代码入口）。
- **课程映射**：`docs/03-llm-quantization.md` 的 KV Cache 专题；`docs/04-accuracy-repair.md` 的长上下文失败；`docs/inference-acceleration.md`。
- **覆盖状态**：**扩展**。

### QCP-015：ONNX INT4 量化后大部分图没变，原因是算子/权重形态不在支持范围

- **问题/现象**：选择 INT4/UInt4 后只有少数节点变成低比特，文件与性能收益低于预期。
- **常见原因**：当前 ONNX Runtime 官方路径是 block-wise weight-only；`MatMul` 只有常量 B 才量化，`Gather` 只有常量 data 才量化，其他动态权重或算子不会自动变成 INT4 kernel。
- **最小诊断证据**：量化前后 `MatMul`/`Gather` 总数与 `MatMulNBits`/`GatherBlockQuantized` 数量；B/data 是否 initializer；opset；ONNX Runtime 版本；目标 EP 的节点分配和逐算子 profile。
- **解决/规避方案**：先做算子覆盖审计再决定 INT4 路线；把可冻结的权重变为 initializer；仅在语义等价时改图；不支持部分保留更高精度或换后端。
- **适用边界或副作用**：官方文档当前要求 INT4/UInt4 相关 ONNX opset 21；`GatherBlockQuantized` 有 runtime 版本要求。版本会变化，落课前应按锁定版本复核。
- **一手来源**：[Quantize ONNX models — Quantize to Int4/UInt4](https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html#quantize-to-int4uint4)（ONNX Runtime 官方文档）。
- **课程映射**：`docs/02-ptq-qat.md` 的 Int4/UInt4；`docs/inference-acceleration.md` 的低比特算子/kernel；`docs/troubleshooting-index.md`。
- **覆盖状态**：**扩展**。

### QCP-016：PyTorch 剪枝后 checkpoint 仍保存原权重和 mask，部署产物不小也不快

- **问题/现象**：报告显示 50% sparsity，但 `state_dict` 出现 `weight_orig`/`weight_mask`，文件没有按预期缩小，推理仍执行稠密算子。
- **常见原因**：`torch.nn.utils.prune` 默认用重参数化和 forward pre-hook 应用 mask；零值本身不会把 dense tensor 自动变成稀疏存储或稀疏 kernel。
- **最小诊断证据**：`state_dict().keys()`；forward pre-hooks；实际零值比例；导出后算子类型；压缩前后未压缩/压缩文件大小；目标机 kernel profile。
- **解决/规避方案**：导出前用 `prune.remove` 固化权重并移除重参数化；再按目标 runtime 要求转换为其支持的结构化/稀疏格式；分别报告“零值率、磁盘压缩、实际 latency”。
- **适用边界或副作用**：`prune.remove` 只把剪枝永久化，不会自动获得稀疏存储或加速；去掉 mask 后恢复被剪权重需要原 checkpoint。
- **一手来源**：[PyTorch Pruning Tutorial — Remove pruning re-parametrization](https://docs.pytorch.org/tutorials/intermediate/pruning_tutorial.html#remove-pruning-re-parametrization)（PyTorch 官方教程）。
- **课程映射**：`docs/05-compression-distillation.md` 的非结构化剪枝与最小演示；`docs/troubleshooting-index.md` 的模型产物证据。
- **覆盖状态**：**新增**。

### QCP-017：权重满足 2:4 稀疏，但 TensorRT 最终仍选择 dense tactic

- **问题/现象**：稀疏检查通过、builder 开启 sparse weights，实际延迟却不变；verbose 日志中“eligible”层多于真正“chose sparse tactics”的层。
- **常见原因**：TensorRT 的 2:4 有严格布局/精度要求；即使层符合资格，特定 shape 下 dense tactic 仍可能更快，builder 会选择 dense。
- **最小诊断证据**：`polygraphy inspect sparsity`；TensorRT VERBOSE 日志的 eligible/chosen 层；builder sparse flag；层精度（FP16/INT8）、shape；稀疏与 dense engine 的逐层/端到端延迟。
- **解决/规避方案**：按官方 2:4 规则剪枝；启用 sparse flag；以 builder 实际选择和 benchmark 为准，不以全局 sparsity 宣称加速；未选中时保留 dense 或调整模型 shape/结构后重测。
- **适用边界或副作用**：来源把支持边界限定为 NVIDIA Ampere 及以后、TensorRT 支持的 Conv/MatMul 与相应精度；强制 2:4 可能损失精度，通常需要 fine-tuning，且不是所有 Jetson/DLA 路径共享同一限制。
- **一手来源**：[TensorRT Data Formats and Tensors — Sparsity](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/data-formats-tensors.html#sparsity)（NVIDIA 官方文档）。
- **课程映射**：`docs/05-compression-distillation.md` 的结构化稀疏；`docs/inference-acceleration.md` 的 kernel/tactic；`docs/04-accuracy-repair.md` 的训练补偿。
- **覆盖状态**：**扩展**。

### QCP-018：整体 PPL 变化不大，但输出头或 token embedding 低比特导致格式/稀有词退化

- **问题/现象**：总体 PPL 看似可接受，实际却更容易输出错 token、乱码、字段名拼错或专有词退化；更高精度档位正常。
- **常见原因**：输出投影和 token embedding 直接连接词表，可能比平均层误差更敏感；统一把所有 tensor 压到同一低 bit 会掩盖局部敏感性。
- **最小诊断证据**：普通低比特与“保护 output/embedding”变体的 PPL、词表/格式任务通过率、文件大小、tokens/s；逐 tensor 重建误差；完整量化 recipe。
- **解决/规避方案**：用 `--output-tensor-type`、`--token-embedding-type` 或 per-tensor override 保留更高精度；只保护由 A/B 证明确实敏感的 tensor；重新测文件、内存与速度。
- **适用边界或副作用**：提高局部精度会增大文件/内存，未必改善所有模型；乱码也可能来自 tokenizer/chat template，先排除导出链路问题。
- **一手来源**：[llama.cpp quantize README](https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md)（项目官方仓库，提供 output/embedding/per-tensor 精度覆盖选项，并说明保护 output tensor 可能提升质量）。
- **课程映射**：`docs/04-accuracy-repair.md` 的敏感层分析与 mixed precision；`docs/03-llm-quantization.md` 的 GGUF；`docs/troubleshooting-index.md` 的 tokenizer/template 分流。
- **覆盖状态**：**已有**。

## 初步吸收优先级

优先级不是“技术最先进”排序，而是按课程能否快速形成可复查排障闭环排序：

1. **QCP-011 再量化质量损失**：非常容易踩坑，官方工具已有明确警告，加入量化实验前置检查成本低。
2. **QCP-007 浮点回退/纯整数失败**：能把“模型转换成功”和“加速器真正执行”分开，适合作为低比特 kernel 章节的核心案例。
3. **QCP-016 剪枝 mask 未固化**：补齐当前剪枝演示从训练 API 到部署产物之间的关键缺口。
4. **QCP-013 KV Cache 量化短上下文变慢**：能直接纠正“cache 越低比特越快”的直觉，并纳入短/长上下文实验矩阵。
5. **QCP-006 x86 U8S8 饱和**：现象、硬件边界、诊断和回退都很明确，适合做一个平台限定的精度归因案例。

## 证据强度备注

- QCP-001 与 QCP-012 中“instruct 模型应比较 instruct 数据生成的 imatrix”来自 llama.cpp 维护者/协作者讨论，属于**较弱但可操作的工程假设**；正式入课前应在课程 Qwen 模型上做三组 A/B，而不是写成普遍结论。
- 其余记录主要依据官方文档或原始论文；论文中的速度/质量数字未被搬成课程结论，本文只提取算法边界与诊断方向。
