import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: any;

    // Subscribe to network state updates
    const subscribeToNetInfo = async () => {
      unsubscribe = NetInfo.addEventListener(state => {
        setIsOnline(state.isConnected ?? true);
        setIsLoading(false);
      });

      // Get initial state
      const state = await NetInfo.fetch();
      setIsOnline(state.isConnected ?? true);
      setIsLoading(false);
    };

    subscribeToNetInfo();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { isOnline, isLoading };
}
