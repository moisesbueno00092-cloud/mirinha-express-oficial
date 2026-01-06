
'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
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
      await setDoc(userDocRef, { email: `anonymous_${user.uid}@example.com` }, { merge: true });
    }
  } catch (e) {
    console.error("FirebaseProvider: Failed to ensure user profile exists.", e);
    // Re-throwing allows the caller to handle it.
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
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (currentUser) {
          // If a user is found, ensure it's anonymous before proceeding.
          // This check is crucial to prevent the race condition where a non-anonymous
          // user object is briefly available.
          if (currentUser.isAnonymous) {
            try {
              await ensureUserProfileExists(firestore, currentUser);
              setUser(currentUser);
              setUserError(null);
            } catch (error) {
              console.error("FirebaseProvider: Failed to ensure user profile.", error);
              setUserError(error as Error);
              setUser(null);
            } finally {
              setIsUserLoading(false);
            }
          } else {
            // This path should ideally not be taken in an anon-only app.
            // But if it is, we treat it as a loading state until anon sign-in succeeds.
            console.warn("A non-anonymous user was detected. Attempting to sign in anonymously.");
            setUser(null);
            setIsUserLoading(true);
            signInAnonymously(auth).catch(err => {
                 console.error("FirebaseProvider: Subsequent anonymous sign-in failed.", err);
                 setUserError(err);
                 setIsUserLoading(false);
            });
          }
        } else {
          // No user is signed in, so attempt to sign in anonymously.
          setIsUserLoading(true);
          setUser(null);
          try {
            await signInAnonymously(auth);
            // The onAuthStateChanged listener will be called again with the new
            // anonymous user, so we don't need to set state here. The loading
            // state will resolve in the next run of this listener.
          } catch (error) {
            console.error("FirebaseProvider: Anonymous sign-in failed.", error);
            setUserError(error as Error);
            setIsUserLoading(false);
          }
        }
      },
      (error) => {
        // This handles errors in the auth listener itself.
        console.error("FirebaseProvider: Auth listener error", error);
        setUserError(error);
        setUser(null);
        setIsUserLoading(false);
      }
    );

    // Cleanup the subscription on unmount
    return () => unsubscribe();
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
