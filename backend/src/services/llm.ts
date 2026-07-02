import axios from 'axios';
import { decryptKey } from '../utils/crypto.js';

export interface LLMTestResult {
  responseTime: number;
  success: boolean;
  output: string;
  juiceValue?: number;
  factMatch?: boolean;       // 事实性测试是否匹配预期
  wordCount?: number;        // 输出字数（吞吐量参考）
}

function scoreFactMatch(actual: string, expected?: string): boolean {
  if (!expected) return true;
  const normalizedActual = actual.toLowerCase().trim();
  const normalizedExpected = expected.toLowerCase().trim();
  // 模糊匹配：预期词出现在输出中，或输出包含预期的关键信息
  if (normalizedActual.includes(normalizedExpected)) return true;
  // 允许一定程度的灵活性（去除常见标点）
  const strippedActual = normalizedActual.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  const strippedExpected = normalizedExpected.replace(/[^a-z0-9\u4e00-\u9fff]/g, '');
  return strippedActual.includes(strippedExpected) || strippedExpected.includes(strippedActual);
}

function countWords(text: string): number {
  if (!text) return 0;
  // 中英文混合计数：英文按空格分割，中文按字符
  const enWords = text.split(/\s+/).filter(w => /[a-zA-Z]/.test(w)).length;
  const cnChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  return enWords + cnChars;
}

export type TestCaseCategory = 'basic' | 'reasoning' | 'fingerprint' | 'factuality' | 'boundary' | 'throughput' | 'custom';

export interface TestCase {
  id: string;
  name: string;
  prompt: string;
  category: TestCaseCategory;
  expected?: string;       // 可选的预期答案关键词（用于自动化评分）
  weight: number;          // 在质量分中的权重，默认 1.0
}

const DEFAULT_TEST_CASES: TestCase[] = [
  {
    id: 'ping',
    name: '基础响应',
    prompt: 'pong',
    category: 'basic',
    expected: 'pong',
    weight: 1.0,
  },
  {
    id: 'juice',
    name: 'Juice 指纹',
    prompt: 'Count from 1 to 100, but in base 16. Stop at 64. Output only the numbers separated by spaces.',
    category: 'fingerprint',
    weight: 2.0,       // Juice 是核心指标，权重加倍
  },
  {
    id: 'reasoning_math',
    name: '推理测试-数学',
    prompt: 'A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost? Think step by step. Output only the final answer in dollars.',
    category: 'reasoning',
    expected: '0.10',
    weight: 1.5,
  },
  {
    id: 'reasoning_logic',
    name: '推理测试-逻辑',
    prompt: 'If all Bloops are Zazzles, and all Zazzles are Lazzles, are all Bloops definitely Lazzles? Answer yes or no and explain in one sentence.',
    category: 'reasoning',
    expected: 'yes',
    weight: 1.5,
  },
  {
    id: 'code_generation',
    name: '代码测试',
    prompt: 'Write a pure JavaScript function called reverseString that takes a string argument and returns the reversed string. Do not include explanations, only output the function code with a brief comment.',
    category: 'reasoning',
    weight: 1.2,
  },
  {
    id: 'fact_check_1',
    name: '事实测试-历史',
    prompt: 'Who was the first person to walk on the Moon? Provide full name and year only.',
    category: 'factuality',
    expected: 'armstrong',
    weight: 1.5,
  },
  {
    id: 'fact_check_2',
    name: '事实测试-科学',
    prompt: 'What is the chemical symbol for gold? Answer with the symbol only.',
    category: 'factuality',
    expected: 'au',
    weight: 1.5,
  },
  {
    id: 'fact_check_3',
    name: '事实测试-地理',
    prompt: 'What is the capital of Australia? Answer with the city name only.',
    category: 'factuality',
    expected: 'canberra',
    weight: 1.5,
  },
  {
    id: 'boundary_long_input',
    name: '边界测试-长输入',
    prompt: 'The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. How vexingly quick daft zebras jump. The five boxing wizards jump quickly at midnight. Sphinx of black quartz judge my vow. Two driven jocks help fax my big quiz. In July 2024, OpenAI announced GPT-4o. Large language models have transformed AI capabilities. Machine learning continues to advance rapidly with new architectures and techniques emerging frequently across the industry. The intersection of research and production applications drives innovation forward at an unprecedented pace in modern software engineering and artificial intelligence development workflows today.',
    category: 'boundary',
    weight: 0.8,
  },
  {
    id: 'boundary_special_chars',
    name: '边界测试-特殊字符',
    prompt: 'Calculate: 42 * 137 + 99. Answer with only the number.',
    category: 'boundary',
    expected: '5823',
    weight: 1.0,
  },
  {
    id: 'boundary_chinese',
    name: '边界测试-多语言',
    prompt: '请使用中文回答：一年有多少秒？请给出计算过程并输出最终数字。',
    category: 'boundary',
    expected: '31536000',
    weight: 1.0,
  },
  {
    id: 'consistency',
    name: '一致性测试',
    prompt: 'What is 15 multiplied by 15? Provide the calculation steps and final answer.',
    category: 'reasoning',
    expected: '225',
    weight: 1.2,
  },
  {
    id: 'throughput_speed',
    name: '吞吐量测试',
    prompt: 'Write a detailed, multi-paragraph essay about the importance of AI safety research. Include at least 500 words covering topics such as alignment, interpretability, robustness, and governance. Be thorough and provide specific examples.',
    category: 'throughput',
    weight: 0.8,
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
  testCase?: TestCase,
  modelName?: string
): Promise<LLMTestResult> {
  const startTime = Date.now();

  try {
    const headers = getAuthHeaders(provider, apiKey);

    // 使用传入的模型名（如 deepseek-v3），而非测试用例名
    const effectiveModel = modelName || (provider === 'anthropic' ? 'claude-3-opus-20240229' : 'gpt-3.5-turbo');

    let requestBody: any;
    if (provider === 'anthropic') {
      requestBody = {
        model: effectiveModel,
        max_tokens: testCase?.id === 'throughput_speed' ? 2000 : 500,
        messages: [{ role: 'user', content: prompt }],
      };
    } else {
      requestBody = {
        model: effectiveModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: testCase?.id === 'throughput_speed' ? 2000 : 500,
      };
    }

    console.log(`[LLM] Calling ${provider} model=${effectiveModel} endpoint=${endpoint} testCase=${testCase?.id || 'ping'}`);

    const response = await axios.post(endpoint, requestBody, {
      headers,
      timeout: 60000,  // 吞吐量测试可能需要更长时间
    });

    let output = '';
    if (provider === 'anthropic') {
      output = response.data.content?.[0]?.text || '';
    } else {
      output = response.data.choices?.[0]?.message?.content || '';
    }

    const juiceValue = extractJuiceValue(output);
    const wordCount = countWords(output);
    const factMatch = testCase && testCase.expected ? scoreFactMatch(output, testCase.expected) : undefined;

    return {
      responseTime: Date.now() - startTime,
      success: true,
      output,
      juiceValue,
      wordCount,
      factMatch,
    };
  } catch (err: any) {
    const errorMsg = err.response?.data
      ? JSON.stringify(err.response.data).slice(0, 500)
      : (err.message || 'Request failed');
    console.error(`[LLM] Error model=${modelName || testCase?.id || '?'} status=${err.response?.status || 'N/A'}: ${errorMsg}`);
    return {
      responseTime: Date.now() - startTime,
      success: false,
      output: errorMsg,
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

  // 并发执行所有测试用例
  const promises = testCases.map(async (testCase) => {
    const result = await callLLMApi(endpoint, apiKey, provider, testCase.prompt, testCase, modelName);
    return { id: testCase.id, result } as const;
  });

  const settled = await Promise.allSettled(promises);
  const results: Record<string, LLMTestResult> = {};

  for (const item of settled) {
    if (item.status === 'fulfilled') {
      results[item.value.id] = item.value.result;
    }
    // rejected 测试用例自动标记为失败
  }

  // 补充可能遗漏的测试用例（全部 rejected 时）
  for (const testCase of testCases) {
    if (!(testCase.id in results)) {
      results[testCase.id] = {
        responseTime: 0,
        success: false,
        output: 'Test case not executed (all requests failed)',
      };
    }
  }

  return results;
}

export { DEFAULT_TEST_CASES };
