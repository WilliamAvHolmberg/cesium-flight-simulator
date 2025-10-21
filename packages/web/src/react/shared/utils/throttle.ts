export function throttle<T extends (...args: never[]) => void>(
  func: T,
  limit: number
): T {
  let inThrottle = false;

  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
      func.apply(this, args);
    }
  } as T;
}

