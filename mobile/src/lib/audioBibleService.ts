import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface AudioSettings {
  language: 'te' | 'en';
  rate: number; // 0.5 to 2
  pitch: number; // 0.5 to 2
  volume: number; // 0 to 1
}

const AUDIO_SETTINGS_KEY = 'audio_settings';

const DEFAULT_SETTINGS: AudioSettings = {
  language: 'en',
  rate: 1,
  pitch: 1,
  volume: 1,
};

let currentSpeechId: string | null = null;

export const audioBibleService = {
  // Load audio settings
  async loadSettings(): Promise<AudioSettings> {
    try {
      const saved = await AsyncStorage.getItem(AUDIO_SETTINGS_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch (error) {
      console.warn('Failed to load audio settings:', error);
      return DEFAULT_SETTINGS;
    }
  },

  // Save audio settings
  async saveSettings(settings: AudioSettings) {
    try {
      await AsyncStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save audio settings:', error);
    }
  },

  // Speak verse text with promise-based callback
  async speakVerse(
    text: string,
    settings: AudioSettings,
    onFinish?: () => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Stop any existing speech
        Speech.stop();

        currentSpeechId = Math.random().toString(36).substr(2, 9);
        const speechId = currentSpeechId;

        Speech.speak(text, {
          language: settings.language === 'te' ? 'te-IN' : 'en-US',
          rate: settings.rate,
          pitch: settings.pitch,
          volume: settings.volume,
          onDone: () => {
            if (speechId === currentSpeechId) {
              if (onFinish) onFinish();
              resolve();
            }
          },
          onError: (error) => {
            console.error('Speech error:', error);
            reject(error);
          },
          onStopped: () => {
            // Speech was stopped by user
            resolve();
          },
        });
      } catch (error) {
        console.error('Failed to speak verse:', error);
        reject(error);
      }
    });
  },

  // Stop speech
  async stopSpeech() {
    try {
      currentSpeechId = null;
      await Speech.stop();
    } catch (error) {
      console.error('Failed to stop speech:', error);
    }
  },

  // Pause speech (if supported)
  async pauseSpeech() {
    try {
      await Speech.pause?.();
    } catch (error) {
      console.warn('Pause not fully supported:', error);
    }
  },

  // Get available voices
  async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Failed to get voices:', error);
      return [];
    }
  },

  // Check if speech is available
  async isSpeechAvailable(): Promise<boolean> {
    try {
      const voices = await this.getAvailableVoices();
      return voices.length > 0;
    } catch {
      return false;
    }
  },
};
