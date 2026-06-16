import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { readingPlansStore, UserReadingPlan, ReadingPlan, readingPlans } from './readingPlansStore';

interface ReadingPlanContextType {
  userPlans: UserReadingPlan[];
  activePlan: UserReadingPlan | null;
  isLoading: boolean;
  startPlan: (planId: string) => Promise<void>;
  markDayComplete: (planId: string, day: number) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;
  reloadPlans: () => Promise<void>;
  getPlanDetails: (planId: string) => ReadingPlan | undefined;
  getTodayReading: () => ReadingPlan['readings'] | null;
}

const ReadingPlanContext = createContext<ReadingPlanContextType | undefined>(undefined);

export function ReadingPlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlans, setUserPlans] = useState<UserReadingPlan[]>([]);
  const [activePlan, setActivePlan] = useState<UserReadingPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load plans from device-local storage (no sign-in required)
  const reloadPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      const plans = await readingPlansStore.getUserPlans();
      setUserPlans(plans);
      const active = plans.find(p => !p.completed);
      setActivePlan(active || null);
    } catch (error) {
      console.error('Failed to load reading plans:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload plans when user changes
  useEffect(() => {
    let isMounted = true;
    const initLoad = async () => {
      await Promise.resolve();
      if (isMounted) {
        reloadPlans();
      }
    };
    initLoad();
    return () => {
      isMounted = false;
    };
  }, [reloadPlans]);

   
  const startPlan = useCallback(
    async (planId: string) => {
      try {
        const newPlan: UserReadingPlan = {
          id: `${planId}_${Date.now()}`,
          planId,
          userId: 'local',
          startDate: new Date().toISOString(),
          completedDays: 0,
          currentDay: 0,
          completed: false,
        };

        await readingPlansStore.saveUserPlan(undefined, newPlan);
        await reloadPlans();
      } catch (error) {
        console.error('Failed to start plan:', error);
        throw error;
      }
    },
    [reloadPlans]
  );

   
  const markDayComplete = useCallback(
    async (planId: string, day: number) => {
      try {
        const plan = userPlans.find(p => p.id === planId);
        if (plan) {
          plan.currentDay = Math.max(plan.currentDay, day);
          plan.completedDays = day;
          
          const planDetails = readingPlans.find(p => p.id === plan.planId);
          if (day >= (planDetails?.durationDays || 1)) {
            plan.completed = true;
          }

          await readingPlansStore.saveUserPlan(undefined, plan);
          await reloadPlans();
        }
      } catch (error) {
        console.error('Failed to mark day complete:', error);
        throw error;
      }
    },
    [userPlans, reloadPlans]
  );

   
  const deletePlan = useCallback(
    async (planId: string) => {
      try {
        await readingPlansStore.deletePlan(undefined, planId);
        await reloadPlans();
      } catch (error) {
        console.error('Failed to delete plan:', error);
        throw error;
      }
    },
    [reloadPlans]
  );

  const getPlanDetails = useCallback((planId: string) => {
    return readingPlans.find(p => p.id === planId);
  }, []);

  const getTodayReading = useCallback(() => {
    if (!activePlan) return null;
    const planDetails = getPlanDetails(activePlan.planId);
    if (!planDetails) return null;
    
    const todayReading = planDetails.readings.find(r => r.day === activePlan.currentDay + 1);
    return todayReading ? [todayReading] : null;
  }, [activePlan, getPlanDetails]);

  return (
    <ReadingPlanContext.Provider
      value={{
        userPlans,
        activePlan,
        isLoading,
        startPlan,
        markDayComplete,
        deletePlan,
        reloadPlans,
        getPlanDetails,
        getTodayReading,
      }}
    >
      {children}
    </ReadingPlanContext.Provider>
  );
}

export function useReadingPlan() {
  const context = useContext(ReadingPlanContext);
  if (context === undefined) {
    throw new Error('useReadingPlan must be used within ReadingPlanProvider');
  }
  return context;
}
