// 简单加密，实际生产环境应使用更安全的方式（如 crypto-js AES）
export function encryptKey(key: string): string {
  return Buffer.from(key).toString('base64');
}

export function decryptKey(encrypted: string): string {
  return Buffer.from(encrypted, 'base64').toString('utf-8');
}
