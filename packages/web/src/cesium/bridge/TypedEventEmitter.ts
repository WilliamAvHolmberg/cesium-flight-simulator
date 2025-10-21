type EventCallback<T> = (data: T) => void;

export class TypedEventEmitter<TEvents extends Record<string, unknown>> {
  private listeners: Map<keyof TEvents, Array<EventCallback<unknown>>> = new Map();

  public on<K extends keyof TEvents>(
    event: K,
    callback: EventCallback<TEvents[K]>
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const callbacks = this.listeners.get(event)!;
    callbacks.push(callback as EventCallback<unknown>);

    return () => this.off(event, callback);
  }

  public off<K extends keyof TEvents>(
    event: K,
    callback: EventCallback<TEvents[K]>
  ): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    const index = callbacks.indexOf(callback as EventCallback<unknown>);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  public emit<K extends keyof TEvents>(event: K, data: TEvents[K]): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error);
      }
    });
  }

  public removeAllListeners(): void {
    this.listeners.clear();
  }

  public listenerCount(event: keyof TEvents): number {
    return this.listeners.get(event)?.length || 0;
  }
}




