import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const isWeb = Platform.OS === 'web';
const STORAGE_DIR = `${FileSystem.documentDirectory ?? ''}bookmarks/`;
const BOOKMARKS_PREFIX = 'bible-ai-bookmarks-';

interface WebBookmarkStorage {
  [key: string]: Bookmark[];
}

export interface Bookmark {
  id: string;
  bookId?: number;
  chapter?: number;
  verse?: number;
  content: string;
  createdAt: string;
}

function getBookmarkStorageKey(email?: string) {
  const keyId = email && email.trim() ? email.toLowerCase().trim() : 'local';
  return `${BOOKMARKS_PREFIX}${keyId}`;
}

function getBookmarkFilePath(email?: string) {
  const fileId = email && email.trim() ? encodeURIComponent(email.toLowerCase().trim()) : 'local';
  return `${STORAGE_DIR}${fileId}.json`;
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
    return JSON.parse(raw) as Bookmark[];
  } catch {
    return null;
  }
}

function writeWebData(key: string, value: Bookmark[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export async function loadBookmarks(email?: string): Promise<Bookmark[]> {
  const normalizedEmail = email && email.trim() ? email.toLowerCase().trim() : undefined;
  if (isWeb) {
    return readWebData(getBookmarkStorageKey(normalizedEmail)) || [];
  }

  await ensureStorageDir();
  const filePath = getBookmarkFilePath(normalizedEmail);
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) return [];

  try {
    const raw = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(raw) as Bookmark[];
  } catch (err) {
    console.warn('bookmarkStore: failed to read bookmarks', err);
    return [];
  }
}

export async function saveBookmarks(email: string | undefined, bookmarks: Bookmark[]) {
  const normalizedEmail = email && email.trim() ? email.toLowerCase().trim() : undefined;
  if (isWeb) {
    writeWebData(getBookmarkStorageKey(normalizedEmail), bookmarks);
    return;
  }

  await ensureStorageDir();
  const filePath = getBookmarkFilePath(normalizedEmail);
  try {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(bookmarks));
  } catch (err) {
    console.warn('bookmarkStore: failed to save bookmarks', err);
  }
}

export async function addBookmark(
  emailOrContent: string | undefined,
  contentOrUndefined?: string,
  bookId?: number,
  chapter?: number,
  verse?: number,
): Promise<Bookmark[]> {
  // Support both signatures: addBookmark(content) and addBookmark(email, content,...)
  let email: string | undefined;
  let content: string | undefined;

  if (contentOrUndefined === undefined) {
    // Called as addBookmark(content)
    email = undefined;
    content = emailOrContent as string | undefined;
  } else {
    email = emailOrContent as string | undefined;
    content = contentOrUndefined as string | undefined;
  }

  if (!content || !content.trim()) return [];
  const normalizedEmail = email && email.trim() ? email.toLowerCase().trim() : undefined;
  const existing = await loadBookmarks(normalizedEmail);
  const hasSameContent = existing.some(
    bookmark => bookmark.content === content && bookmark.bookId === bookId && bookmark.chapter === chapter && bookmark.verse === verse,
  );
  if (hasSameContent) {
    return existing;
  }

  const newBookmark: Bookmark = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    bookId,
    chapter,
    verse,
    content,
    createdAt: new Date().toISOString(),
  };

  const nextBookmarks = [newBookmark, ...existing];
  await saveBookmarks(normalizedEmail, nextBookmarks);
  return nextBookmarks;
}

export async function removeBookmark(emailOrId: string | undefined, idOrUndefined?: string): Promise<Bookmark[]> {
  // Support removeBookmark(id) and removeBookmark(email, id)
  let email: string | undefined;
  let id: string | undefined;
  if (idOrUndefined === undefined) {
    email = undefined;
    id = emailOrId as string | undefined;
  } else {
    email = emailOrId as string | undefined;
    id = idOrUndefined as string | undefined;
  }

  if (!id) return [];
  const normalizedEmail = email && email.trim() ? email.toLowerCase().trim() : undefined;
  const existing = await loadBookmarks(normalizedEmail);
  const filtered = existing.filter(bookmark => bookmark.id !== id);
  await saveBookmarks(normalizedEmail, filtered);
  return filtered;
}
