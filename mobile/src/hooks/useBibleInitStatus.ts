import { useEffect, useState } from 'react';
import { getBibleInitializationStatus, isBibleInitialized, isBibleInitializing } from '@/lib/bibleInitializer';

interface BibleInitStatus {
  initialized: boolean;
  version: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to track Bible initialization status
 * Use this in components to show initialization progress
 */
export function useBibleInitStatus(): BibleInitStatus {
  const [initialized, setInitialized] = useState(false);
  const [version, setVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const initializing = await isBibleInitializing();
        if (initializing) {
          // Initialization is actively running in background
          setIsLoading(true);
          setInitialized(false);
          setError(null);
          return;
        }

        const isInit = await isBibleInitialized();
        setInitialized(isInit);

        if (isInit) {
          const status = await getBibleInitializationStatus();
          setVersion(status.version);
        }

        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setInitialized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();

    // Check every 2 seconds if initialization is in progress
    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  return { initialized, version, isLoading, error };
}
