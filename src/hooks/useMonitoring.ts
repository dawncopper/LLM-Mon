import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useMonitoring() {
  const models = useStore((state) => state.models);
  const samplingInterval = useStore((state) => state.samplingInterval);
  const isMonitoring = useStore((state) => state.isMonitoring);
  const runMultiTest = useStore((state) => state.runMultiTest);
  const fetchModels = useStore((state) => state.fetchModels);
  const fetchApiKeys = useStore((state) => state.fetchApiKeys);
  const fetchTestCases = useStore((state) => state.fetchTestCases);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchApiKeys();
    fetchModels();
    fetchTestCases();

    if (isMonitoring && models.length > 0) {
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
  }, [models, samplingInterval, isMonitoring, runMultiTest, fetchModels, fetchApiKeys, fetchTestCases]);

  return { isMonitoring };
}
