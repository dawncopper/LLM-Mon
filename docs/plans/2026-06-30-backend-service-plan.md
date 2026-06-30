# LLM 服务质量监控后端服务实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 Node.js/Express 后端服务，提供 API 管理 LLM 模型和监控数据，后台持续采样存储到 PostgreSQL

**Architecture:** 使用 Express.js 构建 REST API，Prisma 作为 ORM 操作 PostgreSQL，后台定时任务持续监控各模型质量指标

**Tech Stack:** Node.js 18+, Express.js, Prisma, PostgreSQL

---

## 文件结构

```
backend/
├── prisma/
│   └── schema.prisma          # 数据库模型定义
├── src/
│   ├── index.ts               # 服务入口
│   ├── routes/
│   │   ├── models.ts          # 模型管理路由
│   │   ├── keys.ts            # API Key 管理路由
│   │   └── metrics.ts         # 指标查询路由
│   ├── services/
│   │   ├── monitor.ts         # 监控采样服务
│   │   └── llm.ts             # LLM API 调用
│   ├── utils/
│   │   └── crypto.ts          # 加密工具
│   └── types/
│       └── index.ts           # 类型定义
├── .env.example               # 环境变量示例
├── package.json
└── tsconfig.json
```

---

## Task 1: 初始化后端项目

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "llm-monitor-backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:push": "prisma db push",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.19.0",
    "express": "^4.21.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "node-cron": "^3.0.3",
    "axios": "^1.7.7"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/cors": "^2.8.17",
    "@types/node": "^22.5.0",
    "@types/node-cron": "^3.0.11",
    "prisma": "^5.19.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.3"
  }
}
```

- [ ] **Step 2: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: 创建 .env.example**

```
DATABASE_URL="postgresql://user:password@localhost:5432/llm_monitor"
PORT=3000
```

---

## Task 2: 创建 Prisma Schema

**Files:**
- Create: `backend/prisma/schema.prisma`

- [ ] **Step 1: 创建 Prisma Schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model ApiKey {
  id        String   @id @default(cuid())
  provider  String   // openai, anthropic, azure, custom
  key       String   // 加密存储
  label     String
  createdAt DateTime @default(now())
  models    Model[]
}

model Model {
  id           String    @id @default(cuid())
  name         String
  apiDocUrl    String?
  apiEndpoint  String
  createdAt    DateTime  @default(now())
  apiKeyId     String
  apiKey       ApiKey    @relation(fields: [apiKeyId], references: [id], onDelete: Cascade)
  metrics      Metric[]

  @@index([apiKeyId])
}

model Metric {
  id           String   @id @default(cuid())
  responseTime Int      // ms
  success      Boolean
  timestamp    DateTime @default(now())
  modelId      String
  model        Model    @relation(fields: [modelId], references: [id], onDelete: Cascade)

  @@index([modelId])
  @@index([timestamp])
}
```

- [ ] **Step 2: 提交代码**

```bash
cd backend
git init
git add .
git commit -m "feat: 初始化后端项目结构"
```

---

## Task 3: 实现服务入口和中间件

**Files:**
- Create: `backend/src/index.ts`
- Create: `backend/src/types/index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
export interface QualityMetrics {
  modelId: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  busyLevel: 'idle' | 'normal' | 'busy' | 'danger';
  lastUpdated: number;
  history: MetricHistory[];
}

export interface MetricHistory {
  timestamp: number;
  responseTime: number;
  success: boolean;
}

export type Provider = 'openai' | 'anthropic' | 'azure' | 'custom';

export function calculateBusyLevel(responseTime: number): 'idle' | 'normal' | 'busy' | 'danger' {
  if (responseTime < 500) return 'idle';
  if (responseTime < 2000) return 'normal';
  if (responseTime < 5000) return 'busy';
  return 'danger';
}
```

- [ ] **Step 2: 创建服务入口**

```typescript
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import { startMonitor } from './services/monitor.js';
import modelsRouter from './routes/models.js';
import keysRouter from './routes/keys.js';
import metricsRouter from './routes/metrics.js';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 路由
app.use('/api/models', modelsRouter);
app.use('/api/keys', keysRouter);
app.use('/api/metrics', metricsRouter);

// 健康检查
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// 错误处理
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// 启动后台监控
cron.schedule('*/30 * * * * *', async () => {
  await startMonitor(prisma);
});

// 启动服务
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { prisma };
```

- [ ] **Step 3: 提交代码**

```bash
cd backend
git add .
git commit -m "feat: 实现服务入口和基础中间件"
```

---

## Task 4: 实现 API Key 管理路由

**Files:**
- Create: `backend/src/routes/keys.ts`
- Create: `backend/src/utils/crypto.ts`

- [ ] **Step 1: 创建加密工具**

```typescript
// 简单加密，实际生产环境应使用更安全的方式
export function encryptKey(key: string): string {
  return Buffer.from(key).toString('base64');
}

export function decryptKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}
```

- [ ] **Step 2: 创建 keys 路由**

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { encryptKey, decryptKey } from '../utils/crypto.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_, res) => {
  const keys = await prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } });
  // 返回时隐藏真实 key
  res.json(keys.map(k => ({ ...k, key: '***' })));
});

router.post('/', async (req, res) => {
  const { provider, key, label } = req.body;
  if (!provider || !key || !label) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const encrypted = encryptKey(key);
  const apiKey = await prisma.apiKey.create({
    data: { provider, key: encrypted, label },
  });
  res.json({ ...apiKey, key: '***' });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.apiKey.delete({ where: { id } });
  res.json({ success: true });
});

export default router;
```

- [ ] **Step 3: 提交代码**

```bash
cd backend
git add .
git commit -m "feat: 实现 API Key 管理路由"
```

---

## Task 5: 实现模型管理路由

**Files:**
- Create: `backend/src/routes/models.ts`

- [ ] **Step 1: 创建 models 路由**

```typescript
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateBusyLevel } from '../types/index.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (_, res) => {
  const models = await prisma.model.findMany({
    include: { apiKey: { select: { label: true, provider: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(models);
});

router.post('/', async (req, res) => {
  const { name, apiDocUrl, apiEndpoint, apiKeyId } = req.body;
  if (!name || !apiEndpoint || !apiKeyId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const model = await prisma.model.create({
    data: { name, apiDocUrl, apiEndpoint, apiKeyId },
  });
  res.json(model);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.model.delete({ where: { id } });
  res.json({ success: true });
});

router.get('/:id/metrics', async (req, res) => {
  const { id } = req.params;
  const { hours = 24 } = req.query;

  const since = new Date(Date.now() - Number(hours) * 60 * 60 * 1000);

  const metrics = await prisma.metric.findMany({
    where: { modelId: id, timestamp: { gte: since } },
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  if (metrics.length === 0) {
    return res.json({
      modelId: id,
      responseTime: 0,
      errorRate: 0,
      successRate: 100,
      busyLevel: 'idle',
      lastUpdated: Date.now(),
      history: [],
    });
  }

  const totalRequests = metrics.length;
  const failedRequests = metrics.filter(m => !m.success).length;
  const avgResponseTime = Math.round(
    metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests
  );
  const errorRate = Math.round((failedRequests / totalRequests) * 100);

  res.json({
    modelId: id,
    responseTime: avgResponseTime,
    errorRate,
    successRate: 100 - errorRate,
    busyLevel: calculateBusyLevel(avgResponseTime),
    lastUpdated: metrics[0].timestamp.getTime(),
    history: metrics.map(m => ({
      timestamp: m.timestamp.getTime(),
      responseTime: m.responseTime,
      success: m.success,
    })),
  });
});

export default router;
```

- [ ] **Step 2: 提交代码**

```bash
cd backend
git add .
git commit -m "feat: 实现模型管理路由"
```

---

## Task 6: 实现 LLM API 调用和监控服务

**Files:**
- Create: `backend/src/services/llm.ts`
- Create: `backend/src/services/monitor.ts`

- [ ] **Step 1: 创建 LLM API 调用服务**

```typescript
import axios from 'axios';
import { decryptKey } from '../utils/crypto.js';

interface MonitorResult {
  responseTime: number;
  success: boolean;
}

export async function callLLMApi(
  endpoint: string,
  apiKey: string,
  provider: string
): Promise<MonitorResult> {
  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider === 'openai') {
      headers['Authorization'] = `Bearer ${decryptKey(apiKey)}`;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = decryptKey(apiKey);
    } else if (provider === 'azure') {
      headers['api-key'] = decryptKey(apiKey);
    } else {
      headers['Authorization'] = `Bearer ${decryptKey(apiKey)}`;
    }

    await axios.post(
      endpoint,
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      },
      { headers, timeout: 30000 }
    );

    return { responseTime: Date.now() - startTime, success: true };
  } catch {
    return { responseTime: Date.now() - startTime, success: false };
  }
}
```

- [ ] **Step 2: 创建监控服务**

```typescript
import { PrismaClient } from '@prisma/client';
import { callLLMApi } from './llm.js';

export async function startMonitor(prisma: PrismaClient): Promise<void> {
  const models = await prisma.model.findMany({
    include: { apiKey: true },
  });

  for (const model of models) {
    const result = await callLLMApi(
      model.apiEndpoint,
      model.apiKey.key,
      model.apiKey.provider
    );

    await prisma.metric.create({
      data: {
        modelId: model.id,
        responseTime: result.responseTime,
        success: result.success,
      },
    });
  }
}
```

- [ ] **Step 3: 提交代码**

```bash
cd backend
git add .
git commit -m "feat: 实现 LLM 调用和监控服务"
```

---

## Task 7: 前端改造

**Files:**
- Modify: `frontend/src/store/index.ts`
- Modify: `frontend/src/hooks/useMonitoring.ts`
- Modify: `frontend/src/services/api.ts` (新建)
- Modify: `frontend/vite.config.ts` (添加代理)

- [ ] **Step 1: 创建前端 API 服务**

Create: `frontend/src/services/api.ts`

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface ApiKey {
  id: string;
  provider: string;
  label: string;
}

interface Model {
  id: string;
  name: string;
  apiDocUrl: string;
  apiEndpoint: string;
  apiKeyId: string;
}

interface Metrics {
  modelId: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  busyLevel: string;
  lastUpdated: number;
  history: { timestamp: number; responseTime: number; success: boolean }[];
}

export const api = {
  // Keys
  async getKeys(): Promise<ApiKey[]> {
    const res = await fetch(`${API_BASE}/keys`);
    return res.json();
  },
  async addKey(data: { provider: string; key: string; label: string }): Promise<ApiKey> {
    const res = await fetch(`${API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteKey(id: string): Promise<void> {
    await fetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
  },

  // Models
  async getModels(): Promise<Model[]> {
    const res = await fetch(`${API_BASE}/models`);
    return res.json();
  },
  async addModel(data: { name: string; apiDocUrl?: string; apiEndpoint: string; apiKeyId: string }): Promise<Model> {
    const res = await fetch(`${API_BASE}/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteModel(id: string): Promise<void> {
    await fetch(`${API_BASE}/models/${id}`, { method: 'DELETE' });
  },

  // Metrics
  async getMetrics(modelId: string, hours = 24): Promise<Metrics> {
    const res = await fetch(`${API_BASE}/models/${modelId}/metrics?hours=${hours}`);
    return res.json();
  },
};
```

- [ ] **Step 2: 修改 vite.config.ts 添加代理**

```typescript
export default defineConfig({
  plugins: [react()],
  base: '/LLM-Mon/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

- [ ] **Step 3: 修改 store/index.ts 适配后端**

将 `addModel` `removeModel` `recordMetric` 等方法改为调用 API

- [ ] **Step 4: 移除 useMonitoring 本地监控逻辑**

改为定时调用 `api.getMetrics()` 获取最新数据

- [ ] **Step 5: 提交代码**

```bash
cd frontend
git add .
git commit -m "feat: 改造前端对接后端 API"
```

---

## Task 8: 部署指南

**Files:**
- Create: `backend/README.md`

- [ ] **创建 Railway 部署 README**

```markdown
# 部署到 Railway

1. 在 Railway 创建新项目，选择 "Empty Project"
2. 添加 PostgreSQL 数据库
3. 部署 Node.js 服务，连接到仓库
4. 设置环境变量：
   - `DATABASE_URL`: PostgreSQL 连接字符串
   - `PORT`: 3000
5. 部署完成后，API 地址为 `https://your-app.up.railway.app/api`
```

---

## 执行选项

**1. Subagent-Driven (推荐)** - 每个 Task 由独立 subagent 执行，任务间有检查点

**2. Inline Execution** - 在当前 session 中按 batch 执行

选择哪个方式？
