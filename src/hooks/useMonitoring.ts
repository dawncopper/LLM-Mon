import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useMonitoring() {
  const models = useStore((state) => state.models);
  const apiKeys = useStore((state) => state.apiKeys);
  const samplingInterval = useStore((state) => state.samplingInterval);
  const isMonitoring = useStore((state) => state.isMonitoring);
  const recordMetric = useStore((state) => state.recordMetric);
  const getApiKey = useStore((state) => state.getApiKey);

  const intervalRef = useRef<number | null>(null);

  const monitorModel = async (modelId: string, apiEndpoint: string, apiKeyId: string) => {
    const apiKey = getApiKey(apiKeyId);
    if (!apiKey) return;

    const startTime = performance.now();

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey.provider === 'openai' && { 'Authorization': `Bearer ${apiKey.key}` }),
          ...(apiKey.provider === 'anthropic' && { 'x-api-key': apiKey.key }),
          ...(apiKey.provider === 'azure' && { 'api-key': apiKey.key }),
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
      });

      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      const success = response.ok;

      recordMetric(modelId, responseTime, success);
    } catch {
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      recordMetric(modelId, responseTime, false);
    }
  };

  useEffect(() => {
    if (!isMonitoring || models.length === 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const runMonitoring = () => {
      models.forEach((model) => {
        monitorModel(model.id, model.apiEndpoint, model.apiKeyId);
      });
    };

    runMonitoring();

    intervalRef.current = window.setInterval(runMonitoring, samplingInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [models, apiKeys, samplingInterval, isMonitoring, recordMetric, getApiKey]);

  return { isMonitoring };
}
