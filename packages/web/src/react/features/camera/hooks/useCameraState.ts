import { useState, useEffect } from 'react';
import { useGameEvent } from '../../../hooks/useGameEvent';
import { useGameMethod } from '../../../hooks/useGameMethod';
import type { CameraType } from '../../../../cesium/managers/CameraManager';

export function useCameraState() {
  const { getCameraType } = useGameMethod();
  const [cameraType, setCameraType] = useState<CameraType>(getCameraType());

  const cameraData = useGameEvent('cameraChanged');

  useEffect(() => {
    if (cameraData) {
      setCameraType(cameraData.type);
    }
  }, [cameraData]);

  return { cameraType };
}




