"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const chapters = [
  "开场",
  "能力地图",
  "Mermaid",
  "Plan × 流程图",
  "Goal × UltraGoal",
  "Browser",
  "Review",
  "Debugger",
  "速查表",
];

const mermaidV1 = `flowchart LR
  A[收到支付回调] --> B[更新订单]
  B --> C[发送通知]`;

const mermaidV2 = `flowchart TD
  A[收到支付回调] --> B{验签通过?}
  B -->|否| X[拒绝并记录]
  B -->|是| C{幂等键存在?}
  C -->|是| Y[返回已有结果]
  C -->|否| D[事务更新订单]
  D --> E{通知成功?}
  E -->|否| R[进入重试队列]
  E -->|是| F[完成]`;

const commandNote = "命令前缀可能因安装方式显示为 /、$ 或插件入口，请以当前 Codex 命令面板为准。";

type CommandBoxProps = {
  label: string;
  command: string;
  accent?: "mint" | "amber" | "violet";
  onCopy?: (value: string) => void;
};

function CommandBox({ label, command, accent = "mint", onCopy }: CommandBoxProps) {
  return (
    <div className={`command-box command-box--${accent}`}>
      <div className="command-box__head"><span>{label}</span><button onClick={() => onCopy?.(command)}>复制</button></div>
      <pre>{command}</pre>
    </div>
  );
}

export default function Home() {
  const [scene, setScene] = useState(0);
  const [direction, setDirection] = useState(1);
  const [mermaidStep, setMermaidStep] = useState(0);
  const [goalCase, setGoalCase] = useState<"feature" | "performance">("feature");
  const [browserCase, setBrowserCase] = useState<"docs" | "e2e">("docs");
  const [copied, setCopied] = useState(false);
  const wheelLock = useRef(false);

  const go = useCallback((next: number) => {
    const bounded = Math.max(0, Math.min(chapters.length - 1, next));
    if (bounded === scene) return;
    setDirection(bounded > scene ? 1 : -1);
    setScene(bounded);
  }, [scene]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault(); go(scene + 1);
      }
      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault(); go(scene - 1);
      }
      if (event.key === "Home") go(0);
      if (event.key === "End") go(chapters.length - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, scene]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest(".scroll-area")) return;
      if (wheelLock.current || Math.abs(event.deltaY) < 28) return;
      wheelLock.current = true;
      go(scene + (event.deltaY > 0 ? 1 : -1));
      window.setTimeout(() => { wheelLock.current = false; }, 700);
    };
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => window.removeEventListener("wheel", onWheel);
  }, [go, scene]);

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard may be unavailable in preview */ }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const sceneClass = direction > 0 ? "lesson lesson--next" : "lesson lesson--prev";
  const progress = `${((scene + 1) / chapters.length) * 100}%`;

  return (
    <main className="academy">
      <div className="academy-grid" />
      <div className="academy-glow" />
      <header className="academy-header">
        <button className="academy-brand" onClick={() => go(0)}><b>C</b><span>CODEX FIELD GUIDE</span></button>
        <div className="academy-topic"><i /> 六个命令 · 六组案例</div>
        <div className="academy-hint">滚轮 / 方向键翻页</div>
      </header>

      <nav className="chapter-nav" aria-label="章节导航">
        {chapters.map((name, index) => (
          <button key={name} className={index === scene ? "active" : index < scene ? "done" : ""} onClick={() => go(index)}>
            <b>{String(index + 1).padStart(2, "0")}</b><span>{name}</span>
          </button>
        ))}
      </nav>

      <section className="academy-stage" aria-live="polite">
        <div key={`transition-${scene}`} className="page-transition"><i /><i /></div>

        {scene === 0 && (
          <article className={`${sceneClass} intro-lesson`}>
            <div className="intro-kicker"><span>CODEX COMMANDS, EXPLAINED</span><em>从“会用 AI”到“会组织 AI 工作”</em></div>
            <h1>六个命令，<br /><strong>把 Codex 用成工程伙伴</strong></h1>
            <p>不堆功能名。每个能力都用一个真实开发案例，讲清楚它解决什么问题、怎么输入、执行什么、最后留下什么证据。</p>
            <div className="intro-commands">
              <span>MERMAID</span><span>PLAN</span><span>GOAL</span><span>BROWSER</span><span>REVIEW</span><span>DEBUGGER</span>
            </div>
            <button className="start-button" onClick={() => go(1)}>开始科普 <b>→</b></button>
            <div className="intro-wheel">
              <div className="wheel-center"><small>WORKFLOW</small><b>CODEX</b></div>
              {chapters.slice(2, 8).map((name, index) => <span key={name} className={`wheel-${index + 1}`}>{name.replace(" × UltraGoal", "")}</span>)}
            </div>
          </article>
        )}

        {scene === 1 && (
          <article className={`${sceneClass} map-lesson`}>
            <div className="lesson-tag">00 · 先选对入口</div>
            <div className="map-head"><h2>遇到什么问题，<br /><span>就调用什么能力</span></h2><p>这六个入口不是替代关系，而是从理解、计划、执行到验证的不同环节。</p></div>
            <div className="capability-map">
              {[
                ["01", "Mermaid", "我需要先看懂复杂流程", "把文字变成可审阅的共同模型"],
                ["02", "Plan", "需求还没拆成可执行步骤", "明确范围、顺序、风险与验收"],
                ["03", "Goal / UltraGoal", "任务很长，不能靠一次对话完成", "持久目标、检查点、自动推进"],
                ["04", "Browser", "需要操作真实网页", "填表、导出文档、执行 E2E"],
                ["05", "Review / code-review", "代码准备合并", "独立审查风险并给出合并结论"],
                ["06", "Debugger", "出现异常但根因不明", "复现、定位、修复、回归"],
              ].map(([id, title, question, answer]) => (
                <button key={id} onClick={() => go(Number(id) + 1)}><b>{id}</b><div><strong>{title}</strong><span>{question}</span></div><em>{answer}</em><i>↗</i></button>
              ))}
            </div>
            <div className="map-rule"><b>推荐顺序：</b>先让理解可见，再让计划可执行；最后用自动化、Review 与 Debugger 把结果变成证据。</div>
          </article>
        )}

        {scene === 2 && (
          <article className={`${sceneClass} mermaid-lesson`}>
            <div className="lesson-tag">01 · AI TEXT → MERMAID → CODE</div>
            <div className="lesson-head"><div><h2>Mermaid：先把 AI 的理解<br /><span>变成人能审阅的流程</span></h2></div><p>适合业务流程、异步任务、权限判断、状态机。重点不是“一次画对”，而是把图当作人机协作的中间语言。</p></div>
            <div className="mermaid-workbench">
              <div className="mermaid-brief">
                <CommandBox label="示例输入 · 支付回调" command={'请先不要修改代码。阅读支付回调实现，输出 Mermaid 流程图；标出验签、幂等、事务、失败重试和告警分支。'} onCopy={copy} />
                <div className="human-loop">
                  {[
                    ["1", "AI 输出 v1", "快速暴露当前理解"],
                    ["2", "人类批注", "补充遗漏的规则与例外"],
                    ["3", "重新输入信息", "让 AI 查最佳实践并调整流程"],
                    ["4", "确认 v2", "再更新 Plan 和代码"],
                  ].map(([id, title, text], index) => <button key={id} className={mermaidStep === index ? "active" : mermaidStep > index ? "done" : ""} onClick={() => setMermaidStep(index)}><b>{id}</b><span><strong>{title}</strong><small>{text}</small></span></button>)}
                </div>
              </div>
              <div className="mermaid-panel">
                <div className="panel-tabs"><button className={mermaidStep < 2 ? "active" : ""} onClick={() => setMermaidStep(0)}>流程 v1</button><button className={mermaidStep >= 2 ? "active" : ""} onClick={() => setMermaidStep(3)}>流程 v2 · 最佳实践</button><span>{mermaidStep >= 2 ? "+ 验签 / 幂等 / 重试" : "待人类 Review"}</span></div>
                <pre>{mermaidStep >= 2 ? mermaidV2 : mermaidV1}</pre>
                <div className={`flow-preview ${mermaidStep >= 2 ? "flow-preview--advanced" : ""}`}>
                  <div className="flow-main"><span>支付回调</span><i>→</i>{mermaidStep >= 2 && <><span className="decision">验签？</span><i>→</i><span className="guard">幂等？</span><i>→</i></>}<span>更新订单</span><i>→</i><span>发送通知</span></div>
                  {mermaidStep >= 2 && <div className="flow-branches"><span>验签失败 → 拒绝</span><span>重复请求 → 复用结果</span><span>通知失败 → 重试队列</span></div>}
                  {mermaidStep === 1 && <div className="review-notes"><span>缺少验签</span><span>双回调怎么办？</span><span>通知失败呢？</span></div>}
                </div>
              </div>
            </div>
            <div className="takeaway"><b>关键习惯</b><span>不要直接让 AI 改代码：先画图 → 人类审阅 → 补信息 → 查最佳实践 → 定稿流程 → 再修改代码与测试。</span></div>
          </article>
        )}

        {scene === 3 && (
          <article className={`${sceneClass} plan-lesson`}>
            <div className="lesson-tag">02 · PLAN × FLOWCHART</div>
            <div className="lesson-head"><div><h2>Plan 决定“怎么做”，<br /><span>流程图验证“是否想对”</span></h2></div><p>Plan 适合拆范围、依赖、风险和验收；Mermaid 适合检查业务逻辑。两者一起使用，能在写代码前发现返工点。</p></div>
            <div className="plan-grid">
              <div className="plan-input">
                <CommandBox label="Codex Plan / OMX $plan" command={'$plan --direct "为会员退款功能制定计划。先输出 Mermaid 状态图，再列出代码改动、迁移、测试与回滚步骤。"'} accent="amber" onCopy={copy} />
                <div className="when-use"><small>什么时候用</small><span>需求跨 3 个以上模块</span><span>业务分支多、容易理解偏差</span><span>需要先评审再开发</span></div>
              </div>
              <div className="plan-output">
                <div className="output-title"><span>配套案例</span><b>会员退款功能</b></div>
                <div className="plan-columns">
                  <div><small>PLAN</small><ol><li>确认退款状态与权限</li><li>扩展订单状态机</li><li>接入支付渠道退款 API</li><li>增加补偿任务与告警</li><li>单元 / 集成 / E2E 验收</li></ol></div>
                  <div><small>MERMAID REVIEW</small><div className="refund-flow"><span>申请退款</span><i>↓</i><span className="decision">可退款？</span><div><b>否 → 拒绝</b><b>是 → 渠道退款</b></div><i>↓</i><span>完成 / 补偿</span></div></div>
                </div>
                <div className="plan-sync"><span>人类修改流程图</span><i>→</i><span>AI 同步更新 Plan</span><i>→</i><span>按新 Plan 改代码</span></div>
              </div>
            </div>
            <div className="compare-strip"><div><b>只有 Plan</b><span>步骤完整，但业务理解可能错</span></div><div><b>只有流程图</b><span>逻辑清楚，但缺少实施与验收</span></div><div className="best"><b>Plan + Mermaid</b><span>理解与执行同时可审阅</span></div></div>
          </article>
        )}

        {scene === 4 && (
          <article className={`${sceneClass} goal-lesson`}>
            <div className="lesson-tag">03 · GOAL × OMX ULTRAGOAL</div>
            <div className="lesson-head"><div><h2>Goal 管住完成标准，<br /><span>UltraGoal 管住长任务全过程</span></h2></div><p>Goal 适合一个明确、可验证的目标；UltraGoal 把复杂任务拆成持久子目标，记录检查点与证据，失败后可继续推进。</p></div>
            <div className="case-tabs"><button className={goalCase === "feature" ? "active" : ""} onClick={() => setGoalCase("feature")}>案例 A · 开发完整功能</button><button className={goalCase === "performance" ? "active" : ""} onClick={() => setGoalCase("performance")}>案例 B · 性能问题排查</button></div>
            <div className="goal-board">
              <div className="goal-command-panel">
                {goalCase === "feature" ? (
                  <CommandBox label="UltraGoal · 功能开发" command={'omx ultragoal create-goals --brief "开发团队工作台：完成 UX 设计、前后端实现、文档、浏览器 E2E、代码 Review 与发布报告"'} onCopy={copy} />
                ) : (
                  <CommandBox label="Goal / Performance Goal" command={'创建目标：把订单列表 p95 从 1.8s 降到 600ms；必须包含基线、火焰图、根因、优化、压测和回归证据。'} accent="violet" onCopy={copy} />
                )}
                <div className="goal-difference"><div><b>Goal</b><span>一个目标 + 成功标准 + 当前状态</span></div><div><b>UltraGoal</b><span>brief + 多个子目标 + ledger 检查点 + 最终质量门</span></div></div>
              </div>
              <div className="goal-pipeline">
                {(goalCase === "feature" ? [
                  ["G-01", "设计", "交互稿 / 数据模型", "done"],
                  ["G-02", "实现", "前端 + API + 数据库", "done"],
                  ["G-03", "输出", "README + 接口文档", "active"],
                  ["G-04", "测试", "unit + integration + browser E2E", ""],
                  ["G-05", "质量门", "code-review + 交付证据", ""],
                ] : [
                  ["G-01", "建立基线", "p50 / p95 / p99", "done"],
                  ["G-02", "定位瓶颈", "trace / flamegraph / query", "done"],
                  ["G-03", "最小优化", "索引 + 缓存策略", "active"],
                  ["G-04", "自动压测", "同数据集对比", ""],
                  ["G-05", "防回退", "性能阈值进入 CI", ""],
                ]).map(([id, title, proof, state]) => <div key={id} className={`goal-row ${state}`}><b>{id}</b><span><strong>{title}</strong><small>{proof}</small></span><em>{state === "done" ? "✓" : state === "active" ? "RUNNING" : "PENDING"}</em></div>)}
              </div>
            </div>
            <div className="goal-evidence"><b>自动化的关键不是“无人看管”</b><span>而是每个子目标都有停止条件、测试证据和失败记录；最终完成还需要验证与独立 Review。</span></div>
          </article>
        )}

        {scene === 5 && (
          <article className={`${sceneClass} browser-lesson`}>
            <div className="lesson-tag">04 · BROWSER PLUGIN</div>
            <div className="lesson-head"><div><h2>Browser：让 Codex 从“写代码”<br /><span>走到“操作真实网页”</span></h2></div><p>适合需要登录态、表单操作、页面断言、截图证据和在线文档录入的任务。它操作的是可见页面，而不是猜测页面结果。</p></div>
            <div className="case-tabs"><button className={browserCase === "docs" ? "active" : ""} onClick={() => setBrowserCase("docs")}>案例 A · 输出飞书云文档</button><button className={browserCase === "e2e" ? "active" : ""} onClick={() => setBrowserCase("e2e")}>案例 B · 网站自动化测试</button></div>
            <div className="browser-demo">
              <div className="browser-prompt">
                <CommandBox label="自然语言调用 Browser" command={browserCase === "docs" ? '阅读本仓库的 API 和部署说明，整理成《订单服务接入指南》，打开飞书云文档，按“概述 / 鉴权 / 请求示例 / 错误码 / 发布检查”录入并校对。' : '打开本地结算页；使用测试账号登录，添加两件商品，验证优惠券、库存不足和支付失败三个分支，并输出截图与断言结果。'} accent={browserCase === "docs" ? "mint" : "amber"} onCopy={copy} />
                <div className="browser-rules"><small>使用前确认</small><span>目标网站与账号已授权</span><span>写入外部文档属于真实操作</span><span>最终以页面状态和截图为证据</span></div>
              </div>
              <div className="browser-window">
                <div className="browser-bar"><i /><i /><i /><span>{browserCase === "docs" ? "feishu.cn/docx/…" : "localhost:3000/checkout"}</span></div>
                {browserCase === "docs" ? (
                  <div className="feishu-mock"><aside><b>飞书</b><span>文档</span><span>知识库</span></aside><section><small>订单服务接入指南</small><h3>面向开发者的 API 使用说明</h3><div className="doc-outline"><b>01 概述</b><p>服务边界、调用链路与适用场景。</p><b>02 鉴权</b><p>Token 获取、权限范围与安全注意事项。</p><b>03 请求示例</b><pre>POST /v1/orders</pre><b>04 错误码</b></div><em>✓ 已录入并校对 5 个章节</em></section></div>
                ) : (
                  <div className="e2e-mock"><div className="test-steps"><small>BROWSER TEST</small><span className="done">✓ 登录测试账号</span><span className="done">✓ 添加两件商品</span><span className="done">✓ 优惠券 -20.00</span><span className="active">● 模拟支付失败</span><span>○ 截图并输出报告</span></div><div className="checkout"><small>订单确认</small><div><span>商品小计</span><b>¥ 268.00</b></div><div><span>优惠券</span><b className="green">- ¥ 20.00</b></div><div className="total"><span>应付</span><b>¥ 248.00</b></div><button>提交支付</button><em>测试模式 · 不会真实扣款</em></div></div>
                )}
              </div>
            </div>
            <div className="takeaway"><b>边界</b><span>Browser 可以读页面和执行操作；涉及发送、提交、权限或真实外部写入时，需要明确授权，并在操作后验证页面结果。</span></div>
          </article>
        )}

        {scene === 6 && (
          <article className={`${sceneClass} review-lesson`}>
            <div className="lesson-tag">05 · REVIEW × OMX CODE-REVIEW</div>
            <div className="lesson-head"><div><h2>Review 找问题，<br /><span>OMX code-review 建立独立质量门</span></h2></div><p>普通 Review 适合快速检查一个 diff；OMX code-review 适合合并前的系统审查，由独立 reviewer 与 architect 两条视角给出严重级别和最终结论。</p></div>
            <div className="review-board">
              <div className="review-commands">
                <CommandBox label="快速 Review" command={'/review 检查本次支付回调 diff，重点看安全、幂等、事务和测试缺口。'} accent="amber" onCopy={copy} />
                <CommandBox label="OMX 独立 Review" command={'$code-review 评审当前分支：输出 CRITICAL/HIGH/MEDIUM/LOW、file:line 证据、architect 状态和合并建议。'} accent="violet" onCopy={copy} />
                <p>{commandNote}</p>
              </div>
              <div className="review-case">
                <div className="review-case__head"><span>配套案例 · 支付回调 PR</span><b>REQUEST CHANGES</b></div>
                <div className="review-lanes">
                  <div><small>CODE REVIEWER</small><article className="finding critical"><b>HIGH</b><span><strong>缺少幂等约束</strong><em>api/payment.ts:88</em><p>渠道重试会重复更新订单并重复发券。</p></span></article><article className="finding medium"><b>MED</b><span><strong>日志包含完整请求体</strong><em>api/payment.ts:64</em><p>可能记录用户和支付敏感字段。</p></span></article></div>
                  <div><small>ARCHITECT</small><article className="architecture-watch"><b>WATCH</b><strong>支付状态与通知状态耦合</strong><p>建议用 outbox 事件隔离事务边界，否则通知失败会污染支付主流程。</p></article><div className="merge-rule"><span>reviewer: REQUEST CHANGES</span><span>architect: WATCH</span><b>最终：REQUEST CHANGES</b></div></div>
                </div>
              </div>
            </div>
            <div className="review-checklist"><span>安全</span><span>正确性</span><span>性能</span><span>可维护性</span><span>测试</span><span>架构边界</span></div>
          </article>
        )}

        {scene === 7 && (
          <article className={`${sceneClass} debugger-lesson`}>
            <div className="lesson-tag">06 · DEBUGGER AGENT</div>
            <div className="lesson-head"><div><h2>Debugger 不猜答案，<br /><span>它把异常变成可复现的证据链</span></h2></div><p>适合“偶发、只在线上出现、日志不完整、修了又复发”的问题。核心流程是复现 → 缩小范围 → 证明根因 → 最小修复 → 回归。</p></div>
            <div className="debugger-grid">
              <div className="debug-prompt">
                <CommandBox label="调用 Debugger" command={'使用 debugger 智能体调查“用户双击后偶发生成两份飞书文档”。先复现，不要先改代码；输出时间线、根因、最小修复和回归测试。'} onCopy={copy} />
                <div className="debug-principles"><span><b>不要</b>看到报错就直接改</span><span><b>必须</b>先建立稳定复现</span><span><b>必须</b>用测试证明修复有效</span></div>
              </div>
              <div className="debug-trace">
                <div className="trace-title"><span>配套案例 · 重复文档</span><em>ROOT CAUSE CONFIRMED</em></div>
                {[
                  ["T+000", "用户点击 #1", "POST req_a1", "done"],
                  ["T+041", "用户点击 #2", "POST req_a2", "done"],
                  ["T+312", "两个请求均未命中幂等记录", "race", "bad"],
                  ["T+874", "创建两份飞书文档", "2 × 201", "bad"],
                  ["FIX", "按钮 pending 锁定 + 后端唯一幂等键", "minimal patch", "good"],
                  ["TEST", "并发双击 20 次，只创建 1 份", "20/20 pass", "good"],
                ].map(([time, event, data, state]) => <div key={time} className={`trace-line ${state}`}><b>{time}</b><span>{event}</span><em>{data}</em></div>)}
              </div>
            </div>
            <div className="debug-loop"><span>症状</span><i>→</i><span>假设</span><i>→</i><span>复现</span><i>→</i><span>根因</span><i>→</i><span>最小修复</span><i>→</i><b>回归证据</b></div>
          </article>
        )}

        {scene === 8 && (
          <article className={`${sceneClass} cheatsheet-lesson`}>
            <div className="lesson-tag">07 · COMMAND CHEATSHEET</div>
            <h2>把六个入口，<span>放进日常开发节奏</span></h2>
            <div className="cheatsheet">
              {[
                ["Mermaid", "先理解", "把复杂逻辑画成图，让人类审阅后再改代码", "支付回调流程"],
                ["Plan × 图", "再规划", "用 Plan 管实施，用图验证业务理解", "会员退款功能"],
                ["Goal / UltraGoal", "持续执行", "长任务分目标、留检查点、以证据完成", "功能开发 / 性能排查"],
                ["Browser", "操作真实界面", "把文档写入网页，或执行网站 E2E", "飞书文档 / 结算测试"],
                ["Review / code-review", "合并前把关", "独立审查正确性、安全、架构与测试", "支付回调 PR"],
                ["Debugger", "异常时定位", "从稳定复现走到根因和回归测试", "重复创建文档"],
              ].map(([name, moment, purpose, example], index) => <div key={name}><b>{String(index + 1).padStart(2, "0")}</b><span><strong>{name}</strong><small>{moment}</small></span><p>{purpose}</p><em>{example}</em></div>)}
            </div>
            <div className="final-message"><b>一句话原则</b><span>让 AI 的理解可见，让计划可审阅，让执行可持续，让结果有证据。</span></div>
            <button className="restart-button" onClick={() => go(0)}>从头播放 ↺</button>
          </article>
        )}
      </section>

      {copied && <div className="copy-toast">已复制示例命令</div>}
      <footer className="academy-footer">
        <div className="progress"><span style={{ width: progress }} /></div>
        <button onClick={() => go(scene - 1)} disabled={scene === 0} aria-label="上一页">←</button>
        <div><b>{String(scene + 1).padStart(2, "0")}</b><span>/ {String(chapters.length).padStart(2, "0")}</span><em>{chapters[scene]}</em></div>
        <button onClick={() => go(scene + 1)} disabled={scene === chapters.length - 1} aria-label="下一页">→</button>
      </footer>
    </main>
  );
}
