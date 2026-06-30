import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useMonitoring() {
  const models = useStore((state) => state.models);
  const samplingInterval = useStore((state) => state.samplingInterval);
  const isMonitoring = useStore((state) => state.isMonitoring);
  const fetchMetrics = useStore((state) => state.fetchMetrics);
  const fetchModels = useStore((state) => state.fetchModels);
  const fetchApiKeys = useStore((state) => state.fetchApiKeys);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Initial fetch
    fetchApiKeys();
    fetchModels();

    // Set up polling interval
    if (isMonitoring && models.length > 0) {
      const runFetch = () => {
        models.forEach((model) => {
          fetchMetrics(model.id);
        });
      };

      runFetch();
      intervalRef.current = window.setInterval(runFetch, samplingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [models, samplingInterval, isMonitoring, fetchMetrics, fetchModels, fetchApiKeys]);

  return { isMonitoring };
}