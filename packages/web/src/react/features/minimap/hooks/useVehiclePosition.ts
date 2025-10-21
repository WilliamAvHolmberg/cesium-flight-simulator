import { useState, useEffect } from 'react';
import { useGameEvent } from '../../../hooks/useGameEvent';
import * as Cesium from 'cesium';

export interface VehiclePosition {
  longitude: number;
  latitude: number;
  altitude: number;
  heading: number;
}

export function useVehiclePosition() {
  const vehicleState = useGameEvent('vehicleStateChanged');
  const [position, setPosition] = useState<VehiclePosition>({
    longitude: 11.9746,
    latitude: 57.7089,
    altitude: 200,
    heading: 0,
  });

  useEffect(() => {
    if (vehicleState?.position) {
      const cartographic = Cesium.Cartographic.fromCartesian(vehicleState.position);
      
      setPosition({
        longitude: Cesium.Math.toDegrees(cartographic.longitude),
        latitude: Cesium.Math.toDegrees(cartographic.latitude),
        altitude: cartographic.height,
        heading: Cesium.Math.toDegrees(vehicleState.heading),
      });
    }
  }, [vehicleState]);

  return position;
}

