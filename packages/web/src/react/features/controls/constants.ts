export interface ControlItem {
  keys: string[];
  description: string;
}

export const VEHICLE_CONTROLS: ControlItem[] = [
  { keys: ['W', '↑'], description: 'Throttle / Altitude Up' },
  { keys: ['S', '↓'], description: 'Brake / Altitude Down' },
  { keys: ['A', 'D', '←', '→'], description: 'Roll' },
];

export const CAMERA_CONTROLS: ControlItem[] = [
  { keys: ['C'], description: 'Switch Camera' },
];

export const MODE_CONTROLS: ControlItem[] = [
  { keys: ['M'], description: 'Toggle Rover/Aircraft' },
  { keys: ['B'], description: 'Toggle Collision' },
];




