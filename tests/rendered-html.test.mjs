import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the 3D asset-management Codex guide", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /3D 仿真资产管理网站/);
  assert.match(html, /aria-label="章节导航"/);
  assert.match(html, /UltraGoal/);
  assert.match(html, /Debugger/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("covers every requested capability and keeps the editorial design accessible", async () => {
  const [page, layout, css, design, packageJson, gitignore] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../DESIGN.md", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../.gitignore", import.meta.url), "utf8"),
  ]);

  for (const required of [
    "flowchart TD",
    "PLAN x 流程图（Mermaid）",
    "GOAL VS OMX ULTRAGOAL",
    "BROWSER PLUGIN",
    "REVIEW VS OMX CODEREVIEW",
    "DEBUGGER",
  ]) assert.match(page, new RegExp(required));

  assert.match(page, /本教程推荐/);
  assert.match(page, /遇到的问题/);
  assert.match(page, /为什么选它/);
  assert.match(page, /你告诉 AI/);
  assert.match(page, /你会得到/);
  assert.match(page, /Codex小技巧/);
  assert.match(page, /@Browser 打开本地 3D 资产网站/);
  assert.match(page, /@Chrome 打开这个已授权的飞书云文档链接/);
  assert.match(page, /@UltraGoal 开发 3D 仿真资产管理网站/);
  assert.match(page, /@CodeReview 检查 3D 资产上传与转换功能/);
  assert.doesNotMatch(page, /开始之前 · 怎么调用|invocation-scene/);
  assert.match(page, /PLAN 负责想清楚怎么做/);
  assert.match(page, /流程图（Mermaid）负责让人一眼看懂/);
  assert.match(page, /一定要让 AI 多画图/);
  assert.match(page, /function PlanFlowchart/);
  assert.match(page, /<PlanFlowchart language=\{language\} \/>/);
  assert.match(page, /function BeginnerPath/);
  assert.match(page, /从问题到结果的命令理解路径/);
  assert.match(page, /01 · 遇到的问题/);
  assert.match(page, /02 · 为什么选它/);
  assert.match(page, /04 · AI 会怎么做/);
  assert.match(page, /05 · 你会得到/);
  assert.match(page, /说明原因/);
  assert.match(page, /退回修改/);
  assert.match(page, /id="plan-flow-arrow"/);
  assert.match(page, /AI 输出 Plan \+ 流程图 → 人看图 Review/);
  assert.match(page, /持续做到验收通过/);
  assert.match(page, /自动完成网页测试，也能自动编写飞书云文档/);
  assert.match(page, /请独立的 AI 审查组帮你挑问题/);
  assert.match(page, /先查清 Bug 为什么发生/);
  assert.match(page, /这个网站是怎么做出来的/);
  assert.match(page, /每遇到一个新问题/);
  assert.match(page, /不是五个孤立功能/);
  assert.match(page, /我现在卡在哪里/);
  assert.match(page, /还不知道应该怎么做/);
  assert.match(page, /任务很大，要持续做到完成/);
  assert.match(page, /GitHub Pages 上线后显示 404/);
  assert.match(page, /线上从 404 恢复为 200/);
  assert.match(page, /换会话仍能继续/);
  assert.match(page, /从失败任务重试/);
  assert.match(page, /自动跑完整测试/);
  assert.match(page, /自动编写飞书云文档/);
  assert.match(page, /复制云文档链接 → 粘贴到 Codex Chrome 插件/);
  assert.match(page, /已授权的飞书云文档链接/);
  assert.match(page, /OMX CodeReview：/);
  assert.match(page, /github\.com\/Yeachan-Heo\/oh-my-codex/);
  assert.doesNotMatch(page, /summary-scene[\s\S]*?revealClass\(2, "restart"\)/);
  assert.match(page, /appendix-scene[\s\S]*?revealClass\(3, "restart"\)/);
  assert.match(page, /\$deep-interview/);
  assert.match(page, /\$ultraqa/);
  assert.match(page, /transitionLock/);
  assert.match(page, /setTransitioning/);
  assert.match(page, /sceneMaxSteps/);
  assert.match(page, /setRevealStep/);
  assert.match(page, /phaseLabels/);
  assert.match(page, /transitionKind/);
  assert.match(page, /is-current/);
  assert.match(page, /is-past/);
  assert.match(page, /wheelGestureActive/);
  assert.match(page, /wheelAccumulator/);
  assert.match(page, /routeWheelInput/);
  assert.match(page, /WHEEL_GESTURE_RELEASE_MS/);
  assert.match(page, /target\?\.closest<HTMLElement>\("\.lesson"\)/);
  assert.match(page, /sceneMaxSteps = \[2, 2, 5, 5, 5, 5, 5, 5, 5, 3\]/);
  assert.match(page, /revealClass\(1, "project-relay", 5\)/);
  assert.match(page, /revealClass\(1, "decision-map", 5\)/);
  assert.match(page, /relay-track/);
  assert.match(page, /relay-panel/);
  assert.match(page, /relay-handoff/);
  assert.match(page, /aria-current=\{revealStep === step \? "step"/);
  assert.match(page, /aria-current=\{index === scene \? "page"/);
  assert.match(page, /decision-branch/);
  assert.match(page, /capabilityGuide\.map\(\(\{ choiceProblem: problem, command, choiceResult: result \}/);
  assert.match(page, /revealClass\(2, "recommendation coral", 3\)/);
  assert.match(page, /codex-tips-language/);
  assert.match(page, /codex-tips-theme/);
  assert.match(page, /document\.documentElement\.dataset\.theme/);
  assert.match(page, /Switch to Chinese/);
  assert.match(page, /Switch to dark mode/);
  assert.match(page, /Learn the AI development loop through a 3D simulation asset platform/);
  assert.match(page, /Ask AI to draw often/);
  assert.match(page, /UltraGoal preserves objectives, progress, failures, and verification evidence/);
  assert.match(page, /先理解作用/);
  assert.match(page, /观察 AI 动作/);
  assert.match(page, /AUTOMATION STEPS · 随滚轮推进/);
  assert.doesNotMatch(page, /Mermaid 自动迭代|AUTOMATION STEPS · 自动推进/);
  assert.doesNotMatch(page, /01 · MERMAID|六个小技巧|六个技巧分别解决什么问题/);
  assert.doesNotMatch(page, /startViewTransition|mode-tabs|演示 Browser 自动测试/);
  assert.doesNotMatch(page, /无需讲师 · 功能/);
  assert.doesNotMatch(page, /人类控制点|AI 会执行|可审计的 ledger|架构边界|最终质量门/);
  assert.doesNotMatch(page, /小游戏|VISUALIZE|\bVIS\b/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.match(css, /\.topbar-tools/);
  assert.match(css, /\.icon-control/);
  assert.match(css, /\.case-study-scene/);
  assert.match(css, /\.project-relay/);
  assert.match(css, /\.relay-track::before/);
  assert.match(css, /\.relay-panel\.is-current/);
  assert.match(css, /\.relay-handoff/);
  assert.match(css, /\.decision-map/);
  assert.match(css, /\.plan-flowchart/);
  assert.match(css, /\.beginner-path/);
  assert.match(css, /\.learning-progress-step\.is-current/);
  assert.match(css, /\.learning-panel\.is-current/);
  assert.match(css, /\.sr-only/);
  assert.match(css, /\.ultragoal-loop/);
  assert.match(css, /\.review-lanes/);
  assert.match(css, /\.review-example\{position:relative;z-index:6/);
  assert.match(css, /\.review-compare \.review-lanes>i\{display:none\}/);
  assert.match(css, /\.flow-shapes \.decision/);
  assert.match(css, /\.flow-return/);
  assert.match(css, /marker-end:url\(#plan-flow-arrow\)/);
  assert.match(css, /Desktop height fitting/);
  assert.match(css, /max-height:760px/);
  assert.match(css, /\.browser-sequence\{height:246px/);
  assert.match(css, /scrollbar-width:none/);
  assert.doesNotMatch(css, /\.invocation-scene|\.codex-composer|\.invoke-legend/);
  assert.match(css, /soft-cover/);
  assert.match(css, /compare-left/);
  assert.match(css, /action-cover/);
  assert.match(css, /Semantic motion/);
  assert.match(css, /focus-ring-in/);
  assert.match(css, /opacity:\.72;pointer-events:auto/);
  assert.doesNotMatch(css, /reveal-block\.revealed\.is-past\{opacity:\.2/);
  assert.doesNotMatch(css, /focus-step-3,.focus-step-4,.focus-step-5\) \.statement\{opacity:\.26/);
  assert.equal((page.match(/<BeginnerPath/g) ?? []).length, 5);
  assert.doesNotMatch(page, /function Capability/);
  assert.match(css, /learning-progress-step\.revealed/);
  assert.match(css, /reveal-block/);
  assert.match(page, /scene === 2[\s\S]*?compare-scene[\s\S]*?revealClass\(4, "comparison"\)[\s\S]*?compare-card native[\s\S]*?versus[\s\S]*?compare-card recommended[\s\S]*?revealClass\(5, "recommendation coral"\)/);
  assert.match(page, /\[1, "01 · 遇到的问题"[\s\S]*?\[2, "02 · 为什么选它"[\s\S]*?\[3, "03 · 你告诉 AI"[\s\S]*?\[4, "04 · AI 会怎么做"[\s\S]*?\[5, "05 · 你会得到"/);
  assert.doesNotMatch(page, /plan-mermaid-scene|mermaid-layout|flowStep|flowV1|flowV2/);
  assert.doesNotMatch(css, /capability-anatomy|case-evolution|case-capabilities|case-proof|summary-list|plan-mermaid-scene|project-story|learning-step/);
  assert.match(page, /AI 输出 01/);
  assert.match(page, /AI 输出 02/);
  assert.match(css, /grid-template-columns:1fr 55px 1\.12fr/);
  assert.doesNotMatch(css, /view-transition-name:lesson-stage|hf-accent-new/);
  assert.doesNotMatch(css, /infinite/);
  assert.match(design, /warm editorial|Claude-like/);
  assert.match(design, /ReactBits-inspired focus ring/);
  assert.match(design, /trackpad inertia must not skip several steps/);
  assert.match(design, /single-canvas five-step `BeginnerPath`/);
  assert.match(design, /connected `project-relay`/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /title: "Codex小技巧"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(gitignore, /^\/\.omx\/$/m);

  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
