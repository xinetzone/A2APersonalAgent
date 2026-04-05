import { EventBus, Event } from '@/agent/core/events';

describe('EventBus', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = EventBus.getInstance();
    eventBus.clear();
  });

  afterEach(() => {
    eventBus.clear();
  });

  describe('subscribe and unsubscribe', () => {
    it('should receive events for subscribed type', async () => {
      const handler = jest.fn();
      eventBus.subscribe('test_event', handler);

      const event: Event = {
        type: 'test_event',
        data: { message: 'hello' },
        timestamp: new Date(),
        source: 'test',
      };

      await eventBus.emit(event);
      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should not receive events for other types', async () => {
      const handler = jest.fn();
      eventBus.subscribe('other_event', handler);

      const event: Event = {
        type: 'test_event',
        data: {},
        timestamp: new Date(),
        source: 'test',
      };

      await eventBus.emit(event);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should unsubscribe and stop receiving events', async () => {
      const handler = jest.fn();
      const unsubscribe = eventBus.subscribe('test_event', handler);
      unsubscribe();

      const event: Event = {
        type: 'test_event',
        data: {},
        timestamp: new Date(),
        source: 'test',
      };

      await eventBus.emit(event);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('subscribeAll', () => {
    it('should receive all events', async () => {
      const handler = jest.fn();
      eventBus.subscribeAll(handler);

      const event1: Event = {
        type: 'event1',
        data: {},
        timestamp: new Date(),
        source: 'test',
      };
      const event2: Event = {
        type: 'event2',
        data: {},
        timestamp: new Date(),
        source: 'test',
      };

      await eventBus.emit(event1);
      await eventBus.emit(event2);

      expect(handler).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitAsync', () => {
    it('should create event with correct properties', async () => {
      const handler = jest.fn();
      eventBus.subscribe('test', handler);

      await eventBus.emitAsync('test', { message: 'hello' }, 'test-source');

      expect(handler).toHaveBeenCalled();
      const event = handler.mock.calls[0][0];
      expect(event.type).toBe('test');
      expect(event.data).toEqual({ message: 'hello' });
      expect(event.source).toBe('test-source');
      expect(event.timestamp).toBeInstanceOf(Date);
    });
  });

  describe('error handling', () => {
    it('should continue processing other listeners if one fails', async () => {
      const errorHandler = jest.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = jest.fn();

      eventBus.subscribe('test_event', errorHandler);
      eventBus.subscribe('test_event', goodHandler);

      const event: Event = {
        type: 'test_event',
        data: {},
        timestamp: new Date(),
        source: 'test',
      };

      await eventBus.emit(event);
      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should remove all listeners', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      eventBus.subscribe('event1', handler1);
      eventBus.subscribe('event2', handler2);

      eventBus.clear();

      await eventBus.emitAsync('event1', {}, 'test');
      await eventBus.emitAsync('event2', {}, 'test');

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });
});
