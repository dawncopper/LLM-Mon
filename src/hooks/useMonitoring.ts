import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useMonitoring() {
  const models = useStore((state) => state.models);
  const samplingInterval = useStore((state) => state.samplingInterval);
  const isMonitoring = useStore((state) => state.isMonitoring);
  const runMultiTest = useStore((state) => state.runMultiTest);
  const fetchModels = useStore((state) => state.fetchModels);
  const fetchApiKeys = useStore((state) => state.fetchApiKeys);
  const isBackendConnected = useStore((state) => state.isBackendConnected);
  const backendUrl = useStore((state) => state.backendUrl);
  const checkBackend = useStore((state) => state.checkBackend);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (backendUrl) {
      checkBackend().then((connected) => {
        if (connected) {
          fetchApiKeys();
          fetchModels();
        }
      });
    }
  }, [backendUrl]);

  useEffect(() => {
    if (isMonitoring && isBackendConnected && models.length > 0) {
      const runFetch = () => {
        models.forEach((model) => {
          runMultiTest(model.id);
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
  }, [models, samplingInterval, isMonitoring, isBackendConnected, runMultiTest]);

  return { isMonitoring, isBackendConnected };
}
