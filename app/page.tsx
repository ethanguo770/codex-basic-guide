"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const chapters = ["开场", "认识平台", "Mermaid", "Plan", "UltraGoal", "Browser", "CodeReview", "Debugger", "总结"];
const sceneMaxSteps = [2, 2, 5, 4, 4, 5, 4, 4, 2] as const;

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
  className?: string;
  revealStep: number;
  purpose: string;
  when: string;
  input: string;
  output: string;
};

function Capability({ className = "", revealStep, purpose, when, input, output }: CapabilityProps) {
  const cellClass = (step: number) => `capability-cell ${revealStep >= step ? "revealed" : ""}`;
  return (
    <div className={`capability-anatomy ${className}`}>
      <div className={cellClass(1)}><small>01 · 它能帮你做什么</small><strong>{purpose}</strong></div>
      <div className={cellClass(1)}><small>02 · 什么时候会用到</small><span>{when}</span></div>
      <div className={cellClass(2)}><small>03 · 你只要告诉 AI</small><span>{input}</span></div>
      <div className={cellClass(2)}><small>04 · 它会交给你</small><span>{output}</span></div>
    </div>
  );
}

export default function Home() {
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState(chapters[0]);
  const [revealStep, setRevealStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const wheelLock = useRef(false);
  const transitionLock = useRef(false);
  const transitionTimers = useRef<number[]>([]);

  const go = useCallback((next: number, targetReveal = 0) => {
    if (transitionLock.current) return;
    const safe = Math.max(0, Math.min(chapters.length - 1, next));
    if (safe === scene) return;
    const nextDirection = safe > scene ? 1 : -1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDirection(nextDirection);
    if (reduceMotion) { setRevealStep(targetReveal); setScene(safe); return; }

    transitionLock.current = true;
    transitionTimers.current.forEach(window.clearTimeout);
    transitionTimers.current = [];
    setTransitionLabel(chapters[safe]);
    setTransitioning(true);
    transitionTimers.current.push(window.setTimeout(() => {
      setRevealStep(targetReveal);
      setScene(safe);
    }, 330));
    transitionTimers.current.push(window.setTimeout(() => {
      setTransitioning(false);
      transitionLock.current = false;
    }, 720));
  }, [scene]);

  const advance = useCallback((delta: 1 | -1) => {
    if (transitionLock.current) return;
    const maxStep = sceneMaxSteps[scene];
    if (delta > 0) {
      if (revealStep < maxStep) setRevealStep(step => step + 1);
      else go(scene + 1, 0);
      return;
    }
    if (revealStep > 0) setRevealStep(step => step - 1);
    else if (scene > 0) go(scene - 1, sceneMaxSteps[scene - 1]);
  }, [go, revealStep, scene]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) { event.preventDefault(); advance(1); }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); advance(-1); }
      if (event.key === "Home") { if (scene === 0) setRevealStep(0); else go(0, 0); }
      if (event.key === "End") { const last = chapters.length - 1; if (scene === last) setRevealStep(sceneMaxSteps[last]); else go(last, sceneMaxSteps[last]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, go, scene]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest(".scrollable")) return;
      if (wheelLock.current || Math.abs(event.deltaY) < 30) return;
      wheelLock.current = true;
      advance(event.deltaY > 0 ? 1 : -1);
      window.setTimeout(() => { wheelLock.current = false; }, 420);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [advance]);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* preview may deny clipboard */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1100);
  };

  useEffect(() => () => {
    transitionTimers.current.forEach(window.clearTimeout);
  }, []);

  const lessonClass = direction > 0 ? "lesson lesson-next" : "lesson lesson-prev";
  const assetInfo = ["PUMP-204", "离心泵总成", "v3.2", "待审核"];
  const maxReveal = sceneMaxSteps[scene];
  const progress = `${((scene + (revealStep + 1) / (maxReveal + 1)) / chapters.length) * 100}%`;
  const revealClass = (step: number, className = "") => `${className} reveal-block ${revealStep >= step ? "revealed" : ""}`;
  const flowStep = scene === 2 ? (revealStep >= 5 ? 3 : revealStep >= 4 ? 1 : 0) : 0;
  const angle = scene === 5 ? (revealStep >= 4 ? 3 : revealStep >= 3 ? 1 : 0) : 0;
  const testStatus: "idle" | "running" | "passed" = scene === 5 ? (revealStep >= 4 ? "passed" : revealStep >= 3 ? "running" : "idle") : "idle";

  return (
    <main className="guide">
      <div className="paper-grain" />
      <header className="topbar">
        <button className="wordmark" onClick={() => scene === 0 ? setRevealStep(0) : go(0, 0)}><b>C</b><span>Codex小技巧</span></button>
        <span>滚轮逐步展开 · {revealStep + 1} / {maxReveal + 1}</span>
      </header>

      <nav className="chapter-rail" aria-label="章节导航">
        {chapters.map((title, index) => <button key={title} className={index === scene ? "active" : index < scene ? "done" : ""} onClick={() => go(index, 0)}><b>{index + 1}</b><span>{title}</span></button>)}
      </nav>

      <section className="stage" aria-live="polite">
        {transitioning && <div className={`soft-wipe ${direction > 0 ? "forward" : "backward"}`} aria-hidden="true"><i /><i /><i /><b>{transitionLabel}</b></div>}

        {scene === 0 && (
          <article className={`${lessonClass} cover`}>
            <div className="cover-copy">
              <div className="overline">FROM PROMPT TO PROOF · CODEX</div>
              <h1>Codex小技巧<span className="case-title">用一个 3D 仿真资产管理网站，读懂 AI 开发闭环</span></h1>
              <p>这不是命令清单。六个技巧会分别帮你看懂复杂流程、提前想清楚怎么做、持续完成大任务、检查真实网页、审查代码和定位 Bug。</p>
              <div className={revealClass(1, "cover-thesis")}><b>你会学到什么</b><span>先把事情看明白，再让 AI 开始做，最后检查它是否真的做好了。</span></div>
              <button className={revealClass(2, "primary")} onClick={() => go(1)}>从资产生命周期开始 <b>→</b></button>
            </div>
            <div className={revealClass(1, "cover-product")} aria-hidden="true">
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
            <div className={revealClass(1, "platform-brief")}>
              <div className="asset-definition"><small>什么是一个 3D 仿真资产？</small><h3>文件 + 数据 + 流程</h3><div className="asset-stack"><span><b>01</b>GLB / FBX 模型</span><span><b>02</b>贴图与材质</span><span><b>03</b>名称、标签、尺寸</span><span><b>04</b>版本与审核记录</span><span><b>05</b>发布到仿真环境</span></div></div>
              <div className="lifecycle"><small>核心流程</small>{[["上传","技术美术提交模型"],["转换","生成统一格式与缩略图"],["预览","浏览器检查模型和贴图"],["审核","负责人通过或退回"],["发布","进入正式仿真资产库"]].map(([t,d],i)=><div key={t}><b>0{i+1}</b><span><strong>{t}</strong><em>{d}</em></span></div>)}</div>
              <div className="capability-route"><small>六个技巧分别解决什么问题</small><div><b>Mermaid</b><span><strong>把流程画清楚</strong><em>避免一开始就理解错</em></span></div><div><b>Plan</b><span><strong>先列清楚做法</strong><em>避免做到一半返工</em></span></div><div><b>UltraGoal</b><span><strong>把大任务拆开做</strong><em>中途停下也能继续</em></span></div><div><b>Browser</b><span><strong>真的操作网页</strong><em>不靠猜页面结果</em></span></div><div><b>CodeReview</b><span><strong>合并前再检查</strong><em>找出自己没看到的问题</em></span></div><div><b>Debugger</b><span><strong>先找到真正原因</strong><em>避免乱改代码</em></span></div></div>
            </div>
            <div className={revealClass(2, "plain-note")}><b>给小白的比喻</b><span>平台像一个 3D 模型仓库：每个模型有身份证、历史版本、质检记录和正式上架状态。</span></div>
          </article>
        )}

        {scene === 2 && (
          <article className={`${lessonClass} mermaid-scene`}>
            <div className="section-no">01 · MERMAID</div>
            <div className="statement"><h2>Mermaid：<br /><span>把一大段文字变成流程图。</span></h2><p>先让 AI 把它理解的步骤画出来，你只需要看图检查哪里不对，再让它重新调整。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="把复杂的需求、代码流程或工作步骤，画成大家都看得懂的图。"
              when="一件事有很多步骤和分支，光看文字很容易漏掉内容时。"
              input="要看哪些代码、事情要经过哪些步骤，以及哪些特殊情况要标出来。"
              output="一张可以继续修改的 Mermaid 流程图，以及需要你确认的问题。"
            />
            <div className={revealClass(3, "mermaid-layout")}>
              <div className="mermaid-left">
                <Command title="直接这样问" onCopy={copy}>{"不要修改代码。先把 3D 资产从上传、转换、预览、审核到发布的流程输出为 Mermaid；标出格式校验、重复版本、转换失败和权限分支。"}</Command>
                <div className="iteration-steps" aria-label="Mermaid 滚轮迭代过程">
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
            <div className={revealClass(5, "recommendation")}><b>正确顺序</b><span>AI 画图 → 人类审阅 → 补规则 → AI 按最佳实践调整 → 定稿后再修改 Plan、代码与测试。</span></div>
          </article>
        )}

        {scene === 3 && (
          <article className={`${lessonClass} plan-scene`}>
            <div className="section-no">02 · PLAN × 流程图</div>
            <div className="statement"><h2>Plan：<br /><span>开始写代码前，先把怎么做列清楚。</span></h2><p>它会告诉你先做什么、后做什么、要改哪些地方，以及最后怎样检查功能是否真的完成。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="把“我要做这个功能”拆成一份有顺序、能检查的施工清单。"
              when="功能不止改一个地方，或者你还不知道应该先做什么时。"
              input="确认过的流程图、现有代码、不能违反的限制和完成标准。"
              output="要改哪些地方、按什么顺序、怎么测试，以及什么才算完成。"
            />
            <div className={revealClass(3, "plan-spread")}>
              <div className="plan-prompt"><Command title="Plan 示例" onCopy={copy}>{'$plan --direct "根据确认后的 3D 资产生命周期流程图制定开发计划；包含资产库、上传、转换、在线预览、版本、权限、审核、测试和验收。"'}</Command><div className="plan-tip"><b>Plan 最少要有</b><span>模块与边界</span><span>开发顺序和依赖</span><span>失败与回滚策略</span><span>可以验证的完成标准</span></div></div>
              <div className="plan-paper"><small>3D 仿真资产平台 · 开发计划</small>{[["01","资产列表","搜索、标签和版本状态"],["02","上传与格式转换","检查文件、上传并生成网页可用格式"],["03","网页 3D 预览","查看模型、贴图、尺寸和旋转效果"],["04","审核与发布","提交、退回、批准和正式发布"],["05","测试与验收","检查代码、接口、网页操作和加载速度"]].map(([n,t,d])=><div key={n}><b>{n}</b><span><strong>{t}</strong><em>{d}</em></span></div>)}</div>
              <div className={revealClass(4, "plan-link")}><span>流程图规则变化</span><i>→</i><span>Plan 同步模块与测试</span><i>→</i><b>再开始改代码</b></div>
            </div>
          </article>
        )}

        {scene === 4 && (
          <article className={`${lessonClass} compare-scene`}>
            <div className="section-no">03 · GOAL VS OMX ULTRAGOAL</div>
            <div className="statement"><h2>Goal 盯住一个任务，<br /><span>UltraGoal 帮你持续推进一个大项目。</span></h2><p>Goal 适合一个小功能；UltraGoal 会把大项目拆开、记录进度，即使中途停下来也能接着做。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="Goal 负责一个明确任务；UltraGoal 把一个大项目拆成多件小事并持续完成。"
              when="小功能用 Goal；涉及设计、开发、测试等多个阶段时用 UltraGoal。"
              input="想完成什么、哪些事情不要做，以及最后怎样才算成功。"
              output="Goal 会持续跟踪一个任务；UltraGoal 还会记录子任务、进度和检查结果。"
            />
            <div className={revealClass(3, "comparison")}>
              <div className="compare-card native"><div className="compare-title"><span>Codex 原生</span><h3>Goal</h3></div><p>像一张验收目标卡。适合范围清楚、步骤少、当前线程可以完成的任务。</p><Command title="平台里的用法" onCopy={copy}>{"创建 Goal：为资产列表增加标签筛选，并用浏览器测试证明 URL、筛选结果和空状态正确。"}</Command><ul><li>一个目标</li><li>一个成功标准</li><li>由当前线程持续推进</li></ul><div className="fit">适合：标签筛选、单个 Bug、小功能</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">本教程推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>UltraGoal</h3></div><p>像一份会自动记录进度的项目清单。它会把大项目拆开，一件一件完成。</p><Command title="大项目案例" onCopy={copy}>{'omx ultragoal create-goals --brief "开发 3D 仿真资产管理网站：页面设计、资产接口、上传转换、3D 预览、版本审核、文档、网页测试和加载速度检查"'}</Command><ul><li>把项目拆成小任务</li><li>每完成一步都会保存进度</li><li>最后统一运行测试和代码检查</li></ul><div className="fit strong">适合：完整平台、较长任务、性能排查</div></div>
            </div>
            <div className={revealClass(4, "recommendation coral")}><b>建议</b><span>一个小改动用 Goal；只要涉及多个阶段、自动化测试或性能排查，就优先用 OMX UltraGoal。</span></div>
          </article>
        )}

        {scene === 5 && (
          <article className={`${lessonClass} browser-scene`}>
            <div className="section-no">04 · BROWSER PLUGIN</div>
            <div className="statement"><h2>Browser：<br /><span>让 AI 真的打开网页操作和检查。</span></h2><p>它不再只看代码猜结果，而是像用户一样搜索、点击、旋转模型、提交表单并确认页面变化。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="让 AI 像真实用户一样操作网页，确认功能不是只在代码里看起来正确。"
              when="你必须确认网页真的能用，或者需要把结果写进飞书文档时。"
              input="网址、要做哪些操作、应该看到什么结果，以及已经授权的登录状态。"
              output="真实页面结果、测试证据，或者已经整理好的飞书云文档。"
            />
            <div className={revealClass(3, "browser-sequence")}>
              <section className={revealClass(3, "browser-phase test-phase")}>
                <div className="phase-heading"><b>01</b><span><strong>先验证网站</strong><small>自动完成搜索、预览、旋转和提交，并确认页面结果</small></span></div>
                <div className="browser-spread">
                  <div className="browser-instruction"><Command title="Browser 测试提示词" onCopy={copy}>{"打开本地 3D 资产网站；搜索 PUMP-204，进入详情，旋转模型确认预览可用，提交审核，并确认状态从“草稿”变成“待审核”。"}</Command><div className="test-log"><small>AUTOMATION STEPS · 随滚轮推进</small><span className={testStatus!=="idle"?"done":"active"}>1. 搜索 PUMP-204</span><span className={angle>=1?"done":""}>2. 打开 3D 预览</span><span className={angle>=2?"done":""}>3. 旋转检查模型</span><span className={angle>=3?"done":""}>4. 读取资产信息</span><span className={testStatus==="passed"?"done":""}>5. 确认结果正确</span></div></div>
                  <div className="mini-browser"><div className="mini-bar"><i/><i/><i/><span>localhost:3000/assets/PUMP-204</span></div><div className="asset-app"><aside><div className="asset-row active"><b>P</b><span>离心泵</span></div><div className="asset-row"><b>R</b><span>机械臂</span></div><div className="asset-row"><b>W</b><span>自动仓库</span></div></aside><section><div className="viewer"><div className={`model-proxy angle-${angle}`}><i className="front"/><i className="back"/><i className="right"/><i className="left"/><i className="top"/><i className="bottom"/><span/></div><div className="viewer-grid"/>{testStatus==="passed"&&<em>✓ 预览测试通过</em>}</div><div className="asset-meta"><small>{assetInfo[0]}</small><h3>{assetInfo[1]}</h3><p>GLB · 42.8 MB · {assetInfo[2]}</p><div><span>状态</span><b>{testStatus==="passed"?"待审核":"草稿"}</b></div><div><span>贴图</span><b>8 / 8 正常</b></div><div><span>三角面</span><b>124,860</b></div></div></section></div></div>
                </div>
              </section>
              <section className={revealClass(5, "browser-phase docs-phase")}>
                <div className="phase-heading"><b>02</b><span><strong>再沉淀文档</strong><small>把验证结果写入已授权的飞书云文档</small></span></div>
                <div className="docs-compact"><Command title="飞书文档提示词" onCopy={copy}>{"读取资产库中本周新增、待审核和转换失败的 3D 资产；打开飞书云文档，生成《仿真资产周报》，包含资产清单、风险、负责人和下周计划。"}</Command><div className="permission-note"><b>注意</b><span>写入真实飞书需要登录状态和明确授权。</span></div><div className="doc-page"><small>仿真资产周报 · Week 28</small><h3>3D Asset Operations</h3><p>本周新增 42 个资产，已审核 31 个，转换失败 3 个。</p><h4>需要关注</h4><div className="doc-table"><span>PUMP-204 <b>已审核</b></span><span>ROBOT-018 <b>待审核</b></span><span>WH-031 <b>贴图缺失</b></span></div><em>Browser 已完成录入与校对</em></div></div>
              </section>
            </div>
          </article>
        )}

        {scene === 6 && (
          <article className={`${lessonClass} compare-scene review-compare`}>
            <div className="section-no">05 · REVIEW VS OMX CODEREVIEW</div>
            <div className="statement"><h2>CodeReview：<br /><span>在合并代码前，请另一组 AI 帮你挑问题。</span></h2><p>它会重点检查有没有 Bug、安全风险、性能问题和缺少的测试，并告诉你是否适合合并。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="在代码合并前，帮你找出自己容易忽略的 Bug、风险和设计问题。"
              when="功能已经做完准备合并，或者这次改动比较重要时。"
              input="这次改了什么、原始需求、重要限制和已经跑过的测试。"
              output="问题在哪里、严重不严重、怎样修改，以及是否建议合并。"
            />
            <div className={revealClass(3, "comparison")}>
              <div className="compare-card native"><div className="compare-title"><span>Codex 快速入口</span><h3>Review</h3></div><p>快速检查一个文件或一小段改动，找出比较明显的问题。</p><Command title="小改动案例" onCopy={copy}>{"/review 检查本次 3D 文件上传逻辑，重点看文件检查、权限、出错处理和测试。"}</Command><ul><li>速度快</li><li>适合正在开发的小改动</li><li>只检查你这次交给它的内容</li></ul><div className="fit">适合：边写边检查</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">合并前推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>CodeReview</h3></div><p>由两组 AI 分别检查代码细节和整体设计，减少同一种思路反复看漏问题。</p><Command title="重要改动案例" onCopy={copy}>{"调用 OMX CodeReview，检查 3D 资产上传与转换功能：有没有安全问题、功能错误、速度问题，以及遗漏的测试。"}</Command><ul><li>第一组检查代码和测试</li><li>第二组检查整体设计是否合理</li><li>最后给出“可以合并”或“需要修改”</li></ul><div className="fit strong">适合：重要功能和正式合并</div></div>
            </div>
            <div className={revealClass(4, "review-example")}><b>发现一个严重问题：暂时不要合并</b><span>上传 ZIP 时可能把文件写到不该写的位置；超大文件还可能让服务器内存不够用。</span><em>问题位置：api/assets/upload.ts 第 71 行 · 建议先修改</em></div>
          </article>
        )}

        {scene === 7 && (
          <article className={`${lessonClass} debug-scene`}>
            <div className="section-no">06 · DEBUGGER</div>
            <div className="statement"><h2>Debugger：<br /><span>先查清 Bug 为什么发生，再动手修改。</span></h2><p>它不会一上来就猜着改代码，而是先让问题稳定出现，再一步步缩小范围并确认真正原因。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="不靠猜，按照证据一步步找到 Bug 的真正原因。"
              when="Bug 反复出现、只在某些环境出现，或者已经修过几次仍然复发时。"
              input="你看到了什么、正确结果应该是什么、相关日志和最近改动。"
              output="怎样稳定复现、真正原因、最小修改，以及防止再次发生的测试。"
            />
            <div className={revealClass(3, "debug-spread")}>
              <div><Command title="Debugger 提示词" onCopy={copy}>{"使用 debugger 智能体调查：WH-031 在 Windows 正常，但部署到 Linux 后 3D 预览变黑。先稳定重现，不要先改代码；说明问题经过、真正原因、最小修改和防止再次发生的测试。"}</Command><div className="debug-analogy"><b>像侦探一样工作</b><span>现象：模型变黑</span><span>线索：只有 Linux 失败</span><span>真正原因必须能用测试证明</span></div></div>
              <div className="timeline"><small>DEBUG TRACE · WH-031</small>{[["T+00","读取 glTF 材质","baseColorTexture","ok"],["T+12","请求 BaseColor.PNG","Windows 200","ok"],["T+13","Linux 区分大小写","basecolor.png 404","bad"],["FIX","上传时规范化贴图名","重写 glTF URI","good"],["TEST","三种系统运行 30 组资产","30 / 30 通过","good"]].map(([t,e,r,s])=><div key={t} className={s}><b>{t}</b><span>{e}</span><em>{r}</em></div>)}</div>
            </div>
            <div className={revealClass(4, "debug-chain")}><span>让问题再次出现</span><i>→</i><span>比较不同环境</span><i>→</i><span>确认真正原因</span><i>→</i><span>只改必要部分</span><i>→</i><b>各个平台重新测试</b></div>
          </article>
        )}

        {scene === 8 && (
          <article className={`${lessonClass} summary-scene`}>
            <div className="section-no">07 · 现在你会选了</div>
            <div className="summary-title"><h2>六个小技巧，<br /><span>各自解决一个常见问题。</span></h2><p>先看看自己现在卡在哪里，再选择对应的能力。</p></div>
            <div className={revealClass(1, "summary-list")}>{[["Mermaid","流程太复杂，看不懂","最后得到：一张大家都确认过的流程图"],["Plan","知道要做什么，却不知道怎么开始","最后得到：有顺序、有检查方法的开发计划"],["OMX UltraGoal","任务太大，一次做不完","最后得到：拆开的小任务、完成进度和检查记录"],["Browser","代码写好了，但不知道网页是否真能用","最后得到：真实页面结果、截图或飞书文档"],["OMX CodeReview","自己写的代码容易看漏问题","最后得到：问题位置、修改建议和是否合并的结论"],["Debugger","只看到了 Bug，却不知道真正原因","最后得到：复现方法、真正原因、修改和防复发测试"]].map(([n,w,d],i)=><div key={n}><b>0{i+1}</b><span><strong>{n}</strong><small>{w}</small></span><p>{d}</p></div>)}</div>
            <div className={revealClass(2, "closing")}><b>给小白的一句话</b><span>先让 AI 把系统讲明白，再让 UltraGoal 自动做；每一步都要求留下可以检查的证据。</span></div>
            <button className={revealClass(2, "restart")} onClick={()=>go(0)}>从头再看一次 ↺</button>
          </article>
        )}
      </section>

      {copied && <div className="toast">示例已复制</div>}
      <footer className="footer"><div className="progress"><span style={{width:progress}}/></div><button onClick={()=>advance(-1)} disabled={scene===0&&revealStep===0} aria-label="上一步">←</button><div><b>{String(scene+1).padStart(2,"0")}</b><span>/ {String(chapters.length).padStart(2,"0")}</span><em>{chapters[scene]} · STEP {revealStep + 1}/{maxReveal + 1}</em></div><button onClick={()=>advance(1)} disabled={scene===chapters.length-1&&revealStep===maxReveal} aria-label="下一步">→</button></footer>
    </main>
  );
}
