export class HapticFeedback {
  private static isSupported = 'vibrate' in navigator;

  static light(): void {
    if (this.isSupported) {
      navigator.vibrate(10);
    }
  }

  static medium(): void {
    if (this.isSupported) {
      navigator.vibrate(20);
    }
  }

  static heavy(): void {
    if (this.isSupported) {
      navigator.vibrate(40);
    }
  }

  static selection(): void {
    if (this.isSupported) {
      navigator.vibrate(5);
    }
  }

  static impact(): void {
    if (this.isSupported) {
      navigator.vibrate([10, 30, 10]);
    }
  }

  static success(): void {
    if (this.isSupported) {
      navigator.vibrate([10, 50, 10, 50, 10]);
    }
  }

  static error(): void {
    if (this.isSupported) {
      navigator.vibrate([50, 100, 50]);
    }
  }
}
