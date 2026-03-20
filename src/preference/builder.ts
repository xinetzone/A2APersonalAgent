import { Profile } from '../api/secondme';
import { Memory } from '../api/secondme';

export interface UserProfile {
  userId: string;
  name: string;
  aboutMe: string;
  interests: string[];
  personalityTraits: string[];
  interactionPatterns: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VectorProfile {
  userId: string;
  vector: number[];
  dimensions: {
    interestTags: string[];
    personalityTraits: string[];
    interactionPatterns: string[];
  };
  updatedAt: Date;
}

export class ProfileBuilder {
  private dimensionSize: number;

  constructor(dimensionSize: number = 128) {
    this.dimensionSize = dimensionSize;
  }

  buildFromProfile(profile: Profile, memories: Memory[] = []): UserProfile {
    const interests = this.extractInterests(memories);
    const personalityTraits = this.extractTraits(memories);
    const interactionPatterns = this.extractPatterns(memories);

    return {
      userId: profile.originRoute || profile.homepage || 'unknown',
      name: profile.name,
      aboutMe: profile.aboutMe,
      interests,
      personalityTraits,
      interactionPatterns,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  buildVector(profile: UserProfile): VectorProfile {
    const vector = this.generateVector(profile);
    return {
      userId: profile.userId,
      vector,
      dimensions: {
        interestTags: profile.interests,
        personalityTraits: profile.personalityTraits,
        interactionPatterns: profile.interactionPatterns,
      },
      updatedAt: new Date(),
    };
  }

  private extractInterests(memories: Memory[]): string[] {
    const interests: string[] = [];
    for (const memory of memories) {
      const content = memory.factContent || '';
      if (content.includes('[兴趣]') || content.includes('[interest]')) {
        const match = content.match(/[兴趣|interest]:?\s*(.+)/i);
        if (match) {
          interests.push(match[1].trim());
        }
      }
    }
    return [...new Set(interests)];
  }

  private extractTraits(memories: Memory[]): string[] {
    const traits: string[] = [];
    for (const memory of memories) {
      const content = memory.factContent || '';
      if (content.includes('[性格]') || content.includes('[trait]')) {
        const match = content.match(/[性格|trait]:?\s*(.+)/i);
        if (match) {
          traits.push(match[1].trim());
        }
      }
    }
    return [...new Set(traits)];
  }

  private extractPatterns(memories: Memory[]): string[] {
    const patterns: string[] = [];
    for (const memory of memories) {
      const content = memory.factContent || '';
      if (content.includes('[模式]') || content.includes('[pattern]')) {
        const match = content.match(/[模式|pattern]:?\s*(.+)/i);
        if (match) {
          patterns.push(match[1].trim());
        }
      }
    }
    return [...new Set(patterns)];
  }

  private generateVector(profile: UserProfile): number[] {
    const vector: number[] = [];
    for (let i = 0; i < this.dimensionSize; i++) {
      const seed = this.hashString(profile.userId + i.toString());
      vector.push((seed % 100) / 100);
    }
    return vector;
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  updateProfile(profile: UserProfile, newInterests: string[]): UserProfile {
    return {
      ...profile,
      interests: [...new Set([...profile.interests, ...newInterests])],
      updatedAt: new Date(),
    };
  }
}

export const profileBuilder = new ProfileBuilder();
