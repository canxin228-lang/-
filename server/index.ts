import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import usersRouter from './routes/users.js';
import resumesRouter from './routes/resumes.js';
import platformsRouter from './routes/platforms.js';
import logsRouter from './routes/logs.js';
import opportunitiesRouter from './routes/opportunities.js';
import interviewsRouter from './routes/interviews.js';
import tasksRouter from './routes/tasks.js';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));

// API 路由
app.use('/api/users', usersRouter);
app.use('/api/resumes', resumesRouter);
app.use('/api/platforms', platformsRouter);
app.use('/api/logs', logsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/interviews', interviewsRouter);
app.use('/api/tasks', tasksRouter);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 启动服务器 (仅在非 Vercel 环境下才执行 listen, Vercel 会自己接管)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 后端服务器运行在 http://localhost:${PORT}`);
  });
}

// 供 Vercel Serverless 函数使用
export default app;
