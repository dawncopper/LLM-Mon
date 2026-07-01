# LLM 服务质量监控 - 后端服务

基于 Node.js + Express + PostgreSQL 的后端服务，提供 LLM 模型监控 API。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，修改数据库连接字符串：

```bash
cp .env.example .env
```

编辑 `.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/llm_monitor"
PORT=3000
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 推送数据库结构
npx prisma db push
```

### 4. 启动开发服务器

```bash
npm run dev
```

服务将在 http://localhost:3000 启动。

## 部署到 Railway

### 1. 创建 Railway 项目

1. 访问 [Railway](https://railway.app) 并登录
2. 点击 "New Project" → "Empty Project"
3. 添加 PostgreSQL 数据库
4. 添加 Node.js 服务，连接到 GitHub 仓库

### 2. 配置环境变量

在 Railway 项目设置中配置：
- `DATABASE_URL`: PostgreSQL 连接字符串（由 Railway 自动填充）
- `PORT`: 3000

### 3. 部署

1. Railway 会自动检测 Node.js 项目并部署
2. 部署完成后，API 地址为 `https://your-app.up.railway.app/api`

### 4. 修改前端 API 地址

在前端项目中创建 `.env` 文件：

```bash
VITE_API_URL=https://your-app.up.railway.app
```

重新构建并部署前端：

```bash
npm run build
npm run deploy
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/keys | 获取所有 API Key |
| POST | /api/keys | 添加 API Key |
| DELETE | /api/keys/:id | 删除 API Key |
| GET | /api/models | 获取所有模型 |
| POST | /api/models | 添加模型 |
| DELETE | /api/models/:id | 删除模型 |
| GET | /api/models/:id/metrics | 获取模型指标 |

## 监控服务

后台监控任务每 30 秒自动执行，采样所有模型的响应时间和可用性。

## 技术栈

- **运行时**: Node.js 18+
- **框架**: Express.js
- **ORM**: Prisma
- **数据库**: PostgreSQL
- **定时任务**: node-cron
