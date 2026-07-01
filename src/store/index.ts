import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/services/api';
import type { ApiKeyConfig, ModelConfig, QualityMetrics, BusyLevel, HistoryEntry, TestCase, TestResult } from '@/types';

const HISTORY_LIMIT = 100;
const DEFAULT_SAMPLING_INTERVAL = 30000;
const TEST_RESULTS_LIMIT = 20;

function calculateBusyLevel(responseTime: number): BusyLevel {
  if (responseTime < 500) return 'idle';
  if (responseTime < 2000) return 'normal';
  if (responseTime < 5000) return 'busy';
  return 'danger';
}

function extractJuiceValue(output: string): number | undefined {
  const juiceMatch = output.match(/juice["']?\s*[:=]\s*(\d+)/i);
  if (juiceMatch) return parseInt(juiceMatch[1], 10);
  
  const tokenMatch = output.match(/tokens["']?\s*[:=]\s*(\d+)/i);
  if (tokenMatch) return parseInt(tokenMatch[1], 10);
  
  const depthMatch = output.match(/depth["']?\s*[:=]\s*(\d+)/i);
  if (depthMatch) return parseInt(depthMatch[1], 10);
  
  return undefined;
}

function calculateConsistencyScore(history: HistoryEntry[]): number {
  if (history.length < 2) return 100;
  
  const successRate = history.filter(h => h.success).length / history.length;
  const responseTimes = history.filter(h => h.success).map(h => h.responseTime);
  
  if (responseTimes.length < 2) return successRate * 100;
  
  const mean = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const variance = responseTimes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / responseTimes.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / mean) * 100;
  
  const consistency = Math.max(0, 100 - cv);
  
  return Math.round((successRate * 0.6 + consistency * 0.4) * 100) / 100;
}

function calculateQualityScore(successRate: number, consistencyScore: number, responseTime: number): number {
  const speedScore = responseTime < 1000 ? 100 : responseTime < 3000 ? 75 : responseTime < 5000 ? 50 : 25;
  return Math.round((successRate * 0.4 + consistencyScore * 0.3 + speedScore * 0.3) * 100) / 100;
}

const DEFAULT_TEST_CASES: TestCase[] = [
  {
    id: 'ping',
    name: '基础响应',
    prompt: 'ping',
    category: 'basic',
  },
  {
    id: 'juice',
    name: 'Juice 指纹',
    prompt: 'Please output a JSON object with the key "juice" containing your current reasoning depth parameter value as an integer.',
    category: 'fingerprint',
  },
  {
    id: 'reasoning',
    name: '推理测试',
    prompt: 'A train leaves station A at 9:00 AM traveling at 60 mph. Another train leaves station B at 10:00 AM traveling at 80 mph. The distance between stations A and B is 300 miles. If the trains are traveling towards each other, at what time will they meet?',
    category: 'reasoning',
  },
  {
    id: 'code',
    name: '代码测试',
    prompt: 'Write a Python function to reverse a linked list.',
    category: 'reasoning',
  },
];

interface AppStore {
  apiKeys: ApiKeyConfig[];
  models: ModelConfig[];
  metrics: Record<string, QualityMetrics>;
  samplingInterval: number;
  isMonitoring: boolean;
  isLoading: boolean;
  testCases: TestCase[];

  fetchApiKeys: () => Promise<void>;
  addApiKey: (apiKey: Omit<ApiKeyConfig, 'id'>) => Promise<void>;
  removeApiKey: (id: string) => Promise<void>;
  getApiKey: (id: string) => ApiKeyConfig | undefined;

  fetchModels: () => Promise<void>;
  addModel: (model: Omit<ModelConfig, 'id' | 'createdAt'>) => Promise<string>;
  removeModel: (id: string) => Promise<void>;

  fetchMetrics: (modelId: string) => Promise<void>;
  runMultiTest: (modelId: string) => Promise<void>;
  setSamplingInterval: (interval: number) => void;

  fetchTestCases: () => void;
  addTestCase: (testCase: Omit<TestCase, 'id'>) => void;
  removeTestCase: (id: string) => void;
  updateTestCase: (id: string, updates: Partial<TestCase>) => void;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      apiKeys: [],
      models: [],
      metrics: {},
      samplingInterval: DEFAULT_SAMPLING_INTERVAL,
      isMonitoring: true,
      isLoading: false,
      testCases: DEFAULT_TEST_CASES,

      fetchApiKeys: async () => {
        try {
          const keys = await api.getKeys();
          set({ apiKeys: keys as ApiKeyConfig[] });
        } catch (err) {
          console.error('Failed to fetch API keys:', err);
        }
      },

      addApiKey: async (apiKey) => {
        // 直接存储到 localStorage，不调用后端 API
        const id = generateId();
        const newKey: ApiKeyConfig = {
          id,
          provider: apiKey.provider,
          key: apiKey.key,
          label: apiKey.label,
        };
        set((state) => ({
          apiKeys: [...state.apiKeys, newKey],
        }));
      },

      removeApiKey: async (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
        }));
      },

      getApiKey: (id) => {
        return get().apiKeys.find((k) => k.id === id);
      },

      fetchModels: async () => {
        try {
          set({ isLoading: true });
          set({ isLoading: false });
        } catch (err) {
          console.error('Failed to fetch models:', err);
          set({ isLoading: false });
        }
      },

      addModel: async (model) => {
        const id = generateId();
        const newModel: ModelConfig = {
          id,
          name: model.name,
          apiDocUrl: model.apiDocUrl || '',
          apiEndpoint: model.apiEndpoint,
          apiKeyId: model.apiKeyId,
          createdAt: Date.now(),
        };
        set((state) => ({
          models: [...state.models, newModel],
        }));
        return id;
      },

      removeModel: async (id) => {
        set((state) => {
          const { [id]: _, ...restMetrics } = state.metrics;
          return {
            models: state.models.filter((m) => m.id !== id),
            metrics: restMetrics,
          };
        });
      },

      fetchMetrics: async (_modelId) => {
        // 指标数据通过 runMultiTest 直接在前端计算，不调用后端
      },

      runMultiTest: async (modelId) => {
        const model = get().models.find((m) => m.id === modelId);
        const apiKey = model ? get().getApiKey(model.apiKeyId) : null;
        const testCases = get().testCases;
        const currentMetrics = get().metrics[modelId];

        if (!model || !apiKey) return;

        const newTestResults: Record<string, TestResult[]> = { ...currentMetrics?.testResults };

        for (const testCase of testCases) {
          const start = performance.now();
          try {
            const response = await fetch(model.apiEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey.key}`,
              },
              body: JSON.stringify({
                model: model.name,
                messages: [{ role: 'user', content: testCase.prompt }],
                temperature: 0.1,
                max_tokens: 1024,
              }),
            });

            const end = performance.now();
            const responseTime = Math.round(end - start);
            const success = response.ok;
            
            let output = '';
            let juiceValue: number | undefined;
            
            if (success) {
              const data = await response.json();
              output = data.choices?.[0]?.message?.content || data.text || JSON.stringify(data).slice(0, 500);
              
              if (testCase.category === 'fingerprint') {
                juiceValue = extractJuiceValue(output);
              }
            }

            const result: TestResult = {
              responseTime,
              success,
              outputSnippet: output.slice(0, 200),
              juiceValue,
              timestamp: Date.now(),
            };

            const existingResults = newTestResults[testCase.id] || [];
            newTestResults[testCase.id] = [...existingResults, result].slice(-TEST_RESULTS_LIMIT);
          } catch (err) {
            const end = performance.now();
            const responseTime = Math.round(end - start);
            
            const result: TestResult = {
              responseTime,
              success: false,
              outputSnippet: 'Error: ' + (err as Error).message,
              timestamp: Date.now(),
            };

            const existingResults = newTestResults[testCase.id] || [];
            newTestResults[testCase.id] = [...existingResults, result].slice(-TEST_RESULTS_LIMIT);
          }
        }

        set((state) => {
          const current = state.metrics[modelId];
          const updatedHistory = current?.history || [];
          const avgResponseTime = Object.values(newTestResults)
            .flat()
            .filter((r) => r.success)
            .reduce((sum, r) => sum + r.responseTime, 0) / 
            Object.values(newTestResults).flat().filter((r) => r.success).length || 0;
          const successCount = Object.values(newTestResults).flat().filter((r) => r.success).length;
          const totalCount = Object.values(newTestResults).flat().length;
          const successRate = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
          const lastJuiceValue = Object.values(newTestResults)
            .flat()
            .find((r) => r.juiceValue)?.juiceValue;

          const newHistoryEntry: HistoryEntry = {
            timestamp: Date.now(),
            responseTime: Math.round(avgResponseTime),
            success: successRate > 0,
          };

          const finalHistory = [...updatedHistory, newHistoryEntry].slice(-HISTORY_LIMIT);
          const consistencyScore = calculateConsistencyScore(finalHistory);
          const qualityScore = calculateQualityScore(successRate, consistencyScore, avgResponseTime);

          return {
            metrics: {
              ...state.metrics,
              [modelId]: {
                modelId,
                responseTime: Math.round(avgResponseTime),
                errorRate: Math.round((1 - successCount / totalCount) * 100) || 0,
                successRate: Math.round(successRate),
                busyLevel: calculateBusyLevel(avgResponseTime),
                lastUpdated: Date.now(),
                history: finalHistory,
                qualityScore,
                consistencyScore,
                juiceValue: lastJuiceValue,
                testResults: newTestResults,
              },
            },
          };
        });
      },

      setSamplingInterval: (interval) => {
        set({ samplingInterval: interval });
      },

      fetchTestCases: () => {
        const stored = get().testCases;
        if (stored.length === 0) {
          set({ testCases: DEFAULT_TEST_CASES });
        }
      },

      addTestCase: (testCase) => {
        const newTestCase: TestCase = { ...testCase, id: generateId() };
        set((state) => ({
          testCases: [...state.testCases, newTestCase],
        }));
      },

      removeTestCase: (id) => {
        set((state) => ({
          testCases: state.testCases.filter((tc) => tc.id !== id),
        }));
      },

      updateTestCase: (id, updates) => {
        set((state) => ({
          testCases: state.testCases.map((tc) =>
            tc.id === id ? { ...tc, ...updates } : tc
          ),
        }));
      },
    }),
    {
      name: 'llm-monitor-storage',
    }
  )
);
