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
          <span>HTML Slides</span>
          <h1>端侧模型量化部署技术专题</h1>
          <p>
            reveal.js 课件以独立页面运行，适合全屏投屏、键盘翻页和浏览器演示。
          </p>
          <div>
            <a className="button button--primary button--lg" href="/slides/deck/index.html">
              打开课件
            </a>
            <Link className="button button--secondary button--lg" to="/docs/intro">
              返回课程书
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
