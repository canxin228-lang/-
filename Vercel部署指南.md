# 数字策展人 (Digital Curator) 部署指南

本项目采用 **前后端分离** 的架构，前端使用 `React + Vite`，后端使用 `Express.js`。
为了获得最佳的体验和稳定性，建议的生产环境部署方案是：**前端部署至 Vercel，后端部署至 Render / Railway**。

---

## 方案一：推荐架构（前端 Vercel + 后端 Render）

这种方式最符合真实企业级应用的部署规范，可以完美避免 Vercel 免费版函数执行超时（Serverless Cold Start）问题。

### 1. 部署后端 (Express) 到 Render
Render 提供免费且易用的 Node.js 后端托管服务。
1. 登录 [Render](https://render.com/) 并连接您的 GitHub 账号。
2. 点击 **"New +" -> "Web Service"**。
3. 选择您刚上传的 `digital-curator` GitHub 仓库。
4. 按以下参数配置部署：
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
5. 在 **Environment Variables (环境变量)** 填入以下配置：
   - `VITE_SUPABASE_URL` = (您的 Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (您的 Supabase Anon Key)
   - `SUPABASE_SERVICE_ROLE_KEY` = (您的 Supabase Service Role 密钥，**非常重要**)
   - `CORS_ORIGIN` = (等前端部署完，填入 Vercel 提供的网址，如 `https://digital-curator.vercel.app`)
6. 点击 **"Create Web Service"**，等待部署成功并获取您的后端网址（例如 `https://digital-curator-backend.onrender.com`）。

### 2. 部署前端 (React / Vite) 到 Vercel
1. 登录 [Vercel](https://vercel.com/)，点击 **"Add New..." -> "Project"**。
2. 导入您的 `digital-curator` GitHub 仓库。
3. Vercel 会自动识别出 Vite 项目，所有 Build 设置（`npm run build` 和 `dist` 输出）保持**默认**。
4. 展开 **"Environment Variables"**，填入以下变量：
   - `VITE_SUPABASE_URL` = (您的 Supabase URL)
   - `VITE_SUPABASE_ANON_KEY` = (您的 Supabase Anon Key)
5. **最重要的一步（代码修改提醒）**：
   在正式部署 Vercel 前，您需要在代码中告诉前端去哪里寻找线上后端：
   打开 `src/services/api.ts` 文件，将目前的 `const API_URL = '/api'` 或直接请求本地的逻辑，修改为判断环境：
   ```typescript
   // src/services/api.ts 的最上方
   const API_URL = import.meta.env.PROD 
     ? 'https://digital-curator-backend.onrender.com/api' // <- 换成您 Render 的真实后端网址
     : '/api';
   ```
6. 点击 **"Deploy"**，等待几十秒后即可获得 Vercel 的访问连结。

---

## 方案二：如果你想把前后端硬塞在一起全托管给 Vercel (纯 Serverless 模式)

Vercel 原生是对无服务器函数最友好的。如果您想把前后端（Express）都塞进 Vercel 统一管理，您需要在项目根目录新建一个 `vercel.json` 文件来重写路由：

### 1. 新建 `vercel.json`（放置于项目根目录）
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    },
    {
      "src": "server/index.ts",
      "use": "@vercel/node"
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/server/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. 去 Vercel 完成导入与部署
1. 直接在 Vercel 导入仓库。
2. 在环境变量中将 `.env` 文件里的三个 Supabase 变量全部填进去（特别包含 `SUPABASE_SERVICE_ROLE_KEY`）。
3. 部署即可！Vercel 会自动把前端打包丢到静态边缘网络，把 `server/index.ts` 转换成 Serverless Function 运行您的 API。

*(注：Vercel 免费版的 Serverless 函数执行时常默认上限为 10 秒，如果以后接了很耗时的爬虫、大数据分析流程，可能会遇到 504 Timeout 报错，这时候还是建议切回到【方案一】。)*
