import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Switch, Alert, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { notificationService } from '@/lib/notificationService';

import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface NotificationSettings {
  dailyVerse: boolean;
  dailyVerseTime: string;
  prayerReminder: boolean;
  prayerReminderTime: string;
}

export default function SettingsScreen() {
  const theme = useTheme();
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    dailyVerse: false,
    dailyVerseTime: '06:00',
    prayerReminder: false,
    prayerReminderTime: '19:00',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem('notification_settings');
        if (stored) {
          setNotificationSettings(JSON.parse(stored));
        }
      } catch (e) {
        console.warn('Failed to load notification settings', e);
      }
    };
    loadSettings();
  }, []);

  const handleNotificationToggle = async (type: keyof NotificationSettings) => {
    try {
      const willEnable = !notificationSettings[type];
      const newSettings = { ...notificationSettings, [type]: willEnable };
      setNotificationSettings(newSettings);
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));

      if (willEnable) {
        const granted = await notificationService.requestPermissions();
        if (!granted) {
          Alert.alert('Permission Denied', 'Please enable notifications in settings');
          const reverted = { ...newSettings, [type]: false };
          setNotificationSettings(reverted);
          await AsyncStorage.setItem('notification_settings', JSON.stringify(reverted));
          return;
        }

        // Schedule notification
        if (type === 'dailyVerse') {
          await notificationService.scheduleDailyVerse(6, 0); // Always morning 6 AM
        } else if (type === 'prayerReminder') {
          const [hour, minute] = notificationSettings.prayerReminderTime.split(':');
          await notificationService.schedulePrayerReminder(parseInt(hour), parseInt(minute));
        }
      } else {
        // Cancel notification
        await notificationService.cancelAllNotifications();
        // Reschedule other enabled notifications
        if (type === 'dailyVerse' && newSettings.prayerReminder) {
          const [hour, minute] = newSettings.prayerReminderTime.split(':');
          await notificationService.schedulePrayerReminder(parseInt(hour), parseInt(minute));
        } else if (type === 'prayerReminder' && newSettings.dailyVerse) {
          await notificationService.scheduleDailyVerse(6, 0);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Notifications Section */}
      <View style={[styles.section, { borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>🔔 Notifications</Text>

        {/* Daily Verse */}
        <View style={[styles.settingItem, { borderColor: theme.border }]}>
          <View style={styles.settingLabel}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Daily Verse</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Get a daily verse at {notificationSettings.dailyVerseTime}
            </Text>
          </View>
          <Switch
            value={notificationSettings.dailyVerse}
            onValueChange={() => handleNotificationToggle('dailyVerse')}
            trackColor={{ false: theme.border, true: theme.accent }}
          />
        </View>

        {/* Prayer Reminder */}
        <View style={[styles.settingItem, { borderColor: theme.border }]}>
          <View style={styles.settingLabel}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>Prayer Time</Text>
            <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
              Evening prayer reminder at {notificationSettings.prayerReminderTime}
            </Text>
          </View>
          <Switch
            value={notificationSettings.prayerReminder}
            onValueChange={() => handleNotificationToggle('prayerReminder')}
            trackColor={{ false: theme.border, true: theme.accent }}
          />
        </View>

        {/* Devotional removed */}
      </View>

      {/* About Section */}
      <View style={[styles.section, { borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.accent }]}>ℹ️ About</Text>
        <View style={[styles.aboutItem, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}> 
          <Text style={[styles.aboutTitle, { color: theme.text }]}>Bible AI</Text>
          <Text style={[styles.aboutVersion, { color: theme.textSecondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.aboutFeatures, { color: theme.textSecondary }]}>
            📖 Bible Reading • 🤖 AI Assistant • 📱 Offline Support
          </Text>
        </View>
      </View>
    </ScrollView>
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
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLabel: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
  },
  aboutItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  aboutVersion: {
    fontSize: 13,
    marginBottom: 12,
  },
  aboutFeatures: {
    fontSize: 13,
    lineHeight: 18,
  },
});
