import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    {
      type: 'category',
      label: '导读',
      items: [
        'intro',
        'course-hours',
        'part-technical-outline',
        'self-study-granularity',
        'source-comparison',
      ],
    },
    {
      type: 'category',
      label: 'Part I 前置知识与工具链',
      items: [
        'prerequisites',
        'ml-inference-basics',
        'transformer-llm-basics',
        'quantization-math-basics',
        'linux-gpu-toolchain',
      ],
    },
    {
      type: 'category',
      label: 'Part II 端侧部署问题框架',
      items: [
        'framework',
        'jetson-deployment',
      ],
    },
    {
      type: 'category',
      label: 'Part III 量化与压缩',
      items: [
        'ptq-qat',
        'llm-quantization',
        'accuracy-repair',
        'compression-distillation',
      ],
    },
    {
      type: 'category',
      label: 'Part IV 模型微调与数据适配',
      items: [
        'finetuning-lora',
        'lab-qwen-lora-finetuning',
      ],
    },
    {
      type: 'category',
      label: 'Part V Runtime 与推理加速',
      items: [
        'inference-acceleration',
        'runtime-deployment',
        'lab-profiling',
      ],
    },
    {
      type: 'category',
      label: 'Part VI Ubuntu / Jetson / 移动端实作',
      items: [
        'lab-ubuntu-nvidia',
        'lab-jetson-setup',
        'lab-qwen-baseline',
        'lab-qwen-quantization',
        'lab-inference-acceleration',
        'lab-local-service',
      ],
    },
    {
      type: 'category',
      label: 'Part VII VLM、Agent 与最终复盘',
      items: [
        'vlm-agent',
        'cases-qa',
        'final-project',
        'reference-map',
        'similar-courses',
      ],
    },
  ],
};

export default sidebars;
