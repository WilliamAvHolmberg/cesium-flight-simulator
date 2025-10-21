import { useGameEvent } from '../../../hooks/useGameEvent';

export function useVehicleState() {
  const vehicleState = useGameEvent('vehicleStateChanged', { throttle: 50 });

  return {
    speed: vehicleState?.speed ?? 0,
    velocity: vehicleState?.velocity ?? 0,
    heading: vehicleState?.heading ?? 0,
    pitch: vehicleState?.pitch ?? 0,
    roll: vehicleState?.roll ?? 0,
  };
}


