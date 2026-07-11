"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const scenes = [
  "开场",
  "案例",
  "Plan",
  "Mermaid v1",
  "人工 Review",
  "Mermaid v2",
  "Ultra Goal",
  "浏览器测试",
  "飞书云文档",
  "/review",
  "Debugger",
  "闭环",
];

const mermaidV1 = `flowchart LR
  A[填写发布信息] --> B[生成说明]
  B --> C[写入飞书文档]`;

const mermaidV2 = `flowchart LR
  A[填写发布信息] --> V{输入校验}
  V -->|通过| K[生成幂等键]
  V -->|失败| E[返回错误]
  K --> B[生成说明]
  B --> C[写入飞书文档]
  C -->|成功| D[返回文档链接]
  C -->|失败| R[重试 / 告警]`;

type Doc = { id: number; title: string; version: string; status: string };

export default function Home() {
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [autoplay, setAutoplay] = useState(false);
  const [reviewed, setReviewed] = useState<string[]>([]);
  const [version, setVersion] = useState("v2.4.0");
  const [releaseTitle, setReleaseTitle] = useState("协作评论与批量导出");
  const [changes, setChanges] = useState("新增评论线程；支持批量导出；修复偶发重复提交。");
  const [generating, setGenerating] = useState(false);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [fixed, setFixed] = useState(false);
  const wheelLock = useRef(false);

  const go = useCallback(
    (next: number) => {
      const safe = Math.max(0, Math.min(scenes.length - 1, next));
      if (safe === scene) return;
      setDirection(safe > scene ? 1 : -1);
      setScene(safe);
    },
    [scene],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        go(scene + 1);
      }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        go(scene - 1);
      }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(scenes.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, scene]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      const el = event.target as HTMLElement;
      if (el.closest(".scrollable")) return;
      if (wheelLock.current || Math.abs(event.deltaY) < 22) return;
      wheelLock.current = true;
      go(scene + (event.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => (wheelLock.current = false), 850);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, scene]);

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => {
      setScene((value) => {
        setDirection(1);
        return value === scenes.length - 1 ? 0 : value + 1;
      });
    }, 9000);
    return () => window.clearInterval(timer);
  }, [autoplay]);

  const toggleReview = (item: string) => {
    setReviewed((items) =>
      items.includes(item) ? items.filter((value) => value !== item) : [...items, item],
    );
  };

  const generate = (duplicate = false) => {
    setGenerating(true);
    window.setTimeout(() => {
      const count = duplicate && !fixed ? 2 : 1;
      setDocs(
        Array.from({ length: count }, (_, index) => ({
          id: Date.now() + index,
          title: releaseTitle,
          version,
          status: count === 2 ? `重复请求 ${index + 1}` : "创建成功",
        })),
      );
      setGenerating(false);
    }, 850);
  };

  const progress = `${((scene + 1) / scenes.length) * 100}%`;
  const allReviewed = reviewed.length === 3;
  const sceneClass = direction > 0 ? "scene scene--forward" : "scene scene--backward";

  const navHint = useMemo(() => (scene === 0 ? "滚轮 / 方向键开始" : scenes[scene]), [scene]);

  return (
    <main
      className="showcase"
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty("--mx", `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty("--my", `${event.clientY - rect.top}px`);
      }}
    >
      <div className="ambient ambient--one" />
      <div className="ambient ambient--two" />
      <div className="grid-noise" />
      <div className="cursor-glow" />

      <header className="topbar">
        <button className="brand" onClick={() => go(0)} aria-label="返回开场">
          <span className="brand-mark">C</span>
          <span>CODEX · ONE CASE</span>
        </button>
        <div className="case-label"><i /> CASE 024 · 发布说明生成器</div>
        <button className={`autoplay ${autoplay ? "is-on" : ""}`} onClick={() => setAutoplay(!autoplay)}>
          <span>{autoplay ? "Ⅱ" : "▶"}</span> {autoplay ? "自动播放中" : "自动播放"}
        </button>
      </header>

      <nav className="scene-rail" aria-label="场景导航">
        {scenes.map((label, index) => (
          <button
            key={label}
            className={index === scene ? "active" : index < scene ? "done" : ""}
            onClick={() => go(index)}
            aria-label={`前往 ${label}`}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>
            <b>{label}</b>
          </button>
        ))}
      </nav>

      <section className="stage" aria-live="polite">
        <div key={`wipe-${scene}`} className="transition-wipe"><i /><i /><i /></div>

        {scene === 0 && (
          <article key="cover" className={`${sceneClass} cover`}>
            <div className="eyebrow stagger-1"><span>LIVE CASE DEMO</span><em>不是功能清单，是一次真实交付</em></div>
            <h1 className="hero-title stagger-2">
              <span>CODEX</span>
              <strong>把一个想法，推进到可验证的交付</strong>
            </h1>
            <p className="hero-copy stagger-3">从一句需求开始。让 Plan、Mermaid、Ultra Goal、Browser、/review 与 Debugger 在同一条开发链路里接力。</p>
            <div className="hero-orbit stagger-4" aria-hidden="true">
              <span>PLAN</span><span>GRAPH</span><span>GOAL</span><span>TEST</span><span>REVIEW</span><span>DEBUG</span>
              <b>SHIP</b>
            </div>
            <button className="primary-action stagger-5" onClick={() => go(1)}>进入案例 <span>→</span></button>
          </article>
        )}

        {scene === 1 && (
          <article key="brief" className={`${sceneClass} split-scene`}>
            <div className="scene-copy">
              <div className="section-number">01 / CASE</div>
              <h2>只讲一个案例：<br /><span>发布说明生成器</span></h2>
              <p>把散落的版本信息整理成规范发布说明，并自动创建飞书云文档。看似简单，却包含输入校验、第三方 API、幂等、错误恢复与前端测试。</p>
              <div className="brief-metrics">
                <span><b>01</b> 输入表单</span><span><b>02</b> 内容生成</span><span><b>03</b> 飞书落档</span>
              </div>
            </div>
            <div className="product-frame product-frame--hero">
              <div className="window-bar"><i /><i /><i /><span>release.local</span></div>
              <div className="mock-app">
                <div className="mock-sidebar"><b>R</b><i/><i/><i/></div>
                <div className="mock-content">
                  <small>RELEASE STUDIO</small><h3>创建发布说明</h3>
                  <div className="mock-row"><span>版本号</span><b>v2.4.0</b></div>
                  <div className="mock-row"><span>本次变更</span><b>评论线程、批量导出…</b></div>
                  <button>生成飞书云文档 ↗</button>
                </div>
              </div>
              <div className="frame-tag">THE PRODUCT WE WILL SHIP</div>
            </div>
          </article>
        )}

        {scene === 2 && (
          <article key="plan" className={`${sceneClass} plan-scene`}>
            <div className="section-number">02 / PLAN</div>
            <h2>先把“做一个功能”，<span>变成可执行契约</span></h2>
            <div className="plan-canvas">
              <div className="raw-request">
                <small>RAW REQUEST</small>
                <p>“做个页面，把发布信息生成飞书文档。”</p>
              </div>
              <div className="plan-arrow"><span>AI 追问</span><i>→</i></div>
              <div className="plan-terminal">
                <div className="terminal-head"><span>codex / plan</span><em>● RUNNING</em></div>
                <div className="terminal-line"><b>01</b><span>输入字段与必填规则是什么？</span><i>✓</i></div>
                <div className="terminal-line"><b>02</b><span>飞书失败后重试还是回滚？</span><i>✓</i></div>
                <div className="terminal-line"><b>03</b><span>如何避免重复创建文档？</span><i>✓</i></div>
                <div className="terminal-line"><b>04</b><span>什么证据可以证明完成？</span><i>✓</i></div>
              </div>
            </div>
            <div className="contract-strip">
              <span>范围：表单 → 内容 → 飞书</span><span>风险：认证 / 幂等 / 超时</span><span>验收：E2E + 文档链接 + Review 通过</span>
            </div>
          </article>
        )}

        {scene === 3 && (
          <article key="mermaid1" className={`${sceneClass} graph-scene`}>
            <div className="graph-head">
              <div><div className="section-number">03 / TEXT → MERMAID</div><h2>AI 先把理解<span>画出来</span></h2></div>
              <p>图不是装饰。它是人和 AI 之间最低成本的“共同模型”。</p>
            </div>
            <div className="graph-workbench">
              <pre className="mermaid-code"><small>MERMAID · V1</small>{mermaidV1}</pre>
              <div className="diagram diagram--v1">
                <div className="flow-node n1"><small>INPUT</small>填写发布信息</div><div className="flow-line l1"><i /></div>
                <div className="flow-node n2"><small>GENERATE</small>生成说明</div><div className="flow-line l2"><i /></div>
                <div className="flow-node n3 danger"><small>EXTERNAL</small>写入飞书文档</div>
                <div className="question-pulse">?</div>
              </div>
            </div>
            <div className="graph-warning"><b>看起来通了。</b><span>但失败分支、鉴权与重复提交，都还不在图里。</span></div>
          </article>
        )}

        {scene === 4 && (
          <article key="human-review" className={`${sceneClass} review-graph-scene`}>
            <div className="section-number">04 / HUMAN IN THE LOOP</div>
            <div className="review-layout">
              <div className="review-intro">
                <h2>人不必重写 Plan，<br />只需<span>指出缺口</span></h2>
                <p>点击三个批注，模拟架构师对流程图的快速审阅。</p>
                <div className="review-actions">
                  {["输入校验", "幂等保护", "失败恢复"].map((item, index) => (
                    <button key={item} className={reviewed.includes(item) ? "checked" : ""} onClick={() => toggleReview(item)}>
                      <b>{reviewed.includes(item) ? "✓" : `0${index + 1}`}</b><span>{item}<small>{["空内容不能提交", "同一请求只创建一次", "超时、重试、告警"][index]}</small></span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="annotated-flow">
                <div className="mini-flow"><span>填写信息</span><i>→</i><span>生成说明</span><i>→</i><span>飞书 API</span></div>
                <div className={`annotation a1 ${reviewed.includes("输入校验") ? "active" : ""}`}><b>01</b> 校验在哪里？</div>
                <div className={`annotation a2 ${reviewed.includes("幂等保护") ? "active" : ""}`}><b>02</b> 双击会发生什么？</div>
                <div className={`annotation a3 ${reviewed.includes("失败恢复") ? "active" : ""}`}><b>03</b> API 超时怎么办？</div>
                <div className={`review-stamp ${allReviewed ? "show" : ""}`}>READY TO ITERATE</div>
              </div>
            </div>
            <div className="review-progress"><span style={{ width: `${(reviewed.length / 3) * 100}%` }} /><b>{reviewed.length}/3 REVIEWED</b></div>
          </article>
        )}

        {scene === 5 && (
          <article key="mermaid2" className={`${sceneClass} graph-v2-scene`}>
            <div className="section-number">05 / ITERATE THE PLAN</div>
            <div className="v2-head"><h2>流程图 v2，<span>也是新的执行计划</span></h2><div><b>+5</b> 节点 <b>+3</b> 失败分支 <b>+1</b> 幂等约束</div></div>
            <div className="v2-board">
              <pre className="mermaid-code compact"><small>MERMAID · V2</small>{mermaidV2}</pre>
              <div className="v2-flow">
                <div className="v2-node input">填写信息</div><i>→</i><div className="v2-node decision">输入校验</div><i>→</i><div className="v2-node guard">幂等键</div><i>→</i><div className="v2-node">生成说明</div><i>→</i><div className="v2-node external">飞书 API</div>
                <div className="branch branch--one"><span>校验失败</span><b>返回错误</b></div>
                <div className="branch branch--two"><span>API 失败</span><b>重试 / 告警</b></div>
                <div className="branch branch--three"><span>成功</span><b>文档链接</b></div>
              </div>
            </div>
            <div className="iteration-callout"><span>HUMAN REVIEW</span><i>→</i><span>DIAGRAM UPDATE</span><i>→</i><span>PLAN UPDATE</span></div>
          </article>
        )}

        {scene === 6 && (
          <article key="goal" className={`${sceneClass} goal-scene`}>
            <div className="goal-copy">
              <div className="section-number">06 / GOAL · OMX ULTRA GOAL</div>
              <h2>Plan 说明怎么做。<br /><span>Goal 保证做到哪一步。</span></h2>
              <p>长任务不再依赖一次对话的记忆：目标、检查点、完成证据被持久化，失败后从最近的证据继续。</p>
              <div className="goal-command"><small>$</small> omx ultragoal <span>release-note-generator</span><i>↵</i></div>
            </div>
            <div className="goal-timeline">
              <div className="goal-spine" />
              {[
                ["G-01", "冻结需求与流程图", "plan.md · mermaid v2", "done"],
                ["G-02", "实现表单与内容生成", "unit tests · build", "done"],
                ["G-03", "接入飞书与幂等保护", "API contract · retry", "active"],
                ["G-04", "浏览器 E2E 与 Review", "screenshots · findings", ""],
                ["G-05", "Debugger 回归与交付", "0 duplicate · report", ""],
              ].map(([id, title, evidence, state]) => (
                <div key={id} className={`goal-step ${state}`}><b>{id}</b><div><strong>{title}</strong><small>{evidence}</small></div><span>{state === "done" ? "✓" : state === "active" ? "RUN" : ""}</span></div>
              ))}
            </div>
          </article>
        )}

        {scene === 7 && (
          <article key="browser" className={`${sceneClass} browser-scene`}>
            <div className="browser-head"><div><div className="section-number">07 / BROWSER CONTROL</div><h2>不是“告诉你怎么测”，<span>是直接操作页面</span></h2></div><div className="live-pill"><i/> INTERACTIVE DEMO</div></div>
            <div className="browser-shell">
              <div className="browser-chrome"><span>‹</span><span>›</span><span>↻</span><div><i/>http://localhost:3000/release</div><b>⋮</b></div>
              <div className="browser-body">
                <div className="test-script">
                  <small>CODEX BROWSER</small>
                  <div className="script-line done"><b>01</b> 定位版本输入框 <span>✓</span></div>
                  <div className="script-line done"><b>02</b> 填写发布内容 <span>✓</span></div>
                  <div className={`script-line ${docs.length ? "done" : "active"}`}><b>03</b> 点击生成按钮 <span>{docs.length ? "✓" : "…"}</span></div>
                  <div className={`script-line ${docs.length ? "active" : ""}`}><b>04</b> 断言文档链接 <span>{docs.length ? "✓" : ""}</span></div>
                </div>
                <form className="release-form" onSubmit={(event) => { event.preventDefault(); generate(false); }}>
                  <div className="form-title"><div><small>RELEASE STUDIO</small><h3>创建发布说明</h3></div><span>Mock Feishu API</span></div>
                  <label>版本号<input value={version} onChange={(event) => setVersion(event.target.value)} aria-label="版本号" /></label>
                  <label>发布标题<input value={releaseTitle} onChange={(event) => setReleaseTitle(event.target.value)} aria-label="发布标题" /></label>
                  <label>变更内容<textarea value={changes} onChange={(event) => setChanges(event.target.value)} aria-label="变更内容" /></label>
                  <button type="submit" disabled={generating || !version || !releaseTitle}>{generating ? "正在生成…" : "生成飞书云文档  ↗"}</button>
                </form>
              </div>
            </div>
          </article>
        )}

        {scene === 8 && (
          <article key="feishu" className={`${sceneClass} feishu-scene`}>
            <div className="section-number">08 / FEISHU CLOUD DOC</div>
            <div className="feishu-layout">
              <div className="feishu-request">
                <small>TOOL CALL · MOCK</small><h2>结构化内容，<br /><span>直接落到协作文档</span></h2>
                <div className="request-card"><b>POST</b><span>/open-apis/docx/v1/documents</span><i>{`{ title, blocks, idempotency_key }`}</i></div>
                <button onClick={() => generate(false)} disabled={generating}>{generating ? "创建中…" : "运行一次文档创建"}</button>
                <p>演示环境使用 Mock API，不会写入真实飞书空间；生产环境替换凭据即可沿用同一流程。</p>
              </div>
              <div className={`doc-preview ${docs.length ? "has-doc" : ""}`}>
                <div className="doc-toolbar"><b>≡</b><span>飞书云文档 · Preview</span><em>{docs.length ? "已创建" : "等待创建"}</em></div>
                {docs.length ? (
                  <div className="doc-page">
                    <div className="doc-icon">R</div><small>RELEASE NOTE · {version}</small><h3>{releaseTitle}</h3>
                    <div className="doc-meta"><span>负责人：Codex</span><span>状态：Ready</span><span>日期：2026-07-11</span></div>
                    <h4>本次变更</h4><p>{changes}</p><h4>风险与回滚</h4><p>第三方 API 超时自动重试；使用幂等键避免重复创建。</p>
                    <div className="doc-link">mock://feishu/docx/release-{version.replaceAll(".", "-")}</div>
                  </div>
                ) : <div className="empty-doc"><span>＋</span><p>点击左侧按钮，生成文档预览</p></div>}
              </div>
            </div>
          </article>
        )}

        {scene === 9 && (
          <article key="code-review" className={`${sceneClass} code-review-scene`}>
            <div className="review-title"><div className="section-number">09 / REVIEW AGENT</div><h2><code>/review</code> 不复述代码，<span>只找会出事的地方</span></h2></div>
            <div className="diff-review">
              <div className="code-pane scrollable">
                <div className="code-head"><span>app/api/release/route.ts</span><em>+42 −3</em></div>
                <pre><span className="line-no">18</span> <i>export async function POST(req) {'{'}</i>{"\n"}<span className="line-no">19</span>   const body = await req.json(){"\n"}<span className="line-no">20</span> <mark>  console.log(&quot;release&quot;, body)</mark>{"\n"}<span className="line-no">21</span>   const doc = await feishu.create(body){"\n"}<span className="line-no">22</span>   return Response.json(doc){"\n"}<span className="line-no">23</span> <i>{'}'}</i></pre>
              </div>
              <div className="findings">
                <div className="finding high"><b>P0</b><div><strong>缺少幂等保护</strong><p>按钮双击或网络重试会创建两份文档。</p></div><span>route.ts:21</span></div>
                <div className="finding medium"><b>P1</b><div><strong>敏感内容写入日志</strong><p>body 可能包含内部发布信息。</p></div><span>route.ts:20</span></div>
                <div className="finding low"><b>P2</b><div><strong>没有输入 schema</strong><p>空标题会流入第三方 API。</p></div><span>route.ts:19</span></div>
              </div>
            </div>
            <div className="review-verdict"><span>VERDICT</span><b>REQUEST CHANGES</b><i>3 actionable findings · 0 style comments</i></div>
          </article>
        )}

        {scene === 10 && (
          <article key="debugger" className={`${sceneClass} debugger-scene`}>
            <div className="debug-head"><div><div className="section-number">10 / DEBUGGER AGENT</div><h2>从“偶发重复”，<span>走到可复现、可解释、可回归</span></h2></div><div className={`bug-status ${fixed ? "fixed" : docs.length === 2 ? "failed" : ""}`}>{fixed ? "FIX VERIFIED" : docs.length === 2 ? "BUG REPRODUCED" : "READY TO REPRODUCE"}</div></div>
            <div className="debug-grid">
              <div className="debug-controls">
                <button onClick={() => generate(true)} disabled={generating}>{generating ? "复现中…" : "① 模拟用户双击提交"}</button>
                <button onClick={() => { setFixed(true); setDocs([]); }} disabled={generating}>② 应用幂等修复</button>
                <button onClick={() => generate(true)} disabled={generating || !fixed}>③ 重新运行回归</button>
              </div>
              <div className="trace-panel">
                <small>REQUEST TRACE</small>
                <div className="trace-row"><b>T+000</b><span>click #1 → POST /api/release</span><i>req_a1</i></div>
                <div className="trace-row"><b>T+041</b><span>click #2 → POST /api/release</span><i>req_a2</i></div>
                <div className={`trace-row ${fixed ? "success" : docs.length === 2 ? "error" : ""}`}><b>T+8{fixed ? "12" : "74"}</b><span>{fixed ? "相同 idempotency_key → 复用结果" : docs.length === 2 ? "创建 2 份文档 → 根因确认" : "等待复现…"}</span><i>{fixed ? "200 CACHED" : docs.length === 2 ? "2 × 201" : "—"}</i></div>
              </div>
              <div className="root-cause">
                <span>ROOT CAUSE</span><h3>前端未锁定按钮<br />后端没有幂等键</h3><div><i /> UI: pending 时 disabled</div><div><i /> API: hash(user + version)</div><div><i /> Test: double-click regression</div>
              </div>
              <div className={`doc-counter ${docs.length === 2 ? "bad" : fixed && docs.length === 1 ? "good" : ""}`}><small>DOCUMENTS CREATED</small><strong>{docs.length}</strong><span>{fixed && docs.length === 1 ? "EXPECTED: 1 ✓" : docs.length === 2 ? "EXPECTED: 1 ✕" : "RUN THE TRACE"}</span></div>
            </div>
          </article>
        )}

        {scene === 11 && (
          <article key="loop" className={`${sceneClass} finale-scene`}>
            <div className="section-number">11 / THE DELIVERY LOOP</div>
            <h2>Codex 的价值，不是多一个写代码工具。<br /><span>而是让交付闭环持续运转。</span></h2>
            <div className="loop-visual">
              <div className="loop-ring ring-one"/><div className="loop-ring ring-two"/>
              <div className="loop-center"><small>VERIFIED</small><b>SHIP</b><span>有证据地完成</span></div>
              {[
                ["PLAN", "把模糊变成契约"], ["GRAPH", "让理解可以审阅"], ["GOAL", "让长任务持续推进"], ["BROWSER", "在真实界面验收"], ["/REVIEW", "交付前找到风险"], ["DEBUGGER", "从症状追到根因"],
              ].map(([title, caption], index) => <div key={title} className={`loop-item loop-item-${index + 1}`}><b>{title}</b><span>{caption}</span></div>)}
            </div>
            <div className="final-rule"><span>一句需求</span><i>→</i><span>共同模型</span><i>→</i><span>持久目标</span><i>→</i><span>真实验证</span><i>→</i><b>可交付结果</b></div>
          </article>
        )}
      </section>

      <footer className="controls">
        <div className="progress-track"><span style={{ width: progress }} /></div>
        <button onClick={() => go(scene - 1)} disabled={scene === 0} aria-label="上一页">←</button>
        <div><b>{String(scene + 1).padStart(2, "0")}</b><span>/ {String(scenes.length).padStart(2, "0")}</span><em>{navHint}</em></div>
        <button onClick={() => go(scene + 1)} disabled={scene === scenes.length - 1} aria-label="下一页">→</button>
      </footer>
    </main>
  );
}
