"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const chapters = ["开场", "认识平台", "Mermaid", "Plan", "UltraGoal", "Browser", "code-review", "Debugger", "总结"];

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

export default function Home() {
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [flowStep, setFlowStep] = useState(0);
  const [browserMode, setBrowserMode] = useState<"test" | "docs">("test");
  const [asset, setAsset] = useState<"pump" | "robot" | "warehouse">("pump");
  const [angle, setAngle] = useState(0);
  const [testStatus, setTestStatus] = useState<"idle" | "running" | "passed">("idle");
  const [copied, setCopied] = useState(false);
  const wheelLock = useRef(false);
  const timers = useRef<number[]>([]);

  const go = useCallback((next: number) => {
    const safe = Math.max(0, Math.min(chapters.length - 1, next));
    if (safe === scene) return;
    setDirection(safe > scene ? 1 : -1);
    setScene(safe);
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
      window.setTimeout(() => { wheelLock.current = false; }, 720);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, scene]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* preview may deny clipboard */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1100);
  };

  const runBrowserTest = () => {
    timers.current.forEach(window.clearTimeout); timers.current = [];
    setTestStatus("running"); setAsset("pump"); setAngle(0);
    timers.current.push(window.setTimeout(() => setAngle(1), 500));
    timers.current.push(window.setTimeout(() => setAngle(2), 1000));
    timers.current.push(window.setTimeout(() => setAngle(3), 1450));
    timers.current.push(window.setTimeout(() => setTestStatus("passed"), 1900));
  };

  const lessonClass = direction > 0 ? "lesson lesson-next" : "lesson lesson-prev";
  const progress = `${((scene + 1) / chapters.length) * 100}%`;
  const assetInfo = {
    pump: ["PUMP-204", "离心泵总成", "v3.2", "已审核"],
    robot: ["ROBOT-018", "六轴机械臂", "v1.8", "待审核"],
    warehouse: ["WH-031", "自动化仓库", "v2.1", "草稿"],
  }[asset];

  return (
    <main className="guide">
      <div className="paper-grain" />
      <header className="topbar">
        <button className="wordmark" onClick={() => go(0)}><b>C</b><span>Codex 入门课</span></button>
        <p>一个 3D 资产平台 · 看懂六个能力</p>
        <span>方向键 / 滚轮翻页</span>
      </header>

      <nav className="chapter-rail" aria-label="章节导航">
        {chapters.map((title, index) => <button key={title} className={index === scene ? "active" : index < scene ? "done" : ""} onClick={() => go(index)}><b>{index + 1}</b><span>{title}</span></button>)}
      </nav>

      <section className="stage" aria-live="polite">
        <div key={`wipe-${scene}`} className="soft-wipe"><i /><i /></div>

        {scene === 0 && (
          <article className={`${lessonClass} cover`}>
            <div className="cover-copy">
              <div className="overline">CODEX FOR BEGINNERS · 15 MIN</div>
              <h1>用 Codex，<br />开发一个<span>3D 仿真资产管理网站</span></h1>
              <p>从一句需求开始，学会画流程、做计划、自动开发、浏览器测试、代码审查和调试。</p>
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
              <div className="capability-route"><small>六个能力分别负责</small><div><b>Mermaid</b><span>画清生命周期</span></div><div><b>Plan</b><span>拆开发工作</span></div><div><b>UltraGoal</b><span>自动推进全项目</span></div><div><b>Browser</b><span>操作页面验证</span></div><div><b>code-review</b><span>合并前把关</span></div><div><b>Debugger</b><span>定位预览故障</span></div></div>
            </div>
            <div className="plain-note"><b>给小白的比喻</b><span>平台像一个 3D 模型仓库：每个模型有身份证、历史版本、质检记录和正式上架状态。</span></div>
          </article>
        )}

        {scene === 2 && (
          <article className={`${lessonClass} mermaid-scene`}>
            <div className="section-no">01 · MERMAID</div>
            <div className="statement"><h2>先别急着写上传代码，<br /><span>让 AI 把资产流程画出来。</span></h2><p>流程图一出现，人类马上能发现：格式失败怎么办？重复版本怎么办？谁有权发布？</p></div>
            <div className="mermaid-layout">
              <div className="mermaid-left">
                <Command title="直接这样问" onCopy={copy}>{"不要修改代码。先把 3D 资产从上传、转换、预览、审核到发布的流程输出为 Mermaid；标出格式校验、重复版本、转换失败和权限分支。"}</Command>
                <div className="iteration-steps">
                  {[["1","AI 画出 v1","先看它怎样理解"],["2","人类 Review","指出缺少失败与权限分支"],["3","补充规则","加入重复版本、重试和退回"],["4","确认 v2","再同步 Plan 和代码"]].map(([n,t,d],i)=><button key={n} className={flowStep===i?"active":flowStep>i?"done":""} onClick={()=>setFlowStep(i)}><b>{n}</b><span><strong>{t}</strong><small>{d}</small></span></button>)}
                </div>
              </div>
              <div className="mermaid-right">
                <div className="editor-tabs"><button className={flowStep<2?"active":""} onClick={()=>setFlowStep(0)}>AI 初稿 v1</button><button className={flowStep>=2?"active":""} onClick={()=>setFlowStep(3)}>人工调整后 v2</button><span>{flowStep>=2?"分支完整":"待人工审阅"}</span></div>
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
            <div className="statement"><h2>流程图讲“资产怎么流转”，<br /><span>Plan 讲“系统怎么实现”。</span></h2><p>两者一起用，业务、前端、后端和测试可以在写代码前对齐。</p></div>
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
            <div className="statement"><h2>Goal 适合一个明确改动，<br /><span>完整平台建议直接用 UltraGoal。</span></h2><p>UltraGoal 会把设计、实现、文档、测试和质量门拆成持久目标，并记录每一步证据。</p></div>
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
            <div className="statement"><h2>系统写完以后，<br /><span>让 Browser 真的操作资产网站。</span></h2><p>它可以搜索资产、打开 3D 预览、旋转模型、提交审核，也可以把资产清单写入飞书云文档。</p></div>
            <div className="mode-tabs"><button className={browserMode==="test"?"active":""} onClick={()=>setBrowserMode("test")}>网站自动化测试</button><button className={browserMode==="docs"?"active":""} onClick={()=>setBrowserMode("docs")}>输出飞书云文档</button></div>
            {browserMode === "test" ? (
              <div className="browser-spread">
                <div className="browser-instruction"><Command title="Browser 测试提示词" onCopy={copy}>{"打开本地 3D 资产网站；搜索 PUMP-204，进入详情，旋转模型确认预览可用，提交审核，并断言状态从“草稿”变成“待审核”。"}</Command><div className="test-log"><small>AUTOMATION STEPS</small><span className={testStatus!=="idle"?"done":"active"}>1. 搜索 PUMP-204</span><span className={angle>=1?"done":""}>2. 打开 3D 预览</span><span className={angle>=2?"done":""}>3. 旋转检查模型</span><span className={angle>=3?"done":""}>4. 读取元数据</span><span className={testStatus==="passed"?"done":""}>5. 断言测试通过</span></div><button className="automation" onClick={runBrowserTest}>▶ 演示 Browser 自动测试</button></div>
                <div className="mini-browser"><div className="mini-bar"><i/><i/><i/><span>localhost:3000/assets/PUMP-204</span></div><div className="asset-app"><aside>{(["pump","robot","warehouse"] as const).map(a=><button key={a} className={asset===a?"active":""} onClick={()=>{setAsset(a);setTestStatus("idle")}}><b>{a==="pump"?"P":a==="robot"?"R":"W"}</b><span>{a==="pump"?"离心泵":a==="robot"?"机械臂":"自动仓库"}</span></button>)}</aside><section><div className="viewer"><div className={`model-proxy angle-${angle}`}><i className="front"/><i className="back"/><i className="right"/><i className="left"/><i className="top"/><i className="bottom"/><span/></div><div className="viewer-grid"/><button onClick={()=>setAngle((angle+1)%4)}>旋转模型 ↻</button>{testStatus==="passed"&&<em>✓ 预览测试通过</em>}</div><div className="asset-meta"><small>{assetInfo[0]}</small><h3>{assetInfo[1]}</h3><p>GLB · 42.8 MB · {assetInfo[2]}</p><div><span>状态</span><b>{assetInfo[3]}</b></div><div><span>贴图</span><b>8 / 8 正常</b></div><div><span>三角面</span><b>124,860</b></div></div></section></div></div>
              </div>
            ) : (
              <div className="docs-spread"><div><Command title="飞书文档提示词" onCopy={copy}>{"读取资产库中本周新增、待审核和转换失败的 3D 资产；打开飞书云文档，生成《仿真资产周报》，包含资产清单、风险、负责人和下周计划。"}</Command><div className="permission-note"><b>注意</b><span>写入真实飞书属于外部操作，需要登录状态和明确授权。</span></div></div><div className="doc-page"><small>仿真资产周报 · Week 28</small><h3>3D Asset Operations</h3><p>本周新增 42 个资产，已审核 31 个，转换失败 3 个。</p><h4>需要关注</h4><div className="doc-table"><span>PUMP-204 <b>已审核</b></span><span>ROBOT-018 <b>待审核</b></span><span>WH-031 <b>贴图缺失</b></span></div><h4>下周计划</h4><p>修复贴图路径校验；补充大文件转换性能基线。</p><em>Browser 已完成录入与校对</em></div></div>
            )}
          </article>
        )}

        {scene === 6 && (
          <article className={`${lessonClass} compare-scene review-compare`}>
            <div className="section-no">05 · REVIEW VS OMX CODE-REVIEW</div>
            <div className="statement"><h2>快速 Review 看当前改动，<br /><span>合并前建议用 OMX code-review。</span></h2><p>和 Goal / UltraGoal 类似：一个轻量直接，一个更独立、更完整、更适合作为质量门。</p></div>
            <div className="comparison">
              <div className="compare-card native"><div className="compare-title"><span>Codex 快速入口</span><h3>Review</h3></div><p>检查一个文件或一段 diff，快速找明显 Bug、性能问题和测试缺口。</p><Command title="平台里的用法" onCopy={copy}>{"/review 检查本次 3D 文件上传逻辑，重点看文件校验、权限、错误处理和测试。"}</Command><ul><li>速度快</li><li>适合开发中的小改动</li><li>结论依赖当前审查上下文</li></ul><div className="fit">适合：边写边检查</div></div>
              <div className="versus">VS</div>
              <div className="compare-card recommended"><div className="recommended-badge">合并前推荐</div><div className="compare-title"><span>Oh My Codex</span><h3>code-review</h3></div><p>独立 code-reviewer 与 architect 两条视角，按严重级别输出 file:line 证据和合并建议。</p><Command title="平台里的用法" onCopy={copy}>{"$code-review 审查 3D 资产上传与转换分支：检查安全、正确性、性能、可维护性、测试和架构边界。"}</Command><ul><li>reviewer：代码、测试与风险</li><li>architect：存储与转换边界</li><li>输出 APPROVE / COMMENT / REQUEST CHANGES</li></ul><div className="fit strong">适合：PR 合并、UltraGoal 最终质量门</div></div>
            </div>
            <div className="review-example"><b>本平台发现的 HIGH 问题</b><span>上传 ZIP 未防止路径穿越，并把 2GB 文件完整读入内存。</span><em>api/assets/upload.ts:71 · REQUEST CHANGES</em></div>
          </article>
        )}

        {scene === 7 && (
          <article className={`${lessonClass} debug-scene`}>
            <div className="section-no">06 · DEBUGGER</div>
            <div className="statement"><h2>部分模型预览变黑时，<br /><span>Debugger 先证明根因，再改代码。</span></h2><p>“预览失败”只是症状。Debugger 会先找出稳定复现条件，再验证究竟是材质、贴图、格式还是浏览器问题。</p></div>
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
            <div className="summary-title"><h2>开发一个 3D 资产平台，<br /><span>六个能力各司其职。</span></h2><p>先判断你遇到的是理解、计划、执行、验证、审查，还是调试问题。</p></div>
            <div className="summary-list">{[["Mermaid","生命周期不清楚","先把上传、转换、审核和发布画出来"],["Plan","不知道如何实施","拆模块、依赖、风险与验收"],["OMX UltraGoal","项目跨很多阶段","推荐：自动推进设计、实现、测试和质量门"],["Browser","需要真实页面结果","搜索、预览、旋转、提交审核或写飞书"],["OMX code-review","准备合并代码","推荐：独立 reviewer + architect 审查"],["Debugger","预览故障根因不明","复现、证明、最小修复、跨平台回归"]].map(([n,w,d],i)=><div key={n}><b>0{i+1}</b><span><strong>{n}</strong><small>{w}</small></span><p>{d}</p></div>)}</div>
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
