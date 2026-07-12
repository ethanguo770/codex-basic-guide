# Codex Tips

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

An interactive, beginner-friendly guide to practical Codex workflows. Instead
of listing commands in isolation, the guide follows one realistic project: a
3D simulation asset-management website.

## 🌐 Live Demo

**[Open the interactive Codex Tips guide →](https://ethanguo770.github.io/codex-basic-guide/)**

The page supports English and Chinese, light and dark themes, and
scroll-controlled step-by-step explanations.

## What You Will Learn

### 1. PLAN × Flowcharts (Mermaid)

Ask AI to produce a written plan and draw the important processes, branches,
and module relationships. Review the diagram, correct missing cases, and let AI
update the plan before changing code.

### 2. Goal vs. OMX UltraGoal

Understand when a normal Goal is enough and why UltraGoal is better for
long-running development work that must continue through design,
implementation, testing, verification, and performance investigation.

### 3. Browser Automation

Use the browser integration to run end-to-end website tests and write technical
documentation directly into Feishu documents after authorization.

### 4. OMX CodeReview

Run structured code review across correctness, security, maintainability, and
regression risk instead of relying on a single superficial review pass.

### 5. Debugger

Give AI the error, logs, reproduction steps, and relevant code so it can trace
the root cause, verify the hypothesis, and confirm the fix with tests.

## Running Example

Every chapter uses the same 3D asset lifecycle:

```text
Upload → Validate → Convert → Preview → Review → Publish
```

This makes it easier to see how planning, autonomous execution, browser tests,
code review, and debugging work together in one development loop.

## Who This Is For

- Developers who are new to Codex or AI-assisted development
- Teams looking for a practical AI development workflow
- People who want to understand what to ask AI, what AI should do, and where
  human review still matters

## Run Locally

Requires Node.js `>=22.13.0`.

```bash
npm install
npm run dev
```

Useful checks:

```bash
npm run lint
npm test
npm run pages:build
```

## Deployment

Pushes to `main` run `.github/workflows/pages.yml` and deploy the static guide
to GitHub Pages. The repository's Pages source must be set to
**GitHub Actions**.

Built with React, vinext, and GitHub Pages.
