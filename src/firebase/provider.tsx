
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
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
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true); // Start as true
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
  
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!isMounted) return;
  
      if (currentUser) {
        setUser(currentUser);
        setUserError(null);
        setIsUserLoading(false);
      } else {
        // This small delay gives Firebase time to restore a potential existing session.
        setTimeout(async () => {
          if (!isMounted || auth.currentUser) {
            // If another auth event already fired and set a user, or if component unmounted, do nothing.
            if(auth.currentUser && !user) {
              setUser(auth.currentUser);
              setIsUserLoading(false);
            }
            return;
          }
  
          try {
            await signInAnonymously(auth);
            // The onAuthStateChanged listener will be re-triggered by signInAnonymously,
            // which will then set the user and update loading state.
          } catch (error) {
            console.error("FirebaseProvider: Anonymous sign-in failed.", error);
            if (isMounted) {
              setUserError(error as Error);
              setUser(null);
              setIsUserLoading(false);
            }
          }
        }, 500); // 500ms delay to wait for session restoration
      }
    }, (error) => {
      console.error("FirebaseProvider: Auth listener error", error);
      if (isMounted) {
        setUserError(error);
        setUser(null);
        setIsUserLoading(false);
      }
    });
  
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [auth, user]);
  

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

    

    