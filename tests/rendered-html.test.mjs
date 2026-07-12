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
  const [page, layout, css, design, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../DESIGN.md", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
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
  assert.match(page, /它能帮你做什么/);
  assert.match(page, /什么时候会用到/);
  assert.match(page, /你只要告诉 AI/);
  assert.match(page, /它会交给你/);
  assert.match(page, /Codex小技巧/);
  assert.match(page, /Plan 负责想清楚怎么做/);
  assert.match(page, /流程图（Mermaid）负责让人一眼看懂/);
  assert.match(page, /一定要让 AI 多画图/);
  assert.match(page, /AI 输出 Plan \+ 流程图 → 人看图 Review/);
  assert.match(page, /持续做到验收通过/);
  assert.match(page, /自动完成网页测试，也能自动编写飞书云文档/);
  assert.match(page, /请独立的 AI 审查组帮你挑问题/);
  assert.match(page, /先查清 Bug 为什么发生/);
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
  assert.match(page, /滚轮逐步展开/);
  assert.match(page, /AUTOMATION STEPS · 随滚轮推进/);
  assert.doesNotMatch(page, /Mermaid 自动迭代|AUTOMATION STEPS · 自动推进/);
  assert.doesNotMatch(page, /01 · MERMAID|六个小技巧|六个技巧分别解决什么问题/);
  assert.doesNotMatch(page, /startViewTransition|mode-tabs|演示 Browser 自动测试/);
  assert.doesNotMatch(page, /无需讲师 · 功能/);
  assert.doesNotMatch(page, /人类控制点|AI 会执行|可审计的 ledger|架构边界|最终质量门/);
  assert.doesNotMatch(page, /小游戏|VISUALIZE|\bVIS\b/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /soft-cover/);
  assert.match(page, /capability-cell/);
  assert.match(css, /capability-anatomy>div\.revealed/);
  assert.match(css, /reveal-block/);
  assert.match(css, /\.plan-mermaid-scene\{justify-content:flex-start/);
  assert.match(css, /\.plan-mermaid-scene \.mermaid-layout\{height:286px/);
  assert.match(css, /\.plan-mermaid-scene\{gap:8px;padding-top:52px;padding-bottom:12px/);
  assert.match(css, /grid-template-columns:minmax\(0,1\.5fr\) minmax\(300px,\.65fr\)/);
  assert.match(page, /AI 输出 01/);
  assert.match(page, /AI 输出 02/);
  assert.match(css, /grid-template-columns:1fr 55px 1\.12fr/);
  assert.match(css, /flex:0 0 273px/);
  assert.doesNotMatch(css, /view-transition-name:lesson-stage|hf-accent-new/);
  assert.doesNotMatch(css, /infinite/);
  assert.match(design, /warm editorial|Claude-like/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /title: "Codex小技巧"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
