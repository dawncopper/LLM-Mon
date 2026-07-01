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
