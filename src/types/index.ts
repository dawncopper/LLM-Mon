export type BusyLevel = 'idle' | 'normal' | 'busy' | 'danger';

export type Provider = 'openai' | 'anthropic' | 'azure' | 'custom';

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

export interface QualityMetrics {
  modelId: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  busyLevel: BusyLevel;
  lastUpdated: number;
  history: HistoryEntry[];
}

export interface AppState {
  apiKeys: ApiKeyConfig[];
  models: ModelConfig[];
  metrics: Record<string, QualityMetrics>;
  samplingInterval: number;
}
