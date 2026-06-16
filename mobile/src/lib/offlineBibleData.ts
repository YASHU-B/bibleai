import { Verse, Book } from './bibleData';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';
const OFFLINE_BIBLE_CACHE_DIR = `${FileSystem.documentDirectory ?? ''}offline-bible/`;
const OFFLINE_BIBLE_KEY = 'offline-bible-data';
const OFFLINE_BIBLE_TIMESTAMP = 'offline-bible-timestamp';

interface OfflineBibleData {
  verses: Map<string, Verse[]>;
  books: Book[];
  lastUpdated: number;
}

let cachedBibleData: OfflineBibleData | null = null;

async function ensureBibleCacheDir() {
  if (isWeb) {
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(OFFLINE_BIBLE_CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(OFFLINE_BIBLE_CACHE_DIR, { intermediates: true });
    }
  } catch (error) {
    console.warn('Failed to ensure Bible cache directory:', error);
  }
}

/**
 * Load offline Bible data for a specific chapter
 * Returns verses from cache or bundled data
 */
export async function loadOfflineBibleChapter(
  bookId: number,
  chapter: number,
  bundledVerses: Verse[]
): Promise<Verse[]> {
  try {
    // First try to get from memory cache
    const cacheKey = `${bookId}-${chapter}`;
    
    if (cachedBibleData?.verses.has(cacheKey)) {
      return cachedBibleData.verses.get(cacheKey) || bundledVerses;
    }

    // Try to load from file system
    if (!isWeb) {
      await ensureBibleCacheDir();
      const filePath = `${OFFLINE_BIBLE_CACHE_DIR}${bookId}-${chapter}.json`;
      
      try {
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          const raw = await FileSystem.readAsStringAsync(filePath);
          const verses = JSON.parse(raw) as Verse[];
          
          if (!cachedBibleData) {
            cachedBibleData = {
              verses: new Map(),
              books: [],
              lastUpdated: Date.now()
            };
          }
          cachedBibleData.verses.set(cacheKey, verses);
          
          return verses;
        }
      } catch (error) {
        console.warn(`Failed to load chapter ${bookId}:${chapter} from file:`, error);
      }
    } else {
      // Web: try localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = window.localStorage.getItem(cacheKey);
          if (raw) {
            return JSON.parse(raw) as Verse[];
          }
        }
      } catch (error) {
        console.warn('Failed to load chapter from localStorage:', error);
      }
    }

    // Fallback to bundled verses
    return bundledVerses;
  } catch (error) {
    console.warn('Error loading offline Bible chapter:', error);
    return bundledVerses;
  }
}

/**
 * Save a chapter to offline storage for later access
 */
export async function saveOfflineBibleChapter(
  bookId: number,
  chapter: number,
  verses: Verse[]
) {
  if (verses.length === 0) return;

  try {
    const cacheKey = `${bookId}-${chapter}`;

    // Update memory cache
    if (!cachedBibleData) {
      cachedBibleData = {
        verses: new Map(),
        books: [],
        lastUpdated: Date.now()
      };
    }
    cachedBibleData.verses.set(cacheKey, verses);

    // Save to file system
    if (!isWeb) {
      await ensureBibleCacheDir();
      const filePath = `${OFFLINE_BIBLE_CACHE_DIR}${bookId}-${chapter}.json`;
      
      try {
        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(verses));
      } catch (error) {
        console.warn(`Failed to save chapter ${bookId}:${chapter} to file:`, error);
      }
    } else {
      // Web: save to localStorage
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(cacheKey, JSON.stringify(verses));
        }
      } catch (error) {
        console.warn('Failed to save chapter to localStorage:', error);
      }
    }
  } catch (error) {
    console.warn('Error saving offline Bible chapter:', error);
  }
}

/**
 * Check if a chapter is cached offline
 */
export async function isChapterCachedOffline(bookId: number, chapter: number): Promise<boolean> {
  try {
    const cacheKey = `${bookId}-${chapter}`;

    // Check memory cache first
    if (cachedBibleData?.verses.has(cacheKey)) {
      return true;
    }

    // Check file system
    if (!isWeb) {
      const filePath = `${OFFLINE_BIBLE_CACHE_DIR}${bookId}-${chapter}.json`;
      const info = await FileSystem.getInfoAsync(filePath);
      return info.exists;
    }

    // Check localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(cacheKey) !== null;
    }

    return false;
  } catch (error) {
    console.warn('Error checking if chapter is cached:', error);
    return false;
  }
}

/**
 * Clear all offline Bible cache
 */
export async function clearOfflineBibleCache() {
  try {
    // Clear memory cache
    cachedBibleData = null;

    // Clear file system cache
    if (!isWeb) {
      try {
        await FileSystem.deleteAsync(OFFLINE_BIBLE_CACHE_DIR, { idempotent: true });
      } catch (error) {
        console.warn('Failed to clear file system cache:', error);
      }
    } else {
      // Clear localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        keys.forEach(key => {
          if (key.startsWith('offline-bible-') || key.match(/^\d+-\d+$/)) {
            window.localStorage.removeItem(key);
          }
        });
      }
    }
  } catch (error) {
    console.warn('Error clearing offline Bible cache:', error);
  }
}

/**
 * Get cache statistics
 */
export async function getOfflineBibleCacheStats() {
  try {
    let cacheSize = 0;
    let chapterCount = 0;

    if (!isWeb) {
      try {
        const files = await FileSystem.readDirectoryAsync(OFFLINE_BIBLE_CACHE_DIR);
        chapterCount = files.length;

        for (const file of files) {
          const filePath = `${OFFLINE_BIBLE_CACHE_DIR}${file}`;
          const info = await FileSystem.getInfoAsync(filePath);
          if (info.exists) {
            // Estimate size from file (in bytes)
            cacheSize += (info.size as any) || 0;
          }
        }
      } catch (error) {
        // Cache directory doesn't exist yet
      }
    } else {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keys = Object.keys(window.localStorage);
        const bibleKeys = keys.filter(key => key.match(/^\d+-\d+$/));
        chapterCount = bibleKeys.length;

        // Rough estimate of size
        bibleKeys.forEach(key => {
          const value = window.localStorage.getItem(key) || '';
          cacheSize += value.length;
        });
      }
    }

    return {
      chapterCount,
      cacheSizeBytes: cacheSize,
      cacheSizeKB: (cacheSize / 1024).toFixed(2)
    };
  } catch (error) {
    console.warn('Error getting cache stats:', error);
    return { chapterCount: 0, cacheSizeBytes: 0, cacheSizeKB: '0' };
  }
}
