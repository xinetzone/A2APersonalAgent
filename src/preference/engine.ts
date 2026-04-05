import { TrackedEvent } from './tracker';
import { PatternRecognizer } from './patterns';
import { ProfileBuilder, UserProfile, VectorProfile } from './builder';

export interface PreferenceEngineState {
  profile: UserProfile | null;
  vector: VectorProfile | null;
  lastUpdated: Date;
}

export class PreferenceEngine {
  private state: PreferenceEngineState;
  private profileBuilder: ProfileBuilder;

  constructor() {
    this.state = {
      profile: null,
      vector: null,
      lastUpdated: new Date(),
    };
    this.profileBuilder = new ProfileBuilder();
  }

  setProfile(profile: UserProfile): void {
    this.state.profile = profile;
    this.state.vector = this.profileBuilder.buildVector(profile);
    this.state.lastUpdated = new Date();
  }

  getProfile(): UserProfile | null {
    return this.state.profile;
  }

  getVector(): VectorProfile | null {
    return this.state.vector;
  }

  updateWithEvents(events: TrackedEvent[]): void {
    if (!this.state.profile) return;

    const interests = new Set(this.state.profile.interests);
    for (const event of events) {
      if (event.eventType === 'interest_shown' && typeof event.data === 'object') {
        const data = event.data as { interest?: string };
        if (data.interest) {
          interests.add(data.interest);
        }
      }
    }
    this.state.profile = {
      ...this.state.profile,
      interests: Array.from(interests),
      updatedAt: new Date(),
    };
    this.state.vector = this.profileBuilder.buildVector(this.state.profile);
    this.state.lastUpdated = new Date();
  }

  getState(): PreferenceEngineState {
    return { ...this.state };
  }
}

export const preferenceEngine = new PreferenceEngine();
