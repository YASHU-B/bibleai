import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_LANGUAGE_KEY = 'app_ui_language';
const HAS_LAUNCHED_BEFORE_KEY = 'app_has_launched_before';

export const languagePreferenceService = {
  // Get language (default: te)
  async getLanguage(): Promise<'te' | 'en'> {
    try {
      const saved = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
      return (saved === 'en' || saved === 'te') ? saved : 'te';
    } catch {
      return 'te';
    }
  },

  // Set language
  async setLanguage(lang: 'te' | 'en'): Promise<void> {
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_KEY, lang);
    } catch (err) {
      console.warn('Failed to save language preference', err);
    }
  },

  // Check if first-time app launch
  async checkFirstTimeLaunch(): Promise<boolean> {
    try {
      const hasLaunched = await AsyncStorage.getItem(HAS_LAUNCHED_BEFORE_KEY);
      if (hasLaunched === 'true') {
        return false;
      }
      // Set the flag for future launches
      await AsyncStorage.setItem(HAS_LAUNCHED_BEFORE_KEY, 'true');
      return true;
    } catch {
      return false;
    }
  }
};
