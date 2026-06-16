import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const isWeb = Platform.OS === 'web';
const STORAGE_DIR = `${FileSystem.documentDirectory ?? ''}prayer-requests/`;
const PRAYER_REQUEST_PREFIX = 'bible-ai-prayer-requests-';

export interface PrayerRequest {
  id: string;
  content: string;
  createdAt: string;
  prayCount: number;
  userEmail?: string;
  hasAmen?: boolean;
}

function getPrayerRequestStorageKey(email: string) {
  return `${PRAYER_REQUEST_PREFIX}${email.toLowerCase().trim()}`;
}

function getPrayerRequestAmenStorageKey(email: string) {
  return `${PRAYER_REQUEST_PREFIX}${email.toLowerCase().trim()}-amens`;
}

function getPrayerRequestFilePath(email: string) {
  return `${STORAGE_DIR}${encodeURIComponent(email.toLowerCase().trim())}.json`;
}

function getPrayerRequestAmenFilePath(email: string) {
  return `${STORAGE_DIR}${encodeURIComponent(email.toLowerCase().trim())}-amens.json`;
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
    return JSON.parse(raw) as PrayerRequest[];
  } catch {
    return null;
  }
}

function writeWebData(key: string, value: PrayerRequest[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function readWebAmenData(key: string) {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const raw = window.localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return null;
  }
}

function writeWebAmenData(key: string, value: string[]) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

async function loadLocalPrayerRequestAmenIds(email: string): Promise<string[]> {
  if (!email) return [];
  const normalizedEmail = email.toLowerCase().trim();
  if (isWeb) {
    return readWebAmenData(getPrayerRequestAmenStorageKey(normalizedEmail)) || [];
  }

  await ensureStorageDir();
  const filePath = getPrayerRequestAmenFilePath(normalizedEmail);
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) return [];

  try {
    const raw = await FileSystem.readAsStringAsync(filePath);
    return JSON.parse(raw) as string[];
  } catch (err) {
    console.warn('prayerRequestStore: failed to read Amen ids', err);
    return [];
  }
}

async function saveLocalPrayerRequestAmenIds(email: string, amenIds: string[]) {
  if (!email) return;
  const normalizedEmail = email.toLowerCase().trim();
  if (isWeb) {
    writeWebAmenData(getPrayerRequestAmenStorageKey(normalizedEmail), amenIds);
    return;
  }

  await ensureStorageDir();
  const filePath = getPrayerRequestAmenFilePath(normalizedEmail);
  try {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(amenIds));
  } catch (err) {
    console.warn('prayerRequestStore: failed to save Amen ids', err);
  }
}

async function loadLocalPrayerRequests(email: string, amenIds: string[] = []): Promise<PrayerRequest[]> {
  if (!email) return [];
  const normalizedEmail = email.toLowerCase().trim();
  if (isWeb) {
    const stored = readWebData(getPrayerRequestStorageKey(normalizedEmail)) || [];
    return stored.map(request => ({ ...request, hasAmen: amenIds.includes(request.id) }));
  }

  await ensureStorageDir();
  const filePath = getPrayerRequestFilePath(normalizedEmail);
  const info = await FileSystem.getInfoAsync(filePath);
  if (!info.exists) return [];

  try {
    const raw = await FileSystem.readAsStringAsync(filePath);
    const stored = JSON.parse(raw) as PrayerRequest[];
    return stored.map(request => ({ ...request, hasAmen: amenIds.includes(request.id) }));
  } catch (err) {
    console.warn('prayerRequestStore: failed to read prayer requests', err);
    return [];
  }
}

async function saveLocalPrayerRequests(email: string, prayerRequests: PrayerRequest[]) {
  if (!email) return;
  const normalizedEmail = email.toLowerCase().trim();
  if (isWeb) {
    writeWebData(getPrayerRequestStorageKey(normalizedEmail), prayerRequests);
    return;
  }

  await ensureStorageDir();
  const filePath = getPrayerRequestFilePath(normalizedEmail);
  try {
    await FileSystem.writeAsStringAsync(filePath, JSON.stringify(prayerRequests));
  } catch (err) {
    console.warn('prayerRequestStore: failed to save prayer requests', err);
  }
}

export async function loadPrayerRequests(email?: string): Promise<PrayerRequest[]> {
  const normalizedEmail = email?.toLowerCase().trim();
  if (!normalizedEmail) return [];
  const amenIds = await loadLocalPrayerRequestAmenIds(normalizedEmail);
  return loadLocalPrayerRequests(normalizedEmail, amenIds);
}

// Supabase removed: local-only amen id loader retained above

export async function savePrayerRequests(email: string, prayerRequests: PrayerRequest[]) {
  if (!email) return;
  await saveLocalPrayerRequests(email, prayerRequests);
}

export async function addPrayerRequest(email: string, content: string): Promise<PrayerRequest[]> {
  if (!email || !content.trim()) return [];
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await loadLocalPrayerRequests(normalizedEmail);
  const newPrayer: PrayerRequest = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    content: content.trim(),
    createdAt: new Date().toISOString(),
    prayCount: 0,
    userEmail: normalizedEmail,
  };
  const next = [newPrayer, ...existing];
  await saveLocalPrayerRequests(normalizedEmail, next);
  return next;
}

function isValidUUID(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function addPrayerRequestAmen(requestId: string, userEmail: string): Promise<boolean> {
  if (!requestId || !isValidUUID(requestId)) {
    console.warn('prayerRequestStore: invalid prayer request id for Amen', requestId);
    return false;
  }

  const normalizedEmail = userEmail?.toLowerCase().trim();
  if (!normalizedEmail) {
    console.warn('prayerRequestStore: missing user email for Amen');
    return false;
  }

  const existingAmenIds = await loadLocalPrayerRequestAmenIds(normalizedEmail);
  if (existingAmenIds.includes(requestId)) {
    return false;
  }
  const nextAmenIds = [...existingAmenIds, requestId];
  await saveLocalPrayerRequestAmenIds(normalizedEmail, nextAmenIds);
  return true;
}

// Supabase removed: direct DB insert logic is no longer used; operations are local-only

export async function removePrayerRequest(email: string, id: string): Promise<PrayerRequest[]> {
  if (!email || !id) return [];
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await loadLocalPrayerRequests(normalizedEmail);
  const filtered = existing.filter(pr => pr.id !== id);
  await saveLocalPrayerRequests(normalizedEmail, filtered);
  return filtered;
}
