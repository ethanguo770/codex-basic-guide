# Codex 小技巧

<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

面向 AI 辅助开发新手的交互式 Codex 指南。项目通过一个 3D 仿真资产管理网站
案例，讲解 PLAN 与流程图（Mermaid）、UltraGoal、浏览器自动化、
OMX CodeReview 和 Debugger。

## 🌐 在线演示

**[打开 Codex 小技巧交互页面 →](https://ethanguo770.github.io/codex-basic-guide/)**

页面支持中英文、明暗主题，以及由滚轮控制的循序渐进讲解。

## 技术概览

项目基于 [vinext](https://github.com/cloudflare/vinext)，并保留可选的
Cloudflare D1 与 Drizzle 支持。

## 环境要求

- Node.js `>=22.13.0`

## 快速开始

```bash
npm install
npm run dev
npm run build
```

本项目不使用 `wrangler.jsonc`。

## 项目结构

- 网站代码位于 `app/`。
- `.openai/hosting.json` 声明可选的 Sites D1 与 R2 绑定。
- `vite.config.ts` 在本地开发环境中模拟已声明的绑定。
- `db/schema.ts` 默认为空数据库结构。
- `examples/d1/` 提供可选的 D1 示例。
- `drizzle.config.ts` 用于按需生成本地数据库迁移。

## 工作区身份请求头

OpenAI 工作区站点可以从 `oai-authenticated-user-email` 获取当前用户邮箱。

当用户的 SIWC 资料包含非空 `name` 字段时，站点还可能收到
`oai-authenticated-user-full-name`。姓名使用百分号编码的 UTF-8，并通过
`oai-authenticated-user-full-name-encoding: percent-encoded-utf-8` 标明编码方式。

姓名应当被视为可选值；缺失时回退到邮箱：

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

## 可选的 ChatGPT 登录

当站点需要可选或强制的 ChatGPT 登录时，可以导入
`app/chatgpt-auth.ts` 中的辅助函数：

- 使用 `getChatGPTUser()` 实现可选的登录态界面。
- 使用 `requireChatGPTUser(returnTo)` 让匿名用户先完成 ChatGPT 登录。
- 浏览器链接或操作可以使用 `chatGPTSignInPath(returnTo)` 和
  `chatGPTSignOutPath(returnTo)`。
- `returnTo` 必须是同源相对路径；辅助函数会进行校验和安全编码。
- 受保护页面需要设置 `export const dynamic = "force-dynamic"`，因为页面依赖
  每次请求注入的身份请求头。

Dispatch 负责 `/signin-with-chatgpt`、`/signout-with-chatgpt`、`/callback`、
OAuth Cookie 和身份请求头注入。不要为这些保留路径实现应用路由。未调用登录
辅助函数的页面仍然允许匿名访问。

SIWC 只能确认身份，不能证明用户属于某个工作区。工作区级限制应使用 Sites
托管平台的访问策略，或在服务端实现明确的成员白名单。

SIWC 适用于账户页面、用户专属仪表盘、保存的数据，以及绑定当前用户的写入
操作；公开内容应继续允许匿名访问。

## 常用命令

- `npm run dev`：启动本地开发环境
- `npm run build`：验证 vinext 构建
- `npm run pages:build`：在 `pages-dist/` 生成 GitHub Pages 静态产物
- `npm test`：构建项目并验证渲染后的页面
- `npm run db:generate`：在数据库结构变化后生成 Drizzle 迁移

## GitHub Pages

推送到 `main` 后，`.github/workflows/pages.yml` 会使用 GitHub 官方 Pages Actions
构建并部署页面。仓库 Pages 的发布源必须设置为 **GitHub Actions**。

## 延伸阅读

- [vinext 文档](https://github.com/cloudflare/vinext)
- [Drizzle D1 指南](https://orm.drizzle.team/docs/get-started/d1-new)
