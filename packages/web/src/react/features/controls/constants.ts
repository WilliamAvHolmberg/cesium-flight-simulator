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
  { keys: ['V'], description: 'Toggle Collision' },
  { keys: ['B'], description: 'Toggle Builder Mode' },
];

export const BUILDER_CONTROLS: ControlItem[] = [
  { keys: ['Click'], description: 'Lock/Unlock Mouse Look' },
  { keys: ['Mouse'], description: 'Look Around' },
  { keys: ['W', 'A', 'S', 'D'], description: 'Move' },
  { keys: ['Space', 'Ctrl'], description: 'Up / Down' },
  { keys: ['Shift'], description: 'Fast Movement' },
  { keys: ['ESC'], description: 'Unlock Mouse' },
];




