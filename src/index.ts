import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { startMonitor } from './services/monitor.js';
import modelsRouter from './routes/models.js';
import keysRouter from './routes/keys.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
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
    await startMonitor(prisma);
  } catch (err) {
    console.error('Monitor error:', err);
  }
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };
