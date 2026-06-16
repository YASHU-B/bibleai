import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

const isWeb = Platform.OS === 'web';
const STORAGE_DIR = `${FileSystem.documentDirectory ?? ''}auth/`;
const USERS_FILE = `${STORAGE_DIR}users.json`;
const SESSION_FILE = `${STORAGE_DIR}session.json`;
const USERS_KEY = 'bible-ai-users';
const SESSION_KEY = 'bible-ai-session';

export interface LocalUser {
  email: string;
  password: string;
  createdAt: string;
  isAdmin?: boolean;
}

export interface LocalSession {
  email: string;
  signedInAt: string;
  isAdmin?: boolean;
}

async function ensureStorageDir() {
  if (isWeb) return;
  const info = await FileSystem.getInfoAsync(STORAGE_DIR);
  if (!info.exists) {
    console.debug('localAuthStore: creating storage dir', STORAGE_DIR);
    await FileSystem.makeDirectoryAsync(STORAGE_DIR, { intermediates: true });
  }
}

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

export async function loadUsers(): Promise<LocalUser[]> {
  try {
    if (isWeb) {
      return readWebData(USERS_KEY) || [];
    }
    await ensureStorageDir();
    const info = await FileSystem.getInfoAsync(USERS_FILE);
    if (!info.exists) return [];
    const raw = await FileSystem.readAsStringAsync(USERS_FILE);
    return JSON.parse(raw) as LocalUser[];
  } catch (error) {
    console.warn('Failed to load local users:', error);
    return [];
  }
}

export async function saveUsers(users: LocalUser[]) {
  try {
    if (isWeb) {
      writeWebData(USERS_KEY, users);
      return;
    }
    await ensureStorageDir();
    await FileSystem.writeAsStringAsync(USERS_FILE, JSON.stringify(users));
  } catch (error) {
    console.warn('Failed to save local users:', error);
  }
}

export async function loadSession(): Promise<LocalSession | null> {
  try {
    if (isWeb) {
      return readWebData(SESSION_KEY);
    }
    await ensureStorageDir();
    const info = await FileSystem.getInfoAsync(SESSION_FILE);
    if (!info.exists) {
      return null;
    }
    const raw = await FileSystem.readAsStringAsync(SESSION_FILE);
    if (!raw || raw.trim() === '' || raw === '{}') {
      return null;
    }
    const parsed = JSON.parse(raw) as LocalSession;
    if (__DEV__) console.debug('localAuthStore: loaded session', parsed);
    // Check if parsed session is valid
    if (!parsed.email) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.warn('Failed to load local session:', error);
    return null;
  }
}

export async function saveSession(session: LocalSession | null) {
  try {
    if (isWeb) {
      if (session) {
        writeWebData(SESSION_KEY, session);
      } else {
        window.localStorage.removeItem(SESSION_KEY);
      }
      return;
    }
    await ensureStorageDir();
    if (session) {
      await FileSystem.writeAsStringAsync(SESSION_FILE, JSON.stringify(session));
    } else {
      // Remove the session file entirely when logging out.
      await FileSystem.deleteAsync(SESSION_FILE, { idempotent: true });
    }
  } catch (error) {
    console.warn('Failed to save local session:', error);
  }
}

export async function clearSession() {
  try {
    if (isWeb) {
      window.localStorage.removeItem(SESSION_KEY);
      return;
    }
    await ensureStorageDir();
    await FileSystem.deleteAsync(SESSION_FILE, { idempotent: true });
  } catch (error) {
    console.warn('Failed to clear local session:', error);
  }
}

export async function findUserByEmail(email: string) {
  const users = await loadUsers();
  return users.find(user => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function registerLocalUser(email: string, password: string) {
  const existing = await findUserByEmail(email);
  if (existing) {
    throw new Error('User already exists');
  }

  const user: LocalUser = {
    email,
    password,
    createdAt: new Date().toISOString(),
    isAdmin: false,
  };

  const users = await loadUsers();
  users.push(user);
  await saveUsers(users);
  return user;
}

export async function authenticateLocalUser(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (user && user.password === password) {
    return user;
  }

  throw new Error('Invalid email or password');
}
