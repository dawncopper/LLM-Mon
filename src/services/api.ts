/// <reference types="vite/client" />
import type { Provider, TestCase } from '@/types';

function getApiBase(): string {
  const stored = localStorage.getItem('llm-monitor-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.backendUrl) {
        return parsed.state.backendUrl;
      }
    } catch {
      // ignore
    }
  }
  return import.meta.env.VITE_API_URL || '';
}

export interface ApiKeyResponse {
  id: string;
  provider: Provider;
  label: string;
  key?: string;
  createdAt?: string;
}

export interface ModelResponse {
  id: string;
  name: string;
  apiDocUrl: string | null;
  apiEndpoint: string;
  apiKeyId: string;
  apiKey?: { label: string; provider: string; id: string };
  createdAt?: string;
}

export interface MetricsResponse {
  modelId: string;
  responseTime: number;
  errorRate: number;
  successRate: number;
  busyLevel: string;
  lastUpdated: number;
  juiceValue: number | null;
  juiceTrend?: string | null;
  juiceBaseline?: number | null;
  throughputTPS?: number | null;
  qualityScore?: number;
  consistencyScore?: number;
  history: { timestamp: number; responseTime: number; success: boolean }[];
}

export interface TestResultResponse {
  responseTime: number;
  success: boolean;
  outputSnippet: string;
  score?: number;
  juiceValue?: number;
}

export interface RunTestResponse {
  modelId: string;
  responseTime: number;
  successRate: number;
  errorRate: number;
  juiceValue: number | null;
  juiceTrend?: string;
  juiceBaseline?: number;
  throughputTPS?: number;
  qualityScore?: number;
  testResults: Record<string, TestResultResponse>;
  timestamp: number;
}

export const api = {
  async health(): Promise<{ status: string; timestamp: number }> {
    const res = await fetch(`${getApiBase()}/api/health`);
    return res.json();
  },

  // Keys
  async getKeys(): Promise<ApiKeyResponse[]> {
    const res = await fetch(`${getApiBase()}/api/keys`);
    return res.json();
  },
  async addKey(data: { provider: string; key: string; label: string }): Promise<ApiKeyResponse> {
    const res = await fetch(`${getApiBase()}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async deleteKey(id: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/keys/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete key');
  },

  // Models
  async getModels(): Promise<ModelResponse[]> {
    const res = await fetch(`${getApiBase()}/api/models`);
    return res.json();
  },
  async addModel(data: { name: string; apiDocUrl?: string; apiEndpoint: string; apiKeyId: string }): Promise<ModelResponse> {
    const res = await fetch(`${getApiBase()}/api/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async deleteModel(id: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/models/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete model');
  },

  // Metrics
  async getMetrics(modelId: string, hours = 24): Promise<MetricsResponse> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/metrics?hours=${hours}`);
    return res.json();
  },

  // Run test
  async runTest(modelId: string, testCases?: TestCase[]): Promise<RunTestResponse> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testCases }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Test cases (per model)
  async getTestCases(modelId: string): Promise<TestCase[]> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test-cases`);
    return res.json();
  },
  async addTestCase(modelId: string, data: { name: string; prompt: string; category: string }): Promise<TestCase> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test-cases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  async deleteTestCase(modelId: string, testCaseId: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test-cases/${testCaseId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete test case');
  },
};
