import { spawn } from "node:child_process";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const clientDir = path.join(root, "dist", "client");
const outputDir = path.join(root, "pages-dist");
const port = Number(process.env.PAGES_EXPORT_PORT ?? "4173");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
const requestedBase = process.env.PAGES_BASE_PATH ??
  (repositoryName ? `/${repositoryName}/` : "/codex-basic-guide/");
const basePath = `/${requestedBase.replace(/^\/+|\/+$/g, "")}/`;
const origin = `http://127.0.0.1:${port}`;
const vinextCli = path.join(root, "node_modules", "vinext", "dist", "cli.js");

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await cp(clientDir, outputDir, { recursive: true });

const server = spawn(
  process.execPath,
  [vinextCli, "start", "--port", String(port), "--hostname", "127.0.0.1"],
  { cwd: root, stdio: ["ignore", "pipe", "pipe"] },
);

let serverError = "";
server.stderr.setEncoding("utf8");
server.stderr.on("data", (chunk) => { serverError += chunk; });

try {
  const response = await waitForPage(`${origin}/`);
  let html = await response.text();

  // vinext renders absolute local font paths in the SSR response. The matching
  // font files are copied into dist/client/assets/_vinext_fonts during build.
  html = html.replace(
    /url\((?:[A-Za-z]:[\\/]|\/)[^)]*?\.vinext[\\/]fonts[\\/]/g,
    `url(${basePath}assets/_vinext_fonts/`,
  );

  // GitHub project pages live below /<repository>/, while vinext's production
  // server emits root-relative asset URLs.
  html = html
    .replaceAll("/assets/", `${basePath}assets/`)
    .replaceAll('href="/favicon.svg"', `href="${basePath}favicon.svg"`);

  await writeFile(path.join(outputDir, "index.html"), html, "utf8");
  await writeFile(path.join(outputDir, "404.html"), html, "utf8");
  await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");

  const exportedHtml = await readFile(path.join(outputDir, "index.html"), "utf8");
  if (exportedHtml.includes(".vinext/fonts") || exportedHtml.includes('"/assets/')) {
    throw new Error("GitHub Pages export still contains local or root-relative asset paths.");
  }

  console.log(`GitHub Pages export ready: ${outputDir}`);
  console.log(`Expected project URL path: ${basePath}`);
} finally {
  server.kill();
}

async function waitForPage(url) {
  const deadline = Date.now() + 20_000;
  let lastError;

  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`vinext production server exited early.\n${serverError}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error(`Timed out exporting ${url}: ${lastError?.message ?? "unknown error"}`);
}
