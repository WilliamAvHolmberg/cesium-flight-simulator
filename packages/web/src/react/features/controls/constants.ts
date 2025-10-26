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
  { keys: ['W', 'A', 'S', 'D'], description: 'Move Spawn Cursor' },
  { keys: ['↑', '↓'], description: 'Cursor Up/Down' },
  { keys: ['Space'], description: 'Spawn Object' },
  { keys: ['Mouse Drag'], description: 'Look Around' },
  { keys: ['Scroll'], description: 'Zoom In/Out' },
  { keys: ['B'], description: 'Exit Builder Mode' },
];




