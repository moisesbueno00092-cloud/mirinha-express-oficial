
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function usePersistentState<T>(key: string, initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(initialState);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let storedValue: T;
    try {
      const item = window.localStorage.getItem(key);
      storedValue = item ? JSON.parse(item) : initialState;
    } catch (error) {
      console.error(error);
      storedValue = initialState;
    }
    setState(storedValue);
    setIsInitialized(true);
  }, [key, initialState]);

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
