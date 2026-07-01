import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || 'llm-mon-default-secret-key-change-me';
  return crypto.scryptSync(secret, 'salt', KEY_LENGTH);
}

export function encryptKey(key: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decryptKey(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 2) {
    return Buffer.from(encrypted, 'base64').toString('utf8');
  }
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
