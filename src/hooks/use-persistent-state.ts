"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function usePersistentState<T>(key: string, initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedValue = window.localStorage.getItem(key);
        if (storedValue !== null) {
          setState(JSON.parse(storedValue));
        }
      } catch (error) {
        console.error(error);
      }
      setIsInitialized(true);
    }
  }, [key]);

  useEffect(() => {
    if (isInitialized) {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, state, isInitialized]);

  return [state, setState];
}

export default usePersistentState;
