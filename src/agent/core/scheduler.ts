export interface Task {
  id: string;
  type: string;
  priority: number;
  data: unknown;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: Error;
}

export type TaskHandler = (task: Task) => Promise<void>;

export class TaskScheduler {
  private taskQueue: Task[] = [];
  private runningTasks: Map<string, Task> = new Map();
  private handlers: Map<string, TaskHandler> = new Map();
  private maxConcurrent: number;
  private isProcessing: boolean = false;

  constructor(maxConcurrent: number = 3) {
    this.maxConcurrent = maxConcurrent;
  }

  registerHandler(taskType: string, handler: TaskHandler): void {
    this.handlers.set(taskType, handler);
  }

  async addTask(type: string, data: unknown, priority: number = 0): Promise<string> {
    const task: Task = {
      id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      priority,
      data,
      status: 'pending',
      createdAt: new Date(),
    };
    this.taskQueue.push(task);
    this.taskQueue.sort((a, b) => b.priority - a.priority);
    this.processQueue();
    return task.id;
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (this.runningTasks.size >= this.maxConcurrent) return;
    if (this.taskQueue.length === 0) return;

    this.isProcessing = true;
    try {
      while (this.runningTasks.size < this.maxConcurrent && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift();
        if (task) {
          this.executeTask(task);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async executeTask(task: Task): Promise<void> {
    const handler = this.handlers.get(task.type);
    if (!handler) {
      task.status = 'failed';
      task.error = new Error(`No handler registered for task type: ${task.type}`);
      return;
    }

    task.status = 'running';
    task.startedAt = new Date();
    this.runningTasks.set(task.id, task);

    try {
      await handler(task);
      task.status = 'completed';
      task.completedAt = new Date();
    } catch (error) {
      task.status = 'failed';
      task.error = error as Error;
      task.completedAt = new Date();
    } finally {
      this.runningTasks.delete(task.id);
      this.processQueue();
    }
  }

  getTask(taskId: string): Task | undefined {
    const running = this.runningTasks.get(taskId);
    if (running) return running;
    return this.taskQueue.find(t => t.id === taskId);
  }

  getPendingTasks(): Task[] {
    return [...this.taskQueue];
  }

  getRunningTasks(): Task[] {
    return Array.from(this.runningTasks.values());
  }

  cancelTask(taskId: string): boolean {
    const index = this.taskQueue.findIndex(t => t.id === taskId);
    if (index !== -1) {
      this.taskQueue.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(): void {
    this.taskQueue = [];
  }
}

export const taskScheduler = new TaskScheduler();
