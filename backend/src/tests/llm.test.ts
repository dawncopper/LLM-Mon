/**
 * llm.test.ts
 * 测试 LLM 服务相关工具函数（不含真实 API 调用）
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractJuiceValue,
  scoreFactMatch,
  countWords,
  getAuthHeaders,
} from '../services/llm.js';
import { encryptKey } from '../utils/crypto.js';

const TEST_KEY = 'test-encryption-key-32-bytes-long!!';

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

describe('extractJuiceValue', () => {
  it('应当从包含 "juice 512" 的文本中提取数值', () => {
    const text = 'The model response contains juice 512 tokens.';
    expect(extractJuiceValue(text)).toBe(512);
  });

  it('应当从包含 "tokens 256" 的文本中提取数值', () => {
    const text = 'Generated with tokens 256 steps.';
    expect(extractJuiceValue(text)).toBe(256);
  });

  it('应当从包含中文 "深度 128" 的文本中提取数值', () => {
    const text = '推理深度 128 层';
    expect(extractJuiceValue(text)).toBe(128);
  });

  it('应当从包含 "推理 1024 步" 的文本中提取数值', () => {
    const text = '完成推理 1024 步';
    expect(extractJuiceValue(text)).toBe(1024);
  });

  it('当文本中不包含有效模式时应当返回 undefined', () => {
    const text = 'This is a normal response without any special tokens.';
    expect(extractJuiceValue(text)).toBeUndefined();
  });

  it('应当忽略超出合理范围的数值（>= 10000）', () => {
    const text = 'The count is 50000 which is too large.';
    expect(extractJuiceValue(text)).toBeUndefined();
  });

  it('应当忽略 0 或负数', () => {
    const text = 'juice 0 tokens used.';
    expect(extractJuiceValue(text)).toBeUndefined();
  });
});

describe('scoreFactMatch', () => {
  it('当 expected 为空时应当返回 true', () => {
    expect(scoreFactMatch('any output')).toBe(true);
    expect(scoreFactMatch('any output', undefined)).toBe(true);
  });

  it('当输出包含预期关键词时应当返回 true', () => {
    expect(scoreFactMatch('The answer is Armstrong in 1969.', 'armstrong')).toBe(true);
  });

  it('应当忽略大小写', () => {
    expect(scoreFactMatch('The symbol is AU.', 'au')).toBe(true);
    expect(scoreFactMatch('The symbol is au.', 'AU')).toBe(true);
  });

  it('应当忽略标点符号差异', () => {
    expect(scoreFactMatch('Canberra is the capital.', 'canberra')).toBe(true);
  });

  it('当输出不包含预期关键词时应当返回 false', () => {
    expect(scoreFactMatch('The answer is something else.', 'armstrong')).toBe(false);
  });

  it('应当支持双向模糊匹配', () => {
    expect(scoreFactMatch('Armstrong was the first person.', 'armstrong')).toBe(true);
  });
});

describe('countWords', () => {
  it('应当正确统计英文字数', () => {
    const text = 'The quick brown fox jumps';
    expect(countWords(text)).toBe(5);
  });

  it('应当正确统计中文字符数', () => {
    const text = '你好世界';
    expect(countWords(text)).toBe(4);
  });

  it('应当混合统计中英文', () => {
    const text = 'Hello 世界 from AI';
    // 英文 3 个 + 中文 2 个 = 5
    expect(countWords(text)).toBe(5);
  });

  it('空字符串应当返回 0', () => {
    expect(countWords('')).toBe(0);
  });

  it('无空格的英文连续字符串会被算作 1 个英文词', () => {
    // countWords 的实现：按空格 split 后检查是否含英文字母
    // 'HelloWorld' split 后只有 1 段，且包含英文字母，所以返回 1
    const text = 'HelloWorld';
    expect(countWords(text)).toBe(1);
  });
});

describe('getAuthHeaders', () => {
  // getAuthHeaders 内部会调用 decryptKey()，
  // 所以需要传入加密后的 key。

  it('OpenAI 提供商应当使用 Bearer token', () => {
    const encrypted = encryptKey('my-openai-key');
    const headers = getAuthHeaders('openai', encrypted);
    expect(headers['Authorization']).toBe('Bearer my-openai-key');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('Anthropic 提供商应当使用 x-api-key', () => {
    const encrypted = encryptKey('my-anthropic-key');
    const headers = getAuthHeaders('anthropic', encrypted);
    expect(headers['x-api-key']).toBe('my-anthropic-key');
    expect(headers['anthropic-version']).toBe('2023-06-01');
  });

  it('Azure 提供商应当使用 api-key', () => {
    const encrypted = encryptKey('my-azure-key');
    const headers = getAuthHeaders('azure', encrypted);
    expect(headers['api-key']).toBe('my-azure-key');
  });

  it('未知提供商应当默认使用 Bearer token', () => {
    const encrypted = encryptKey('my-custom-key');
    const headers = getAuthHeaders('custom', encrypted);
    expect(headers['Authorization']).toBe('Bearer my-custom-key');
  });
});
