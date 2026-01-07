
'use client';

import { useState, useEffect } from 'react';
import {
  Query,
  onSnapshot,
  DocumentData,
  FirestoreError,
  QuerySnapshot,
  CollectionReference,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export type WithId<T> = T & { id: string };

export interface UseCollectionResult<T> {
  data: WithId<T>[] | null;
  isLoading: boolean;
  error: FirestoreError | Error | null;
}

export function useCollection<T = any>(
    memoizedTargetRefOrQuery: ((CollectionReference<DocumentData> | Query<DocumentData>) & {__memo?: boolean})  | null | undefined,
): UseCollectionResult<T> {
  type ResultItemType = WithId<T>;
  type StateDataType = ResultItemType[] | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<FirestoreError | Error | null>(null);
  
  useEffect(() => {
    if (!memoizedTargetRefOrQuery) {
      setIsLoading(false);
      setData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = onSnapshot(
      memoizedTargetRefOrQuery,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const results: ResultItemType[] = [];
        for (const doc of snapshot.docs) {
          results.push({ ...(doc.data() as T), id: doc.id });
        }
        setData(results);
        setError(null);
        setIsLoading(false);
      },
      (error: FirestoreError) => {
        // Simplified error handling.
        // The original implementation had a bug trying to access a path that might not exist.
        console.error("useCollection error:", error);
        setError(error);
        setData(null);
        setIsLoading(false);

        // Optionally, you can still emit a generic permission error if you want to use the global handler
        if (error.code === 'permission-denied') {
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: 'path' in memoizedTargetRefOrQuery ? memoizedTargetRefOrQuery.path : 'unknown path',
            });
            errorEmitter.emit('permission-error', contextualError);
        }
      }
    );

    return () => unsubscribe();
  }, [memoizedTargetRefOrQuery]);

  if(memoizedTargetRefOrQuery && !memoizedTargetRefOrQuery.__memo) {
    throw new Error('Query was not properly memoized using useMemoFirebase. This can cause infinite loops.');
  }
  
  return { data, isLoading, error };
}
