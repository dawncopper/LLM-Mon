import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { prisma } from './lib/prisma.js';
import { startMonitor } from './services/monitor.js';
import modelsRouter from './routes/models.js';
import keysRouter from './routes/keys.js';

const app = express();
const PORT = process.env.PORT || 3000;

// CORS 配置
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['https://dawncopper.github.io', 'http://localhost:5173'];

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
  })
);
app.use(express.json());

// 路由
app.use('/api/models', modelsRouter);
app.use('/api/keys', keysRouter);

// 健康检查
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// 启动后台监控 (每30秒)
cron.schedule('*/30 * * * * *', async () => {
  try {
    await startMonitor();
  } catch (err) {
    console.error('Monitor error:', err);
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
