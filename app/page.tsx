"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const chapters = ["开场", "认识平台", "PLAN x 流程图", "UltraGoal", "Browser", "OMX CodeReview", "Debugger", "总结", "附录"];
const sceneMaxSteps = [2, 2, 5, 4, 5, 4, 4, 2, 3] as const;

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
  const flowStep = scene === 2 ? (revealStep >= 5 ? 4 : revealStep >= 4 ? 3 : revealStep >= 3 ? 2 : revealStep >= 2 ? 1 : 0) : 0;
  const angle = scene === 4 ? (revealStep >= 4 ? 3 : revealStep >= 3 ? 1 : 0) : 0;
  const testStatus: "idle" | "running" | "passed" = scene === 4 ? (revealStep >= 4 ? "passed" : revealStep >= 3 ? "running" : "idle") : "idle";

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
              <p>这不是命令清单。五个技巧会分别帮你想清楚怎么做、持续完成大任务、自动操作网页、审查代码和定位 Bug。</p>
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
              <div className="capability-route"><small>五个技巧分别解决什么问题</small><div><b>PLAN x 流程图</b><span><strong>文字计划和图一起看</strong><em>让 AI 多画图，人更容易确认</em></span></div><div><b>UltraGoal</b><span><strong>让大项目持续跑到完成</strong><em>中断、失败也能接着做</em></span></div><div><b>Browser</b><span><strong>自动测试 + 写飞书</strong><em>替你操作真实网页</em></span></div><div><b>OMX CodeReview</b><span><strong>合并前再检查</strong><em>找出自己没看到的问题</em></span></div><div><b>Debugger</b><span><strong>先找到真正原因</strong><em>避免乱改代码</em></span></div></div>
            </div>
            <div className={revealClass(2, "plain-note")}><b>给小白的比喻</b><span>平台像一个 3D 模型仓库：每个模型有身份证、历史版本、质检记录和正式上架状态。</span></div>
          </article>
        )}

        {scene === 2 && (
          <article className={`${lessonClass} mermaid-scene plan-mermaid-scene`}>
            <div className="section-no">01 · PLAN x 流程图（Mermaid）</div>
            <div className="statement"><h2>Plan 负责想清楚怎么做，<br /><span>流程图（Mermaid）负责让人一眼看懂。</span></h2><p>一定要让 AI 多画图：出现流程、分支或模块关系时就同时输出图。人看图找遗漏，AI 同步修改 Plan，确认后再写代码。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="先得到有顺序的开发计划，再用流程图把步骤、分支和异常情况讲明白。"
              when="功能涉及多个模块，文字计划不容易快速看懂，也担心 AI 理解错需求时。"
              input="需求、相关代码、不能违反的限制，以及最后怎样才算完成。"
              output="一份文字 Plan、一张配套流程图（Mermaid），以及需要人确认的问题。"
            />
            <div className={revealClass(3, "mermaid-layout")}>
              <div className="mermaid-left">
                <Command title="PLAN x 流程图示例" onCopy={copy}>{'$plan --direct "不要修改代码。先为 3D 资产上传、转换、预览、审核和发布制定开发 Plan；凡是流程、分支和模块关系都要输出流程图（Mermaid），标出格式校验、重复版本、转换失败、退回和权限分支。列出需要人确认的问题。"'}</Command>
                <div className="iteration-steps" aria-label="PLAN 与流程图人工审阅过程">
                  {[["1","AI 阅读需求和代码","理解现状与限制"],["2","输出文字 Plan","列模块、顺序和测试"],["3","主动多画流程图","把步骤、分支和关系画出来"],["4","人看图 Review","指出失败、权限和退回遗漏"],["5","同步修改后开工","Plan 与图确认后再写代码"]].map(([n,t,d],i)=><div key={n} className={flowStep===i?"active":flowStep>i?"done":""}><b>{n}</b><span><strong>{t}</strong><small>{d}</small></span></div>)}
                </div>
              </div>
              <div className="mermaid-right">
                <div className="editor-tabs"><b className="active">文字 Plan</b><b className="active">流程图（Mermaid）</b><span>{flowStep>=4?"已同步定稿":"等待人工确认"}</span></div>
                <div className="plan-outline"><span><b>模块</b>上传、转换、预览、审核</span><span><b>顺序</b>先校验，再转换，最后发布</span><span><b>验收</b>正常与失败分支都要测试</span></div>
                <pre>{flowStep>=4?flowV2:flowV1}</pre>
                <div className={`simple-flow ${flowStep>=4?"complete":""}`}><span>上传</span><i>→</i><span className="diamond">校验</span><i>→</i><span>转换</span><i>→</i><span>预览</span><i>→</i><span>{flowStep>=4?"通过 / 退回":"发布"}</span></div>
                {flowStep===3&&<div className="human-comment">人类批注：转换失败呢？版本重复呢？谁可以发布？</div>}
              </div>
            </div>
            <div className={revealClass(5, "recommendation")}><b>让 AI 多画图</b><span>需求与代码 → AI 输出 Plan + 流程图 → 人看图 Review → AI 同步修改 → 确认后再写代码和测试。</span></div>
          </article>
        )}

        {scene === 3 && (
          <article className={`${lessonClass} compare-scene`}>
            <div className="section-no">02 · GOAL VS OMX ULTRAGOAL</div>
            <div className="statement"><h2>Goal 盯住一个任务，<br /><span>UltraGoal 把一个大项目持续做到验收通过。</span></h2><p>它不只是“拆任务”：进度会保存在项目里；中断后可以继续，失败后可以重试，检查不通过就不会假装已经完成。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="Goal 完成一个明确任务；UltraGoal 会自动拆解并持续推进整个项目，直到真正通过验收。"
              when="任务横跨设计、开发、测试、Review 或性能排查，今天做不完、明天还要继续时。"
              input="最终目标、不能触碰的边界、怎样才算完成，以及必须通过哪些检查。"
              output="保存下来的任务与进度、每一步的结果、失败记录，以及通过测试和 Review 的最终产物。"
            />
            <div className={revealClass(3, "comparison")}>
              <div className="compare-card native"><div className="compare-title"><span>Codex 原生</span><h3>Goal</h3></div><p>像一张验收目标卡。适合范围清楚、步骤少、当前线程可以完成的任务。</p><Command title="平台里的用法" onCopy={copy}>{"创建 Goal：为资产列表增加标签筛选，并用浏览器测试证明 URL、筛选结果和空状态正确。"}</Command><ul><li>一个目标</li><li>一个成功标准</li><li>由当前线程持续推进</li></ul><div className="fit">适合：标签筛选、单个 Bug、小功能</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">本教程推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>UltraGoal</h3></div><p>像一位会记住全部进度的项目负责人：自己安排下一步，遇到失败留下记录，修好后继续，最终用测试和独立 Review 把关。</p><Command title="完整项目案例" onCopy={copy}>{'omx ultragoal create-goals --brief "开发 3D 仿真资产管理网站：完成页面设计、资产接口、上传转换、3D 预览、版本审核、飞书文档、浏览器自动化测试和加载速度排查；所有测试与 OMX CodeReview 通过后才算完成"'}</Command><ul><li>进度保存在项目里，换会话仍能继续</li><li>失败会留下原因，可以从失败任务重试</li><li>测试、OMX CodeReview 和整体设计检查全部通过才结束</li></ul><div className="fit strong">适合：完整平台、较长任务、性能排查</div></div>
            </div>
            <div className={revealClass(4, "recommendation coral")}><b>真正强的地方</b><span>UltraGoal 把目标、进度、失败和验证结果都保存下来；执行中发现新问题，还能根据证据调整后续任务。它追求的不是“AI 跑了很久”，而是“项目真的交付并通过检查”。</span></div>
          </article>
        )}

        {scene === 4 && (
          <article className={`${lessonClass} browser-scene`}>
            <div className="section-no">03 · BROWSER PLUGIN</div>
            <div className="statement"><h2>Browser 插件：<br /><span>自动完成网页测试，也能自动编写飞书云文档。</span></h2><p>给它网址、步骤和正确结果，它可以从头跑完整测试并留下证据；飞书文档在网页端授权后，把链接复制到 Codex Chrome 插件，它就能进入指定文档继续操作。</p></div>
            <Capability
              className={revealClass(1)}
              revealStep={revealStep}
              purpose="替你完成两类重复工作：全流程网页自动化测试，以及打开飞书编写云文档。"
              when="需要完整验证一条用户流程，或者要把测试和项目结果正式整理进飞书时。"
              input="测试网址、操作步骤和正确结果；写飞书时，再提供已授权的云文档链接和内容要求。"
              output="自动化测试记录、页面状态与截图，以及已经写入并校对好的飞书云文档。"
            />
            <div className={revealClass(3, "browser-sequence")}>
              <section className={revealClass(3, "browser-phase test-phase")}>
                <div className="phase-heading"><b>01</b><span><strong>自动跑完整测试</strong><small>从打开页面到输出结果，整条流程自动完成</small></span></div>
                <div className="browser-spread">
                  <div className="browser-instruction"><Command title="Browser 测试提示词" onCopy={copy}>{"打开本地 3D 资产网站；搜索 PUMP-204，进入详情，旋转模型确认预览可用，提交审核，并确认状态从“草稿”变成“待审核”。"}</Command><div className="test-log"><small>AUTOMATION STEPS · 随滚轮推进</small><span className={testStatus!=="idle"?"done":"active"}>1. 搜索 PUMP-204</span><span className={angle>=1?"done":""}>2. 打开 3D 预览</span><span className={angle>=2?"done":""}>3. 旋转检查模型</span><span className={angle>=3?"done":""}>4. 读取资产信息</span><span className={testStatus==="passed"?"done":""}>5. 确认结果正确</span></div></div>
                  <div className="mini-browser"><div className="mini-bar"><i/><i/><i/><span>localhost:3000/assets/PUMP-204</span></div><div className="asset-app"><aside><div className="asset-row active"><b>P</b><span>离心泵</span></div><div className="asset-row"><b>R</b><span>机械臂</span></div><div className="asset-row"><b>W</b><span>自动仓库</span></div></aside><section><div className="viewer"><div className={`model-proxy angle-${angle}`}><i className="front"/><i className="back"/><i className="right"/><i className="left"/><i className="top"/><i className="bottom"/><span/></div><div className="viewer-grid"/>{testStatus==="passed"&&<em>✓ 预览测试通过</em>}</div><div className="asset-meta"><small>{assetInfo[0]}</small><h3>{assetInfo[1]}</h3><p>GLB · 42.8 MB · {assetInfo[2]}</p><div><span>状态</span><b>{testStatus==="passed"?"待审核":"草稿"}</b></div><div><span>贴图</span><b>8 / 8 正常</b></div><div><span>三角面</span><b>124,860</b></div></div></section></div></div>
                </div>
              </section>
              <section className={revealClass(5, "browser-phase docs-phase")}>
                <div className="phase-heading"><b>02</b><span><strong>自动编写飞书云文档</strong><small>通过文档链接进入指定页面，填写、排版并校对内容</small></span></div>
                <div className="docs-compact"><Command title="飞书文档提示词" onCopy={copy}>{"打开这个已授权的飞书云文档链接：https://example.feishu.cn/docx/asset-weekly；根据刚才的自动化测试结果和资产库数据，填写《仿真资产周报》，包含资产清单、测试结果、风险、负责人和下周计划；完成排版并检查内容是否保存成功。"}</Command><div className="permission-note"><b>连接方法</b><span>网页端登录飞书并授权文档 → 复制云文档链接 → 粘贴到 Codex Chrome 插件 → AI 自动打开并操作该文档。</span></div><div className="doc-page"><small>仿真资产周报 · Week 28</small><h3>3D Asset Operations</h3><p>本周新增 42 个资产，已审核 31 个，转换失败 3 个。</p><h4>需要关注</h4><div className="doc-table"><span>PUMP-204 <b>自动化测试通过</b></span><span>ROBOT-018 <b>待审核</b></span><span>WH-031 <b>贴图缺失</b></span></div><em>Browser 已完成打开、录入、排版、保存与校对</em></div></div>
              </section>
            </div>
          </article>
        )}

        {scene === 5 && (
          <article className={`${lessonClass} compare-scene review-compare`}>
            <div className="section-no">04 · REVIEW VS OMX CODEREVIEW</div>
            <div className="statement"><h2>OMX CodeReview：<br /><span>在合并代码前，请独立的 AI 审查组帮你挑问题。</span></h2><p>它会重点检查有没有 Bug、安全风险、性能问题和缺少的测试，并告诉你是否适合合并。</p></div>
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
              <div className="compare-card recommended"><div className="recommended-badge">合并前推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>OMX CodeReview</h3></div><p>由两组 AI 分别检查代码细节和整体设计，减少同一种思路反复看漏问题。</p><Command title="重要改动案例" onCopy={copy}>{"调用 OMX CodeReview，检查 3D 资产上传与转换功能：有没有安全问题、功能错误、速度问题，以及遗漏的测试。"}</Command><ul><li>第一组检查代码和测试</li><li>第二组检查整体设计是否合理</li><li>最后给出“可以合并”或“需要修改”</li></ul><div className="fit strong">适合：重要功能和正式合并</div></div>
            </div>
            <div className={revealClass(4, "review-example")}><b>发现一个严重问题：暂时不要合并</b><span>上传 ZIP 时可能把文件写到不该写的位置；超大文件还可能让服务器内存不够用。</span><em>问题位置：api/assets/upload.ts 第 71 行 · 建议先修改</em></div>
          </article>
        )}

        {scene === 6 && (
          <article className={`${lessonClass} debug-scene`}>
            <div className="section-no">05 · DEBUGGER</div>
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

        {scene === 7 && (
          <article className={`${lessonClass} summary-scene`}>
            <div className="section-no">06 · 现在你会选了</div>
            <div className="summary-title"><h2>五个小技巧，<br /><span>组成一条完整的 AI 开发流程。</span></h2><p>先让人看懂和确认，再让 AI 执行，最后用真实证据检查结果。</p></div>
            <div className={revealClass(1, "summary-list")}>{[["PLAN x 流程图（Mermaid）","计划太长，不容易发现 AI 理解错了哪里","最后得到：文字 Plan、多张配套流程图和人工确认后的规则"],["OMX UltraGoal","大项目跨很多阶段，容易中断或漏验收","最后得到：可恢复的执行进度，以及通过测试和 Review 的完整产物"],["Browser","测试网页和写飞书文档太重复","最后得到：完整自动化测试证据，以及已编写好的飞书云文档"],["OMX CodeReview","自己写的代码容易看漏问题","最后得到：问题位置、修改建议和是否合并的结论"],["Debugger","只看到了 Bug，却不知道真正原因","最后得到：复现方法、真正原因、修改和防复发测试"]].map(([n,w,d],i)=><div key={n}><b>0{i+1}</b><span><strong>{n}</strong><small>{w}</small></span><p>{d}</p></div>)}</div>
            <div className={revealClass(2, "closing")}><b>给小白的一句话</b><span>先让 AI 把系统讲明白，再让 UltraGoal 自动做；每一步都要求留下可以检查的证据。</span></div>
            <button className={revealClass(2, "restart")} onClick={()=>go(0)}>从头再看一次 ↺</button>
          </article>
        )}

        {scene === 8 && (
          <article className={`${lessonClass} appendix-scene`}>
            <div className="section-no">附录 · OH MY CODEX</div>
            <div className="statement"><h2>Oh My Codex：<br /><span>把零散的 AI 命令，变成可以持续运行的开发流程。</span></h2><p>它不是另一个 AI 模型，而是 Codex 的工作流与多智能体扩展：负责澄清需求、规划、长期执行、协作、Review 和质量检查。</p></div>
            <div className={revealClass(1, "omx-intro")}><div><small>官方项目地址</small><a href="https://github.com/Yeachan-Heo/oh-my-codex" target="_blank" rel="noreferrer">github.com/Yeachan-Heo/oh-my-codex ↗</a></div><p><b>适合谁？</b><span>经常让 Codex 开发完整功能，希望任务能自动推进、失败可恢复、结果有独立检查的人。</span></p></div>
            <div className={revealClass(2, "omx-command-groups")}>
              {[["先想清楚",[["$deep-interview","通过提问把模糊需求问清楚"],["$ralplan","让多个角色共同检查并完善计划"]]],["自动执行",[["$autopilot","串起规划、执行、Review 和 QA 的完整闭环"],["$team","让多个智能体并行处理不同子任务"]]],["质量提升",[["$ultraqa","生成更刁钻的端到端场景并反复验证"],["$performance-goal","持续定位和优化性能问题"]]],["项目维护",[["$wiki","把项目知识保存成可搜索的长期文档"],["$doctor","检查 Oh My Codex 是否安装和运行正常"]]]].map(([group,items])=><section key={group as string}><h3>{group as string}</h3>{(items as string[][]).map(([command,description])=><div key={command}><code>{command}</code><span>{description}</span></div>)}</section>)}
            </div>
            <div className={revealClass(3, "recommendation coral")}><b>新手建议</b><span>先从 PLAN x 流程图、UltraGoal 和 OMX CodeReview 开始；任务更复杂后，再尝试 Autopilot、Team 与 UltraQA。</span></div>
          </article>
        )}
      </section>

      {copied && <div className="toast">示例已复制</div>}
      <footer className="footer"><div className="progress"><span style={{width:progress}}/></div><button onClick={()=>advance(-1)} disabled={scene===0&&revealStep===0} aria-label="上一步">←</button><div><b>{String(scene+1).padStart(2,"0")}</b><span>/ {String(chapters.length).padStart(2,"0")}</span><em>{chapters[scene]} · STEP {revealStep + 1}/{maxReveal + 1}</em></div><button onClick={()=>advance(1)} disabled={scene===chapters.length-1&&revealStep===maxReveal} aria-label="下一步">→</button></footer>
    </main>
  );
}
