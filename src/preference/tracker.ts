import { Event } from '../agent/core/events';

export interface TrackedEvent {
  eventType: string;
  userId: string;
  data: unknown;
  timestamp: Date;
}

export class PreferenceTracker {
  private events: TrackedEvent[] = [];
  private maxEvents: number;

  constructor(maxEvents: number = 1000) {
    this.maxEvents = maxEvents;
  }

  track(eventType: string, userId: string, data: unknown): void {
    const event: TrackedEvent = {
      eventType,
      userId,
      data,
      timestamp: new Date(),
    };
    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }
  }

  getEvents(eventType?: string, limit?: number): TrackedEvent[] {
    let filtered = this.events;
    if (eventType) {
      filtered = filtered.filter(e => e.eventType === eventType);
    }
    if (limit) {
      return filtered.slice(-limit);
    }
    return filtered;
  }

  getRecentEvents(count: number = 10): TrackedEvent[] {
    return this.events.slice(-count);
  }

  clear(): void {
    this.events = [];
  }

  getEventCount(): number {
    return this.events.length;
  }
}

export const preferenceTracker = new PreferenceTracker();
