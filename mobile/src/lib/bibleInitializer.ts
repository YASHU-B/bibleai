import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { saveOfflineBibleChapter } from './offlineBibleData';
import { parseBooksCSV, parseVersesCSV, calculateChapterCounts } from './csvBibleLoader';
import { Book, Verse } from './bibleData';
import * as FileSystem from 'expo-file-system/legacy';

const BIBLE_INITIALIZED_KEY = 'bible-offline-initialized';
const BIBLE_VERSION_KEY = 'bible-offline-version';
const BIBLE_INIT_STARTED_KEY = 'bible-offline-initializing';
const CURRENT_BIBLE_VERSION = '1.0'; // Increment if Bible data changes

interface BibleLoadProgress {
  booksLoaded: number;
  chaptersLoaded: number;
  totalChapters: number;
  isComplete: boolean;
}

/**
 * Check if Bible data has already been initialized
 */
export async function isBibleInitialized(): Promise<boolean> {
  try {
    const initialized = await AsyncStorage.getItem(BIBLE_INITIALIZED_KEY);
    const version = await AsyncStorage.getItem(BIBLE_VERSION_KEY);

    return initialized === 'true' && version === CURRENT_BIBLE_VERSION;
  } catch (error) {
    console.warn('Error checking Bible initialization status:', error);
    return false;
  }
}

/**
 * Load CSV files from app assets
 */
async function loadAssetText(moduleReference: any): Promise<string> {
  const asset = Asset.fromModule(moduleReference);
  await asset.downloadAsync();
  const uri = asset.localUri ?? asset.uri;
  if (!uri) {
    throw new Error('Asset URI unavailable');
  }
  if (uri.startsWith('http://') || uri.startsWith('https://')) {
    const response = await fetch(uri);
    return await response.text();
  }
  return await FileSystem.readAsStringAsync(uri);
}

async function loadCSVFiles(): Promise<{ booksCSV: string; versesCSV: string }> {
  try {
    // Load books CSV
    const booksPath = `${FileSystem.bundleDirectory}data/books.csv`;
    let booksCSV: string;

    try {
      booksCSV = await FileSystem.readAsStringAsync(booksPath);
    } catch (error) {
      console.info('Bundle path failed for books CSV, trying asset fallback');
      try {
        booksCSV = await loadAssetText(require('../../data/books.csv') as any);
      } catch (assetError) {
        console.info('Asset fallback failed for books CSV, trying web/static fetch');
        const asset = Asset.fromModule(require('../../data/books.csv'));
        if (asset.uri && (asset.uri.startsWith('http') || asset.uri.startsWith('https'))) {
          booksCSV = await fetch(asset.uri).then(r => r.text());
        } else {
          throw new Error('Books CSV fallback failed: no valid URL');
        }
      }
    }

    // Load verses CSV
    const versesPath = `${FileSystem.bundleDirectory}data/verses.csv`;
    let versesCSV: string;

    try {
      versesCSV = await FileSystem.readAsStringAsync(versesPath);
    } catch (error) {
      console.info('Bundle path failed for verses CSV, trying asset fallback');
      try {
        versesCSV = await loadAssetText(require('../../data/verses.csv') as any);
      } catch (assetError) {
        console.info('Asset fallback failed for verses CSV, trying web/static fetch');
        const asset = Asset.fromModule(require('../../data/verses.csv'));
        if (asset.uri && (asset.uri.startsWith('http') || asset.uri.startsWith('https'))) {
          versesCSV = await fetch(asset.uri).then(r => r.text());
        } else {
          throw new Error('Verses CSV fallback failed: no valid URL');
        }
      }
    }

    return { booksCSV, versesCSV };
  } catch (error) {
    console.error('Failed to load CSV files:', error);
    throw new Error('Could not load Bible CSV files from app bundle');
  }
}

/**
 * Initialize offline Bible from CSV data
 * This loads the entire Bible and caches all chapters for offline access
 * Should be called once on app startup
 */
export async function initializeOfflineBible(
  onProgress?: (progress: BibleLoadProgress) => void
): Promise<void> {
  try {
    // Mark initialization started so UI can show progress
    try {
      await AsyncStorage.setItem(BIBLE_INIT_STARTED_KEY, 'true');
    } catch (e) {
      // non-fatal
    }
    // Check if already initialized
    const alreadyInitialized = await isBibleInitialized();
    if (alreadyInitialized) {
      console.log('Offline Bible already initialized');
      onProgress?.({
        booksLoaded: 66,
        chaptersLoaded: 1189,
        totalChapters: 1189,
        isComplete: true,
      });
      return;
    }

    console.log('Starting Bible offline initialization...');

    // Load CSV files
    const { booksCSV, versesCSV } = await loadCSVFiles();

    // Parse books and verses
    const books = await parseBooksCSV(booksCSV);
    const versesMap = await parseVersesCSV(versesCSV);

    // Calculate chapter counts
    const booksWithChapters = calculateChapterCounts(books, versesMap);

    const totalChapters = versesMap.size;
    let chaptersLoaded = 0;
    const batchSize = 50;

    console.log(`Loading ${totalChapters} chapters into offline cache in batches...`);

    const mapEntries = Array.from(versesMap.entries());
    for (let i = 0; i < mapEntries.length; i += batchSize) {
      const chunk = mapEntries.slice(i, i + batchSize);
      
      await Promise.all(
        chunk.map(async ([key, verses]) => {
          if (verses.length === 0) return;
          const [bookId, chapter] = key.split('-').map(Number);
          try {
            await saveOfflineBibleChapter(bookId, chapter, verses);
          } catch (error) {
            console.warn(`Failed to cache chapter ${bookId}:${chapter}:`, error);
          }
        })
      );

      chaptersLoaded += chunk.length;

      onProgress?.({
        booksLoaded: books.length,
        chaptersLoaded: Math.min(chaptersLoaded, totalChapters),
        totalChapters,
        isComplete: false,
      });

      // Yield to main thread briefly
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    // Mark initialization as complete
    await AsyncStorage.multiSet([
      [BIBLE_INITIALIZED_KEY, 'true'],
      [BIBLE_VERSION_KEY, CURRENT_BIBLE_VERSION],
    ]);

    // Clear initializing flag
    try {
      await AsyncStorage.removeItem(BIBLE_INIT_STARTED_KEY);
    } catch (e) {
      // ignore
    }

    console.log(`✅ Bible offline initialization complete: ${chaptersLoaded}/${totalChapters} chapters cached`);

    onProgress?.({
      booksLoaded: books.length,
      chaptersLoaded,
      totalChapters,
      isComplete: true,
    });
  } catch (error) {
    console.error('Failed to initialize offline Bible:', error);
    // Ensure initializing flag is cleared on failure
    try {
      await AsyncStorage.removeItem(BIBLE_INIT_STARTED_KEY);
    } catch (e) {
      // ignore
    }
    throw error;
  }
}

/**
 * Returns true when initialization has been started and not yet finished
 */
export async function isBibleInitializing(): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(BIBLE_INIT_STARTED_KEY);
    return v === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * Reset Bible initialization (useful for debugging/testing)
 */
export async function resetBibleInitialization(): Promise<void> {
  try {
    await AsyncStorage.removeItem(BIBLE_INITIALIZED_KEY);
    await AsyncStorage.removeItem(BIBLE_VERSION_KEY);
    console.log('Bible initialization reset');
  } catch (error) {
    console.error('Failed to reset Bible initialization:', error);
  }
}

/**
 * Get initialization status with details
 */
export async function getBibleInitializationStatus(): Promise<{
  initialized: boolean;
  version: string | null;
  lastInitTime: string | null;
}> {
  try {
    const initialized = await AsyncStorage.getItem(BIBLE_INITIALIZED_KEY);
    const version = await AsyncStorage.getItem(BIBLE_VERSION_KEY);
    const lastInitTime = await AsyncStorage.getItem('bible-init-time');

    return {
      initialized: initialized === 'true',
      version,
      lastInitTime,
    };
  } catch (error) {
    console.error('Failed to get Bible initialization status:', error);
    return {
      initialized: false,
      version: null,
      lastInitTime: null,
    };
  }
}
