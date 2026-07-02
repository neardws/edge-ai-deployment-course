import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    {
      type: 'category',
      label: '导读',
      collapsed: false,
      items: [
        'intro',
        'start-here',
        'student-run-coverage',
        'course-hours',
        'slides-day-flow',
        'environment-matrix',
        'glossary',
        'math-conventions',
        'report-template',
        'troubleshooting-index',
        'instructor-guide',
        'part-technical-outline',
        'self-study-granularity',
        'source-comparison',
        'course-review-feedback',
      ],
    },
    {
      type: 'category',
      label: 'Part I 前置知识与工具链',
      collapsed: false,
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
      collapsed: false,
      items: [
        'framework',
        'jetson-deployment',
      ],
    },
    {
      type: 'category',
      label: 'Part III 量化与压缩',
      collapsed: false,
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
      collapsed: false,
      items: [
        'finetuning-lora',
        'lab-qwen-lora-finetuning',
      ],
    },
    {
      type: 'category',
      label: 'Part V Runtime 与推理加速',
      collapsed: false,
      items: [
        'inference-acceleration',
        'runtime-deployment',
        'lab-profiling',
      ],
    },
    {
      type: 'category',
      label: 'Part VI Ubuntu / Jetson / 移动端实作',
      collapsed: false,
      items: [
        'lab-ubuntu-nvidia',
        'lab-jetson-setup',
        'lab-qwen-baseline',
        'lab-qwen-quantization',
        'lab-inference-acceleration',
        'lab-local-service',
        'sample-logs',
      ],
    },
    {
      type: 'category',
      label: 'Part VII VLM、Agent 与最终复盘',
      collapsed: false,
      items: [
        'vlm-agent',
        'cases-qa',
        'final-project',
        'example-final-report',
        'reference-map',
        'similar-courses',
        'raw-reference-intake',
      ],
    },
  ],
};

export default sidebars;
