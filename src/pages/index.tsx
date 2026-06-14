import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import type {ReactNode} from 'react';

import styles from './index.module.css';

const courseStats = [
  ['52 学时', '完整课程版本'],
  ['6 个实作', 'Ubuntu / Jetson / Qwen'],
  ['3 类交付', '课程书、课件、实验材料'],
];

const learningTracks = [
  {
    title: '概念判断',
    body: '先建立端侧部署问题框架，明确模型能力、设备约束、延迟、显存、功耗和体验指标。',
  },
  {
    title: '量化压缩',
    body: '再比较 PTQ、QAT、LLM 量化、KV Cache、精度修复和蒸馏压缩的适用边界。',
  },
  {
    title: '实作验证',
    body: '最后用 Ubuntu Server、NVIDIA GPU、Qwen 小模型和本地 API 服务跑出可复现实验记录。',
  },
];

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
        <dl className={styles.courseStats}>
          {courseStats.map(([value, label]) => (
            <div key={value}>
              <dt>{value}</dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className={styles.heroVisual} aria-hidden="true">
        <img className={styles.heroImage} src={heroImage} alt="" />
        <div className={styles.pipelinePanel}>
          <span>Deployment path</span>
          <strong>模型选择 → 量化 → Profiling → 本地服务</strong>
        </div>
      </div>
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
        <section className={styles.trackSection} aria-label="Learning tracks">
          <Heading as="h2">维护和学习都按同一条链路推进</Heading>
          <div className={styles.trackList}>
            {learningTracks.map((track, index) => (
              <article key={track.title} className={styles.trackItem}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <Heading as="h3">{track.title}</Heading>
                <p>{track.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </Layout>
  );
}
