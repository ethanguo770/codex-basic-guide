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
    "PLAN × 流程图",
    "GOAL VS OMX ULTRAGOAL",
    "BROWSER PLUGIN",
    "REVIEW VS OMX CODEREVIEW",
    "DEBUGGER",
  ]) assert.match(page, new RegExp(required));

  assert.match(page, /本教程推荐/);
  assert.match(page, /它的功能/);
  assert.match(page, /什么时候用/);
  assert.match(page, /你要提供/);
  assert.match(page, /AI 会执行/);
  assert.match(page, /人类控制点/);
  assert.match(page, /最后得到/);
  assert.match(page, /不需要讲师/);
  assert.match(page, /startViewTransition/);
  assert.match(page, /transitionLock/);
  assert.doesNotMatch(page, /无需讲师 · 功能/);
  assert.doesNotMatch(page, /小游戏|VISUALIZE|\bVIS\b/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /view-transition-name:lesson-stage/);
  assert.match(css, /hf-accent-new/);
  assert.doesNotMatch(css, /infinite/);
  assert.match(design, /warm editorial|Claude-like/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(layout, /title: "Codex 小技巧"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
