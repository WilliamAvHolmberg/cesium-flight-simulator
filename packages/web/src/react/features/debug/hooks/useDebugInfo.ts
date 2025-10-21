import { useState, useEffect } from 'react';
import { useGameEvent } from '../../../hooks/useGameEvent';
import { useGameMethod } from '../../../hooks/useGameMethod';

export function useDebugInfo() {
  const { getCollisionDetection, getRoverMode } = useGameMethod();
  const [collisionEnabled, setCollisionEnabled] = useState(getCollisionDetection());
  const [heightLockEnabled, setHeightLockEnabled] = useState(getRoverMode());
  const [fps, setFps] = useState(0);

  const collisionData = useGameEvent('collisionDetectionChanged');
  const roverModeData = useGameEvent('roverModeChanged');

  useEffect(() => {
    if (collisionData !== null) {
      setCollisionEnabled(collisionData.enabled);
    }
  }, [collisionData]);

  useEffect(() => {
    if (roverModeData !== null) {
      setHeightLockEnabled(roverModeData.enabled);
    }
  }, [roverModeData]);

  useEffect(() => {
    let lastTime = performance.now();
    let frames = 0;

    const measureFps = () => {
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }
      requestAnimationFrame(measureFps);
    };

    const rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return { collisionEnabled, heightLockEnabled, fps };
}




