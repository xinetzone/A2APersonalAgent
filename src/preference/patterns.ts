import { TrackedEvent } from './tracker';

export interface Pattern {
  name: string;
  events: string[];
  frequency: number;
  lastOccurrence: Date;
}

export class PatternRecognizer {
  private patterns: Map<string, Pattern> = new Map();

  recognize(events: TrackedEvent[]): Pattern[] {
    const eventSequences = this.extractSequences(events);
    for (const [name, sequence] of eventSequences) {
      const existing = this.patterns.get(name);
      if (existing) {
        existing.frequency++;
        existing.lastOccurrence = new Date();
      } else {
        this.patterns.set(name, {
          name,
          events: sequence,
          frequency: 1,
          lastOccurrence: new Date(),
        });
      }
    }
    return this.getTopPatterns(10);
  }

  private extractSequences(events: TrackedEvent[]): Map<string, string[]> {
    const sequences = new Map<string, string[]>();
    for (let i = 0; i < events.length - 1; i++) {
      const seq = [events[i].eventType, events[i + 1].eventType].join('->');
      const existing = sequences.get(seq) || [];
      existing.push(events[i].eventType);
      sequences.set(seq, existing);
    }
    return sequences;
  }

  getPattern(name: string): Pattern | undefined {
    return this.patterns.get(name);
  }

  getTopPatterns(count: number): Pattern[] {
    return Array.from(this.patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, count);
  }

  clear(): void {
    this.patterns.clear();
  }
}

export const patternRecognizer = new PatternRecognizer();
