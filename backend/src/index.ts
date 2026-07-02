import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { prisma } from './lib/prisma.js';
import { startMonitor } from './services/monitor.js';
import modelsRouter from './routes/models.js';
import keysRouter from './routes/keys.js';
import authRouter from './routes/auth.js';
import { authMiddleware } from './middleware/auth.js';

const app = express();
const PORT = process.env.PORT || 3000;
const REQUIRE_AUTH = process.env.REQUIRE_AUTH !== 'false'; // 默认启用认证

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

// 公开路由（无需认证）
app.use('/api/auth', authRouter);

// 健康检查（公开）
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 认证保护的中间件（可配置关闭）
function maybeAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!REQUIRE_AUTH) {
    // 未启用认证时，模拟一个 userId（方便本地开发）
    req.userId = 'dev-user';
    next();
  } else {
    authMiddleware(req, res, next);
  }
}

// 受保护路由
app.use('/api/keys', maybeAuth, keysRouter);
app.use('/api/models', maybeAuth, modelsRouter);

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
  console.log(`Server running on port ${PORT}, auth=${REQUIRE_AUTH}`);
});
