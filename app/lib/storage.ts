const STORAGE_KEYS = {
  GUIDANCE_HISTORY: 'dao_guidance_history',
  USER_PREFERENCES: 'user_preferences',
} as const;

export interface GuidanceWithTimestamp {
  date: string;
  quote: {
    title?: string;
    text: string;
  };
  topic?: string;
  mood?: string;
  interpretation: string;
  reflectionQuestions: string[];
  practices: string[];
  savedAt: string;
}

export function saveGuidanceLocally(guidance: GuidanceWithTimestamp): void {
  if (typeof window === 'undefined') return;
  try {
    const history = getGuidanceHistory();
    history.unshift({
      ...guidance,
      savedAt: new Date().toISOString(),
    });
    localStorage.setItem(
      STORAGE_KEYS.GUIDANCE_HISTORY,
      JSON.stringify(history.slice(0, 30))
    );
  } catch (error) {
    console.error('Failed to save guidance:', error);
  }
}

export function getGuidanceHistory(): GuidanceWithTimestamp[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.GUIDANCE_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function clearGuidanceHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.GUIDANCE_HISTORY);
}

export interface UserPreferences {
  theme?: 'light' | 'dark';
  lastTopic?: string;
  lastMood?: string;
  defaultPageSize?: number;
}

export function saveUserPreferences(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

export function getUserPreferences(): UserPreferences {
  if (typeof window === 'undefined') return {};
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}
