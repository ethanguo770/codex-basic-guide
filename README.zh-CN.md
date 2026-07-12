# Codex 小技巧

<p align="center">
  <a href="./README.md">English</a> · <strong>简体中文</strong>
</p>

一份面向新手的交互式 Codex 实战指南。它不会孤立地罗列命令，而是使用一个
完整的 3D 仿真资产管理网站作为贯穿案例。

## 🌐 在线体验

**[打开 Codex 小技巧交互页面 →](https://ethanguo770.github.io/codex-basic-guide/)**

页面支持中英文、明暗主题，以及由滚轮控制的循序渐进讲解。

## 你会学到什么

### 1. PLAN × 流程图（Mermaid）

让 AI 同时输出文字计划和流程图，把关键流程、判断分支与模块关系画出来。
人先看图找遗漏，补充失败和权限分支，再让 AI 同步修改 Plan，确认后才改代码。

### 2. Goal 与 OMX UltraGoal

理解普通 Goal 适合什么任务，以及为什么长时间开发更推荐 UltraGoal。它可以
持续推进设计、实现、测试、验收和性能问题排查，而不是只完成其中一个步骤。

### 3. 浏览器自动化

通过浏览器插件完成网站端到端自动化测试；授权飞书后，还能将技术文档直接
写入飞书云文档。

### 4. OMX CodeReview

从正确性、安全性、可维护性和回归风险等角度进行结构化代码审查，避免只做
一次表面的 Review。

### 5. Debugger

把报错、日志、复现步骤和相关代码交给 AI，让它追踪根因、验证判断，并通过
测试确认修复是否真正有效。

## 贯穿案例

所有章节都围绕同一条 3D 资产生命周期展开：

```text
上传 → 校验 → 转换 → 预览 → 审核 → 发布
```

这样可以直观看到 Plan、自动执行、浏览器测试、代码审查和调试如何组合成一个
完整的开发闭环。

## 适合谁

- 刚开始使用 Codex 或 AI 辅助开发的开发者
- 希望建立实用 AI 开发流程的团队
- 想弄清楚“应该怎样向 AI 提需求、AI 应该做什么、哪里必须人工确认”的人

## 本地运行

需要 Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

常用检查命令：

```bash
npm run lint
npm test
npm run pages:build
```

## 部署

推送到 `main` 后，`.github/workflows/pages.yml` 会自动构建静态页面并部署到
GitHub Pages。仓库 Pages 的发布源需要设置为 **GitHub Actions**。

使用 React、vinext 和 GitHub Pages 构建。
