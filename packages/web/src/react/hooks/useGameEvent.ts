import { useEffect, useState, useRef } from 'react';
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
  const throttledSetData = useRef(
    options?.throttle ? throttle(setData, options.throttle) : setData
  );

  useEffect(() => {
    const unsubscribe = bridge.on(event, (eventData) => {
      throttledSetData.current(eventData as GameEvents[K]);
    });

    return unsubscribe;
  }, [bridge, event]);

  return data;
}

export function useGameEventCallback<K extends keyof GameEvents>(
  event: K,
  callback: (data: GameEvents[K]) => void,
  options?: UseGameEventOptions
): void {
  const bridge = useGameBridge();
  const throttledCallback = useRef(
    options?.throttle ? throttle(callback, options.throttle) : callback
  );

  useEffect(() => {
    throttledCallback.current = options?.throttle
      ? throttle(callback, options.throttle)
      : callback;
  }, [callback, options?.throttle]);

  useEffect(() => {
    const unsubscribe = bridge.on(event, (eventData) => {
      throttledCallback.current(eventData as GameEvents[K]);
    });

    return unsubscribe;
  }, [bridge, event]);
}




