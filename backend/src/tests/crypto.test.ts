/**
 * crypto.test.ts
 * 测试 AES-256-CBC 加密解密逻辑
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { encryptKey, decryptKey } from '../utils/crypto.js';

const TEST_KEY = 'test-encryption-key-32-bytes-long!!';

beforeEach(() => {
  process.env.ENCRYPTION_KEY = TEST_KEY;
});

describe('encryptKey / decryptKey', () => {
  it('应当正确地对 API Key 进行加密和解密', () => {
    const original = 'sk-test1234567890abcdef';
    const encrypted = encryptKey(original);
    const decrypted = decryptKey(encrypted);

    expect(decrypted).toBe(original);
  });

  it('加密后的字符串应当包含 IV 和密文（以 ":" 分隔）', () => {
    const original = 'sk-anthropic-test-key-12345';
    const encrypted = encryptKey(original);

    expect(encrypted).toContain(':');
    const parts = encrypted.split(':');
    expect(parts.length).toBe(2);
    expect(parts[0].length).toBe(32); // IV 是 16 字节 = 32 个 hex 字符
  });

  it('相同明文每次加密结果不同（IV 随机）', () => {
    const original = 'sk-same-key';
    const encrypted1 = encryptKey(original);
    const encrypted2 = encryptKey(original);

    // 因为 IV 不同，密文应该不同
    expect(encrypted1).not.toBe(encrypted2);
    // 但解密后都应该得到原文
    expect(decryptKey(encrypted1)).toBe(original);
    expect(decryptKey(encrypted2)).toBe(original);
  });

  it('应当能处理空字符串', () => {
    const original = '';
    const encrypted = encryptKey(original);
    const decrypted = decryptKey(encrypted);

    expect(decrypted).toBe(original);
  });

  it('应当能处理包含特殊字符的 API Key', () => {
    const original = 'sk-abc123!@#$%^&*()_+-=[]{}|;:,.<>?';
    const encrypted = encryptKey(original);
    const decrypted = decryptKey(encrypted);

    expect(decrypted).toBe(original);
  });

  it('解密非法格式的字符串时应当 fallback 到 base64 解码', () => {
    // 模拟旧版本（base64 存储）的数据
    const base64Key = Buffer.from('legacy-key-value').toString('base64');
    const decrypted = decryptKey(base64Key);

    expect(decrypted).toBe('legacy-key-value');
  });
});
