"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const chapters = ["开场", "认识平台", "Mermaid", "Plan", "UltraGoal", "Browser", "CodeReview", "Debugger", "总结"];

const flowV1 = `flowchart LR
  A[上传 3D 文件] --> B[生成预览]
  B --> C[人工审核]
  C --> D[发布资产]`;

const flowV2 = `flowchart TD
  A[上传 GLB / FBX] --> B{格式与大小合法?}
  B -->|否| X[拒绝并说明原因]
  B -->|是| C{版本是否重复?}
  C -->|是| Y[提示覆盖或新建版本]
  C -->|否| D[转换与生成缩略图]
  D --> E{转换成功?}
  E -->|否| R[重试 / 进入修复队列]
  E -->|是| F[3D 在线预览]
  F --> G{审核通过?}
  G -->|否| H[退回修改]
  G -->|是| I[发布到仿真资产库]`;

type CommandProps = { title: string; children: string; onCopy: (value: string) => void };

function Command({ title, children, onCopy }: CommandProps) {
  return (
    <div className="prompt-card">
      <div><span>{title}</span><button onClick={() => onCopy(children)}>复制示例</button></div>
      <pre>{children}</pre>
    </div>
  );
}

type CapabilityProps = {
  purpose: string;
  when: string;
  input: string;
  action: string;
  human: string;
  output: string;
};

function Capability({ purpose, when, input, action, human, output }: CapabilityProps) {
  return (
    <div className="capability-anatomy">
      <div><small>01 · 它的功能</small><strong>{purpose}</strong></div>
      <div><small>02 · 什么时候用</small><span>{when}</span></div>
      <div><small>03 · 你要提供</small><span>{input}</span></div>
      <div><small>04 · AI 会执行</small><span>{action}</span></div>
      <div><small>05 · 人类控制点</small><span>{human}</span></div>
      <div><small>06 · 最后得到</small><span>{output}</span></div>
    </div>
  );
}

export default function Home() {
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState(chapters[0]);
  const [flowStep, setFlowStep] = useState(0);
  const [angle, setAngle] = useState(0);
  const [testStatus, setTestStatus] = useState<"idle" | "running" | "passed">("idle");
  const [copied, setCopied] = useState(false);
  const wheelLock = useRef(false);
  const transitionLock = useRef(false);
  const transitionTimers = useRef<number[]>([]);
  const timers = useRef<number[]>([]);

  const go = useCallback((next: number) => {
    if (transitionLock.current) return;
    const safe = Math.max(0, Math.min(chapters.length - 1, next));
    if (safe === scene) return;
    const nextDirection = safe > scene ? 1 : -1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDirection(nextDirection);
    if (safe === 2) setFlowStep(0);
    if (safe === 5) { setTestStatus("idle"); setAngle(0); }
    if (reduceMotion) { setScene(safe); return; }

    transitionLock.current = true;
    transitionTimers.current.forEach(window.clearTimeout);
    transitionTimers.current = [];
    setTransitionLabel(chapters[safe]);
    setTransitioning(true);
    transitionTimers.current.push(window.setTimeout(() => setScene(safe), 330));
    transitionTimers.current.push(window.setTimeout(() => {
      setTransitioning(false);
      transitionLock.current = false;
    }, 720));
  }, [scene]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) { event.preventDefault(); go(scene + 1); }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); go(scene - 1); }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(chapters.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, scene]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest(".scrollable")) return;
      if (wheelLock.current || Math.abs(event.deltaY) < 30) return;
      wheelLock.current = true;
      go(scene + (event.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => { wheelLock.current = false; }, 850);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, scene]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* preview may deny clipboard */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1100);
  };

  useEffect(() => {
    timers.current.forEach(window.clearTimeout);
    timers.current = [];

    if (scene === 2) {
      timers.current.push(window.setTimeout(() => setFlowStep(1), 950));
      timers.current.push(window.setTimeout(() => setFlowStep(2), 1900));
      timers.current.push(window.setTimeout(() => setFlowStep(3), 2850));
    }

    if (scene === 5) {
      timers.current.push(window.setTimeout(() => setTestStatus("running"), 180));
      timers.current.push(window.setTimeout(() => setAngle(1), 900));
      timers.current.push(window.setTimeout(() => setAngle(2), 1450));
      timers.current.push(window.setTimeout(() => setAngle(3), 2000));
      timers.current.push(window.setTimeout(() => setTestStatus("passed"), 2550));
    }

    return () => timers.current.forEach(window.clearTimeout);
  }, [scene]);

  useEffect(() => () => {
    transitionTimers.current.forEach(window.clearTimeout);
    timers.current.forEach(window.clearTimeout);
  }, []);

  const lessonClass = direction > 0 ? "lesson lesson-next" : "lesson lesson-prev";
  const progress = `${((scene + 1) / chapters.length) * 100}%`;
  const assetInfo = ["PUMP-204", "离心泵总成", "v3.2", "待审核"];

  return (
    <main className="guide">
      <div className="paper-grain" />
      <header className="topbar">
        <button className="wordmark" onClick={() => go(0)}><b>C</b><span>Codex小技巧</span></button>
        <span>方向键 / 滚轮 / 点击章节</span>
      </header>

      <nav className="chapter-rail" aria-label="章节导航">
        {chapters.map((title, index) => <button key={title} className={index === scene ? "active" : index < scene ? "done" : ""} onClick={() => go(index)}><b>{index + 1}</b><span>{title}</span></button>)}
      </nav>

      <section className="stage" aria-live="polite">
        {transitioning && <div className={`soft-wipe ${direction > 0 ? "forward" : "backward"}`} aria-hidden="true"><i /><i /><i /><b>{transitionLabel}</b></div>}

        {scene === 0 && (
          <article className={`${lessonClass} cover`}>
            <div className="cover-copy">
              <div className="overline">FROM PROMPT TO PROOF · CODEX</div>
              <h1>Codex小技巧<span className="case-title">用一个 3D 仿真资产管理网站，读懂 AI 开发闭环</span></h1>
              <p>这不是命令清单。六个技巧分别解决理解偏差、实施返工、长任务失忆、真实环境差异、审查盲区和根因不确定。</p>
              <div className="cover-thesis"><b>核心作用</b><span>让理解可见，让执行可恢复，让结果有证据。</span></div>
              <button className="primary" onClick={() => go(1)}>从资产生命周期开始 <b>→</b></button>
            </div>
            <div className="cover-product" aria-hidden="true">
              <div className="cover-ui-head"><i/><i/><i/><span>Simulation Asset Hub</span></div>
              <div className="cover-ui-body">
                <aside><b>SA</b><span>资产库</span><span>版本</span><span>审核</span></aside>
                <section><div className="cover-model"><div className="iso-cube"><i className="front"/><i className="right"/><i className="top"/></div><span>3D PREVIEW</span></div><div className="cover-meta"><small>PUMP-204</small><h3>离心泵总成</h3><p>GLB · 42.8 MB · v3.2</p><div><b>已审核</b><span>12 个版本</span></div></div></section>
              </div>
              <div className="cover-caption"><small>贯穿案例</small><b>上传 → 转换 → 预览 → 审核 → 发布</b></div>
            </div>
          </article>
        )}

        {scene === 1 && (
          <article className={`${lessonClass} brief`}>
            <div className="section-no">00 · 先理解案例</div>
            <div className="statement"><h2>“管理 3D 资产”听起来简单，<br /><span>背后其实是一整条生命周期。</span></h2><p>一个资产不只是模型文件，还包括贴图、缩略图、版本、审核记录和发布状态。</p></div>
            <div className="platform-brief">
              <div className="asset-definition"><small>什么是一个 3D 仿真资产？</small><h3>文件 + 数据 + 流程</h3><div className="asset-stack"><span><b>01</b>GLB / FBX 模型</span><span><b>02</b>贴图与材质</span><span><b>03</b>名称、标签、尺寸</span><span><b>04</b>版本与审核记录</span><span><b>05</b>发布到仿真环境</span></div></div>
              <div className="lifecycle"><small>核心流程</small>{[["上传","技术美术提交模型"],["转换","生成统一格式与缩略图"],["预览","浏览器检查模型和贴图"],["审核","负责人通过或退回"],["发布","进入正式仿真资产库"]].map(([t,d],i)=><div key={t}><b>0{i+1}</b><span><strong>{t}</strong><em>{d}</em></span></div>)}</div>
              <div className="capability-route"><small>六个技巧真正减少的风险</small><div><b>Mermaid</b><span><strong>理解可见</strong><em>减少需求误解</em></span></div><div><b>Plan</b><span><strong>决策成形</strong><em>减少实施返工</em></span></div><div><b>UltraGoal</b><span><strong>执行可恢复</strong><em>防止长任务失忆</em></span></div><div><b>Browser</b><span><strong>接入真实环境</strong><em>消除“看起来正确”</em></span></div><div><b>CodeReview</b><span><strong>引入独立反方</strong><em>暴露作者盲区</em></span></div><div><b>Debugger</b><span><strong>建立因果证据</strong><em>避免试错式修复</em></span></div></div>
            </div>
            <div className="plain-note"><b>给小白的比喻</b><span>平台像一个 3D 模型仓库：每个模型有身份证、历史版本、质检记录和正式上架状态。</span></div>
          </article>
        )}

        {scene === 2 && (
          <article className={`${lessonClass} mermaid-scene`}>
            <div className="section-no">01 · MERMAID</div>
            <div className="statement"><h2>Mermaid 不是为了画图，<br /><span>而是把 AI 的隐形假设摊在桌面上。</span></h2><p>在代码还是零改动时发现误解，代价最低。流程图让人类可以直接批注异常、权限和状态流转。</p></div>
            <Capability
              purpose="把模型脑中的理解外化为共同模型，让误解可以被看见和纠正"
              when="需求有多个状态、异常和角色，继续写代码会放大理解偏差时"
              input="相关代码范围、业务规则、需要标出的异常与权限"
              action="读取文字与代码，画出 v1；根据人工批注补齐分支并迭代 v2"
              human="审阅流程图，补充异常、权限和业务规则；确认 v2 后才允许改代码"
              output="Mermaid 源码、可视流程图，以及仍需人类确认的问题"
            />
            <div className="mermaid-layout">
              <div className="mermaid-left">
                <Command title="直接这样问" onCopy={copy}>{"不要修改代码。先把 3D 资产从上传、转换、预览、审核到发布的流程输出为 Mermaid；标出格式校验、重复版本、转换失败和权限分支。"}</Command>
                <div className="iteration-steps" aria-label="Mermaid 自动迭代过程">
                  {[["1","AI 画出 v1","先看它怎样理解"],["2","人类 Review","指出缺少失败与权限分支"],["3","补充规则","加入重复版本、重试和退回"],["4","确认 v2","再同步 Plan 和代码"]].map(([n,t,d],i)=><div key={n} className={flowStep===i?"active":flowStep>i?"done":""}><b>{n}</b><span><strong>{t}</strong><small>{d}</small></span></div>)}
                </div>
              </div>
              <div className="mermaid-right">
                <div className="editor-tabs"><b className={flowStep<2?"active":""}>AI 初稿 v1</b><b className={flowStep>=2?"active":""}>人工调整后 v2</b><span>{flowStep>=2?"分支完整":"待人工审阅"}</span></div>
                <pre>{flowStep>=2?flowV2:flowV1}</pre>
                <div className={`simple-flow ${flowStep>=2?"complete":""}`}><span>上传</span><i>→</i><span className="diamond">校验</span><i>→</i><span>转换</span><i>→</i><span>预览</span><i>→</i><span>{flowStep>=2?"通过 / 退回":"发布"}</span></div>
                {flowStep===1&&<div className="human-comment">人类批注：转换失败呢？版本重复呢？谁可以发布？</div>}
              </div>
            </div>
            <div className="recommendation"><b>正确顺序</b><span>AI 画图 → 人类审阅 → 补规则 → AI 按最佳实践调整 → 定稿后再修改 Plan、代码与测试。</span></div>
          </article>
        )}

        {scene === 3 && (
          <article className={`${lessonClass} plan-scene`}>
            <div className="section-no">02 · PLAN × 流程图</div>
            <div className="statement"><h2>Plan 不是任务清单，<br /><span>而是开工前的决策边界。</span></h2><p>Mermaid 决定业务必须怎样流转；Plan 决定改哪些模块、按什么顺序、如何验收以及哪里可能失败。</p></div>
            <Capability
              purpose="把已确认的业务行为压缩成范围、依赖、风险和验收合同"
              when="需求跨多个模块，任何遗漏都会造成返工或无法判断是否完成时"
              input="确认后的流程图、仓库现状、约束、优先级与成功标准"
              action="把业务节点映射为模块、步骤、依赖、风险与测试，再等待人工调整"
              human="调整范围、顺序、风险和验收标准；确认计划后再开始实现"
              output="需求摘要、验收条件、实施步骤、风险和验证方法"
            />
            <div className="plan-spread">
              <div className="plan-prompt"><Command title="Plan 示例" onCopy={copy}>{'$plan --direct "根据确认后的 3D 资产生命周期流程图制定开发计划；包含资产库、上传、转换、在线预览、版本、权限、审核、测试和验收。"'}</Command><div className="plan-tip"><b>Plan 最少要有</b><span>模块与边界</span><span>开发顺序和依赖</span><span>失败与回滚策略</span><span>可以验证的完成标准</span></div></div>
              <div className="plan-paper"><small>3D 仿真资产平台 · 开发计划</small>{[["01","资产库与元数据","列表、搜索、标签、版本状态"],["02","上传与转换管线","分片上传、格式校验、异步转换"],["03","浏览器 3D 预览","模型、材质、尺寸和旋转查看"],["04","审核与权限","提交、退回、批准、发布审计"],["05","测试与验收","unit + API + Browser E2E + 性能"]].map(([n,t,d])=><div key={n}><b>{n}</b><span><strong>{t}</strong><em>{d}</em></span></div>)}</div>
              <div className="plan-link"><span>流程图规则变化</span><i>→</i><span>Plan 同步模块与测试</span><i>→</i><b>再开始改代码</b></div>
            </div>
          </article>
        )}

        {scene === 4 && (
          <article className={`${lessonClass} compare-scene`}>
            <div className="section-no">03 · GOAL VS OMX ULTRAGOAL</div>
            <div className="statement"><h2>Goal 记住“要完成什么”，<br /><span>UltraGoal 记住“如何持续证明完成”。</span></h2><p>真正差别不是速度，而是恢复能力：UltraGoal 把复杂项目写入 brief、子目标和 ledger，中断后仍能继续。</p></div>
            <Capability
              purpose="Goal 保持单一结果不丢失；UltraGoal 把复杂执行变成可恢复、可审计的项目账本"
              when="任务跨设计、开发、测试、性能和 Review，无法在一次对话内可靠完成时"
              input="目标、范围、约束、质量门，以及可以证明完成的证据"
              action="拆解子目标，持续执行设计、开发、测试与性能排查，并记录检查点"
              human="批准目标和质量门；外部写入、高风险或破坏性动作仍由人授权"
              output="Goal 状态；或 UltraGoal 的 brief、子目标、ledger 与最终质量报告"
            />
            <div className="comparison">
              <div className="compare-card native"><div className="compare-title"><span>Codex 原生</span><h3>Goal</h3></div><p>像一张验收目标卡。适合范围清楚、步骤少、当前线程可以完成的任务。</p><Command title="平台里的用法" onCopy={copy}>{"创建 Goal：为资产列表增加标签筛选，并用浏览器测试证明 URL、筛选结果和空状态正确。"}</Command><ul><li>一个目标</li><li>一个成功标准</li><li>由当前线程持续推进</li></ul><div className="fit">适合：标签筛选、单个 Bug、小功能</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">本教程推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>UltraGoal</h3></div><p>像项目经理加任务账本。大任务拆成多个可恢复子目标，每一步都有验证证据。</p><Command title="平台里的用法" onCopy={copy}>{'omx ultragoal create-goals --brief "开发 3D 仿真资产管理网站：UX 设计、资产 API、上传转换、3D 预览、版本审核、文档、E2E、性能与代码 Review"'}</Command><ul><li>设计 → 实现 → 输出 → 测试</li><li>失败后从检查点继续</li><li>最终质量门包含验证与独立 Review</li></ul><div className="fit strong">适合：完整平台、性能排查、长任务自动化</div></div>
            </div>
            <div className="recommendation coral"><b>建议</b><span>一个小改动用 Goal；只要涉及多个阶段、自动化测试或性能排查，就优先用 OMX UltraGoal。</span></div>
          </article>
        )}

        {scene === 5 && (
          <article className={`${lessonClass} browser-scene`}>
            <div className="section-no">04 · BROWSER PLUGIN</div>
            <div className="statement"><h2>Browser 不是自动点击器，<br /><span>而是把代码结论接到真实环境。</span></h2><p>只有真实页面、真实登录态和明确断言都通过，“功能完成”才从推测变成证据。</p></div>
            <Capability
              purpose="关闭代码与用户可见结果之间的现实差距，留下可复查证据"
              when="功能依赖真实 DOM、登录状态、交互结果或外部文档写入时"
              input="目标网址、已授权的登录状态、操作步骤和断言"
              action="搜索、点击、旋转、提交并读取页面状态；经授权后也可写入飞书文档"
              human="授权登录态与外部写入，定义断言，并复核截图和页面结果"
              output="页面结果、截图或断言证据，以及经授权创建的在线文档"
            />
            <div className="browser-sequence">
              <section className="browser-phase test-phase">
                <div className="phase-heading"><b>01</b><span><strong>先验证网站</strong><small>自动执行搜索、预览、旋转、提交和断言</small></span></div>
                <div className="browser-spread">
                  <div className="browser-instruction"><Command title="Browser 测试提示词" onCopy={copy}>{"打开本地 3D 资产网站；搜索 PUMP-204，进入详情，旋转模型确认预览可用，提交审核，并断言状态从“草稿”变成“待审核”。"}</Command><div className="test-log"><small>AUTOMATION STEPS · 自动推进</small><span className={testStatus!=="idle"?"done":"active"}>1. 搜索 PUMP-204</span><span className={angle>=1?"done":""}>2. 打开 3D 预览</span><span className={angle>=2?"done":""}>3. 旋转检查模型</span><span className={angle>=3?"done":""}>4. 读取元数据</span><span className={testStatus==="passed"?"done":""}>5. 断言测试通过</span></div></div>
                  <div className="mini-browser"><div className="mini-bar"><i/><i/><i/><span>localhost:3000/assets/PUMP-204</span></div><div className="asset-app"><aside><div className="asset-row active"><b>P</b><span>离心泵</span></div><div className="asset-row"><b>R</b><span>机械臂</span></div><div className="asset-row"><b>W</b><span>自动仓库</span></div></aside><section><div className="viewer"><div className={`model-proxy angle-${angle}`}><i className="front"/><i className="back"/><i className="right"/><i className="left"/><i className="top"/><i className="bottom"/><span/></div><div className="viewer-grid"/>{testStatus==="passed"&&<em>✓ 预览测试通过</em>}</div><div className="asset-meta"><small>{assetInfo[0]}</small><h3>{assetInfo[1]}</h3><p>GLB · 42.8 MB · {assetInfo[2]}</p><div><span>状态</span><b>{testStatus==="passed"?"待审核":"草稿"}</b></div><div><span>贴图</span><b>8 / 8 正常</b></div><div><span>三角面</span><b>124,860</b></div></div></section></div></div>
                </div>
              </section>
              <section className="browser-phase docs-phase">
                <div className="phase-heading"><b>02</b><span><strong>再沉淀文档</strong><small>把验证结果写入已授权的飞书云文档</small></span></div>
                <div className="docs-compact"><Command title="飞书文档提示词" onCopy={copy}>{"读取资产库中本周新增、待审核和转换失败的 3D 资产；打开飞书云文档，生成《仿真资产周报》，包含资产清单、风险、负责人和下周计划。"}</Command><div className="permission-note"><b>注意</b><span>写入真实飞书需要登录状态和明确授权。</span></div><div className="doc-page"><small>仿真资产周报 · Week 28</small><h3>3D Asset Operations</h3><p>本周新增 42 个资产，已审核 31 个，转换失败 3 个。</p><h4>需要关注</h4><div className="doc-table"><span>PUMP-204 <b>已审核</b></span><span>ROBOT-018 <b>待审核</b></span><span>WH-031 <b>贴图缺失</b></span></div><em>Browser 已完成录入与校对</em></div></div>
              </section>
            </div>
          </article>
        )}

        {scene === 6 && (
          <article className={`${lessonClass} compare-scene review-compare`}>
            <div className="section-no">05 · REVIEW VS OMX CODEREVIEW</div>
            <div className="statement"><h2>CodeReview 不是再读一遍代码，<br /><span>而是引入独立反方与合并门槛。</span></h2><p>作者容易验证“它能工作”；独立 reviewer 和 architect 会主动寻找“它为什么不该合并”。</p></div>
            <Capability
              purpose="用独立实现审查与架构反证，暴露作者上下文中的盲区"
              when="功能准备合并、风险较高，或 UltraGoal 进入最终质量门时"
              input="代码 diff、原始需求、架构约束和应该通过的测试"
              action="reviewer 检查实现与测试，architect 检查边界；按严重级别整理证据"
              human="判断哪些发现必须修复，复核证据，并作出是否合并的最终决定"
              output="严重级别、file:line 证据、修复建议，以及合并结论"
            />
            <div className="comparison">
              <div className="compare-card native"><div className="compare-title"><span>Codex 快速入口</span><h3>Review</h3></div><p>检查一个文件或一段 diff，快速找明显 Bug、性能问题和测试缺口。</p><Command title="平台里的用法" onCopy={copy}>{"/review 检查本次 3D 文件上传逻辑，重点看文件校验、权限、错误处理和测试。"}</Command><ul><li>速度快</li><li>适合开发中的小改动</li><li>结论依赖当前审查上下文</li></ul><div className="fit">适合：边写边检查</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">合并前推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>CodeReview</h3></div><p>独立 code-reviewer 与 architect 两条视角，按严重级别输出 file:line 证据和合并建议。</p><Command title="平台里的用法" onCopy={copy}>{"调用 OMX CodeReview，审查 3D 资产上传与转换分支：检查安全、正确性、性能、可维护性、测试和架构边界。"}</Command><ul><li>reviewer：代码、测试与风险</li><li>architect：存储与转换边界</li><li>输出 APPROVE / COMMENT / REQUEST CHANGES</li></ul><div className="fit strong">适合：PR 合并、UltraGoal 最终质量门</div></div>
            </div>
            <div className="review-example"><b>本平台发现的 HIGH 问题</b><span>上传 ZIP 未防止路径穿越，并把 2GB 文件完整读入内存。</span><em>api/assets/upload.ts:71 · REQUEST CHANGES</em></div>
          </article>
        )}

        {scene === 7 && (
          <article className={`${lessonClass} debug-scene`}>
            <div className="section-no">06 · DEBUGGER</div>
            <div className="statement"><h2>Debugger 不是试一个修复，<br /><span>而是建立从症状到根因的因果链。</span></h2><p>修好一次不等于知道原因。稳定复现、环境对照和回归测试共同证明修复不是巧合。</p></div>
            <Capability
              purpose="把模糊症状转化为可以被证伪、被证明、被回归保护的因果解释"
              when="Bug 偶发、环境相关，或团队已经尝试过多个猜测式修复时"
              input="症状、期望行为、复现线索、日志和最近变更"
              action="稳定复现、比较环境差异、验证假设、实施最小修复并补回归测试"
              human="确认复现条件与修复边界，审阅根因证据，避免扩大改动范围"
              output="复现步骤、根因证据、最小补丁和防止复发的回归测试"
            />
            <div className="debug-spread">
              <div><Command title="Debugger 提示词" onCopy={copy}>{"使用 debugger 智能体调查：WH-031 在 Windows 正常，但部署到 Linux 后 3D 预览变黑。先稳定复现，不要先改代码；输出时间线、根因、最小修复和回归测试。"}</Command><div className="debug-analogy"><b>像侦探一样工作</b><span>症状：模型变黑</span><span>证据：只有 Linux 失败</span><span>根因必须能被测试证明</span></div></div>
              <div className="timeline"><small>DEBUG TRACE · WH-031</small>{[["T+00","读取 glTF 材质","baseColorTexture","ok"],["T+12","请求 BaseColor.PNG","Windows 200","ok"],["T+13","Linux 区分大小写","basecolor.png 404","bad"],["FIX","上传时规范化贴图名","重写 glTF URI","good"],["TEST","三种系统运行 30 组资产","30 / 30 通过","good"]].map(([t,e,r,s])=><div key={t} className={s}><b>{t}</b><span>{e}</span><em>{r}</em></div>)}</div>
            </div>
            <div className="debug-chain"><span>稳定复现</span><i>→</i><span>比较环境差异</span><i>→</i><span>证明根因</span><i>→</i><span>最小修复</span><i>→</i><b>跨平台回归</b></div>
          </article>
        )}

        {scene === 8 && (
          <article className={`${lessonClass} summary-scene`}>
            <div className="section-no">07 · 现在你会选了</div>
            <div className="summary-title"><h2>六个小技巧，<br /><span>解决六种不同的开发失真。</span></h2><p>先判断风险发生在理解、决策、执行、现实、审查还是因果层，再选对应能力。</p></div>
            <div className="summary-list">{[["Mermaid","理解偏差","产物：一张人类确认过的共同流程模型"],["Plan","实施模糊","产物：带风险和验收标准的决策合同"],["OMX UltraGoal","长任务失忆","产物：可恢复的目标、ledger 与质量门证据"],["Browser","真实环境差异","产物：页面状态、断言、截图或授权文档"],["OMX CodeReview","作者审查盲区","产物：独立双通道发现与合并结论"],["Debugger","根因不确定","产物：可复现因果链、最小修复与回归测试"]].map(([n,w,d],i)=><div key={n}><b>0{i+1}</b><span><strong>{n}</strong><small>{w}</small></span><p>{d}</p></div>)}</div>
            <div className="closing"><b>给小白的一句话</b><span>先让 AI 把系统讲明白，再让 UltraGoal 自动做；每一步都要求留下可以检查的证据。</span></div>
            <button className="restart" onClick={()=>go(0)}>从头再看一次 ↺</button>
          </article>
        )}
      </section>

      {copied && <div className="toast">示例已复制</div>}
      <footer className="footer"><div className="progress"><span style={{width:progress}}/></div><button onClick={()=>go(scene-1)} disabled={scene===0} aria-label="上一页">←</button><div><b>{String(scene+1).padStart(2,"0")}</b><span>/ {String(chapters.length).padStart(2,"0")}</span><em>{chapters[scene]}</em></div><button onClick={()=>go(scene+1)} disabled={scene===chapters.length-1} aria-label="下一页">→</button></footer>
    </main>
  );
}
