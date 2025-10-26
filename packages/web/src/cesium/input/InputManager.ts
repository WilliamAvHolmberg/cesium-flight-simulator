export interface KeyBinding {
  [key: string]: string;
}

export interface InputState {
  // Vehicle controls
  throttle: boolean;
  brake: boolean;
  turnLeft: boolean;
  turnRight: boolean;
  pitchUp: boolean;
  pitchDown: boolean;
  rollLeft: boolean;
  rollRight: boolean;
  
  // Camera controls
  cameraRotateLeft: boolean;
  cameraRotateRight: boolean;
  cameraUp: boolean;
  cameraDown: boolean;
  cameraCloser: boolean;
  cameraFarther: boolean;
  
  // Mode toggles
  toggleRoverMode: boolean;
  switchCamera: boolean;
  toggleCollision: boolean;
  toggleBuilder: boolean;
  spawnObject: boolean;

  // Aircraft specific
  altitudeUp: boolean;
  altitudeDown: boolean;

  // System
  restart: boolean;
}

export type InputAction = keyof InputState;

export class InputManager {
  private keyBindings: KeyBinding = {
    // Vehicle controls (WASD)
    'KeyW': 'throttle',
    'KeyS': 'brake',
    'KeyA': 'turnLeft',
    'KeyD': 'turnRight',
    
    // Arrow keys: turn/steer for ground vehicles, altitude for aircraft
    'ArrowUp': 'altitudeUp',
    'ArrowDown': 'altitudeDown',
    'ArrowLeft': 'turnLeft',
    'ArrowRight': 'turnRight',
    
    // Q/E for roll (aircraft)
    'KeyQ': 'rollLeft',
    'KeyE': 'rollRight',
    
    // Camera controls
    'KeyF': 'cameraDown',
    'KeyT': 'cameraCloser',
    'KeyG': 'cameraFarther',
    
    // Mode toggles
    'KeyM': 'toggleRoverMode',
    'KeyC': 'switchCamera',
    'KeyV': 'toggleCollision',
    'KeyB': 'toggleBuilder',
    
    // Builder mode
    'Space': 'spawnObject',

    // Alternative altitude controls (for those who prefer PageUp/PageDown)
    'PageUp': 'altitudeUp',
    'PageDown': 'altitudeDown',

    // Restart
    'KeyR': 'restart'
  };

  private inputState: InputState = {
    throttle: false,
    brake: false,
    turnLeft: false,
    turnRight: false,
    pitchUp: false,
    pitchDown: false,
    rollLeft: false,
    rollRight: false,
    cameraRotateLeft: false,
    cameraRotateRight: false,
    cameraUp: false,
    cameraDown: false,
    cameraCloser: false,
    cameraFarther: false,
    toggleRoverMode: false,
    switchCamera: false,
    toggleCollision: false,
    toggleBuilder: false,
    spawnObject: false,
    altitudeUp: false,
    altitudeDown: false,
    restart: false
  };

  private listeners: Map<InputAction, Array<(pressed: boolean) => void>> = new Map();
  private oneTimeActions: Set<InputAction> = new Set(['toggleRoverMode', 'switchCamera', 'toggleCollision', 'toggleBuilder', 'spawnObject', 'restart']);
  private throttlePercent: number = 0;
  private targetSpeedCallback: ((speed: number) => void) | null = null;

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    // Prevent context menu on right click for better camera controls
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  private handleKeyDown(event: KeyboardEvent): void {
    const action = this.keyBindings[event.code] as InputAction;
    if (!action) return;

    // Prevent default browser behavior for game controls
    if (event.code === 'PageUp' || event.code === 'PageDown' || event.code.startsWith('Arrow')) {
      event.preventDefault();
    }

    // For one-time actions, only trigger on initial press
    if (this.oneTimeActions.has(action)) {
      if (!this.inputState[action]) {
        this.setInputState(action, true);
        // Immediately reset one-time actions
        setTimeout(() => this.setInputState(action, false), 0);
      }
    } else {
      this.setInputState(action, true);
    }
  }

  private handleKeyUp(event: KeyboardEvent): void {
    const action = this.keyBindings[event.code] as InputAction;
    if (!action || this.oneTimeActions.has(action)) return;

    this.setInputState(action, false);
  }

  private setInputState(action: InputAction, pressed: boolean): void {
    this.inputState[action] = pressed;
    this.notifyListeners(action, pressed);
  }

  private notifyListeners(action: InputAction, pressed: boolean): void {
    const actionListeners = this.listeners.get(action);
    if (actionListeners) {
      actionListeners.forEach(listener => listener(pressed));
    }
  }

  public getInputState(): Readonly<InputState> {
    return this.inputState;
  }

  public isPressed(action: InputAction): boolean {
    return this.inputState[action];
  }

  public onInput(action: InputAction, callback: (pressed: boolean) => void): void {
    if (!this.listeners.has(action)) {
      this.listeners.set(action, []);
    }
    this.listeners.get(action)!.push(callback);
  }

  public offInput(action: InputAction, callback: (pressed: boolean) => void): void {
    const actionListeners = this.listeners.get(action);
    if (actionListeners) {
      const index = actionListeners.indexOf(callback);
      if (index > -1) {
        actionListeners.splice(index, 1);
      }
    }
  }

  public setKeyBinding(key: string, action: InputAction): void {
    this.keyBindings[key] = action;
  }

  public getKeyBindings(): Readonly<KeyBinding> {
    return this.keyBindings;
  }

  public setThrottlePercent(percent: number): void {
    this.throttlePercent = Math.max(0, Math.min(100, percent));
    
    const minSpeed = 15;
    const maxSpeed = 120;
    const targetSpeed = minSpeed + (this.throttlePercent / 100) * (maxSpeed - minSpeed);
    
    if (this.targetSpeedCallback) {
      this.targetSpeedCallback(targetSpeed);
    }
    
    const shouldThrottle = this.throttlePercent > 0;
    this.setInputState('throttle', shouldThrottle);
    this.setInputState('brake', false);
  }

  public getThrottlePercent(): number {
    return this.throttlePercent;
  }

  public onTargetSpeedChange(callback: (speed: number) => void): void {
    this.targetSpeedCallback = callback;
  }

  public destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    this.listeners.clear();
  }
}
