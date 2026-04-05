import { cosineSimilarity, Vector } from './similarity';

export interface RetrievalItem<T> {
  id: string;
  vector: Vector;
  data: T;
}

export interface TopKResult<T> {
  items: Array<{
    id: string;
    data: T;
    score: number;
  }>;
  total: number;
}

class MinHeap<T> {
  private heap: Array<{ id: string; data: T; score: number }> = [];

  get size(): number {
    return this.heap.length;
  }

  push(item: { id: string; data: T; score: number }): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  peek(): { id: string; data: T; score: number } | undefined {
    return this.heap[0];
  }

  pop(): { id: string; data: T; score: number } | undefined {
    if (this.heap.length === 0) return undefined;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return min;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      if (this.heap[parentIndex].score <= this.heap[index].score) break;
      [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
      index = parentIndex;
    }
  }

  private bubbleDown(index: number): void {
    while (true) {
      const leftChild = 2 * index + 1;
      const rightChild = 2 * index + 2;
      let smallest = index;

      if (leftChild < this.heap.length && this.heap[leftChild].score < this.heap[smallest].score) {
        smallest = leftChild;
      }
      if (rightChild < this.heap.length && this.heap[rightChild].score < this.heap[smallest].score) {
        smallest = rightChild;
      }

      if (smallest === index) break;
      [this.heap[smallest], this.heap[index]] = [this.heap[index], this.heap[smallest]];
      index = smallest;
    }
  }
}

export class TopKRetrieval<T> {
  private items: Map<string, RetrievalItem<T>> = new Map();
  private dimension: number;

  constructor(dimension: number = 128) {
    this.dimension = dimension;
  }

  add(id: string, vector: number[], data: T): void {
    if (vector.length !== this.dimension) {
      throw new Error(`Vector dimension must be ${this.dimension}`);
    }
    this.items.set(id, {
      id,
      vector: { dimensions: vector },
      data,
    });
  }

  remove(id: string): boolean {
    return this.items.delete(id);
  }

  search(queryVector: number[], k: number): TopKResult<T> {
    if (queryVector.length !== this.dimension) {
      throw new Error(`Query vector dimension must be ${this.dimension}`);
    }

    if (k <= 0) {
      return { items: [], total: this.items.size };
    }

    const query: Vector = { dimensions: queryVector };
    const heap = new MinHeap<T>();
    const itemCount = this.items.size;

    if (k >= itemCount) {
      const results: Array<{ id: string; data: T; score: number }> = [];
      for (const item of this.items.values()) {
        const score = cosineSimilarity(query, item.vector);
        results.push({
          id: item.id,
          data: item.data,
          score,
        });
      }
      results.sort((a, b) => b.score - a.score);
      return {
        items: results,
        total: itemCount,
      };
    }

    for (const item of this.items.values()) {
      const score = cosineSimilarity(query, item.vector);
      if (heap.size < k) {
        heap.push({ id: item.id, data: item.data, score });
      } else if (score > (heap.peek()?.score ?? 0)) {
        heap.pop();
        heap.push({ id: item.id, data: item.data, score });
      }
    }

    const results: Array<{ id: string; data: T; score: number }> = [];
    let item = heap.pop();
    while (item) {
      results.unshift(item);
      item = heap.pop();
    }

    return {
      items: results,
      total: itemCount,
    };
  }

  getItem(id: string): RetrievalItem<T> | undefined {
    return this.items.get(id);
  }

  size(): number {
    return this.items.size;
  }

  clear(): void {
    this.items.clear();
  }

  getAllIds(): string[] {
    return Array.from(this.items.keys());
  }
}
