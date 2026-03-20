import { validateToolArguments } from '../schemas/mcp';

describe('validateToolArguments', () => {
  describe('search_memories', () => {
    it('should validate valid arguments', () => {
      const result = validateToolArguments('search_memories', {
        keyword: '道德经',
        pageNo: 1,
        pageSize: 20,
      });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.keyword).toBe('道德经');
        expect(result.data.pageNo).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });

    it('should reject empty keyword', () => {
      const result = validateToolArguments('search_memories', {
        keyword: '',
      });

      expect(result.valid).toBe(false);
    });

    it('should use defaults for optional fields', () => {
      const result = validateToolArguments('search_memories', {
        keyword: 'test',
      });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.data.pageNo).toBe(1);
        expect(result.data.pageSize).toBe(20);
      }
    });
  });

  describe('create_memory', () => {
    it('should validate valid arguments', () => {
      const result = validateToolArguments('create_memory', {
        content: '这是一条记忆',
        visibility: 1,
      });

      expect(result.valid).toBe(true);
    });

    it('should reject empty content', () => {
      const result = validateToolArguments('create_memory', {
        content: '',
      });

      expect(result.valid).toBe(false);
    });

    it('should reject content exceeding max length', () => {
      const result = validateToolArguments('create_memory', {
        content: 'a'.repeat(10001),
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('dao_daily_guidance', () => {
    it('should validate valid arguments', () => {
      const result = validateToolArguments('dao_daily_guidance', {
        date: '2024-01-01',
        topic: '焦虑',
        mood: '低落',
      });

      expect(result.valid).toBe(true);
    });

    it('should reject invalid date format', () => {
      const result = validateToolArguments('dao_daily_guidance', {
        date: 'invalid-date',
      });

      expect(result.valid).toBe(false);
    });

    it('should allow missing optional fields', () => {
      const result = validateToolArguments('dao_daily_guidance', {});

      expect(result.valid).toBe(true);
    });
  });

  describe('dao_topic_guidance', () => {
    it('should require topic', () => {
      const result = validateToolArguments('dao_topic_guidance', {});

      expect(result.valid).toBe(false);
    });

    it('should validate valid arguments', () => {
      const result = validateToolArguments('dao_topic_guidance', {
        topic: '工作',
        context: '职场发展',
        mood: '迷茫',
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('unknown tool', () => {
    it('should return invalid for unknown tool', () => {
      const result = validateToolArguments('unknown_tool', {});

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown tool');
    });
  });
});
