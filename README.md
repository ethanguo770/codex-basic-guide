# Codex Tips

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

An interactive Codex guide for developers who are new to AI-assisted coding.
It uses a 3D simulation asset-management website to explain PLAN with Mermaid
flowcharts, UltraGoal, Browser automation, OMX CodeReview, and Debugger.

## 🌐 Live Demo

**[Open the interactive Codex Tips guide →](https://ethanguo770.github.io/codex-basic-guide/)**

The guide supports English and Chinese, light and dark themes, and
scroll-controlled step-by-step explanations.

## Technical Overview

The project runs on [vinext](https://github.com/cloudflare/vinext) and retains
optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

This project does not use `wrangler.jsonc`.

## Project Structure

- Edit the website under `app/`.
- `.openai/hosting.json` declares optional Sites D1 and R2 bindings.
- `vite.config.ts` simulates declared bindings for local development.
- `db/schema.ts` starts intentionally empty.
- `examples/d1/` contains an optional D1 example.
- `drizzle.config.ts` supports local migration generation when needed.

## Workspace Authentication Headers

OpenAI workspace sites can read the current user's email from
`oai-authenticated-user-email`.

SIWC-authenticated workspace sites may also receive
`oai-authenticated-user-full-name` when the user's SIWC profile contains a
non-empty `name` claim. The full-name value is percent-encoded UTF-8 and is
accompanied by
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8`.

Treat the full name as optional and fall back to the email address when it is
absent:

```tsx
import { headers } from "next/headers";

export default async function Home() {
  const requestHeaders = await headers();
  const email = requestHeaders.get("oai-authenticated-user-email");
  const encodedFullName = requestHeaders.get("oai-authenticated-user-full-name");
  const fullName =
    encodedFullName &&
    requestHeaders.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
      ? decodeURIComponent(encodedFullName)
      : null;

  const displayName = fullName ?? email;
  // ...
}
```

## Optional Dispatch-Owned ChatGPT Sign-In

Import the helpers from `app/chatgpt-auth.ts` when the site needs optional or
required ChatGPT sign-in:

- Use `getChatGPTUser()` for optional signed-in UI.
- Use `requireChatGPTUser(returnTo)` for server-rendered pages that should send
  anonymous visitors through Sign in with ChatGPT.
- Use `chatGPTSignInPath(returnTo)` and `chatGPTSignOutPath(returnTo)` for
  browser links or actions.
- Pass a same-origin relative `returnTo` path. The helper validates and safely
  encodes it.
- Mark protected pages with `export const dynamic = "force-dynamic"` because
  they depend on per-request identity headers.

Dispatch owns `/signin-with-chatgpt`, `/signout-with-chatgpt`, `/callback`, the
OAuth cookies, and identity-header injection. Do not implement application
routes for those reserved paths. Routes that do not call the helper remain
anonymous-compatible.

SIWC establishes identity only; it does not prove workspace membership. Use
the Sites hosting platform's access-policy controls for workspace-wide
restrictions, or enforce an explicit server-side allowlist.

Use SIWC for account pages, user-specific dashboards, saved records, and write
actions tied to the current ChatGPT user. Leave public content anonymous.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm run pages:build`: generate the static GitHub Pages artifact in `pages-dist/`
- `npm test`: build the project and verify the rendered page
- `npm run db:generate`: generate Drizzle migrations after schema changes

## GitHub Pages

Pushes to `main` run `.github/workflows/pages.yml`, which builds and deploys the
site with GitHub's official Pages actions. The repository's Pages source must
be set to **GitHub Actions**.

## Learn More

- [vinext documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 guide](https://orm.drizzle.team/docs/get-started/d1-new)
