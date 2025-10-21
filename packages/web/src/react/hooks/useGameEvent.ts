import { useEffect, useState, useRef, useCallback } from 'react';
import { useGameBridge } from './useGameBridge';
import type { GameEvents } from '../../cesium/bridge/types';
import { throttle } from '../shared/utils/throttle';

interface UseGameEventOptions {
  throttle?: number;
}

export function useGameEvent<K extends keyof GameEvents>(
  event: K,
  options?: UseGameEventOptions
): GameEvents[K] | null {
  const bridge = useGameBridge();
  const [data, setData] = useState<GameEvents[K] | null>(null);

  // Store setData in a ref to avoid recreating throttled function when setData changes
  const setDataRef = useRef(setData);
  setDataRef.current = setData;

  // Memoize the throttled setter - only recreate when throttle delay changes
  const throttledSetData = useCallback(
    options?.throttle
      ? throttle((eventData: GameEvents[K]) => {
          setDataRef.current(eventData);
        }, options.throttle)
      : (eventData: GameEvents[K]) => {
          setDataRef.current(eventData);
        },
    [options?.throttle]
  );

  useEffect(() => {
    const unsubscribe = bridge.on(event, (eventData) => {
      throttledSetData(eventData as GameEvents[K]);
    });

    return unsubscribe;
  }, [bridge, event, throttledSetData]);

  return data;
}

export function useGameEventCallback<K extends keyof GameEvents>(
  event: K,
  callback: (data: GameEvents[K]) => void,
  options?: UseGameEventOptions
): void {
  const bridge = useGameBridge();

  // Store callback in a ref to always reference the latest callback
  // This prevents recreating the throttled function when callback changes
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  // Memoize the throttled callback - only recreate when throttle delay changes
  const throttledCallback = useCallback(
    options?.throttle
      ? throttle((eventData: GameEvents[K]) => {
          callbackRef.current(eventData);
        }, options.throttle)
      : (eventData: GameEvents[K]) => {
          callbackRef.current(eventData);
        },
    [options?.throttle]
  );

  useEffect(() => {
    const unsubscribe = bridge.on(event, (eventData) => {
      throttledCallback(eventData as GameEvents[K]);
    });

    return unsubscribe;
  }, [bridge, event, throttledCallback]);
}




