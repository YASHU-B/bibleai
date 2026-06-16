import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const isWeb = Platform.OS === 'web';
const STORAGE_DIR = `${FileSystem.documentDirectory ?? ''}settings/`;
const SETTINGS_FILE = `${STORAGE_DIR}settings.json`;
const SETTINGS_KEY = 'bible-ai-app-settings';
const GUEST_KEY = '__guest__';

export type ScriptureVoicePreference = 'te' | 'en';

export interface AppSettings {
  isPremium: boolean;
  defaultScriptureVoice: ScriptureVoicePreference;
}

const DEFAULT_APP_SETTINGS: AppSettings = {
  isPremium: false,
  defaultScriptureVoice: 'te',
};

function readWebData(key: string) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeWebData(key: string, value: unknown) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

interface SettingsMap {
  [key: string]: AppSettings;
}

async function ensureStorageDir() {
  if (isWeb) return;
  const info = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
}

async function loadSettingsMap(): Promise<SettingsMap> {
  try {
    if (isWeb) {
      return readWebData(SETTINGS_KEY) || {};
    }
    await ensureStorageDir();
    const info = await FileSystem.getInfoAsync(SETTINGS_FILE);
    if (!info.exists) return {};
    const raw = await FileSystem.readAsStringAsync(SETTINGS_FILE);
    if (!raw) return {};
    return JSON.parse(raw) as SettingsMap;
  } catch (error) {
    console.warn('Failed to load app settings:', error);
    return {};
  }
}

async function saveSettingsMap(settingsMap: SettingsMap) {
  try {
    if (isWeb) {
      writeWebData(SETTINGS_KEY, settingsMap);
      return;
    }
    await ensureStorageDir();
    await FileSystem.writeAsStringAsync(SETTINGS_FILE, JSON.stringify(settingsMap));
  } catch (error) {
    console.warn('Failed to save app settings:', error);
  }
}

function getSettingsKey(userEmail?: string) {
  return userEmail?.trim().toLowerCase() || GUEST_KEY;
}

export async function loadAppSettings(userEmail?: string): Promise<AppSettings> {
  const key = getSettingsKey(userEmail);
  const settingsMap = await loadSettingsMap();
  return settingsMap[key] || DEFAULT_APP_SETTINGS;
}

export async function saveAppSettings(settings: AppSettings, userEmail?: string) {
  const key = getSettingsKey(userEmail);
  const settingsMap = await loadSettingsMap();
  settingsMap[key] = settings;
  await saveSettingsMap(settingsMap);
}
