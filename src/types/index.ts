export type BusyLevel = 'idle' | 'normal' | 'busy' | 'danger';

export type Provider = 'openai' | 'anthropic' | 'azure' | 'custom';

export type TestCategory = 'basic' | 'reasoning' | 'fingerprint' | 'factuality' | 'boundary' | 'throughput' | 'custom';

export interface ApiKeyConfig {
  id: string;
  provider: Provider;
  key: string;
  label: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  apiDocUrl: string;
  apiEndpoint: string;
  apiKeyId: string;
  createdAt: number;
}

export interface HistoryEntry {
  timestamp: number;
  responseTime: number;
  success: boolean;
}

export interface TestCase {
  id: string;
  name: string;
  prompt: string;
  expected?: string;
  category: TestCategory;
}

export interface TestResult {
  responseTime: number;
  success: boolean;
  outputSnippet: string;
  score?: number;
  juiceValue?: number;
  timestamp: number;
}

export interface QualityMetrics {
  modelId: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  busyLevel: BusyLevel;
  lastUpdated: number;
  history: HistoryEntry[];
  qualityScore: number;
  consistencyScore: number;
  juiceValue?: number;
  juiceTrend?: string;        // "stable" | "degrading" | "improving"
  juiceBaseline?: number;     // Juice 基准线
  throughputTPS?: number;     // 吞吐量（words/sec）
  testResults: Record<string, TestResult[]>;
}

export interface AppState {
  apiKeys: ApiKeyConfig[];
  models: ModelConfig[];
  metrics: Record<string, QualityMetrics>;
  samplingInterval: number;
  testCases: TestCase[];
}
