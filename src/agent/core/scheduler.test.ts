import { TaskScheduler } from '@/agent/core/scheduler';

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = new TaskScheduler(2);
  });

  afterEach(() => {
    scheduler.clear();
  });

  describe('addTask', () => {
    it('should add task and return task id', async () => {
      scheduler.registerHandler('test', async () => 'result');
      const id = await scheduler.addTask('test', { data: 'test' }, 0);
      expect(typeof id).toBe('string');
    });
  });

  describe('concurrency limit', () => {
    it('should not exceed max concurrent tasks', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;

      scheduler.registerHandler('slow', async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise(resolve => setTimeout(resolve, 50));
        concurrent--;
        return 'done';
      });

      const promises = [
        scheduler.addTask('slow', {}, 0),
        scheduler.addTask('slow', {}, 0),
        scheduler.addTask('slow', {}, 0),
        scheduler.addTask('slow', {}, 0),
      ];

      await Promise.all(promises);
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });

  describe('getRunningTasks', () => {
    it('should return currently running tasks', async () => {
      scheduler.registerHandler('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        return 'done';
      });

      const id = await scheduler.addTask('test', {}, 0);

      await new Promise(resolve => setTimeout(resolve, 10));
      const running = scheduler.getRunningTasks();
      expect(running.length).toBe(1);
      expect(running[0].id).toBe(id);

      await new Promise(resolve => setTimeout(resolve, 60));
      expect(scheduler.getRunningTasks().length).toBe(0);
    });
  });

  describe('cancelTask', () => {
    it('should not cancel already running task', async () => {
      scheduler.registerHandler('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      });

      const id1 = await scheduler.addTask('test', {}, 0);

      await new Promise(resolve => setTimeout(resolve, 10));
      const cancelled = scheduler.cancelTask(id1);
      expect(cancelled).toBe(false);

      await new Promise(resolve => setTimeout(resolve, 120));
    });
  });

  describe('clear', () => {
    it('should clear pending tasks', async () => {
      scheduler.registerHandler('test', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'done';
      });

      await scheduler.addTask('test', {}, 0);
      await scheduler.addTask('test', {}, 0);

      scheduler.clear();
      const pending = scheduler.getPendingTasks();
      expect(pending.length).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should handle handler errors gracefully', async () => {
      scheduler.registerHandler('error', async () => {
        throw new Error('Handler error');
      });

      await scheduler.addTask('error', {}, 0);
      await new Promise(resolve => setTimeout(resolve, 50));

      const running = scheduler.getRunningTasks();
      expect(running.length).toBe(0);
    });
  });
});