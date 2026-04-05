export type EventType = string;

export interface Event {
  type: EventType;
  data: unknown;
  timestamp: Date;
  source: string;
}

export type EventListener = (event: Event) => void | Promise<void>;

export class EventBus {
  private listeners: Map<EventType, EventListener[]> = new Map();
  private globalListeners: EventListener[] = [];
  private static instance: EventBus;

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  subscribe(eventType: EventType, listener: EventListener): () => void {
    const listeners = this.listeners.get(eventType) || [];
    listeners.push(listener);
    this.listeners.set(eventType, listeners);
    return () => this.unsubscribe(eventType, listener);
  }

  subscribeAll(listener: EventListener): () => void {
    this.globalListeners.push(listener);
    return () => {
      const index = this.globalListeners.indexOf(listener);
      if (index !== -1) {
        this.globalListeners.splice(index, 1);
      }
    };
  }

  unsubscribe(eventType: EventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async emit(event: Event): Promise<void> {
    const listeners = this.listeners.get(event.type) || [];

    await Promise.all(
      listeners.map(async (listener) => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      })
    );

    await Promise.all(
      this.globalListeners.map(async (listener) => {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in global event listener:`, error);
        }
      })
    );
  }

  async emitAsync(type: EventType, data: unknown, source: string): Promise<void> {
    const event: Event = {
      type,
      data,
      timestamp: new Date(),
      source,
    };
    await this.emit(event);
  }

  clear(): void {
    this.listeners.clear();
    this.globalListeners = [];
  }
}

export const eventBus = EventBus.getInstance();
