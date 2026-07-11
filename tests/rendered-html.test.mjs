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

test("server-renders the Codex case showcase", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>Codex · 一个案例讲透开发闭环<\/title>/);
  assert.match(html, /把一个想法，推进到可验证的交付/);
  assert.match(html, /aria-label="场景导航"/);
  assert.match(html, /前往 Debugger/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("keeps the integrated interactive case and removes starter preview", async () => {
  const [page, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  for (const required of [
    "TEXT → MERMAID",
    "HUMAN IN THE LOOP",
    "OMX ULTRA GOAL",
    "BROWSER CONTROL",
    "FEISHU CLOUD DOC",
    "REVIEW AGENT",
    "DEBUGGER AGENT",
  ]) {
    assert.match(page, new RegExp(required));
  }

  assert.match(css, /prefers-reduced-motion/);
  assert.match(layout, /lang="zh-CN"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(
    access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)),
  );
});
