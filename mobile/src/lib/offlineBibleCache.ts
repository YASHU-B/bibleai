import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { Verse } from './bibleData';

const isWeb = Platform.OS === 'web';
const CACHE_DIR = `${FileSystem.documentDirectory ?? ''}bible-cache/`;

const getWebCacheKey = (bookId: number, chapter: number) => `bible-cache-${bookId}-${chapter}`;

export async function ensureBibleCacheDir() {
  if (isWeb) {
    return;
  }

  const info = await FileSystem.getInfoAsync(CACHE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
  }
}

export async function saveChapterOffline(bookId: number, chapter: number, verses: Verse[]) {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(getWebCacheKey(bookId, chapter), JSON.stringify(verses));
      }
    } catch (error) {
      console.warn('Web offline cache save failed:', error);
    }
    return;
  }

  await ensureBibleCacheDir();
  await FileSystem.writeAsStringAsync(
    `${CACHE_DIR}${bookId}-${chapter}.json`,
    JSON.stringify(verses)
  );
}

export async function loadChapterOffline(bookId: number, chapter: number) {
  if (isWeb) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(getWebCacheKey(bookId, chapter));
        return raw ? (JSON.parse(raw) as Verse[]) : null;
      }
    } catch (error) {
      console.warn('Web offline cache load failed:', error);
    }
    return null;
  }

  const path = `${CACHE_DIR}${bookId}-${chapter}.json`;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) return null;

  const raw = await FileSystem.readAsStringAsync(path);
  return JSON.parse(raw) as Verse[];
}
