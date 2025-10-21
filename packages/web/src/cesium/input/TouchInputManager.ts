import { InputAction } from './InputManager';

export interface TouchControlConfig {
  sensitivity: number;
  throttleZoneWidth: number;
  enableHaptics: boolean;
}

class HapticFeedback {
  private static isSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  static light(): void {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  static medium(): void {
    if (this.isSupported) {
      navigator.vibrate(15);
    }
  }
}

export class TouchInputManager {
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private currentTouchX: number = 0;
  private currentTouchY: number = 0;
  private isThrottleTouch: boolean = false;
  private isTouching: boolean = false;
  
  private config: TouchControlConfig = {
    sensitivity: 1.5,
    throttleZoneWidth: 96,
    enableHaptics: true
  };

  private inputCallbacks = new Map<InputAction, (pressed: boolean) => void>();
  private activeInputs = new Set<InputAction>();

  constructor(
    private containerElement: HTMLElement,
    config?: Partial<TouchControlConfig>
  ) {
    if (config) {
      Object.assign(this.config, config);
    }
    this.setupTouchListeners();
  }

  private setupTouchListeners(): void {
    this.containerElement.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.containerElement.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.containerElement.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
    this.containerElement.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 0) return;
    
    event.preventDefault();
    
    const touch = event.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
    this.currentTouchX = touch.clientX;
    this.currentTouchY = touch.clientY;
    this.isTouching = true;
    
    this.isThrottleTouch = this.isInThrottleZone(touch.clientX);
    
    if (!this.isThrottleTouch && this.config.enableHaptics) {
      HapticFeedback.light();
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isTouching || event.touches.length === 0) return;
    
    event.preventDefault();
    
    const touch = event.touches[0];
    this.currentTouchX = touch.clientX;
    this.currentTouchY = touch.clientY;
    
    if (!this.isThrottleTouch) {
      this.updateFlightControls();
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    this.isTouching = false;
    this.isThrottleTouch = false;
    
    this.clearAllInputs();
  }

  private isInThrottleZone(x: number): boolean {
    const screenWidth = window.innerWidth;
    return x >= screenWidth - this.config.throttleZoneWidth;
  }

  private updateFlightControls(): void {
    const deltaX = this.currentTouchX - this.touchStartX;
    const deltaY = this.currentTouchY - this.touchStartY;
    
    const rollThreshold = 30 / this.config.sensitivity;
    const altitudeThreshold = 30 / this.config.sensitivity;
    
    this.setInput('rollLeft', deltaX < -rollThreshold);
    this.setInput('rollRight', deltaX > rollThreshold);
    this.setInput('altitudeUp', deltaY < -altitudeThreshold);
    this.setInput('altitudeDown', deltaY > altitudeThreshold);
  }

  private setInput(action: InputAction, pressed: boolean): void {
    const wasPressed = this.activeInputs.has(action);
    
    if (pressed && !wasPressed) {
      this.activeInputs.add(action);
      this.notifyCallback(action, true);
      if (this.config.enableHaptics) {
        HapticFeedback.light();
      }
    } else if (!pressed && wasPressed) {
      this.activeInputs.delete(action);
      this.notifyCallback(action, false);
    }
  }

  private clearAllInputs(): void {
    const actions: InputAction[] = ['rollLeft', 'rollRight', 'altitudeUp', 'altitudeDown'];
    
    actions.forEach(action => {
      if (this.activeInputs.has(action)) {
        this.activeInputs.delete(action);
        this.notifyCallback(action, false);
      }
    });
  }

  private notifyCallback(action: InputAction, pressed: boolean): void {
    const callback = this.inputCallbacks.get(action);
    if (callback) {
      callback(pressed);
    }
  }

  public onInput(action: InputAction, callback: (pressed: boolean) => void): void {
    this.inputCallbacks.set(action, callback);
  }

  public getCurrentTouch(): { x: number; y: number; deltaX: number; deltaY: number } | null {
    if (!this.isTouching || this.isThrottleTouch) return null;
    
    return {
      x: this.currentTouchX,
      y: this.currentTouchY,
      deltaX: this.currentTouchX - this.touchStartX,
      deltaY: this.currentTouchY - this.touchStartY
    };
  }

  public destroy(): void {
    this.containerElement.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.containerElement.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    this.containerElement.removeEventListener('touchend', this.handleTouchEnd.bind(this));
    this.containerElement.removeEventListener('touchcancel', this.handleTouchEnd.bind(this));
    this.inputCallbacks.clear();
    this.activeInputs.clear();
  }
}
