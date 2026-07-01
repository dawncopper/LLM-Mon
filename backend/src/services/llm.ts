import axios from 'axios';
import { decryptKey } from '../utils/crypto.js';

export interface LLMTestResult {
  responseTime: number;
  success: boolean;
  output: string;
  juiceValue?: number;
}

export interface TestCase {
  id: string;
  name: string;
  prompt: string;
  category: 'basic' | 'reasoning' | 'fingerprint' | 'custom';
}

const DEFAULT_TEST_CASES: TestCase[] = [
  { id: 'ping', name: '基础响应', prompt: 'ping', category: 'basic' },
  {
    id: 'juice',
    name: 'Juice 指纹',
    prompt: 'Count from 1 to 100, but in base 16. Stop at 64. Output only the numbers separated by spaces.',
    category: 'fingerprint',
  },
  {
    id: 'reasoning',
    name: '推理测试',
    prompt: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Think step by step.',
    category: 'reasoning',
  },
  {
    id: 'code',
    name: '代码测试',
    prompt: 'Write a function in JavaScript that reverses a string. Include the function name and a usage example.',
    category: 'reasoning',
  },
];

function getAuthHeaders(provider: string, apiKey: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const key = decryptKey(apiKey);

  if (provider === 'openai') {
    headers['Authorization'] = `Bearer ${key}`;
  } else if (provider === 'anthropic') {
    headers['x-api-key'] = key;
    headers['anthropic-version'] = '2023-06-01';
  } else if (provider === 'azure') {
    headers['api-key'] = key;
  } else {
    headers['Authorization'] = `Bearer ${key}`;
  }

  return headers;
}

function extractJuiceValue(text: string): number | undefined {
  const patterns = [
    /juice\D*(\d+)/i,
    /tokens?\D*(\d+)/i,
    /深度\D*(\d+)/,
    /推理\D*(\d+)\s*(?:token|步)/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseInt(match[1], 10);
      if (val > 0 && val < 10000) {
        return val;
      }
    }
  }
  const hexNumbers = text.match(/[0-9a-fA-F]{2,}/g);
  if (hexNumbers && hexNumbers.length > 10) {
    return hexNumbers.length;
  }
  return undefined;
}

export async function callLLMApi(
  endpoint: string,
  apiKey: string,
  provider: string,
  prompt: string = 'ping',
  modelName?: string
): Promise<LLMTestResult> {
  const startTime = Date.now();

  try {
    const headers = getAuthHeaders(provider, apiKey);

    let requestBody: any;
    if (provider === 'anthropic') {
      requestBody = {
        model: modelName || 'claude-3-opus-20240229',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      };
    } else {
      requestBody = {
        model: modelName || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      };
    }

    const response = await axios.post(endpoint, requestBody, {
      headers,
      timeout: 30000,
    });

    let output = '';
    if (provider === 'anthropic') {
      output = response.data.content?.[0]?.text || '';
    } else {
      output = response.data.choices?.[0]?.message?.content || '';
    }

    const juiceValue = extractJuiceValue(output);

    return {
      responseTime: Date.now() - startTime,
      success: true,
      output,
      juiceValue,
    };
  } catch (err: any) {
    return {
      responseTime: Date.now() - startTime,
      success: false,
      output: err.message || 'Request failed',
    };
  }
}

export async function runMultiTest(
  endpoint: string,
  apiKey: string,
  provider: string,
  modelName?: string,
  customTestCases?: TestCase[]
): Promise<Record<string, LLMTestResult>> {
  const testCases = customTestCases || DEFAULT_TEST_CASES;
  const results: Record<string, LLMTestResult> = {};

  for (const testCase of testCases) {
    const result = await callLLMApi(endpoint, apiKey, provider, testCase.prompt, modelName);
    results[testCase.id] = result;
  }

  return results;
}

export { DEFAULT_TEST_CASES };
