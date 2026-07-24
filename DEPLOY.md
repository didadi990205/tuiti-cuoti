# 行测错题复盘 · 部署说明

## 项目简介

基于 Vite + React + TypeScript 构建的纯前端单页应用（SPA）。

- 所有数据保存在浏览器 `localStorage`，不上传服务器
- 支持一级分类 + 无限二级子分类，彩色圆点标识
- 四向边框裁剪图片，多维度组合筛选错题
- 卡片式题库，底部全局操作栏
- history 路由模式 + `_worker.js` 兜底，子路径刷新正常
- 打包后为静态文件，可部署到 Cloudflare Pages / Vercel / Gitee Pages / 自有 nginx

## 当前部署地址

### Cloudflare Pages（推荐，国内可访问）

👉 **https://tuiti-cuoti.pages.dev**

## 本地开发

```bash
pnpm install
pnpm dev          # http://localhost:5173
pnpm build        # 构建产物到 dist/
pnpm preview      # 本地预览
```

## 重新部署

```bash
cd /workspace/tuiti-cuoti
pnpm build
wrangler pages deploy dist --project-name=tuiti-cuoti --branch=main --commit-dirty=true
```

需要环境变量：
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## 数据结构版本

当前为 v2.0，兼容 v1.0 数据自动迁移：
- 旧分类自动升级为一级分类，补充分类颜色
- 旧复盘状态 `已复盘` 自动映射为 `1次复盘`

## 数据备份

应用内「设置」页面支持导出/导入 JSON 备份。更换设备或浏览器前务必先导出。

## 更新日志

### v2.0

- 应用改名为「行测错题复盘」
- 新增一二级分类体系，支持无限二级子分类
- 裁剪改为四向边框拖动模式
- 错题库改为卡片式布局，支持多维度组合筛选（分类树、难度、复盘情况）
- 新增底部全局操作栏（返回/前进/分享/首页）
- 左侧抽屉集成搜索、功能导航、分类筛选
- 编辑页保存后显示短暂「已保存」提示

