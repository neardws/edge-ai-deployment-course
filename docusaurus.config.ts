import {themes as prismThemes} from 'prism-react-renderer';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: '端侧模型量化部署技术专题',
  tagline: '从问题框架、量化方法到端侧部署链路的工程化课程',
  favicon: 'img/edge-ai-mark.svg',

  future: {
    v4: true,
  },

  url: 'https://edge-ai-deployment-course.pages.dev',
  baseUrl: '/',
  organizationName: 'neardws',
  projectName: 'edge-ai-deployment-course',
  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/neardws/edge-ai-deployment-course/tree/main/',
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  markdown: {
    mermaid: true,
  },

  stylesheets: [
    {href: '/vendor/katex/katex.min.css', type: 'text/css'},
  ],

  themes: ['@docusaurus/theme-mermaid'],

  themeConfig: {
    image: 'img/edge-ai-course-hero.png',
    colorMode: {
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: true,
      },
    },
    navbar: {
      title: '端侧 AI 部署课程',
      logo: {
        alt: 'Edge AI course mark',
        src: 'img/edge-ai-mark.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'courseSidebar',
          position: 'left',
          label: '课程书',
        },
        {to: '/slides', label: 'HTML 课件', position: 'left'},
        {
          href: 'https://github.com/neardws/edge-ai-deployment-course',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: '课程导读',
              to: '/docs/intro',
            },
            {
              label: '实作环境',
              to: '/docs/lab-ubuntu-nvidia',
            },
          ],
        },
        {
          title: 'Slides',
          items: [
            {
              label: 'HTML 课件',
              to: '/slides',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/neardws/edge-ai-deployment-course',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} neardws. Course content licensed under CC BY 4.0. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
