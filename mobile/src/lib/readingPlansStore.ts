import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ReadingPlan {
  id: string;
  name_en: string;
  name_te: string;
  description_en: string;
  description_te: string;
  durationDays: number;
  type: 'old_testament' | 'new_testament' | 'psalms_proverbs' | 'gospel' | 'custom';
  readings: PlanReading[];
}

export interface PlanReading {
  day: number;
  book_id: number;
  chapter: number;
  verse_start?: number;
  verse_end?: number;
  reflection_en?: string;
  reflection_te?: string;
}

export interface UserReadingPlan {
  id: string;
  planId: string;
  userId: string;
  startDate: string;
  completedDays: number;
  currentDay: number;
  completed: boolean;
}

// Predefined reading plans
export const readingPlans: ReadingPlan[] = [
  {
    id: 'gospel_30',
    name_en: 'Gospel in 30 Days',
    name_te: '30 రోజుల్లో సువార్త',
    description_en: 'Read through the four gospels in 30 days',
    description_te: '30 రోజుల్లో నాలుగు సువార్తలను చదవండి',
    durationDays: 30,
    type: 'gospel',
    readings: [
      { day: 1, book_id: 40, chapter: 1 }, // Matthew 1
      { day: 2, book_id: 40, chapter: 2 },
      { day: 3, book_id: 40, chapter: 3 },
      { day: 4, book_id: 40, chapter: 4 },
      { day: 5, book_id: 40, chapter: 5 },
      { day: 6, book_id: 40, chapter: 6 },
      { day: 7, book_id: 40, chapter: 7 },
      { day: 8, book_id: 40, chapter: 8 },
      { day: 9, book_id: 41, chapter: 1 }, // Mark 1
      { day: 10, book_id: 41, chapter: 2 },
      { day: 11, book_id: 41, chapter: 3 },
      { day: 12, book_id: 41, chapter: 4 },
      { day: 13, book_id: 41, chapter: 5 },
      { day: 14, book_id: 41, chapter: 6 },
      { day: 15, book_id: 42, chapter: 1 }, // Luke 1
      { day: 16, book_id: 42, chapter: 2 },
      { day: 17, book_id: 42, chapter: 3 },
      { day: 18, book_id: 42, chapter: 4 },
      { day: 19, book_id: 42, chapter: 5 },
      { day: 20, book_id: 42, chapter: 6 },
      { day: 21, book_id: 42, chapter: 7 },
      { day: 22, book_id: 43, chapter: 1 }, // John 1
      { day: 23, book_id: 43, chapter: 2 },
      { day: 24, book_id: 43, chapter: 3 },
      { day: 25, book_id: 43, chapter: 4 },
      { day: 26, book_id: 43, chapter: 5 },
      { day: 27, book_id: 43, chapter: 6 },
      { day: 28, book_id: 43, chapter: 7 },
      { day: 29, book_id: 43, chapter: 8 },
      { day: 30, book_id: 43, chapter: 9 },
    ],
  },
  {
    id: 'psalms_proverbs_40',
    name_en: 'Psalms & Proverbs in 40 Days',
    name_te: '40 రోజుల్లో కీర్తనలు & సామెతలు',
    description_en: 'Discover wisdom and praise through Psalms and Proverbs',
    description_te: 'కీర్తనలు మరియు సామెతల ద్వారా జ్ఞానం కనుగొనండి',
    durationDays: 40,
    type: 'psalms_proverbs',
    readings: [
      { day: 1, book_id: 19, chapter: 1 }, // Psalms 1
      { day: 2, book_id: 19, chapter: 2 },
      { day: 3, book_id: 19, chapter: 3 },
      { day: 4, book_id: 19, chapter: 4 },
      { day: 5, book_id: 19, chapter: 5 },
      { day: 6, book_id: 20, chapter: 1 }, // Proverbs 1
      { day: 7, book_id: 20, chapter: 2 },
      { day: 8, book_id: 20, chapter: 3 },
      // ... continue pattern
      ...Array.from({ length: 32 }, (_, i) => ({
        day: i + 9,
        book_id: i % 2 === 0 ? 19 : 20,
        chapter: Math.floor(i / 2) + 6,
      })),
    ],
  },
  {
    id: 'new_testament_90',
    name_en: 'New Testament in 90 Days',
    name_te: '90 రోజుల్లో కొత్త నిబంధన',
    description_en: 'Complete journey through the New Testament',
    description_te: 'కొత్త నిబంధన ద్వారా సంపూర్ణ ప్రయాణం',
    durationDays: 90,
    type: 'new_testament',
    readings: Array.from({ length: 90 }, (_, i) => ({
      day: i + 1,
      book_id: 40 + Math.floor(i / 3), // Distribute across NT books
      chapter: (i % 3) + 1,
    })),
  },
];

// Store operations
const STORAGE_KEY_PREFIX = 'reading_plans_';

// Helper to get storage key for user (or local)
const getStorageKey = (userEmail?: string): string => {
  const id = userEmail && userEmail.trim() ? userEmail.toLowerCase() : 'local';
  return `${STORAGE_KEY_PREFIX}${id}`;
};

export const readingPlansStore = {
  // Save user's active reading plan
  async saveUserPlan(userEmail: string | undefined, plan: UserReadingPlan) {
    try {
      const plans = await this.getUserPlans(userEmail);
      const index = plans.findIndex(p => p.id === plan.id);
      if (index >= 0) {
        plans[index] = plan;
      } else {
        plans.push(plan);
      }
      const storageKey = getStorageKey(userEmail);
      await AsyncStorage.setItem(storageKey, JSON.stringify(plans));
    } catch (error) {
      console.error('Failed to save reading plan:', error);
    }
  },

  // Get all user plans
  async getUserPlans(userEmail?: string): Promise<UserReadingPlan[]> {
    try {
      const storageKey = getStorageKey(userEmail);
      const data = await AsyncStorage.getItem(storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get reading plans:', error);
      return [];
    }
  },

  // Get active reading plan
  async getActivePlan(userEmail?: string): Promise<UserReadingPlan | null> {
    try {
      const plans = await this.getUserPlans(userEmail);
      return plans.find(p => !p.completed) || null;
    } catch (error) {
      console.error('Failed to get active plan:', error);
      return null;
    }
  },

  // Mark day as completed
  async markDayComplete(userEmail: string | undefined, planId: string, day: number) {
    try {
      const plans = await this.getUserPlans(userEmail);
      const plan = plans.find(p => p.id === planId);
      if (plan) {
        plan.currentDay = Math.max(plan.currentDay, day);
        plan.completedDays = day;
        if (day >= (readingPlans.find(p => p.id === plan.planId)?.durationDays || 0)) {
          plan.completed = true;
        }
        await this.saveUserPlan(userEmail, plan);
      }
    } catch (error) {
      console.error('Failed to mark day complete:', error);
    }
  },

  // Get plan by ID
  async getUserPlanById(userEmail: string | undefined, planId: string): Promise<UserReadingPlan | null> {
    try {
      const plans = await this.getUserPlans(userEmail);
      return plans.find(p => p.id === planId) || null;
    } catch (error) {
      console.error('Failed to get plan:', error);
      return null;
    }
  },

  // Delete reading plan
  async deletePlan(userEmail: string | undefined, planId: string) {
    try {
      const plans = await this.getUserPlans(userEmail);
      const filtered = plans.filter(p => p.id !== planId);
      const storageKey = getStorageKey(userEmail);
      await AsyncStorage.setItem(storageKey, JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to delete plan:', error);
    }
  },

  // Get plan details
  getPlanById(planId: string): ReadingPlan | undefined {
    return readingPlans.find(p => p.id === planId);
  },

  // Get all available plans
  getAllPlans(): ReadingPlan[] {
    return readingPlans;
  },
};
