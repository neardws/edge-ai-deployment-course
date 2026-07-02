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
            一日企业技术培训版课件，吸收 MIT、MLSysBook、TinyML、Arm 与 Microsoft EdgeAI
            等课程资料后，按端侧 LLM / 小模型量化、压缩与部署工程大纲重构；当前包含 240
            页主线课件和 48 页参考课程堆料。
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
