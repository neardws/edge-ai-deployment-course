# Course PPT Reference Downloads

Downloaded public slide decks for redesigning the HTML course deck. Most classic course materials are distributed as PDF slide decks rather than editable PPT files.

| File | Pages | Source | Why Keep |
| --- | ---: | --- | --- |
| `mit-65940-lec05-quantization-i.pdf` | 70 | MIT 6.5940 / EfficientML.ai, Lecture 5 | Quantization course pacing, visual density, formula-to-example flow |
| `mit-65940-lec06-quantization-ii.pdf` | 82 | MIT 6.5940 / EfficientML.ai, Lecture 6 | More quantization methods and hardware-aware framing |
| `mit-65940-lec09-knowledge-distillation.pdf` | 84 | MIT 6.5940 / EfficientML.ai, Lecture 9 | Distillation structure and teacher-student diagrams |
| `mit-65940-lec10-mcunet.pdf` | 93 | MIT 6.5940 / EfficientML.ai, Lecture 10 | TinyML / MCU deployment story and device constraints |
| `mit-65940-lec12-transformers-and-llm.pdf` | 90 | MIT 6.5940 / EfficientML.ai, Lecture 12 | Transformer/LLM teaching structure |
| `mit-65940-lec13-llm-deployment.pdf` | 93 | MIT 6.5940 / EfficientML.ai, Lecture 13 | LLM deployment, serving, memory, and runtime framing |
| `mit-65940-lec14-llm-post-training.pdf` | 94 | MIT 6.5940 / EfficientML.ai, Lecture 14 | Post-training and alignment section design |
| `mit-65940-lec15-long-context-llm.pdf` | 78 | MIT 6.5940 / EfficientML.ai, Lecture 15 | Long-context and KV-cache style material |
| `song-han-model-compression-efficient-ai-computing.pdf` | 65 | MIT AI Hardware Program / Song Han | Compact overview of compression, TinyML, LLM efficiency |
| `mlsys-2024-atom-low-bit-llm-serving.pdf` | 31 | MLSys 2024 presentation slides | LLM serving quantization figures and weight/activation framing |
| `uw-eep596-tinyml-spring24-slides.pdf` | 17 | University of Washington EE P 596 TinyML | Course positioning, syllabus, project-heavy structure |
| `tinyml-foundation-peter-ing-quantization.md` | 44 | tinyML Foundation / Peter Ing deck, parsed through Jina Reader | TinyML definition, AI/ML/DL map, edge/cloud/things, MCU/MPU, sensors, Edge Impulse workflow |

## HarvardX / TinyML Selected Slides

The full HarvardX/TinyML ZIP is 249 MB. Instead of adding the whole bundle, selected directly relevant PDFs were downloaded into `harvardx-tinyml-selected/`.

| Area | Files | Why Keep |
| --- | --- | --- |
| TinyML fundamentals and challenges | `1-2-4-*`, `1-3-*`, `2-6-2-*` | TinyML = embedded systems + ML, compute/memory/storage limits, software fragmentation, model growth, compression toolbox |
| Deploying TinyML | `4-1-6-*`, `4-3-*`, `4-4-*` | Deployment workflow, embedded hardware/software stack, TFLite Micro, Tensor Arena, OpsResolver |
| Sensors and product risks | `4-8-2-*`, `4-9-*` | Sensor ecosystem, privacy, security, monitoring after deployment |

Not downloaded:

- `MLSysBook-TinyML-All.zip`: useful, but it is 249 MB and mostly duplicates the selected PDFs above. Pull only if we need every HarvardX course slide.
- tinyML Foundation Peter Ing original PDF binary: source is valid, but local curl, Python, Node, in-app browser, direct `--resolve` to `3.20.252.12`, and public CORS proxy attempts all failed with TLS/connection-closed or 4xx/522 errors. The same 44-page PDF content was saved as parsed Markdown via Jina Reader and has been integrated into slides 241-288.
