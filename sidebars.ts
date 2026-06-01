import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    {
      type: 'category',
      label: '导读',
      collapsed: false,
      items: [
        'intro',
        'course-hours',
        'source-comparison',
      ],
    },
    {
      type: 'category',
      label: 'Part I 前置知识',
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
      label: 'Part III 量化与压缩方法',
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
      label: 'Part IV 推理加速与 Runtime',
      collapsed: false,
      items: [
        'inference-acceleration',
        'runtime-deployment',
        'lab-profiling',
      ],
    },
    {
      type: 'category',
      label: 'Part V Ubuntu / Jetson 实作',
      collapsed: false,
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
      label: 'Part VI 案例复盘与扩展路线',
      collapsed: false,
      items: [
        'vlm-agent',
        'cases-qa',
        'reference-map',
        'similar-courses',
      ],
    },
  ],
};

export default sidebars;
