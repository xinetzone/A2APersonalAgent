import { ShortTermMemory } from '@/memory/short-term';

describe('ShortTermMemory', () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory(5, 1000);
  });

  afterEach(() => {
    memory.dispose();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      memory.set('key1', 'value1');
      expect(memory.get('key1')).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      expect(memory.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing value', () => {
      memory.set('key1', 'value1');
      memory.set('key1', 'value2');
      expect(memory.get('key1')).toBe('value2');
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      memory.set('key1', 'value1');
      expect(memory.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(memory.has('nonexistent')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      memory.set('key1', 'value1');
      memory.delete('key1');
      expect(memory.has('key1')).toBe(false);
    });

    it('should return false for non-existent key', () => {
      expect(memory.delete('nonexistent')).toBe(false);
    });
  });

  describe('expiration', () => {
    it('should respect TTL and expire', async () => {
      memory.set('key1', 'value1', 50);
      expect(memory.get('key1')).toBe('value1');

      await new Promise(resolve => setTimeout(resolve, 100));
      expect(memory.get('key1')).toBeNull();
    });
  });

  describe('max items', () => {
    it('should remove oldest item when max is exceeded', async () => {
      memory.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 15));
      memory.set('key2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 15));
      memory.set('key3', 'value3');
      await new Promise(resolve => setTimeout(resolve, 15));
      memory.set('key4', 'value4');
      await new Promise(resolve => setTimeout(resolve, 15));
      memory.set('key5', 'value5');
      await new Promise(resolve => setTimeout(resolve, 15));

      memory.set('key6', 'value6');

      expect(memory.get('key1')).toBeNull();
      expect(memory.get('key6')).toBe('value6');
    });
  });

  describe('keys and size', () => {
    it('should return correct keys count', () => {
      memory.set('key1', 'value1');
      memory.set('key2', 'value2');
      expect(memory.keys()).toHaveLength(2);
      expect(memory.size()).toBe(2);
    });

    it('should return empty array when no items', () => {
      expect(memory.keys()).toHaveLength(0);
      expect(memory.size()).toBe(0);
    });
  });

  describe('getRecentItems', () => {
    it('should return items sorted by timestamp', async () => {
      memory.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10));
      memory.set('key2', 'value2');

      const recent = memory.getRecentItems(2);
      expect(recent[0].key).toBe('key2');
      expect(recent[1].key).toBe('key1');
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      memory.set('key1', 'value1');
      memory.set('key2', 'value2');
      memory.clear();

      expect(memory.size()).toBe(0);
    });
  });
});