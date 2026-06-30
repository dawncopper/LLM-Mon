import axios from 'axios';
import { decryptKey } from '../utils/crypto.js';

interface MonitorResult {
  responseTime: number;
  success: boolean;
}

export async function callLLMApi(
  endpoint: string,
  apiKey: string,
  provider: string
): Promise<MonitorResult> {
  const startTime = Date.now();

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (provider === 'openai') {
      headers['Authorization'] = `Bearer ${decryptKey(apiKey)}`;
    } else if (provider === 'anthropic') {
      headers['x-api-key'] = decryptKey(apiKey);
    } else if (provider === 'azure') {
      headers['api-key'] = decryptKey(apiKey);
    } else {
      // custom provider
      headers['Authorization'] = `Bearer ${decryptKey(apiKey)}`;
    }

    await axios.post(
      endpoint,
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      },
      { headers, timeout: 30000 }
    );

    return { responseTime: Date.now() - startTime, success: true };
  } catch {
    return { responseTime: Date.now() - startTime, success: false };
  }
}
