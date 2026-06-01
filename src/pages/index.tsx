import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import type {ReactNode} from 'react';

import styles from './index.module.css';

function HomepageHeader(): ReactNode {
  const heroImage = useBaseUrl('/img/edge-ai-course-hero.png');

  return (
    <header className={styles.hero}>
      <div className={styles.heroCopy}>
        <Heading as="h1">端侧模型量化部署技术专题</Heading>
        <p>
          面向真实设备的模型量化、压缩与部署课程书。内容以工程判断为主线，
          配套 Ubuntu Server、NVIDIA GPU 和 Qwen 小模型实作。
        </p>
        <div className={styles.heroActions}>
          <Link className="button button--primary button--lg" to="/docs/intro">
            阅读课程书
          </Link>
          <Link className="button button--secondary button--lg" to="/slides">
            打开 HTML 课件
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="https://github.com/neardws/edge-ai-deployment-course">
            GitHub
          </Link>
        </div>
      </div>
      <img className={styles.heroImage} src={heroImage} alt="" />
    </header>
  );
}

export default function Home(): ReactNode {
  return (
    <Layout
      title="端侧模型量化部署技术专题"
      description="端侧 AI 模型量化、压缩、推理框架和部署链路课程">
      <HomepageHeader />
      <main className={styles.main}>
        <section className={styles.summaryGrid} aria-label="Course summary">
          <div>
            <span className={styles.kicker}>Course Book</span>
            <Heading as="h2">从方法理解到可运行实作</Heading>
            <p>
              课程书把量化、压缩、蒸馏、runtime 选型和 profiling 放回同一个目标：
              让模型在目标设备上稳定达到业务可用标准。每个核心概念都会对应图示、
              代码片段、实验任务和验收结果。
            </p>
          </div>
          <div className={styles.metrics}>
            <div><strong>Book</strong><span>图文课程书</span></div>
            <div><strong>Lab</strong><span>Ubuntu/Qwen 实作</span></div>
            <div><strong>Slides</strong><span>HTML 课件</span></div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
