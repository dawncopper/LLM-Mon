# LLM 服务质量实时监控平台

通过 AI 实时监测大模型服务质量的网页监控平台，通过固定周期收集影响质量的指标数据来实现感知服务质量。

## 功能特性

- **实时质量监控**：固定周期采样，实时展示响应时间、成功率、错误率
- **多模型管理**：支持添加多个 LLM 模型，卡片式展示
- **API Key 管理**：支持 OpenAI、Anthropic、Azure 等多家服务商
- **繁忙度可视化**：彩色圆角矩形指示器，直观展示服务繁忙程度
- **趋势图表**：迷你折线图展示响应时间历史趋势
- **本地存储**：配置数据保存在浏览器 LocalStorage
- **响应式设计**：适配桌面、平板、移动端

## 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **图标库**：Lucide React
- **状态管理**：Zustand
- **路由**：React Router DOM

## 快速开始

### 环境要求

- Node.js >= 18
- npm 或 pnpm

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 使用说明

### 1. 配置 API Key

首次使用时，系统会自动跳转到设置页面。点击「添加」按钮，输入：

- 名称：便于识别的标签
- 服务商：OpenAI / Anthropic / Azure / 自定义
- API Key：对应的 API 密钥

### 2. 添加监控模型

在监控面板点击「添加模型」，填写：

- 模型名称：如 GPT-4、Claude 3 等
- API 文档地址（可选）：模型 API 文档链接
- API 端点：API 请求地址
- 选择 API Key：使用已配置的 API Key

### 3. 查看质量指标

每张模型卡片展示：

| 指标 | 说明 |
|------|------|
| 响应时间 | 最近采样的平均响应时间（ms） |
| 成功率 | 成功请求 / 总请求 × 100% |
| 错误率 | 失败请求 / 总请求 × 100% |
| 繁忙度 | 空闲/正常/繁忙/危险 四档 |

### 4. 采样间隔设置

在设置页面可配置采样周期：15秒 / 30秒 / 60秒 / 120秒

## 繁忙度等级

| 等级 | 响应时间范围 | 颜色 | 圆角 |
|------|-------------|------|------|
| 空闲 | < 500ms | 薄荷绿 | 4px |
| 正常 | 500ms - 2000ms | 天际蓝 | 4px |
| 繁忙 | 2000ms - 5000ms | 琥珀橙 | 8px |
| 危险 | > 5000ms | 错误红 | 12px |

## 项目结构

```
src/
├── components/
│   ├── Dashboard/
│   │   ├── ModelCard.tsx      # 模型卡片组件
│   │   ├── MiniChart.tsx      # 迷你趋势图
│   │   └── BusyIndicator.tsx  # 繁忙度指示器
│   ├── Layout/
│   │   └── Header.tsx         # 顶部导航栏
│   └── Modal/
│       └── AddModelModal.tsx  # 添加模型弹窗
├── hooks/
│   └── useMonitoring.ts       # 监控数据采集 Hook
├── pages/
│   ├── Dashboard.tsx          # 监控面板页面
│   └── Settings.tsx           # 设置页面
├── store/
│   └── index.ts               # Zustand 状态管理
├── types/
│   └── index.ts               # TypeScript 类型定义
├── App.tsx
├── main.tsx
└── index.css
```

## 数据说明

- 历史数据：保留最近 100 条采样记录
- 响应时间：滑动窗口平均值
- 成功率/错误率：基于历史数据计算
- 数据存储：全部保存在浏览器 LocalStorage

## License

MIT
