const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;

const IDENTITY_BASE = 'https://identitytoolkit.googleapis.com/v1';

function requireApiKey() {
  if (!apiKey) {
    throw new Error('Firebase API key is not configured.');
  }
  return apiKey;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(apiKey);
}

async function parseFirebaseError(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    return payload.error?.message || response.statusText || 'Firebase auth failed';
  } catch {
    return response.statusText || 'Firebase auth failed';
  }
}

export async function firebaseSignUp(email: string, password: string) {
  const key = requireApiKey();
  const url = `${IDENTITY_BASE}/accounts:signUp?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    throw new Error(await parseFirebaseError(response));
  }

  const payload = await response.json();
  if (!payload.email) {
    throw new Error('Firebase sign-up failed.');
  }

  return {
    email: payload.email,
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    emailVerified: payload.emailVerified,
  };
}

export async function firebaseSignIn(email: string, password: string) {
  const key = requireApiKey();
  const url = `${IDENTITY_BASE}/accounts:signInWithPassword?key=${encodeURIComponent(key)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) {
    throw new Error(await parseFirebaseError(response));
  }

  const payload = await response.json();
  if (!payload.email) {
    throw new Error('Firebase sign-in failed.');
  }

  if (payload.emailVerified === false) {
    throw new Error('Please verify your email before signing in.');
  }

  return {
    email: payload.email,
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    emailVerified: payload.emailVerified,
  };
}

export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
  );
}

export async function firebaseSignInWithGoogle(idToken: string, accessToken?: string) {
  const key = requireApiKey();
  const url = `${IDENTITY_BASE}/accounts:signInWithIdp?key=${encodeURIComponent(key)}`;
  const postBodyParts = [`id_token=${encodeURIComponent(idToken)}`, `providerId=google.com`];
  if (accessToken) {
    postBodyParts.push(`access_token=${encodeURIComponent(accessToken)}`);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requestUri: 'http://localhost',
      postBody: postBodyParts.join('&'),
      returnIdpCredential: true,
      returnSecureToken: true,
    }),
  });

  if (!response.ok) {
    throw new Error(await parseFirebaseError(response));
  }

  const payload = await response.json();
  if (!payload.email) {
    throw new Error('Firebase Google sign-in failed.');
  }

  return {
    email: payload.email,
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    emailVerified: payload.emailVerified,
    providerId: payload.providerId || 'google.com',
  };
}

export async function firebaseSignOut() {
  return Promise.resolve();
}

export function onAuthStateChange(_callback: (user: unknown) => void) {
  // Firebase REST sign-in does not provide a real auth listener.
  // The app uses local session persistence instead.
  return () => {};
}
