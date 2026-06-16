import { useEffect } from 'react';
import Constants from 'expo-constants';

// Push notifications are removed/disabled in Expo Go for SDK 53
const areNotificationsSupported = () => {
  const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
  return !isExpoGo;
};

let Notifications: any = null;
if (areNotificationsSupported()) {
  try {
    Notifications = require('expo-notifications');
    
    // Configure how notifications should behave when the app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldShowBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      } as any),
    });
  } catch (err) {
    console.warn('Failed to initialize native notifications:', err);
    Notifications = null;
  }
}

export interface ReminderSchedule {
  id: string;
  type: 'daily_verse' | 'prayer_time' | 'devotional' | 'study_reminder';
  hour: number;
  minute: number;
  enabled: boolean;
  days?: number[]; // 0-6 for Sunday-Saturday
}

export const notificationService = {
  // Request notification permissions
  async requestPermissions() {
    if (!Notifications) return false;
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch {
      return false;
    }
  },

  // Trigger immediate welcome notification
  async triggerWelcomeNotification() {
    if (!Notifications) return undefined;
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🙏 బైబిల్ AI కి స్వాగతం / Welcome to Bible AI',
          body: 'బైబిల్ AI యాప్‌ను డౌన్‌లోడ్ చేసుకున్నందుకు ధన్యవాదాలు! / Thank you for downloading Bible AI!',
          data: { type: 'welcome' },
          sound: 'default',
        },
        trigger: null,
      });
      return identifier;
    } catch (error) {
      console.error('Failed to trigger welcome notification:', error);
    }
  },

  // Schedule daily verse reminder
  async scheduleDailyVerse(hour: number = 8, minute: number = 0) {
    if (!Notifications) return undefined;
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '📖 నేటి వాగ్దానం / Daily Verse',
          body: 'ఈరోజు దేవుని వాక్యమును ధ్యానించండి. / Meditate on God\'s word today.',
          data: { type: 'daily_verse' },
          sound: 'default',
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
        } as any,
      });
      return identifier;
    } catch (error) {
      console.error('Failed to schedule daily verse:', error);
    }
  },

  // Schedule prayer time reminder
  async schedulePrayerReminder(hour: number = 19, minute: number = 0) {
    if (!Notifications) return undefined;
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🙏 Prayer Time',
          body: 'Time for your evening prayers',
          data: { type: 'prayer_time' },
          sound: 'default',
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
        } as any,
      });
      return identifier;
    } catch (error) {
      console.error('Failed to schedule prayer reminder:', error);
    }
  },

  // Schedule devotional reminder
  async scheduleDevotionalReminder(hour: number = 6, minute: number = 30) {
    if (!Notifications) return undefined;
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: '✨ Daily Devotional',
          body: 'Start your day with a spiritual reflection',
          data: { type: 'devotional' },
          sound: 'default',
        },
        trigger: {
          type: 'daily',
          hour,
          minute,
        } as any,
      });
      return identifier;
    } catch (error) {
      console.error('Failed to schedule devotional reminder:', error);
    }
  },

  // Cancel notification
  async cancelNotification(notificationId: string) {
    if (!Notifications) return;
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  },

  // Get all scheduled notifications
  async getAllScheduledNotifications() {
    if (!Notifications) return [];
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to get scheduled notifications:', error);
      return [];
    }
  },

  // Cancel all notifications
  async cancelAllNotifications() {
    if (!Notifications) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  },
};

// Hook to handle notification responses
export function useNotificationHandler() {
  useEffect(() => {
    if (!Notifications) return;
    try {
      const subscription = Notifications.addNotificationResponseReceivedListener((response: any) => {
        const type = response.notification.request.content.data?.type;
        console.log('Notification response:', type);
      });

      return () => subscription.remove();
    } catch (err) {
      console.warn('Failed to listen to notification responses:', err);
    }
  }, []);
}

