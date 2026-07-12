"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Language = "zh" | "en";
type Theme = "light" | "dark";

const chapterTitles = {
  zh: ["开场", "认识平台", "PLAN x 流程图", "UltraGoal", "Browser", "OMX CodeReview", "Debugger", "总结", "附录"],
  en: ["Intro", "The platform", "PLAN x Flowchart", "UltraGoal", "Browser", "OMX CodeReview", "Debugger", "Summary", "Appendix"],
} as const;
const sceneMaxSteps = [2, 2, 4, 4, 5, 4, 4, 2, 3] as const;

type CommandProps = { title: string; children: string; onCopy: (value: string) => void; language: Language };

function Command({ title, children, onCopy, language }: CommandProps) {
  return (
    <div className="prompt-card">
      <div><span>{title}</span><button onClick={() => onCopy(children)}>{language === "zh" ? "复制示例" : "Copy example"}</button></div>
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
  language: Language;
};

function Capability({ className = "", revealStep, purpose, when, input, output, language }: CapabilityProps) {
  const cellClass = (step: number) => `capability-cell ${revealStep >= step ? "revealed" : ""}`;
  return (
    <div className={`capability-anatomy ${className}`}>
      <div className={cellClass(1)}><small>{language === "zh" ? "01 · 它能帮你做什么" : "01 · WHAT IT DOES"}</small><strong>{purpose}</strong></div>
      <div className={cellClass(1)}><small>{language === "zh" ? "02 · 什么时候会用到" : "02 · WHEN TO USE IT"}</small><span>{when}</span></div>
      <div className={cellClass(2)}><small>{language === "zh" ? "03 · 你只要告诉 AI" : "03 · WHAT YOU PROVIDE"}</small><span>{input}</span></div>
      <div className={cellClass(2)}><small>{language === "zh" ? "04 · 它会交给你" : "04 · WHAT YOU GET"}</small><span>{output}</span></div>
    </div>
  );
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("zh");
  const [theme, setTheme] = useState<Theme>("light");
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionScene, setTransitionScene] = useState(0);
  const [revealStep, setRevealStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const wheelLock = useRef(false);
  const transitionLock = useRef(false);
  const transitionTimers = useRef<number[]>([]);
  const chapters = chapterTitles[language];
  const t = (zh: string, en: string) => language === "zh" ? zh : en;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const savedLanguage = window.localStorage.getItem("codex-tips-language");
      const savedTheme = window.localStorage.getItem("codex-tips-theme");
      if (savedLanguage === "zh" || savedLanguage === "en") setLanguage(savedLanguage);
      if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
      else if (window.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
      setPreferencesReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.documentElement.dataset.language = language;
    if (preferencesReady) window.localStorage.setItem("codex-tips-language", language);
  }, [language, preferencesReady]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (preferencesReady) window.localStorage.setItem("codex-tips-theme", theme);
  }, [preferencesReady, theme]);

  const go = useCallback((next: number, targetReveal = 0) => {
    if (transitionLock.current) return;
    const safe = Math.max(0, Math.min(chapterTitles.zh.length - 1, next));
    if (safe === scene) return;
    const nextDirection = safe > scene ? 1 : -1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setDirection(nextDirection);
    if (reduceMotion) { setRevealStep(targetReveal); setScene(safe); return; }

    transitionLock.current = true;
    transitionTimers.current.forEach(window.clearTimeout);
    transitionTimers.current = [];
    setTransitionScene(safe);
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
      if (event.key === "End") { const last = chapterTitles.zh.length - 1; if (scene === last) setRevealStep(sceneMaxSteps[last]); else go(last, sceneMaxSteps[last]); }
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
  const assetInfo = ["PUMP-204", t("离心泵总成", "Centrifugal pump assembly"), "v3.2", t("待审核", "Pending review")];
  const maxReveal = sceneMaxSteps[scene];
  const progress = `${((scene + (revealStep + 1) / (maxReveal + 1)) / chapters.length) * 100}%`;
  const revealClass = (step: number, className = "") => `${className} reveal-block ${revealStep >= step ? "revealed" : ""}`;
  const angle = scene === 4 ? (revealStep >= 4 ? 3 : revealStep >= 3 ? 1 : 0) : 0;
  const testStatus: "idle" | "running" | "passed" = scene === 4 ? (revealStep >= 4 ? "passed" : revealStep >= 3 ? "running" : "idle") : "idle";

  return (
    <main className="guide">
      <div className="paper-grain" />
      <header className="topbar">
        <button className="wordmark" onClick={() => scene === 0 ? setRevealStep(0) : go(0, 0)}><b>C</b><span>{t("Codex小技巧", "Codex Tips")}</span></button>
        <div className="topbar-tools">
          <span>{t("滚轮逐步展开", "Scroll to reveal")} · {revealStep + 1} / {maxReveal + 1}</span>
          <button className="icon-control language-control" onClick={() => setLanguage(current => current === "zh" ? "en" : "zh")} aria-label={t("切换到英文", "Switch to Chinese")} title={t("切换到英文", "Switch to Chinese")}><b>{language === "zh" ? "EN" : "中"}</b></button>
          <button className="icon-control theme-control" onClick={() => setTheme(current => current === "light" ? "dark" : "light")} aria-label={theme === "light" ? t("切换到夜间模式", "Switch to dark mode") : t("切换到日间模式", "Switch to light mode")} title={theme === "light" ? t("切换到夜间模式", "Switch to dark mode") : t("切换到日间模式", "Switch to light mode")}><span aria-hidden="true">{theme === "light" ? "☾" : "☀"}</span></button>
        </div>
      </header>

      <nav className="chapter-rail" aria-label={t("章节导航", "Chapter navigation")}>
        {chapters.map((title, index) => <button key={title} className={index === scene ? "active" : index < scene ? "done" : ""} onClick={() => go(index, 0)}><b>{index + 1}</b><span>{title}</span></button>)}
      </nav>

      <section className="stage" aria-live="polite">
        {transitioning && <div className={`soft-wipe ${direction > 0 ? "forward" : "backward"}`} aria-hidden="true"><i /><i /><i /><b>{chapters[transitionScene]}</b></div>}

        {scene === 0 && (
          <article className={`${lessonClass} cover`}>
            <div className="cover-copy">
              <div className="overline">FROM PROMPT TO PROOF · CODEX</div>
              <h1>{t("Codex小技巧", "Codex Tips")}<span className="case-title">{t("用一个 3D 仿真资产管理网站，读懂 AI 开发闭环", "Learn the AI development loop through a 3D simulation asset platform")}</span></h1>
              <p>{t("这不是命令清单。五个技巧会分别帮你想清楚怎么做、持续完成大任务、自动操作网页、审查代码和定位 Bug。", "This is not a command list. Five practical techniques help you plan clearly, finish long projects, automate the browser, review code, and diagnose bugs.")}</p>
              <div className={revealClass(1, "cover-thesis")}><b>{t("你会学到什么", "WHAT YOU WILL LEARN")}</b><span>{t("先把事情看明白，再让 AI 开始做，最后检查它是否真的做好了。", "Understand the work first, let AI execute second, then verify that the result is truly complete.")}</span></div>
              <button className={revealClass(2, "primary")} onClick={() => go(1)}>{t("从资产生命周期开始", "Start with the asset lifecycle")} <b>→</b></button>
            </div>
            <div className={revealClass(1, "cover-product")} aria-hidden="true">
              <div className="cover-ui-head"><i/><i/><i/><span>Simulation Asset Hub</span></div>
              <div className="cover-ui-body">
                <aside><b>SA</b><span>{t("资产库", "Assets")}</span><span>{t("版本", "Versions")}</span><span>{t("审核", "Review")}</span></aside>
                <section><div className="cover-model"><div className="iso-cube"><i className="front"/><i className="right"/><i className="top"/></div><span>3D PREVIEW</span></div><div className="cover-meta"><small>PUMP-204</small><h3>{t("离心泵总成", "Centrifugal pump assembly")}</h3><p>GLB · 42.8 MB · v3.2</p><div><b>{t("已审核", "Approved")}</b><span>{t("12 个版本", "12 versions")}</span></div></div></section>
              </div>
              <div className="cover-caption"><small>{t("贯穿案例", "RUNNING EXAMPLE")}</small><b>{t("上传 → 转换 → 预览 → 审核 → 发布", "Upload → Convert → Preview → Review → Publish")}</b></div>
            </div>
          </article>
        )}

        {scene === 1 && (
          <article className={`${lessonClass} brief`}>
            <div className="section-no">{t("00 · 先理解案例", "00 · UNDERSTAND THE EXAMPLE")}</div>
            <div className="statement"><h2>{t("“管理 3D 资产”听起来简单，", "“Manage 3D assets” sounds simple,")}<br /><span>{t("背后其实是一整条生命周期。", "but it is really a complete lifecycle.")}</span></h2><p>{t("一个资产不只是模型文件，还包括贴图、缩略图、版本、审核记录和发布状态。", "An asset is more than a model file. It also includes textures, thumbnails, versions, review history, and publishing state.")}</p></div>
            <div className={revealClass(1, "platform-brief")}>
              <div className="asset-definition"><small>{t("什么是一个 3D 仿真资产？", "WHAT IS A 3D SIMULATION ASSET?")}</small><h3>{t("文件 + 数据 + 流程", "Files + Data + Workflow")}</h3><div className="asset-stack"><span><b>01</b>{t("GLB / FBX 模型", "GLB / FBX model")}</span><span><b>02</b>{t("贴图与材质", "Textures and materials")}</span><span><b>03</b>{t("名称、标签、尺寸", "Name, tags, dimensions")}</span><span><b>04</b>{t("版本与审核记录", "Versions and review history")}</span><span><b>05</b>{t("发布到仿真环境", "Published to simulation")}</span></div></div>
              <div className="lifecycle"><small>{t("核心流程", "CORE WORKFLOW")}</small>{(language === "zh" ? [["上传","技术美术提交模型"],["转换","生成统一格式与缩略图"],["预览","浏览器检查模型和贴图"],["审核","负责人通过或退回"],["发布","进入正式仿真资产库"]] : [["Upload","Artist submits the model"],["Convert","Generate standard formats and thumbnails"],["Preview","Check model and textures in browser"],["Review","Owner approves or returns it"],["Publish","Release to the simulation library"]]).map(([title,description],i)=><div key={title}><b>0{i+1}</b><span><strong>{title}</strong><em>{description}</em></span></div>)}</div>
              <div className="capability-route"><small>{t("五个技巧分别解决什么问题", "WHAT EACH TECHNIQUE SOLVES")}</small><div><b>{t("PLAN x 流程图", "PLAN x Flowchart")}</b><span><strong>{t("文字计划和图一起看", "Read the plan and diagram together")}</strong><em>{t("让 AI 多画图，人更容易确认", "Ask AI to draw more; humans review faster")}</em></span></div><div><b>UltraGoal</b><span><strong>{t("让大项目持续跑到完成", "Keep long projects moving to completion")}</strong><em>{t("中断、失败也能接着做", "Resume after interruptions or failures")}</em></span></div><div><b>Browser</b><span><strong>{t("自动测试 + 写飞书", "Automate tests + write Feishu docs")}</strong><em>{t("替你操作真实网页", "Operate real websites for you")}</em></span></div><div><b>OMX CodeReview</b><span><strong>{t("合并前再检查", "Review before merge")}</strong><em>{t("找出自己没看到的问题", "Catch what you missed")}</em></span></div><div><b>Debugger</b><span><strong>{t("先找到真正原因", "Find the real cause first")}</strong><em>{t("避免乱改代码", "Avoid guess-driven fixes")}</em></span></div></div>
            </div>
            <div className={revealClass(2, "plain-note")}><b>{t("给小白的比喻", "A SIMPLE ANALOGY")}</b><span>{t("平台像一个 3D 模型仓库：每个模型有身份证、历史版本、质检记录和正式上架状态。", "Think of the platform as a 3D model warehouse: every model has an ID, version history, inspection record, and shelf status.")}</span></div>
          </article>
        )}

        {scene === 2 && (
          <article className={`${lessonClass} compare-scene`}>
            <div className="section-no">{t("01 · PLAN x 流程图（Mermaid）", "01 · PLAN x FLOWCHART (MERMAID)")}</div>
            <div className="statement"><h2>{t("PLAN 负责想清楚怎么做，", "PLAN works out what to do,")}<br /><span>{t("流程图（Mermaid）负责让人一眼看懂。", "a flowchart (Mermaid) makes it instantly understandable.")}</span></h2><p>{t("一定要让 AI 多画图：文字 Plan 说明要做什么，流程图展示顺序、分支和异常。人先看图找遗漏，AI 同步修改，确认后再写代码。", "Ask AI to draw often: the written Plan says what to build, while diagrams expose sequence, branches, and failures. Humans spot gaps in the picture, AI updates both, and coding starts only after approval.")}</p></div>
            <Capability
              language={language}
              className={revealClass(1)}
              revealStep={revealStep}
              purpose={t("先得到有顺序的开发计划，再用流程图把步骤、分支和异常情况讲明白。", "Create an ordered development plan, then use a flowchart to explain steps, branches, and failure paths.")}
              when={t("功能涉及多个模块，文字计划不容易快速看懂，也担心 AI 理解错需求时。", "Use it when a feature spans multiple modules, a text plan is hard to scan, or AI may have misunderstood the requirement.")}
              input={t("需求、相关代码、不能违反的限制，以及最后怎样才算完成。", "Provide the requirement, relevant code, hard constraints, and the definition of done.")}
              output={t("一份文字 Plan、一张配套流程图（Mermaid），以及需要人确认的问题。", "You get a written Plan, a matching Mermaid flowchart, and the questions that need human confirmation.")}
            />
            <div className={revealClass(3, "comparison")}>
              <div className="compare-card native"><div className="compare-title"><span>{t("AI 输出 01", "AI OUTPUT 01")}</span><h3>{t("文字 Plan", "Written Plan")}</h3></div><p>{t("先把模块、顺序、限制和测试写清楚，让人确认 AI 是否真正理解了需求。", "Clarify modules, order, constraints, and tests so a human can verify that AI understood the requirement.")}</p><Command language={language} title={t("PLAN 案例", "PLAN EXAMPLE")} onCopy={copy}>{t('$plan --direct "不要修改代码。先为 3D 资产上传、转换、预览、审核和发布制定开发 Plan；列出模块、顺序、限制、风险、测试和需要人确认的问题。"', '$plan --direct "Do not modify code. First create a development Plan for 3D asset upload, conversion, preview, review, and publishing. List modules, order, constraints, risks, tests, and questions requiring human confirmation."')}</Command><ul><li>{t("拆清模块和先后顺序", "Separate modules and sequence")}</li><li>{t("列出限制、风险与验收标准", "List constraints, risks, and acceptance criteria")}</li><li>{t("暂不改代码，先让人确认", "Do not code yet; ask for human approval")}</li></ul><div className="fit">{t("第一份产物：可审阅的文字 Plan", "FIRST OUTPUT: A REVIEWABLE WRITTEN PLAN")}</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">{t("本教程推荐", "RECOMMENDED")}</div><div className="compare-title"><span>{t("AI 输出 02", "AI OUTPUT 02")}</span><h3>{t("流程图（Mermaid）", "Flowchart (Mermaid)")}</h3></div><p>{t("让 AI 把正常流程和失败分支都画出来。人看图发现遗漏，再同步修改流程图与 Plan。", "Ask AI to draw both the happy path and failure branches. Humans find omissions in the diagram, then AI updates the diagram and Plan together.")}</p><Command language={language} title={t("流程图示例", "FLOWCHART EXAMPLE")} onCopy={copy}>{t("flowchart TD; A[上传] --> B{校验}; B -->|通过| C[转换]; B -->|失败| D[说明原因]; C --> E{审核}; E -->|退回| F[修改]; E -->|通过| G[发布]", "flowchart TD; A[Upload] --> B{Validate}; B -->|Pass| C[Convert]; B -->|Fail| D[Explain]; C --> E{Review}; E -->|Return| F[Revise]; E -->|Pass| G[Publish]")}</Command><ul><li>{t("正常步骤和失败分支一起画", "Draw success and failure paths together")}</li><li>{t("人看图补充权限、退回等遗漏", "Humans add missing permissions and return paths")}</li><li>{t("图与 Plan 一起确认后再写代码", "Approve the diagram and Plan before coding")}</li></ul><div className="fit strong">{t("关键：先看图确认，再让 AI 开工", "KEY: REVIEW THE DIAGRAM BEFORE AI STARTS")}</div></div>
            </div>
            <div className={revealClass(4, "recommendation coral")}><b>{t("让 AI 多画图", "ASK AI TO DRAW MORE")}</b><span>{t("需求与代码 → AI 输出 Plan + 流程图 → 人看图 Review → AI 同步修改 → 确认后再写代码和测试。", "Requirement + code → AI outputs Plan + flowchart → human reviews the diagram → AI updates both → coding and tests begin after approval.")}</span></div>
          </article>
        )}

        {scene === 3 && (
          <article className={`${lessonClass} compare-scene`}>
            <div className="section-no">02 · GOAL VS OMX ULTRAGOAL</div>
            <div className="statement"><h2>{t("Goal 盯住一个任务，", "Goal keeps one task on track,")}<br /><span>{t("UltraGoal 把一个大项目持续做到验收通过。", "UltraGoal keeps a whole project moving until it passes acceptance.")}</span></h2><p>{t("它不只是“拆任务”：进度会保存在项目里；中断后可以继续，失败后可以重试，检查不通过就不会假装已经完成。", "It does more than split work: progress is stored in the repository, interrupted work resumes, failed tasks retry, and incomplete checks cannot be reported as done.")}</p></div>
            <Capability
              language={language}
              className={revealClass(1)}
              revealStep={revealStep}
              purpose={t("Goal 完成一个明确任务；UltraGoal 会自动拆解并持续推进整个项目，直到真正通过验收。", "Goal completes one clear task. UltraGoal decomposes and advances an entire project until acceptance truly passes.")}
              when={t("任务横跨设计、开发、测试、Review 或性能排查，今天做不完、明天还要继续时。", "Use it when work spans design, development, testing, review, or performance analysis and must continue across sessions.")}
              input={t("最终目标、不能触碰的边界、怎样才算完成，以及必须通过哪些检查。", "Provide the final objective, hard boundaries, definition of done, and required quality gates.")}
              output={t("保存下来的任务与进度、每一步的结果、失败记录，以及通过测试和 Review 的最终产物。", "You get durable tasks and progress, results for every step, failure records, and a final deliverable that passed tests and review.")}
            />
            <div className={revealClass(3, "comparison")}>
              <div className="compare-card native"><div className="compare-title"><span>{t("Codex 原生", "NATIVE CODEX")}</span><h3>Goal</h3></div><p>{t("像一张验收目标卡。适合范围清楚、步骤少、当前线程可以完成的任务。", "Think of it as an acceptance card: ideal for scoped work with few steps that one task can finish.")}</p><Command language={language} title={t("平台里的用法", "HOW TO USE IT")} onCopy={copy}>{t("创建 Goal：为资产列表增加标签筛选，并用浏览器测试证明 URL、筛选结果和空状态正确。", "Create a Goal: add tag filtering to the asset list and use browser tests to prove the URL, filtered results, and empty state are correct.")}</Command><ul><li>{t("一个目标", "One objective")}</li><li>{t("一个成功标准", "One success criterion")}</li><li>{t("由当前线程持续推进", "Advanced by the current task")}</li></ul><div className="fit">{t("适合：标签筛选、单个 Bug、小功能", "BEST FOR: FILTERS, ONE BUG, SMALL FEATURES")}</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">{t("本教程推荐", "RECOMMENDED")}</div><div className="compare-title"><span>Oh My Codex</span><h3>UltraGoal</h3></div><p>{t("像一位会记住全部进度的项目负责人：自己安排下一步，遇到失败留下记录，修好后继续，最终用测试和独立 Review 把关。", "It acts like a project lead with durable memory: it chooses the next step, records failures, resumes after fixes, and uses tests plus independent review as quality gates.")}</p><Command language={language} title={t("完整项目案例", "FULL PROJECT EXAMPLE")} onCopy={copy}>{t('omx ultragoal create-goals --brief "开发 3D 仿真资产管理网站：完成页面设计、资产接口、上传转换、3D 预览、版本审核、飞书文档、浏览器自动化测试和加载速度排查；所有测试与 OMX CodeReview 通过后才算完成"', 'omx ultragoal create-goals --brief "Build a 3D simulation asset platform: deliver UI design, asset APIs, upload and conversion, 3D preview, version review, Feishu documentation, automated browser tests, and load-performance analysis. Finish only after all tests and OMX CodeReview pass."')}</Command><ul><li>{t("进度保存在项目里，换会话仍能继续", "Progress stays in the repository and survives new sessions")}</li><li>{t("失败会留下原因，可以从失败任务重试", "Failures retain causes and can be retried")}</li><li>{t("测试、OMX CodeReview 和整体设计检查全部通过才结束", "Tests, OMX CodeReview, and design checks must all pass")}</li></ul><div className="fit strong">{t("适合：完整平台、较长任务、性能排查", "BEST FOR: FULL PRODUCTS, LONG TASKS, PERFORMANCE WORK")}</div></div>
            </div>
            <div className={revealClass(4, "recommendation coral")}><b>{t("真正强的地方", "WHY IT IS POWERFUL")}</b><span>{t("UltraGoal 把目标、进度、失败和验证结果都保存下来；执行中发现新问题，还能根据证据调整后续任务。它追求的不是“AI 跑了很久”，而是“项目真的交付并通过检查”。", "UltraGoal preserves objectives, progress, failures, and verification evidence. When execution reveals new issues, it updates later work based on that evidence. The goal is not “AI ran for a long time”; it is “the project shipped and passed its checks.”")}</span></div>
          </article>
        )}

        {scene === 4 && (
          <article className={`${lessonClass} browser-scene`}>
            <div className="section-no">03 · BROWSER PLUGIN</div>
            <div className="statement"><h2>{t("Browser 插件：", "Browser plugin:")}<br /><span>{t("自动完成网页测试，也能自动编写飞书云文档。", "fully automate web tests and write Feishu cloud documents.")}</span></h2><p>{t("给它网址、步骤和正确结果，它可以从头跑完整测试并留下证据；飞书文档在网页端授权后，把链接复制到 Codex Chrome 插件，它就能进入指定文档继续操作。", "Give it a URL, steps, and expected results to run an end-to-end test with evidence. After authorizing a Feishu document in the web app, paste its link into the Codex Chrome plugin and AI can continue working inside that exact document.")}</p></div>
            <Capability
              language={language}
              className={revealClass(1)}
              revealStep={revealStep}
              purpose={t("替你完成两类重复工作：全流程网页自动化测试，以及打开飞书编写云文档。", "Automate two repetitive jobs: full web user-flow testing and writing cloud documents directly in Feishu.")}
              when={t("需要完整验证一条用户流程，或者要把测试和项目结果正式整理进飞书时。", "Use it to validate a complete user journey or turn test and project results into a polished Feishu document.")}
              input={t("测试网址、操作步骤和正确结果；写飞书时，再提供已授权的云文档链接和内容要求。", "Provide the test URL, actions, and expected results. For Feishu, add an authorized document link and content requirements.")}
              output={t("自动化测试记录、页面状态与截图，以及已经写入并校对好的飞书云文档。", "You get automated test logs, page states and screenshots, plus a completed and proofread Feishu cloud document.")}
            />
            <div className={revealClass(3, "browser-sequence")}>
              <section className={revealClass(3, "browser-phase test-phase")}>
                <div className="phase-heading"><b>01</b><span><strong>{t("自动跑完整测试", "RUN THE FULL TEST AUTOMATICALLY")}</strong><small>{t("从打开页面到输出结果，整条流程自动完成", "From opening the page to reporting results, the entire flow runs automatically")}</small></span></div>
                <div className="browser-spread">
                  <div className="browser-instruction"><Command language={language} title={t("Browser 测试提示词", "BROWSER TEST PROMPT")} onCopy={copy}>{t("打开本地 3D 资产网站；搜索 PUMP-204，进入详情，旋转模型确认预览可用，提交审核，并确认状态从“草稿”变成“待审核”。", "Open the local 3D asset site. Search for PUMP-204, open its details, rotate the model to verify the preview, submit it for review, and confirm the status changes from Draft to Pending review.")}</Command><div className="test-log"><small>{t("AUTOMATION STEPS · 随滚轮推进", "AUTOMATION STEPS · ADVANCE WITH SCROLL")}</small><span className={testStatus!=="idle"?"done":"active"}>{t("1. 搜索 PUMP-204", "1. Search PUMP-204")}</span><span className={angle>=1?"done":""}>{t("2. 打开 3D 预览", "2. Open 3D preview")}</span><span className={angle>=2?"done":""}>{t("3. 旋转检查模型", "3. Rotate and inspect the model")}</span><span className={angle>=3?"done":""}>{t("4. 读取资产信息", "4. Read asset metadata")}</span><span className={testStatus==="passed"?"done":""}>{t("5. 确认结果正确", "5. Verify the expected result")}</span></div></div>
                  <div className="mini-browser"><div className="mini-bar"><i/><i/><i/><span>localhost:3000/assets/PUMP-204</span></div><div className="asset-app"><aside><div className="asset-row active"><b>P</b><span>{t("离心泵", "Pump")}</span></div><div className="asset-row"><b>R</b><span>{t("机械臂", "Robot arm")}</span></div><div className="asset-row"><b>W</b><span>{t("自动仓库", "Warehouse")}</span></div></aside><section><div className="viewer"><div className={`model-proxy angle-${angle}`}><i className="front"/><i className="back"/><i className="right"/><i className="left"/><i className="top"/><i className="bottom"/><span/></div><div className="viewer-grid"/>{testStatus==="passed"&&<em>✓ {t("预览测试通过", "Preview test passed")}</em>}</div><div className="asset-meta"><small>{assetInfo[0]}</small><h3>{assetInfo[1]}</h3><p>GLB · 42.8 MB · {assetInfo[2]}</p><div><span>{t("状态", "Status")}</span><b>{testStatus==="passed"?t("待审核", "Pending review"):t("草稿", "Draft")}</b></div><div><span>{t("贴图", "Textures")}</span><b>8 / 8 {t("正常", "OK")}</b></div><div><span>{t("三角面", "Triangles")}</span><b>124,860</b></div></div></section></div></div>
                </div>
              </section>
              <section className={revealClass(5, "browser-phase docs-phase")}>
                <div className="phase-heading"><b>02</b><span><strong>{t("自动编写飞书云文档", "WRITE FEISHU CLOUD DOCS AUTOMATICALLY")}</strong><small>{t("通过文档链接进入指定页面，填写、排版并校对内容", "Open the exact page from its link, write, format, and proofread the content")}</small></span></div>
                <div className="docs-compact"><Command language={language} title={t("飞书文档提示词", "FEISHU DOCUMENT PROMPT")} onCopy={copy}>{t("打开这个已授权的飞书云文档链接：https://example.feishu.cn/docx/asset-weekly；根据刚才的自动化测试结果和资产库数据，填写《仿真资产周报》，包含资产清单、测试结果、风险、负责人和下周计划；完成排版并检查内容是否保存成功。", "Open this authorized Feishu cloud document: https://example.feishu.cn/docx/asset-weekly. Using the automated test results and asset data, complete the Simulation Asset Weekly Report with the asset list, test results, risks, owners, and next-week plan. Format it and verify that it saved successfully.")}</Command><div className="permission-note"><b>{t("连接方法", "HOW TO CONNECT")}</b><span>{t("网页端登录飞书并授权文档 → 复制云文档链接 → 粘贴到 Codex Chrome 插件 → AI 自动打开并操作该文档。", "Sign in to Feishu and authorize the document → copy its cloud link → paste it into the Codex Chrome plugin → AI opens and operates that document automatically.")}</span></div><div className="doc-page"><small>{t("仿真资产周报 · Week 28", "SIMULATION ASSET WEEKLY · WEEK 28")}</small><h3>3D Asset Operations</h3><p>{t("本周新增 42 个资产，已审核 31 个，转换失败 3 个。", "42 assets added this week, 31 approved, and 3 conversion failures.")}</p><h4>{t("需要关注", "NEEDS ATTENTION")}</h4><div className="doc-table"><span>PUMP-204 <b>{t("自动化测试通过", "Automation passed")}</b></span><span>ROBOT-018 <b>{t("待审核", "Pending review")}</b></span><span>WH-031 <b>{t("贴图缺失", "Missing texture")}</b></span></div><em>{t("Browser 已完成打开、录入、排版、保存与校对", "Browser completed opening, writing, formatting, saving, and proofreading")}</em></div></div>
              </section>
            </div>
          </article>
        )}

        {scene === 5 && (
          <article className={`${lessonClass} compare-scene review-compare`}>
            <div className="section-no">04 · REVIEW VS OMX CODEREVIEW</div>
            <div className="statement"><h2>{t("OMX CodeReview：", "OMX CodeReview:")}<br /><span>{t("在合并代码前，请独立的 AI 审查组帮你挑问题。", "ask an independent AI review team to challenge the code before merge.")}</span></h2><p>{t("它会重点检查有没有 Bug、安全风险、性能问题和缺少的测试，并告诉你是否适合合并。", "It looks for bugs, security risks, performance issues, and missing tests, then tells you whether the change is ready to merge.")}</p></div>
            <Capability
              language={language}
              className={revealClass(1)}
              revealStep={revealStep}
              purpose={t("在代码合并前，帮你找出自己容易忽略的 Bug、风险和设计问题。", "Find bugs, risks, and design problems that are easy to miss before code is merged.")}
              when={t("功能已经做完准备合并，或者这次改动比较重要时。", "Use it when a feature is ready to merge or the change is important.")}
              input={t("这次改了什么、原始需求、重要限制和已经跑过的测试。", "Provide what changed, the original requirement, important constraints, and tests already run.")}
              output={t("问题在哪里、严重不严重、怎样修改，以及是否建议合并。", "You get issue locations, severity, recommended fixes, and a merge recommendation.")}
            />
            <div className={revealClass(3, "comparison")}>
              <div className="compare-card native"><div className="compare-title"><span>{t("Codex 快速入口", "QUICK CODEX ENTRY")}</span><h3>Review</h3></div><p>{t("快速检查一个文件或一小段改动，找出比较明显的问题。", "Quickly inspect one file or a small change and catch obvious issues.")}</p><Command language={language} title={t("小改动案例", "SMALL CHANGE EXAMPLE")} onCopy={copy}>{t("/review 检查本次 3D 文件上传逻辑，重点看文件检查、权限、出错处理和测试。", "/review Inspect this 3D file-upload change, focusing on validation, permissions, error handling, and tests.")}</Command><ul><li>{t("速度快", "Fast")}</li><li>{t("适合正在开发的小改动", "Good for small changes in progress")}</li><li>{t("只检查你这次交给它的内容", "Reviews only the scope you provide")}</li></ul><div className="fit">{t("适合：边写边检查", "BEST FOR: REVIEW WHILE CODING")}</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">{t("合并前推荐", "RECOMMENDED BEFORE MERGE")}</div><div className="compare-title"><span>Oh My Codex</span><h3>OMX CodeReview</h3></div><p>{t("由两组 AI 分别检查代码细节和整体设计，减少同一种思路反复看漏问题。", "Two AI review groups inspect code details and overall design independently, reducing blind spots from a single line of thinking.")}</p><Command language={language} title={t("重要改动案例", "IMPORTANT CHANGE EXAMPLE")} onCopy={copy}>{t("调用 OMX CodeReview，检查 3D 资产上传与转换功能：有没有安全问题、功能错误、速度问题，以及遗漏的测试。", "Run OMX CodeReview on the 3D asset upload and conversion feature. Check for security problems, functional errors, performance issues, and missing tests.")}</Command><ul><li>{t("第一组检查代码和测试", "One group checks code and tests")}</li><li>{t("第二组检查整体设计是否合理", "Another checks the overall design")}</li><li>{t("最后给出“可以合并”或“需要修改”", "The final verdict is merge or revise")}</li></ul><div className="fit strong">{t("适合：重要功能和正式合并", "BEST FOR: IMPORTANT FEATURES AND FORMAL MERGES")}</div></div>
            </div>
            <div className={revealClass(4, "review-example")}><b>{t("发现一个严重问题：暂时不要合并", "CRITICAL ISSUE FOUND: DO NOT MERGE YET")}</b><span>{t("上传 ZIP 时可能把文件写到不该写的位置；超大文件还可能让服务器内存不够用。", "A ZIP upload may write files outside the allowed directory, while oversized files may exhaust server memory.")}</span><em>{t("问题位置：api/assets/upload.ts 第 71 行 · 建议先修改", "Location: api/assets/upload.ts line 71 · Fix before merge")}</em></div>
          </article>
        )}

        {scene === 6 && (
          <article className={`${lessonClass} debug-scene`}>
            <div className="section-no">05 · DEBUGGER</div>
            <div className="statement"><h2>{t("Debugger：", "Debugger:")}<br /><span>{t("先查清 Bug 为什么发生，再动手修改。", "find out why a bug happens before changing code.")}</span></h2><p>{t("它不会一上来就猜着改代码，而是先让问题稳定出现，再一步步缩小范围并确认真正原因。", "Instead of guessing at a fix, it first reproduces the problem, narrows the search step by step, and confirms the real cause.")}</p></div>
            <Capability
              language={language}
              className={revealClass(1)}
              revealStep={revealStep}
              purpose={t("不靠猜，按照证据一步步找到 Bug 的真正原因。", "Find the true cause of a bug step by step using evidence, not guesses.")}
              when={t("Bug 反复出现、只在某些环境出现，或者已经修过几次仍然复发时。", "Use it when a bug recurs, appears only in certain environments, or returns after several fixes.")}
              input={t("你看到了什么、正确结果应该是什么、相关日志和最近改动。", "Provide the observed behavior, expected behavior, relevant logs, and recent changes.")}
              output={t("怎样稳定复现、真正原因、最小修改，以及防止再次发生的测试。", "You get reliable reproduction steps, the root cause, a minimal fix, and a regression test.")}
            />
            <div className={revealClass(3, "debug-spread")}>
              <div><Command language={language} title={t("Debugger 提示词", "DEBUGGER PROMPT")} onCopy={copy}>{t("使用 debugger 智能体调查：WH-031 在 Windows 正常，但部署到 Linux 后 3D 预览变黑。先稳定重现，不要先改代码；说明问题经过、真正原因、最小修改和防止再次发生的测试。", "Use the debugger agent to investigate: WH-031 works on Windows, but its 3D preview turns black on Linux. Reproduce it reliably before changing code. Explain the evidence, root cause, smallest fix, and regression test.")}</Command><div className="debug-analogy"><b>{t("像侦探一样工作", "WORK LIKE A DETECTIVE")}</b><span>{t("现象：模型变黑", "Symptom: model turns black")}</span><span>{t("线索：只有 Linux 失败", "Clue: only Linux fails")}</span><span>{t("真正原因必须能用测试证明", "The cause must be proven by a test")}</span></div></div>
              <div className="timeline"><small>DEBUG TRACE · WH-031</small>{(language === "zh" ? [["T+00","读取 glTF 材质","baseColorTexture","ok"],["T+12","请求 BaseColor.PNG","Windows 200","ok"],["T+13","Linux 区分大小写","basecolor.png 404","bad"],["FIX","上传时规范化贴图名","重写 glTF URI","good"],["TEST","三种系统运行 30 组资产","30 / 30 通过","good"]] : [["T+00","Read glTF material","baseColorTexture","ok"],["T+12","Request BaseColor.PNG","Windows 200","ok"],["T+13","Linux is case-sensitive","basecolor.png 404","bad"],["FIX","Normalize texture names","Rewrite glTF URI","good"],["TEST","30 assets on 3 systems","30 / 30 passed","good"]]).map(([time,event,result,status])=><div key={time} className={status}><b>{time}</b><span>{event}</span><em>{result}</em></div>)}</div>
            </div>
            <div className={revealClass(4, "debug-chain")}><span>{t("让问题再次出现", "Reproduce")}</span><i>→</i><span>{t("比较不同环境", "Compare environments")}</span><i>→</i><span>{t("确认真正原因", "Confirm root cause")}</span><i>→</i><span>{t("只改必要部分", "Make the smallest fix")}</span><i>→</i><b>{t("各个平台重新测试", "Retest every platform")}</b></div>
          </article>
        )}

        {scene === 7 && (
          <article className={`${lessonClass} summary-scene`}>
            <div className="section-no">{t("06 · 现在你会选了", "06 · NOW YOU CAN CHOOSE")}</div>
            <div className="summary-title"><h2>{t("五个小技巧，", "Five practical techniques,")}<br /><span>{t("组成一条完整的 AI 开发流程。", "one complete AI development workflow.")}</span></h2><p>{t("先让人看懂和确认，再让 AI 执行，最后用真实证据检查结果。", "First make the work understandable and reviewable, then let AI execute, and finally verify the result with real evidence.")}</p></div>
            <div className={revealClass(1, "summary-list")}>{(language === "zh" ? [["PLAN x 流程图（Mermaid）","计划太长，不容易发现 AI 理解错了哪里","最后得到：文字 Plan、多张配套流程图和人工确认后的规则"],["OMX UltraGoal","大项目跨很多阶段，容易中断或漏验收","最后得到：可恢复的执行进度，以及通过测试和 Review 的完整产物"],["Browser","测试网页和写飞书文档太重复","最后得到：完整自动化测试证据，以及已编写好的飞书云文档"],["OMX CodeReview","自己写的代码容易看漏问题","最后得到：问题位置、修改建议和是否合并的结论"],["Debugger","只看到了 Bug，却不知道真正原因","最后得到：复现方法、真正原因、修改和防复发测试"]] : [["PLAN x Flowchart (Mermaid)","Long plans hide where AI misunderstood the work","Result: a written Plan, matching diagrams, and human-approved rules"],["OMX UltraGoal","Long projects are easily interrupted or under-verified","Result: recoverable progress and a complete deliverable that passed tests and review"],["Browser","Web testing and Feishu documentation are repetitive","Result: full automation evidence and a completed Feishu document"],["OMX CodeReview","It is easy to miss problems in your own code","Result: issue locations, fix guidance, and a merge verdict"],["Debugger","You see the bug but do not know the true cause","Result: reproduction, root cause, fix, and regression test"]]).map(([name,why,deliverable],i)=><div key={name}><b>0{i+1}</b><span><strong>{name}</strong><small>{why}</small></span><p>{deliverable}</p></div>)}</div>
            <div className={revealClass(2, "closing")}><b>{t("给小白的一句话", "THE BEGINNER VERSION")}</b><span>{t("先让 AI 把系统讲明白，再让 UltraGoal 自动做；每一步都要求留下可以检查的证据。", "Ask AI to explain the system first, let UltraGoal execute second, and require checkable evidence at every step.")}</span></div>
          </article>
        )}

        {scene === 8 && (
          <article className={`${lessonClass} appendix-scene`}>
            <div className="section-no">{t("附录 · OH MY CODEX", "APPENDIX · OH MY CODEX")}</div>
            <div className="statement"><h2>{t("Oh My Codex：", "Oh My Codex:")}<br /><span>{t("把零散的 AI 命令，变成可以持续运行的开发流程。", "turn isolated AI commands into durable development workflows.")}</span></h2><p>{t("它不是另一个 AI 模型，而是 Codex 的工作流与多智能体扩展：负责澄清需求、规划、长期执行、协作、Review 和质量检查。", "It is not another AI model. It extends Codex with workflows and multi-agent coordination for clarification, planning, durable execution, collaboration, review, and quality checks.")}</p></div>
            <div className={revealClass(1, "omx-command-groups")}>
              {(language === "zh" ? [["先想清楚",[["$deep-interview","通过提问把模糊需求问清楚"],["$ralplan","让多个角色共同检查并完善计划"]]],["自动执行",[["$autopilot","串起规划、执行、Review 和 QA 的完整闭环"],["$team","让多个智能体并行处理不同子任务"]]],["质量提升",[["$ultraqa","生成更刁钻的端到端场景并反复验证"],["$performance-goal","持续定位和优化性能问题"]]],["项目维护",[["$wiki","把项目知识保存成可搜索的长期文档"],["$doctor","检查 Oh My Codex 是否安装和运行正常"]]]] : [["CLARIFY FIRST",[["$deep-interview","Clarify ambiguous requirements through focused questions"],["$ralplan","Have multiple roles challenge and improve the plan"]]],["AUTOMATE EXECUTION",[["$autopilot","Connect planning, execution, review, and QA into one loop"],["$team","Run different subtasks with multiple agents in parallel"]]],["RAISE QUALITY",[["$ultraqa","Generate hostile end-to-end scenarios and verify repeatedly"],["$performance-goal","Continuously diagnose and optimize performance"]]],["MAINTAIN THE PROJECT",[["$wiki","Store project knowledge as searchable long-term documentation"],["$doctor","Verify that Oh My Codex is installed and healthy"]]]]).map(([group,items])=><section key={group as string}><h3>{group as string}</h3>{(items as string[][]).map(([command,description])=><div key={command}><code>{command}</code><span>{description}</span></div>)}</section>)}
            </div>
            <div className={revealClass(2, "recommendation coral")}><b>{t("新手建议", "START HERE")}</b><span>{t("先从 PLAN x 流程图、UltraGoal 和 OMX CodeReview 开始；任务更复杂后，再尝试 Autopilot、Team 与 UltraQA。", "Start with PLAN x Flowchart, UltraGoal, and OMX CodeReview. Try Autopilot, Team, and UltraQA when the work becomes more complex.")}</span><button className={revealClass(3, "restart")} onClick={()=>go(0)}>{t("从头再看一次", "Start again")} ↺</button></div>
            <div className={revealClass(3, "omx-intro")}><div><small>{t("官方项目地址", "OFFICIAL PROJECT")}</small><a href="https://github.com/Yeachan-Heo/oh-my-codex" target="_blank" rel="noreferrer">github.com/Yeachan-Heo/oh-my-codex ↗</a></div><p><b>{t("说明", "NOTE")}</b><span>{t("本页链接采用 Oh My Codex 官方 GitHub 项目，便于继续查看安装方式、完整命令和更新说明。", "This links to the official Oh My Codex GitHub project for installation, the complete command list, and release notes.")}</span></p></div>
          </article>
        )}
      </section>

      {copied && <div className="toast">{t("示例已复制", "Example copied")}</div>}
      <footer className="footer"><div className="progress"><span style={{width:progress}}/></div><button onClick={()=>advance(-1)} disabled={scene===0&&revealStep===0} aria-label={t("上一步", "Previous step")}>←</button><div><b>{String(scene+1).padStart(2,"0")}</b><span>/ {String(chapters.length).padStart(2,"0")}</span><em>{chapters[scene]} · STEP {revealStep + 1}/{maxReveal + 1}</em></div><button onClick={()=>advance(1)} disabled={scene===chapters.length-1&&revealStep===maxReveal} aria-label={t("下一步", "Next step")}>→</button></footer>
    </main>
  );
}
