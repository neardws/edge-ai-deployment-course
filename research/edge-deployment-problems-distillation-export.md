# 边缘部署问题候选资料池：蒸馏与模型导出/转换

> 采集日期：2026-07-10。
>
> 本页是第一阶段互联网检索形成的**候选资料池**，用于后续筛选、复现和课程改写，不是课程结论，也不代表列出的方案已在本课程设备上验证。正文吸收前仍需固定版本、制作最小复现，并在目标设备上回归质量与性能。

## 使用说明

- 来源优先级：原始论文、官方文档、项目仓库或维护者资料；未使用 SEO 聚合文作为证据。
- “最小诊断证据”强调先保存可复查现场，再改变一个变量。
- 覆盖状态：
  - **已有**：指定课程章节已覆盖核心结论，本条主要用于证据补强或避免重复写作。
  - **扩展**：课程已有概念，但缺少平台级诊断、边界或可操作方案。
  - **新增**：指定章节尚未形成对应问题卡。
- 本轨共 24 条：蒸馏 8 条，导出/转换与兼容 16 条；覆盖状态为已有 2、扩展 8、新增 14。

## 一、知识蒸馏

### KD-01：教师更强，学生反而蒸馏得更差

- **问题/现象**：换成参数更多、验证分数更高的教师后，同一学生的验证分数下降或蒸馏损失长期不收敛到原水平。
- **常见原因**：教师与学生容量差距过大，学生没有足够表达能力逼近教师分布；“最强教师”不等于“最适合该学生的教师”。
- **最小诊断证据**：固定学生、数据、温度、损失权重和训练预算，只替换两种容量的教师；同时记录教师任务分数、学生最终分数、训练/验证 KL 与硬标签损失。
- **解决/规避方案**：选择更接近学生容量的教师；或加入中等容量 teacher assistant，做多阶段蒸馏；极端压缩时先重新评估学生下限。
- **适用边界或副作用**：teacher assistant 会增加训练阶段与维护成本；原论文主要在 CNN/ResNet 与图像数据上验证，迁移到 LLM 时应重新做容量阶梯实验，不能直接承诺同等收益。
- **一手来源**：[Improved Knowledge Distillation via Teacher Assistant](https://arxiv.org/abs/1902.03393)（原始论文，AAAI 2020）。
- **课程映射**：`docs/05-compression-distillation.md` → “知识蒸馏”“常见问题”；可转成教师/学生容量阶梯实验卡。
- **覆盖状态**：**扩展**。

### KD-02：教师和学生 tokenizer 不同，逐 token logit 蒸馏无法直接对齐

- **问题/现象**：教师与学生 logits 最后一维不同，KL 无法计算；或强行按 token ID 对齐后损失能算，但语义对应错误、质量异常。
- **常见原因**：两端词表大小、token ID 语义和同一文本的切分位置不同。传统 logit KD 默认输出空间一致，这在跨模型家族时经常不成立。
- **最小诊断证据**：保存双方 tokenizer 名称、版本、词表大小和特殊 token；对 20 条代表性文本同时输出 token 字符串、ID 与序列长度；检查是否真的共享词表，而不是只比较词表大小。
- **解决/规避方案**：优先选共享 tokenizer 的教师/学生；否则改用教师生成文本做 sequence-level KD，或采用有明确词表/序列对齐机制的 cross-tokenizer KD，并单独验证特殊 token 与停止条件。
- **适用边界或副作用**：sequence-level KD 丢失完整软分布；跨词表 optimal-transport 类方法增加显存和计算，并不能免除任务质量回归。
- **一手来源**：[Towards Cross-Tokenizer Distillation: the Universal Logit Distillation Loss for LLMs](https://arxiv.org/abs/2402.12030)（原始论文，TMLR 2025）。
- **课程映射**：`docs/05-compression-distillation.md` → “知识蒸馏”；`docs/transformer-llm-basics.md` → “Token 与 Tokenizer”“Chat Template”。
- **覆盖状态**：**新增**。

### KD-03：温度或蒸馏/硬标签权重不合适，学生只学到一边

- **问题/现象**：软标签损失几乎为零、梯度过小；或蒸馏项压过硬标签，学生模仿教师却在真实标签上退化；不同温度实验不可比较。
- **常见原因**：温度改变了分布熵和梯度尺度；混合 hard/soft target 时遗漏 `T²` 补偿；损失权重只看数值大小，没有看梯度贡献。
- **最小诊断证据**：分别记录 hard CE、KD loss、总损失及两项对学生 logits 的梯度范数；固定随机种子，至少比较 3 个温度和 3 个权重；保存教师分布熵。
- **解决/规避方案**：按经典公式对软目标项乘 `T²`；在固定验证集上联合搜索温度与权重；以任务指标和校准结果选值，不以训练 loss 最小为唯一标准。
- **适用边界或副作用**：该公式直接适用于共享分类输出空间的 logit KD；教师生成文本的 sequence-level KD 不应机械套用同一温度结论。
- **一手来源**：[Distilling the Knowledge in a Neural Network](https://arxiv.org/abs/1503.02531)（原始论文；第 2 节说明温度、加权目标和 `T²` 梯度补偿）。
- **课程映射**：`docs/05-compression-distillation.md` → “知识蒸馏”公式与作业题。
- **覆盖状态**：**已有**。

### KD-04：中间层蒸馏因层数或隐藏维度不同而 shape mismatch

- **问题/现象**：hidden-state MSE 直接报维度错误；不报错时，随意取层对齐也可能让学生质量下降。
- **常见原因**：教师/学生层数、hidden size、head 数和序列对齐方式不同；缺少学生层到教师层的映射以及表示空间投影。
- **最小诊断证据**：打印每个被蒸馏张量的 `[batch, sequence, hidden/head]`；保存层映射表、mask 后有效 token 数、激活范数和每层损失；先用一个 batch 验证 shape 与梯度。
- **解决/规避方案**：明确 `student layer -> teacher layer` 映射；用可学习线性投影把学生 hidden state 映射到教师空间；必要时只蒸馏 attention 或 logits，并做消融。
- **适用边界或副作用**：投影层和多层损失增加训练参数、显存和调参空间；TinyBERT 的具体映射是 BERT 场景设计，不是所有架构的默认最优映射。
- **一手来源**：[TinyBERT: Distilling BERT for Natural Language Understanding](https://arxiv.org/abs/1909.10351)（原始论文；层映射与 hidden-state 线性变换）。
- **课程映射**：`docs/05-compression-distillation.md` → “知识蒸馏”进阶问题卡；可链接 `docs/transformer-llm-basics.md` 的 Transformer block。
- **覆盖状态**：**新增**。

### KD-05：离线固定蒸馏集表现好，自回归生成时错误却逐步放大

- **问题/现象**：教师前缀或参考答案上的 token loss 很低，但学生自由生成时早期错误后开始重复、跑题或长文本崩坏。
- **常见原因**：离线 KD 只训练固定参考/教师序列；推理时学生会访问自己生成的前缀，形成 train-inference distribution mismatch，早期错误会级联。
- **最小诊断证据**：在同一 prompt 上分别用教师前缀、参考前缀和学生自生成前缀计算后续 token loss；按生成位置画错误率或 KL；保存首个分叉 token 后的续写。
- **解决/规避方案**：保留离线基线，同时混入学生 on-policy 序列，让教师对学生实际会到达的状态提供反馈；用 student-data fraction 做从低到高的消融。
- **适用边界或副作用**：on-policy 需要训练期间反复生成与教师评分，成本更高、可复现性更弱；论文结果针对自回归语言模型，分类 KD 不存在相同序列级暴露问题。
- **一手来源**：[On-Policy Distillation of Language Models: Learning from Self-Generated Mistakes](https://arxiv.org/abs/2306.13649)（原始论文，ICLR 2024）；[TRL GKDTrainer documentation](https://github.com/huggingface/trl/blob/main/docs/source/gkd_trainer.md)（维护者文档）。
- **课程映射**：`docs/05-compression-distillation.md` → “蒸馏数据设计”；`docs/transformer-llm-basics.md` → “Decode”。
- **覆盖状态**：**新增**。

### KD-06：在线蒸馏把教师和学生放在同一训练作业后 OOM 或吞吐骤降

- **问题/现象**：学生单独训练能跑，加入教师 forward、在线生成或全词表 logits 后显存溢出；step time 主要花在教师生成/传输而不是学生反向传播。
- **常见原因**：同时驻留教师与学生权重、激活和 `[batch, seq, vocab]` logits；部分 online KD 还更新教师，使计算与优化器状态进一步增加。
- **最小诊断证据**：分别测学生训练、教师只推理和组合训练的峰值显存/step time；记录 logits 张量形状与字节数；确认教师参数是否冻结、是否误建反向图。
- **解决/规避方案**：教师 `eval` + `no_grad`；将教师放到独立设备/服务；分块计算 log-prob、只缓存必要统计或改成离线 sequence KD；在可接受范围内降低教师精度并复验目标质量。
- **适用边界或副作用**：外部教师服务会引入网络与序列化瓶颈；离线缓存会变陈旧且占磁盘；量化教师会改变监督信号。任何“节省倍数”都必须按本地模型和网络实测。
- **一手来源**：[Parameter-Efficient and Student-Friendly Knowledge Distillation](https://arxiv.org/abs/2205.15308)（原始论文，说明 online KD 的额外计算成本）；[huggingface/trl releases](https://github.com/huggingface/trl/releases)（维护者发布说明，包含外部教师与分块/压缩 log-prob 的工程动机）。
- **课程映射**：`docs/05-compression-distillation.md` → “蒸馏不是免费午餐”“蒸馏数据设计”。
- **覆盖状态**：**新增**。

### KD-07：通用域蒸馏完成后，目标业务域仍明显退化

- **问题/现象**：学生在通用验证集接近教师，但到了专利、医疗、设备日志等目标域，教师和学生都下降，或学生相对教师的差距扩大。
- **常见原因**：蒸馏输入没有覆盖目标域；教师也未适配目标域；少量目标域数据无法表达通用教师的完整分布。
- **最小诊断证据**：把评估拆成通用域/目标域和关键子类；同时报告教师、无 KD 同尺寸基线、蒸馏学生；记录词/token 覆盖、长度和错误类型差异。
- **解决/规避方案**：先适配教师，再用目标域数据二次蒸馏；混入原始真实标签并监控通用域遗忘；根据域相似度决定是否值得双阶段蒸馏。
- **适用边界或副作用**：双阶段路线增加训练与教师解码成本；原始证据来自机器翻译，不能把其 BLEU 收益数字外推到本课程的问答/故障诊断任务。
- **一手来源**：[Distill, Adapt, Distill: Training Small, In-Domain Models for Neural Machine Translation](https://aclanthology.org/2020.ngt-1.12/)（原始论文，ACL Workshop 2020）。
- **课程映射**：`docs/05-compression-distillation.md` → “蒸馏数据设计”“任务分布”；最终可进入领域任务第二阶段路线。
- **覆盖状态**：**扩展**。

### KD-08：学生继承教师的幻觉、记忆或其他故障模式

- **问题/现象**：学生平均任务分数提高，但某些幻觉、模板化错误、训练样本复述或敏感输出比例也随之上升。
- **常见原因**：sequence-level KD 把教师输出当监督；教师的优势与错误会一起进入蒸馏集，平均分掩盖了子群风险。
- **最小诊断证据**：同一测试集对教师、蒸馏学生和无 KD 同尺寸基线做错误分类；单列幻觉、长串复述、精确匹配/记忆和低质量子群，不只报平均分。
- **解决/规避方案**：生成后过滤与人工抽检；保留 ground-truth 混合训练；对高风险样本使用多个候选/独立判别器；建立教师与学生共同的安全回归集。
- **适用边界或副作用**：过滤器可能删除困难但有价值的样本；论文直接证据来自神经机器翻译，扩展到通用 LLM 时应把它当风险假设再验证。
- **一手来源**：[Memorization Inheritance in Sequence-Level Knowledge Distillation for Neural Machine Translation](https://aclanthology.org/2025.acl-short.61/)（原始论文，ACL 2025）。
- **课程映射**：`docs/05-compression-distillation.md` → “防止学生学习教师错误”“常见问题”；可接最终报告质量风险表。
- **覆盖状态**：**已有**。

## 二、PyTorch / ONNX 导出

### PX-01：含数据依赖 `if/loop` 的 PyTorch 模型无法完整导出

- **问题/现象**：导出报 `Could not guard on data-dependent expression`、graph break，或只固化了样例输入走过的一条分支。
- **常见原因**：Python `if`/循环条件依赖 Tensor 值；AOT 导出不能把任意 Python 控制流保留为单一可部署图。
- **最小诊断证据**：用 `report=True` 保存导出报告和完整栈；把失败缩到只含该分支的最小模块；用正/负两组输入证明是否需要保留两条分支。
- **解决/规避方案**：确需动态分支时改写为 `torch.cond()`；业务允许时显式专门化一条分支并把适用条件写入模型契约；再检查目标 runtime 是否支持对应 ONNX 控制流。
- **适用边界或副作用**：`torch.cond` 对分支签名、输入输出类型和副作用有约束，相关 API 仍在演进；专门化会牺牲其他输入路径。
- **一手来源**：[Export a model with control flow to ONNX](https://docs.pytorch.org/tutorials/beginner/onnx/export_control_flow_model_to_onnx_tutorial.html)（PyTorch 官方教程）；[`torch.cond` documentation](https://docs.pytorch.org/docs/stable/higher_order_ops/cond.html)（官方 API 文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → 模型格式/unsupported；`docs/inference-acceleration.md` → 图优化层。
- **覆盖状态**：**新增**。

### PX-02：导出的 ONNX 只能接受示例输入尺寸

- **问题/现象**：导出和样例推理成功，换 batch、序列长度或图像尺寸就报 shape 错；或动态输入能跑但图优化/融合减少。
- **常见原因**：导出器默认记录样例 Tensor 的静态 shape；未设置 `dynamic_shapes`，或形状约束写得过窄/过宽；非 Tensor 参数被硬编码。
- **最小诊断证据**：查看 ONNX 输入的 `dim_value/dim_param` 和导出报告中的 range constraints；至少用最小、常用、最大三组 shape 跑 source/ONNX 对齐；保存失败 shape。
- **解决/规避方案**：在当前 `dynamo=True` 路径使用 `dynamic_shapes` 明确真正变化的维；保留可静态的维；用代表性 shape 集做回归，而不是把所有维都标动态。
- **适用边界或副作用**：动态轴会妨碍部分 shape inference 和图融合，也会扩大后端 profile/内存规划空间；不能把“更灵活”默认当成“更快”。
- **一手来源**：[`torch.onnx` documentation](https://docs.pytorch.org/docs/stable/onnx.html)（PyTorch 官方文档）；[ONNX Runtime Transformer optimization](https://onnxruntime.ai/docs/performance/transformers-optimization.html)（官方文档，说明动态轴会阻塞部分优化）。
- **课程映射**：`docs/06-runtime-deployment.md` → “dynamic shape”；`docs/inference-acceleration.md` → 图优化层。
- **覆盖状态**：**扩展**。

### PX-03：PyTorch 算子没有 ONNX 翻译，导出停在 `No decompositions registered`

- **问题/现象**：导出报告列出 unsupported ATen/custom op；更换 opset 仍失败。
- **常见原因**：导出器没有该算子的 decomposition/ONNX 实现；自定义 PyTorch op 只有 eager kernel，没有 ONNX 语义；或形状推断缺失。
- **最小诊断证据**：`report=True` 保存首个失败 op、FX target、来源模块和栈；用最小输入单独导出该 op；确认目标 runtime 是否已有等价标准 op 或 custom op 支持。
- **解决/规避方案**：优先改写/分解为标准算子；否则用 ONNX Script 和 `custom_translation_table` 注册翻译；需要 custom domain 时同步实现并注册目标 runtime kernel。
- **适用边界或副作用**：自定义 op 降低跨 runtime 可移植性；必须维护类型/shape 推断和版本契约，不能以“导出文件生成了”代替运行验证。
- **一手来源**：[Extending the ONNX Exporter Operator Support](https://docs.pytorch.org/tutorials/beginner/onnx/onnx_registry_tutorial.html)（PyTorch 官方教程）；[torch.export-based ONNX Exporter](https://docs.pytorch.org/docs/stable/onnx_export.html)（官方故障报告说明）。
- **课程映射**：`docs/06-runtime-deployment.md` → “unsupported op”；`docs/inference-acceleration.md` → 图优化与 kernel。
- **覆盖状态**：**扩展**。

### OX-01：ONNX opset 与目标 parser/runtime 不兼容

- **问题/现象**：ONNX checker 通过，但 TensorRT、移动 runtime 或旧 ORT 报不支持某个 operator version；直接改 opset 数字后结果错误。
- **常见原因**：opset 不只是文件版本号，算子 schema/语义会演进；导出端选择的 opset 高于消费端覆盖，或自定义 domain 的 opset 没有注册。
- **最小诊断证据**：保存模型 `opset_import`、失败节点的 domain/op/version、`onnx.checker` 结果和目标 runtime 支持矩阵/parser 日志。
- **解决/规避方案**：以目标 runtime 支持范围决定导出 opset；确需升降级时使用 ONNX version converter，并在转换后做 source/target 数值回归；不能手改数字冒充转换。
- **适用边界或副作用**：ONNX version converter 在缺少必要适配器时会直接失败；降级可能没有等价语义，最终仍需改图或升级 runtime。
- **一手来源**：[ONNX Versioning](https://onnx.ai/onnx/repo-docs/Versioning.html)（ONNX 官方规范）；[`onnx.version_converter`](https://onnx.ai/onnx/api/version_converter.html)（官方 API 文档）；[TensorRT Architecture Overview](https://docs.nvidia.com/deeplearning/tensorrt/latest/architecture/architecture-overview.html)（NVIDIA 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → “模型格式”“Runtime 选型”；排障索引可新增 opset 契约字段。
- **覆盖状态**：**新增**。

### OX-02：大 ONNX 的 external data 丢失，模型文件在但权重加载失败

- **问题/现象**：转换机上能加载，复制到另一目录/设备后报 external initializer 越界、找不到数据文件；只看到一个很小的 `.onnx` 却误以为模型完整。
- **常见原因**：权重保存在外部文件，`location` 是相对模型目录的路径；发布时只复制主 protobuf，或重命名/拆包破坏 offset、length 与配套文件。大于 2 GB 的 checker 调用方式也不同。
- **最小诊断证据**：枚举每个 TensorProto 的 `data_location/external_data`；保存主文件与外部数据文件清单、大小和 hash；对大模型用路径调用 `onnx.checker.check_model()`。
- **解决/规避方案**：把 `.onnx` 与 external data 作为同一原子制品发布；保持相对位置或用 `load_external_data_for_model()` 指定目录；生成 manifest/hash 并在目标机检查后再加载。
- **适用边界或副作用**：external data 解决序列化/大文件问题，但增加多文件分发、缓存失效和完整性管理成本；不同消费端仍需确认其 external-data 支持。
- **一手来源**：[External Data — ONNX documentation](https://onnx.ai/onnx/repo-docs/ExternalData.html)（ONNX 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → 模型准备与“不提交大型模型”；`docs/troubleshooting-index.md` → 模型完整性最小证据包。
- **覆盖状态**：**新增**。

### OX-03：ONNX 成功加载，但输出与 PyTorch 数值不对齐

- **问题/现象**：结构和 shape 正常，任务输出却漂移；只测试一个样例时看不出，边界 shape 或长序列才失败。
- **常见原因**：导出前模型仍处于训练模式；随机/状态算子；算子 decomposition 或 dtype 改变；应用侧预后处理不同；容差设置与 dtype 不匹配。
- **最小诊断证据**：固定 seed 和输入语料，保存 PyTorch/ONNX 原始 tensor；报告 max/mean absolute error、relative error 和任务指标；必要时比较中间值定位首个分叉节点；覆盖多种 shape。
- **解决/规避方案**：导出前显式 `model.eval()`；使用 `verify=True` 或 `verify_onnx_program()`；从第一个分叉算子排查；把 tokenizer/图像预处理与输出后处理纳入同一回归脚本。
- **适用边界或副作用**：不同后端与低精度不要求 bitwise 一致，容差必须按 dtype 和业务阈值定义；放宽容差不能替代任务质量回归。
- **一手来源**：[`torch.onnx` documentation](https://docs.pytorch.org/docs/stable/onnx.html)（官方导出参数与模式说明）；[`torch.onnx.verification`](https://docs.pytorch.org/docs/stable/onnx_verification.html)（官方数值验证 API）。
- **课程映射**：`docs/06-runtime-deployment.md` → “模型转换成功不代表部署成功”；`docs/troubleshooting-index.md` → 质量层证据包。
- **覆盖状态**：**新增**。

## 三、ONNX Runtime 与 TensorRT

### ORT-01：ONNX Runtime 能跑但加速器只接走部分节点，性能反而差

- **问题/现象**：注册了 CUDA/OpenVINO/CoreML 等 Execution Provider，模型仍接近 CPU 速度；日志出现 CPU 节点，或 GPU/CPU 之间频繁搬运。
- **常见原因**：EP 只声明其支持的节点/子图，其余会按优先级回落到 CPU；NHWC 来源图转 ONNX NCHW 时还可能插入额外 Transpose，进一步破坏融合。
- **最小诊断证据**：保存 `get_providers()` 与 provider options；打开 verbose log/profiling 查看每个节点放置；用 Netron/优化图统计 Transpose；对比 CPU-only 与目标 EP 的延迟。
- **解决/规避方案**：确认安装的是含目标 EP 的包并固定 provider 顺序；改写 unsupported op、消除无效 layout 转换；必要时选择覆盖更完整的 EP/runtime，而不是接受静默回落。
- **适用边界或副作用**：禁用 CPU fallback 会把性能暗坑变成硬错误，利于验收但降低兼容性；NCHW/NHWC 最优选择与设备相关，不能一概而论。
- **一手来源**：[ONNX Runtime Execution Providers](https://onnxruntime.ai/docs/execution-providers/)（官方架构文档）；[ONNX Runtime performance troubleshooting](https://onnxruntime.ai/docs/performance/tune-performance/troubleshooting.html)（官方排障文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → ONNX provider/fallback；`docs/inference-acceleration.md` → 图优化、layout 与数据搬运。
- **覆盖状态**：**扩展**。

### TRT-01：TensorRT 动态输入缺少或超出 optimization profile

- **问题/现象**：含 `-1` 的 ONNX 无法构建 engine；运行 shape 超出范围时报错；profile 范围过宽时 engine 内存大、某些 tactic 消失，首个新 shape 延迟尖峰。
- **常见原因**：动态维要求 build 时提供 min/opt/max；执行 context 未选 profile/设置实际 shape；宽范围会改变 tactic 可用性与资源规划。
- **最小诊断证据**：保存 `trtexec` 的 min/opt/max、build log、profile 数与 engine 大小；记录失败实际 shape；分别测 profile 切换后的首轮与稳定轮延迟。
- **解决/规避方案**：按真实负载簇建立有界 profile；`opt` 放在高频 shape；运行前设置匹配 profile 和输入 shape；shape/profile 切换后预热。
- **适用边界或副作用**：多个 profile 增加构建时间与 engine/运行内存；`MIN != OPT != MAX` 时部分 tactic 可能不可用，因此“一个超宽 profile”不一定最省事。
- **一手来源**：[Dynamic Shapes: Core Concepts](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/dynamic-shapes-basics.html)（NVIDIA 官方文档，说明 profile 的 min/opt/max 范围与运行时选择）；[Optimizing TensorRT Performance](https://docs.nvidia.com/deeplearning/tensorrt/latest/performance/optimization.html)（NVIDIA 官方文档，说明输入 shape 变化后的状态更新与预热开销）。
- **课程映射**：`docs/06-runtime-deployment.md` → TensorRT/dynamic shape；`docs/inference-acceleration.md` → runtime 与图优化层。
- **覆盖状态**：**扩展**。

### TRT-02：TensorRT ONNX parser 找不到算子实现或 plugin

- **问题/现象**：`trtexec --onnx` 报 `getPluginCreator() could not find Plugin ...`、某输入必须是 initializer，engine 无法生成。
- **常见原因**：parser 没有该 ONNX op 的 importer；插件未编译/注册或版本/namespace 不匹配；本应是常量的输入没有被 constant folding。
- **最小诊断证据**：保存完整 parser error、失败 node 名/domain/opset 和插件 registry；对照目标 TensorRT 的 operator support；用 Polygraphy/Netron 检查该节点输入是否常量。
- **解决/规避方案**：先做安全的 constant folding；从源模型改写为受支持标准图；必要时实现并注册 Plugin V3，或在导出阶段把 op 分解为已有 TensorRT 算子。
- **适用边界或副作用**：plugin 增加编译、版本、平台和安全审计成本，也可能无法落到 DLA；常量折叠后仍须数值回归，不能只看 parser 通过。
- **一手来源**：[Understanding TensorRT Error Messages](https://docs.nvidia.com/deeplearning/tensorrt/latest/reference/troubleshooting-error-messages.html)（NVIDIA 官方排障文档）；[TensorRT Capabilities](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/capabilities.html)（官方插件/算子入口）。
- **课程映射**：`docs/06-runtime-deployment.md` → unsupported op/kernel；`docs/troubleshooting-index.md` → runtime 层证据包。
- **覆盖状态**：**扩展**。

### TRT-03：TensorRT FP16/INT8 engine 更快，但出现 Inf/NaN 或精度骤降

- **问题/现象**：FP32/ONNX Runtime 正常，TensorRT 低精度输出溢出、分类翻转或误差集中在 Softmax/Reduce/归一化附近。
- **常见原因**：FP16 表示范围有限，累加可能溢出；敏感非线性放大小误差；INT8 rounding/clamping 和不代表业务分布的 calibration 共同造成漂移。
- **最小诊断证据**：用 Polygraphy 比较 ORT 与 TensorRT 中间层；开启 NaN/Inf 验证；保存每层误差、engine precision 与 calibration 数据摘要；同时报告任务指标。
- **解决/规避方案**：对敏感层保留 FP32/BF16 或用强类型/显式 cast；重新选择有代表性的 calibration 数据；逐层缩小精度范围，而不是全网盲目回退。
- **适用边界或副作用**：混合精度会损失部分速度和内存收益；具体敏感层取决于模型和数据，官方示例不是固定黑名单。
- **一手来源**：[TensorRT Accuracy Considerations](https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/accuracy-considerations.html)（NVIDIA 官方文档）；[Improving Model Accuracy](https://docs.nvidia.com/deeplearning/tensorrt/10.x.x/performance/accuracy-builder.html)（官方诊断清单）。
- **课程映射**：`docs/06-runtime-deployment.md` → TensorRT precision；`docs/inference-acceleration.md` → mixed precision/kernel；质量风险表。
- **覆盖状态**：**新增**。

## 四、LiteRT、Core ML 与 OpenVINO

### LRT-01：LiteRT 转换因不支持的 TensorFlow op 失败，或运行时报 unresolved custom op

- **问题/现象**：converter 说明某 op 不可转换；设置 `allow_custom_ops` 后文件生成，但默认 Interpreter 报 `Encountered unresolved custom op`；启用 Select TF Ops 后 APK/AAR 明显变大。
- **常见原因**：LiteRT built-in op 集小于完整 TensorFlow；Select TF Ops 还要求客户端链接相应 TensorFlow op runtime；自定义 op 只写进模型并不等于已有执行实现。
- **最小诊断证据**：保存 converter 的 unsupported-op 列表、FlatBuffer op 清单和运行时报错；记录 built-in/Select/custom 三种构建的 app 二进制大小与启动日志。
- **解决/规避方案**：优先把图改写成 built-in ops；无法改写时在 Select TF Ops 与自定义 op 间按包体/维护成本选择；Select 路线同步添加运行依赖，自定义路线实现并注册 kernel；可做 selective build。
- **适用边界或副作用**：Select TF Ops 增加二进制并可能限制标准分发/runtime 选项；custom op 降低可移植性；某 op 名被接受也不代表所有输入输出 dtype 都支持。
- **一手来源**：[Select TensorFlow operators — LiteRT](https://ai.google.dev/edge/litert/conversion/tensorflow/ops_select)（Google 官方文档）；[Custom operators — LiteRT](https://ai.google.dev/edge/litert/conversion/tensorflow/ops_custom)（官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → LiteRT conversion/op coverage；移动端路线图。
- **覆盖状态**：**新增**。

### LRT-02：启用 LiteRT GPU/NPU delegate 后比 CPU 还慢

- **问题/现象**：模型“启用了 GPU”，但日志提示部分 op 无法由 delegate 处理；实测延迟高于 CPU-only，或模型因 dtype 不匹配完全回到 CPU。
- **常见原因**：delegate 只接管支持的子图，CPU/GPU 分区之间同步和内存复制抵消加速；delegate 支持的 bit-width/op version 与模型不匹配。
- **最小诊断证据**：用 `benchmark_model` 分别测 CPU 与 delegate；保存 `op code ... cannot be handled` 警告、委派分区数量、初始化/稳定延迟和内存；在真实目标设备测试。
- **解决/规避方案**：改写造成切图的 op，让可委派子图更连续；比较其他 delegate；若分区成本更高则显式使用 CPU；把 delegate 可用性与 fallback 写入设备兼容矩阵。
- **适用边界或副作用**：支持范围随设备、驱动、模型 dtype 而变；部分切图不一定必然变慢，必须由目标机基准决定，不能只看“delegate 已创建”。
- **一手来源**：[LiteRT GPU delegates](https://ai.google.dev/edge/litert/performance/gpu?hl=en)（Google 官方文档，含部分图回落警告）；[Implementing a LiteRT delegate](https://ai.google.dev/edge/litert/performance/implementing_delegate?hl=en)（官方分区与复制开销说明）。
- **课程映射**：`docs/06-runtime-deployment.md` → delegate/backend/fallback；`docs/inference-acceleration.md` → 数据搬运与 kernel 覆盖。
- **覆盖状态**：**扩展**。

### CML-01：Core ML 动态输入配置不合法或实际 shape 超出范围

- **问题/现象**：转换到 `mlprogram` 时因 unbounded `RangeDim` 报错；固定 shape 模型在另一分辨率/序列长度上无法运行；灵活 shape 首次运行或内存不可控。
- **常见原因**：未在转换时声明 flexible input；对 ML Program 使用无上界范围；默认 shape、枚举 shape 与业务输入不一致。
- **最小诊断证据**：保存转换参数与 Core ML spec 的输入 shape；分别测试 default/min/max 和越界 shape；记录编译/首轮/稳定延迟与峰值内存。
- **解决/规避方案**：已知常用尺寸时使用 `EnumeratedShapes`；连续变化时使用有现实上界的 `RangeDim` 并设置合理 default；在转换阶段声明，不到发布末期再补注解。
- **适用边界或副作用**：枚举 shape 更利于优化但限制输入集合；更宽范围提高灵活性却减少编译优化机会，并把最终上限交给设备内存。
- **一手来源**：[Flexible Input Shapes — Core ML Tools](https://apple.github.io/coremltools/docs-guides/source/flexible-inputs.html)（Apple 官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → Core ML/mobile dynamic shape；部署链路检查表。
- **覆盖状态**：**新增**。

### CML-02：Core ML 模型能运行，但图像结果错误或与 PyTorch 差很多

- **问题/现象**：类别整体错位、颜色相关任务异常，或 app 与 Python 端预测不一致；换模型精度仍无改善。
- **常见原因**：RGB/BGR、NCHW/NHWC、`[0,1]`/`[0,255]`、mean/std、scale/bias 不一致；预处理既被固化进 `ImageType` 又在 app 做了一次；输入类型默认为 `MLMultiArray` 而应用按图像使用。
- **最小诊断证据**：对一张固定图保存原始像素、送入源模型的预处理 tensor 与 Core ML 实际输入契约；检查 `ImageType` color layout、shape、scale、bias；分别关闭 app/模型预处理做单变量比较。
- **解决/规避方案**：只保留一处预处理；在 `ImageType` 中明确 color layout、scale、bias，或把完整 per-channel 归一化固化进模型图；用 `predict()` 与设备端同一输入做回归。
- **适用边界或副作用**：Core ML `ImageType` 使用全局 scale，不能精确表达任意逐通道 std；对数值敏感模型应把精确归一化留在模型图，代价是多一些算子。
- **一手来源**：[Image Input and Output — Core ML Tools](https://apple.github.io/coremltools/docs-guides/source/image-inputs.html)（Apple 官方文档）；[Core ML Tools Getting Started](https://apple.github.io/coremltools/docs-guides/source/introductory-quickstart.html)（官方转换后预测验证）。
- **课程映射**：`docs/06-runtime-deployment.md` → Core ML 模型契约；`docs/troubleshooting-index.md` → 质量层最小证据包。
- **覆盖状态**：**新增**。

### OV-01：OpenVINO 转换遇到未映射的框架/自定义算子

- **问题/现象**：`openvino.convert_model`/frontend 报某 op 无转换规则；即使 IR 能表示自定义节点，目标 plugin 仍可能没有执行实现。
- **常见原因**：来源框架 op 不在当前 frontend 支持表；用户自定义 op 缺少“框架语义 -> OpenVINO op”的映射，或 OpenVINO 侧也缺执行语义/kernel。
- **最小诊断证据**：保存失败 op、来源框架、输入输出类型/shape、OpenVINO 版本和 supported-operations 对照；构造只含该 op 的最小模型；区分转换失败还是设备 compile 失败。
- **解决/规避方案**：优先升级到已支持该 op 的版本或在源图分解为标准 op；一对一映射用 `OpExtension`，复杂分解用 `ConversionExtension`；真正自定义 op 还需注册运行时实现。
- **适用边界或副作用**：扩展同时带来转换与运行维护成本；Python 自定义执行路径有设备限制，不能据此宣称 GPU/NPU 可用；类型不匹配不会自动插入转换。
- **一手来源**：[OpenVINO Frontend Extensions](https://docs.openvino.ai/2025/documentation/openvino-extensibility/frontend-extensions.html)（Intel 官方文档）；[OpenVINO Extensibility Mechanism](https://docs.openvino.ai/2025/documentation/openvino-extensibility.html)（官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → OpenVINO/op coverage；`docs/inference-acceleration.md` → kernel/backend 边界。
- **覆盖状态**：**新增**。

### OV-02：OpenVINO 输入 layout、颜色或 mean/scale 错误，输出无报错但质量异常

- **问题/现象**：模型编译和推理均成功，但预测系统性错误；手写预处理耗时高或不同应用实现不一致。
- **常见原因**：应用提供 `U8 NHWC BGR`，模型期望 `FP32 NCHW RGB`；漏做/重复做 resize、mean、scale；动态空间维时没有明确 resize 目标；操作顺序不同。
- **最小诊断证据**：保存用户 tensor 与模型输入的 dtype/shape/layout/color；打印 `PrePostProcessor` 配置；用一张 golden image 比较每个预处理阶段和最终输出。
- **解决/规避方案**：在 `PrePostProcessor` 中分别声明用户 tensor 与模型 layout，显式添加颜色转换、resize、mean/scale，再把步骤集成进图；需要时序列化含预处理的 IR。
- **适用边界或副作用**：动态 H/W 时自动 resize 不知道目标尺寸，必须显式指定；mean/scale 和颜色转换的顺序影响数值；集成到设备侧后仍需与原框架回归。
- **一手来源**：[Optimize Preprocessing — OpenVINO](https://docs.openvino.ai/2023.3/openvino_docs_OV_UG_Preprocessing_Overview.html)（Intel 官方文档）；[Layout API Overview](https://docs.openvino.ai/2025/openvino-workflow/running-inference/optimize-inference/optimize-preprocessing/layout-api-overview.html)（官方文档）。
- **课程映射**：`docs/06-runtime-deployment.md` → 模型格式/输入契约；`docs/troubleshooting-index.md` → 质量层；`docs/inference-acceleration.md` → layout/data movement。
- **覆盖状态**：**新增**。

## 建议优先吸收的 5 条

1. **KD-02 cross-tokenizer 蒸馏**：现有课程强调 tokenizer 契约，但没有说明 logit KD 还要求输出空间可对齐，容易形成“loss 能算就正确”的隐蔽错误。
2. **PX-01 数据依赖控制流**：错误信息明确、可做极小复现，适合作为“训练代码不等于可导出计算图”的第一张问题卡。
3. **OX-02 ONNX external data**：直接关系到模型制品完整性，能接入课程已有 hash/文件清单证据包。
4. **TRT-01 动态 shape profile**：把课程中的泛化 `dynamic shape` 补成 min/opt/max、tactic、内存和预热的可执行诊断。
5. **LRT-02 delegate 部分回落**：能把“启用 GPU/NPU”与“整图得到加速”拆开，适合移动端路线图和性能排障。

## 证据边界与待复现项

- 本池没有把厂商性能数字写成课程结论，也没有给出硬件/版本的泛化速度承诺。
- **KD-01、KD-07、KD-08** 的直接实验域分别以图像分类或机器翻译为主；其中机制可作为课程问题假设，但吸收为 LLM/边缘部署结论前必须复现。
- **KD-06** 的“外部教师、分块/压缩 log-prob”等方案部分来自维护者发布说明，属于可信工程入口，但不等于对本课程模型的收益保证。
- PyTorch、TensorRT、LiteRT、Core ML 和 OpenVINO 的 API/算子覆盖会随版本变化；正文应记录“本课程验证版本 + 最小复现”，不要复制无版本的永久结论。
- 检索中发现 LLM 蒸馏关于 forward/reverse KL 的机制解释存在后续论文争议，因此本轮未把“某个 KL 方向普遍更优”收入问题卡；后续若要加入，应并列对照 [MiniLLM](https://arxiv.org/abs/2306.08543) 与 [Rethinking Kullback-Leibler Divergence in Knowledge Distillation for Large Language Models](https://arxiv.org/abs/2404.02657)，并以本课程任务消融为准。
