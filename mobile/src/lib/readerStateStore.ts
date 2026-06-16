import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const isWeb = Platform.OS === 'web';
const STORAGE_DIR = `${FileSystem.documentDirectory ?? ''}reader-state/`;
const READER_STATE_PREFIX = 'bible-ai-reader-state-';

export interface ReaderPosition {
  bookId: number;
  chapter: number;
  verse?: number;
  updatedAt: string;
}

function getReaderStateStorageKey(email: string) {
  return `${READER_STATE_PREFIX}${email.toLowerCase().trim()}`;
}

function getReaderStateFilePath(email: string) {
  return `${STORAGE_DIR}${encodeURIComponent(email.toLowerCase().trim())}.json`;
}

async function ensureStorageDir() {
  if (isWeb) return;
  const info = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
}

function readWebData(key: string) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReaderPosition;
  } catch {
    return null;
  }
}

function writeWebData(key: string, value: ReaderPosition) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function loadReaderPosition(email: string): Promise<ReaderPosition | null> {
  if (!email) return null;
  const normalizedEmail = email.toLowerCase().trim();
  if (isWeb) {
    return readWebData(getReaderStateStorageKey(normalizedEmail));
  }

  await ensureStorageDir();
  const filePath = getReaderStateFilePath(normalizedEmail);
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) return null;

  try {
    const raw = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(raw) as ReaderPosition;
  } catch (err) {
    console.warn('readerStateStore: failed to read reader position', err);
    return null;
  }
}

export async function saveReaderPosition(email: string, position: ReaderPosition) {
  if (!email) return;
  const normalizedEmail = email.toLowerCase().trim();
  if (isWeb) {
    writeWebData(getReaderStateStorageKey(normalizedEmail), position);
    return;
  }

  await ensureStorageDir();
  const filePath = getReaderStateFilePath(normalizedEmail);
  try {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(position));
  } catch (err) {
    console.warn('readerStateStore: failed to save reader position', err);
  }
}
