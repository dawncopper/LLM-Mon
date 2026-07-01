/// <reference types="vite/client" />
import type { Provider } from '@/types';

const API_BASE = import.meta.env.VITE_API_URL || '';

interface ApiKey {
  id: string;
  provider: Provider;
  label: string;
  key?: string;
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
  juiceValue?: number;
  history: { timestamp: number; responseTime: number; success: boolean }[];
}

export const api = {
  // Keys
  async getKeys(): Promise<ApiKey[]> {
    const res = await fetch(`${API_BASE}/api/keys`);
    return res.json();
  },
  async addKey(data: { provider: string; key: string; label: string }): Promise<ApiKey> {
    const res = await fetch(`${API_BASE}/api/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteKey(id: string): Promise<void> {
    await fetch(`${API_BASE}/api/keys/${id}`, { method: 'DELETE' });
  },

  // Models
  async getModels(): Promise<Model[]> {
    const res = await fetch(`${API_BASE}/api/models`);
    return res.json();
  },
  async addModel(data: { name: string; apiDocUrl?: string; apiEndpoint: string; apiKeyId: string }): Promise<Model> {
    const res = await fetch(`${API_BASE}/api/models`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  async deleteModel(id: string): Promise<void> {
    await fetch(`${API_BASE}/api/models/${id}`, { method: 'DELETE' });
  },

  // Metrics
  async getMetrics(modelId: string, hours = 24): Promise<Metrics> {
    const res = await fetch(`${API_BASE}/api/models/${modelId}/metrics?hours=${hours}`);
    return res.json();
  },
};