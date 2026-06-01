import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  courseSidebar: [
    'intro',
    {
      type: 'category',
      label: '课程书主线',
      collapsed: false,
      items: [
        'framework',
        'ptq-qat',
        'llm-quantization',
        'accuracy-repair',
        'compression-distillation',
        'runtime-deployment',
        'vlm-agent',
        'cases-qa',
      ],
    },
    {
      type: 'category',
      label: 'Ubuntu/Qwen 实作',
      collapsed: false,
      items: [
        'lab-ubuntu-nvidia',
        'lab-qwen-baseline',
        'lab-qwen-quantization',
        'lab-profiling',
        'lab-local-service',
      ],
    },
  ],
};

export default sidebars;
