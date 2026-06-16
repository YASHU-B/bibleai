import React, { createContext, useContext, useEffect, useState } from "react";
import { firebaseSignIn, firebaseSignInWithGoogle, firebaseSignUp, firebaseSignOut, isFirebaseConfigured } from "./firebaseClient";
import { loadSession, saveSession, clearSession, LocalSession } from "./localAuthStore";

interface AuthContextType {
  user: LocalSession | null;
  isLoading: boolean;
  isSignedIn: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (idToken: string, accessToken?: string) => Promise<void>;
  signOut: () => Promise<boolean>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        if (__DEV__) console.debug('AuthProvider: initializing, loading session');
        const storedSession = await loadSession();
        if (__DEV__) console.debug('AuthProvider: loaded session', storedSession);
        setUser(storedSession);
      } catch (err) {
        console.error("AuthProvider initialize error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured. Cannot sign up.");
      }
      const firebaseUser = await firebaseSignUp(email, password);
      const normalizedEmail = email.trim().toLowerCase();
      const session = {
        email: firebaseUser.email ?? normalizedEmail,
        signedInAt: new Date().toISOString(),
        isAdmin: false,
      };
      await saveSession(session);
      setUser(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed";
      setError(message);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const normalizedEmail = email.trim().toLowerCase();

      if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured. Cannot sign in.");
      }

      const firebaseUser = await firebaseSignIn(email, password);
      const session: LocalSession = {
        email: firebaseUser.email ?? normalizedEmail,
        signedInAt: new Date().toISOString(),
        isAdmin: false,
      };
      await saveSession(session);
      setUser(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
      throw err;
    }
  };

  const signInWithGoogle = async (idToken: string, accessToken?: string) => {
    try {
      setError(null);
      if (!isFirebaseConfigured()) {
        throw new Error("Firebase is not configured. Cannot sign in with Google.");
      }
      const firebaseUser = await firebaseSignInWithGoogle(idToken, accessToken);
      const normalizedEmail = firebaseUser.email?.toLowerCase() ?? "";
      const session: LocalSession = {
        email: firebaseUser.email ?? normalizedEmail,
        signedInAt: new Date().toISOString(),
        isAdmin: false,
      };
      await saveSession(session);
      setUser(session);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Google sign in failed";
      setError(message);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      if (__DEV__) console.debug('AuthProvider.signOut: start');
      // Attempt Firebase sign-out but don't let it prevent clearing local session
      if (isFirebaseConfigured()) {
        try {
          await firebaseSignOut();
        } catch (fbErr) {
          console.warn('firebaseSignOut failed:', fbErr);
        }
      }

      // Ensure both the generated helper and legacy saver remove any persisted session
      try {
        await clearSession();
        if (__DEV__) console.debug('AuthProvider.signOut: cleared session (clearSession)');
      } catch (err) {
        console.warn('clearSession failed:', err);
      }

      try {
        await saveSession(null);
        if (__DEV__) console.debug('AuthProvider.signOut: cleared session (saveSession null)');
      } catch (err) {
        // best-effort: some runtimes may not support write API
        console.warn('saveSession(null) fallback failed:', err);
      }

      setUser(null);
      if (__DEV__) console.debug('AuthProvider.signOut: finished, user cleared');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed";
      setError(message);
      console.error("signOut error", err);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSignedIn: !!user,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
