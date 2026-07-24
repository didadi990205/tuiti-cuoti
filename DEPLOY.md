# 图推错题工作台 · 部署说明

## 项目简介

行测图推错题工作台，基于 Vite + React + TypeScript 构建的纯前端单页应用（SPA）。

- 所有数据保存在浏览器 `localStorage`，不上传服务器，隐私安全
- PC 横屏双栏布局，移动端竖屏单栏自适应
- history 路由模式 + 404 兜底，解决书签刷新 404 / 空白问题
- 打包后为静态文件，可部署到任意静态托管平台

## 本地开发

```bash
pnpm install
pnpm dev          # 启动开发服务器，默认 http://localhost:5173
pnpm build        # 构建生产产物到 dist/
pnpm preview      # 本地预览 dist 构建产物
```

## 部署方案

### 方案一：Vercel（推荐，最简单，永久 HTTPS 域名）

1. 把代码推送到 GitHub
2. 登录 https://vercel.com ，点击 "New Project" → 选择仓库
3. 框架预设选择 `Vite`，其他保持默认即可
4. 点击 Deploy，几秒后获得 `xxx.vercel.app` 永久域名

Vercel 会自动识别 `vercel.json`，无需手动配置 history 路由重定向。

### 方案二：Gitee Pages（国内访问快）

1. 把 `dist/` 目录推送到 Gitee 仓库（如 `tuiti-cuoti-pages`）
2. 仓库设置 → 「服务」→ 「Gitee Pages」→ 选择 `dist` 目录，启用

⚠️ Gitee Pages 的项目页（如 `username.gitee.io/tuiti-cuoti/`）需要保证：
- `index.html` 与 `404.html` 都在仓库根目录（或 dist 同层）
- 通过 `username.gitee.io/tuiti-cuoti/` 进入可直接使用
- 通过 `username.gitee.io/tuiti-cuoti/library` 直接刷新：Gitee 会返回 404.html，由内置脚本重定向回 index.html 并恢复原路径

### 方案三：自有服务器 + nginx

1. 把 `dist/` 目录上传到服务器（如 `/var/www/tuiti-cuoti`）
2. 参考 `nginx.conf.example` 配置 nginx（核心：`try_files $uri $uri/ /index.html`）
3. 重启 nginx：`sudo nginx -t && sudo systemctl reload nginx`
4. 配置域名 + HTTPS（推荐 Let's Encrypt）

### 方案四：Netlify / Cloudflare Pages

把 `dist/` 目录直接拖到 Netlify 的 Deploy 页面，或配置 Cloudflare Pages 构建命令为 `pnpm build`，输出目录为 `dist`。

## history 路由刷新 404 解决方案

本项目是单页应用，使用 BrowserRouter（history 模式）。当用户通过书签或直接刷新访问子路径（如 `/library`）时，需要服务端 fallback 到 `index.html`。

| 平台 | 方案 |
|---|---|
| Vercel | 已配置 `vercel.json` 的 `rewrites`，自动 fallback |
| Netlify | 默认自动 fallback，无需配置 |
| Cloudflare Pages | 自动 fallback |
| GitHub Pages | 复制 `404.html`（已自动 build 进去）作为 404 页面，内置脚本恢复原路径 |
| Gitee Pages | 同 GitHub Pages，已生成 `404.html` |
| 自有 nginx | 见 `nginx.conf.example`：`try_files $uri $uri/ /index.html` |

## 构建产物结构

```
dist/
├── index.html          # 主入口（含 history 路由恢复脚本）
├── 404.html            # 404 fallback（保留原路径后跳转到根）
├── assets/
│   ├── index-*.js      # 打包后的 JS（约 220KB / gzip 68KB）
│   └── index-*.css     # 打包后的 CSS（约 32KB / gzip 5.7KB）
```

整体打包体积小，首屏加载快。

## 数据备份与迁移

应用内：
- 「设置」→「导出备份」下载 JSON 备份
- 「设置」→「导入备份」恢复

⚠️ 更换浏览器或清空浏览器数据前，请务必先导出备份！