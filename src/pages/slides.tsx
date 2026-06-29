import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import type {ReactNode} from 'react';

import styles from './slides.module.css';

export default function Slides(): ReactNode {
  return (
    <Layout
      title="HTML 课件"
      description="端侧模型量化部署技术专题 reveal.js slide deck">
      <main className={styles.launchPage}>
        <section className={styles.launchPanel}>
          <h1>HTML 课件</h1>
          <p>
            reveal.js 课件以独立页面运行，适合全屏投屏、键盘翻页和浏览器演示。课程书用于系统阅读，课件用于课堂节奏和重点回顾。
          </p>
          <div className={styles.actions}>
            <a className="button button--primary button--lg" href="/slides/deck/index.html">
              打开 reveal.js 课件
            </a>
            <Link className="button button--secondary button--lg" to="/docs/intro">
              返回课程导读
            </Link>
          </div>
          <ul className={styles.notes}>
            <li>全屏投屏时使用浏览器原生全屏。</li>
            <li>课件内容和课程书并行维护，正文细节以课程书为准。</li>
            <li>新增或调整章节后，应同步检查课件目录和讲授顺序。</li>
          </ul>
        </section>
      </main>
    </Layout>
  );
}
