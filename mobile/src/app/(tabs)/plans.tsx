import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { readingPlans, ReadingPlan, UserReadingPlan } from '@/lib/readingPlansStore';
import { useFocusEffect } from 'expo-router';
import { useReadingPlan } from '@/lib/readingPlanContext';

export default function ReadingPlansScreen() {
  const theme = useTheme();
  const { userPlans, activePlan, isLoading, startPlan, deletePlan } = useReadingPlan();
  const [availablePlans] = useState(readingPlans);

  useFocusEffect(
    useCallback(() => {
      // Auto-refresh when screen is focused
    }, [])
  );

  const handleStartPlan = async (planId: string) => {
    try {
      const existing = userPlans.find(p => p.planId === planId && !p.completed);
      if (existing) {
        Alert.alert('Already Started', 'You have already started this plan. Check your active plans.');
        return;
      }

      await startPlan(planId);
      Alert.alert('Success', 'Plan started! Start reading to track your progress.');
    } catch (error) {
      console.error('Failed to start plan:', error);
      Alert.alert('Error', 'Failed to start plan');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    Alert.alert('Delete Plan', 'Are you sure you want to delete this plan?', [
      { text: 'Cancel', onPress: () => {} },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            await deletePlan(planId);
          } catch (error) {
            Alert.alert('Error', 'Failed to delete plan');
          }
        },
      },
    ]);
  };

  const getProgressPercentage = (plan: UserReadingPlan): number => {
    const planDetails = readingPlans.find(p => p.id === plan.planId);
    if (!planDetails) return 0;
    return Math.round((plan.completedDays / planDetails.durationDays) * 100);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading plans...</Text>
        </View>
      ) : (
        <>
          {/* Active Plan Section */}
          {activePlan && (
            <View style={[styles.section, { borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.accent }]}>📍 Your Active Plan</Text>
              <ActivePlanCard plan={activePlan} theme={theme} onDelete={handleDeletePlan} />
            </View>
          )}

          {/* Available Plans */}
          <View style={[styles.section, { borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.accent }]}>
              {activePlan ? '🎯 More Plans' : '🎯 Available Plans'}
            </Text>
            {availablePlans.map((plan) => {
              const started = userPlans.some(p => p.planId === plan.id && !p.completed);
              return (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  theme={theme}
                  isStarted={started}
                  onStart={() => handleStartPlan(plan.id)}
                />
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

interface PlanCardProps {
  plan: ReadingPlan;
  theme: any;
  isStarted: boolean;
  onStart: () => void;
}

function PlanCard({ plan, theme, isStarted, onStart }: PlanCardProps) {
  return (
    <View style={[styles.planCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
      <Text style={[styles.planTitle, { color: theme.accent }]}>{plan.name_en}</Text>
      <Text style={[styles.planSubtitle, { color: theme.textSecondary }]}>{plan.name_te}</Text>
      <Text style={[styles.planDescription, { color: theme.text }]}>{plan.description_en}</Text>
      <View style={styles.planMeta}>
        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
          ⏱️ {plan.durationDays} days
        </Text>
        <Text style={[styles.metaText, { color: theme.textSecondary }]}>
          📚 {plan.readings.length} readings
        </Text>
      </View>
      <TouchableOpacity
        style={[
          styles.startButton,
          {
            backgroundColor: isStarted ? theme.textSecondary : theme.accent,
          },
        ]}
        onPress={onStart}
        disabled={isStarted}
      >
        <Ionicons name={isStarted ? 'checkmark' : 'play'} size={18} color="white" />
        <Text style={styles.startButtonText}>{isStarted ? 'Started' : 'Start Reading'}</Text>
      </TouchableOpacity>
    </View>
  );
}

interface ActivePlanCardProps {
  plan: UserReadingPlan;
  theme: any;
  onDelete: (id: string) => void;
}

function ActivePlanCard({ plan, theme, onDelete }: ActivePlanCardProps) {
  const planDetails = readingPlans.find(p => p.id === plan.planId);
  const progress = Math.round((plan.completedDays / (planDetails?.durationDays || 1)) * 100);

  const startDate = new Date(plan.startDate);
  const daysRemaining = (planDetails?.durationDays || 1) - plan.completedDays;

  return (
    <View style={[styles.activePlanCard, { backgroundColor: theme.backgroundElement, borderColor: theme.accent }]}> 
      <View style={styles.activePlanHeader}>
        <View>
          <Text style={[styles.activePlanTitle, { color: theme.accent }]}>
            {planDetails?.name_en}
          </Text>
          <Text style={[styles.activePlanSubtitle, { color: theme.textSecondary }]}>
            Started {startDate.toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onDelete(plan.id)}>
          <Ionicons name="trash" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { backgroundColor: theme.border }]}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: theme.accent, width: `${progress}%` },
          ]}
        />
      </View>

      <View style={styles.progressStats}>
        <Text style={[styles.progressText, { color: theme.text }]}>
          Day {plan.completedDays + 1} of {planDetails?.durationDays || 1}
        </Text>
        <Text style={[styles.progressPercentage, { color: theme.accent }]}>
          {progress}% Complete
        </Text>
      </View>

      {daysRemaining > 0 && (
        <Text style={[styles.daysRemaining, { color: theme.textSecondary }]}>
          📅 {daysRemaining} days remaining
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 24,
  },
  section: {
    borderBottomWidth: 1,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  planCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  planMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
  },
  startButton: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  activePlanCard: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  activePlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  activePlanTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  activePlanSubtitle: {
    fontSize: 12,
  },
  progressContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '500',
  },
  progressPercentage: {
    fontSize: 13,
    fontWeight: '600',
  },
  daysRemaining: {
    fontSize: 12,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
    minHeight: 300,
  },
  loginText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  loginSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
