/// <reference types="vite/client" />
import type { Provider, TestCase } from '@/types';
import { useStore } from '@/store';

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

/** 获取当前 JWT Token（从 zustand store） */
function getToken(): string | null {
  return useStore.getState().token;
}

/** 构造带认证信息的 headers */
function getHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
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

  // Auth
  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const res = await fetch(`${getApiBase()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    return res.json();
  },

  async register(email: string, password: string): Promise<{ token: string; user: { id: string; email: string } }> {
    const res = await fetch(`${getApiBase()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    return res.json();
  },

  // Keys
  async getKeys(): Promise<ApiKeyResponse[]> {
    const res = await fetch(`${getApiBase()}/api/keys`, {
      headers: getHeaders(),
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error('Unauthorized - please login again');
      throw new Error(await res.text());
    }
    return res.json();
  },

  async addKey(data: { provider: string; key: string; label: string }): Promise<ApiKeyResponse> {
    const res = await fetch(`${getApiBase()}/api/keys`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteKey(id: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/keys/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete key');
  },

  // Models
  async getModels(): Promise<ModelResponse[]> {
    const res = await fetch(`${getApiBase()}/api/models`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async addModel(data: { name: string; apiDocUrl?: string; apiEndpoint: string; apiKeyId: string }): Promise<ModelResponse> {
    const res = await fetch(`${getApiBase()}/api/models`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteModel(id: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/models/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete model');
  },

  // Metrics
  async getMetrics(modelId: string, hours = 24): Promise<MetricsResponse> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/metrics?hours=${hours}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Run test
  async runTest(modelId: string, testCases?: TestCase[]): Promise<RunTestResponse> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ testCases }),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Test cases (per model)
  async getTestCases(modelId: string): Promise<TestCase[]> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test-cases`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async addTestCase(modelId: string, data: { name: string; prompt: string; category: string }): Promise<TestCase> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test-cases`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async deleteTestCase(modelId: string, testCaseId: string): Promise<void> {
    const res = await fetch(`${getApiBase()}/api/models/${modelId}/test-cases/${testCaseId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete test case');
  },
};
