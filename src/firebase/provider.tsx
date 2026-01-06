
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * Ensures the user profile document exists in Firestore.
 * This is crucial for security rules that check against the user document.
 * @param firestoreInstance The Firestore instance.
 * @param user The authenticated user.
 */
const ensureUserProfileExists = async (firestoreInstance: Firestore, user: User) => {
  if (!user?.uid) return;
  const userDocRef = doc(firestoreInstance, 'users', user.uid);

  try {
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        await setDoc(userDocRef, { email: user.email || `anonymous_${user.uid}@example.com` }, { merge: true });
    }
  } catch (e) {
    console.error("FirebaseProvider: Failed to ensure user profile exists.", e);
    throw e;
  }
};


/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    // This flag helps prevent race conditions during the auth flow.
    let isSubscribed = true; 
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isSubscribed) return;

      try {
        if (firebaseUser) {
          // A user is logged in. Check if they are anonymous.
          if (firebaseUser.isAnonymous) {
            // Correct state: User is anonymous.
            await ensureUserProfileExists(firestore, firebaseUser);
            setUser(firebaseUser);
            setUserError(null);
            setIsUserLoading(false);
          } else {
            // Incorrect state: User is NOT anonymous. Sign them out.
            // This will trigger onAuthStateChanged again with a null user.
            await signOut(auth);
          }
        } else {
          // No user is logged in. Sign in anonymously.
          // This will trigger onAuthStateChanged again with the new anonymous user.
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("FirebaseProvider: Auth state error:", error);
        setUser(null);
        setUserError(error as Error);
        setIsUserLoading(false);
      }
    }, (error) => {
        if (!isSubscribed) return;
        console.error("FirebaseProvider: onAuthStateChanged listener error:", error);
        setUser(null);
        setUserError(error);
        setIsUserLoading(false);
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    return {
      firebaseApp,
      firestore,
      auth,
      user,
      isUserLoading,
      userError,
    };
  }, [firebaseApp, firestore, auth, user, isUserLoading, userError]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

const useFirebaseContext = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebaseContext must be used within a FirebaseProvider.');
  }
  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebaseContext();
  if (!auth) throw new Error('Firebase Auth not available.');
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebaseContext();
  if (!firestore) throw new Error('Firebase Firestore not available.');
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebaseContext();
  if (!firebaseApp) throw new Error('Firebase App not available.');
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  if(!('__memo' in memoized)) {
    try {
     (memoized as MemoFirebase<T>).__memo = true;
    } catch {}
  }
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebaseContext();
  return { user, isUserLoading, userError };
};
