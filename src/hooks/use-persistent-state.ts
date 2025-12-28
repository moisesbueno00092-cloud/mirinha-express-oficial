
"use client";

import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function usePersistentState<T>(key: string, initialState: T): [T, Dispatch<SetStateAction<T>>] {
  const [isInitialized, setIsInitialized] = useState(false);
  const [state, setState] = useState<T>(initialState);

  useEffect(() => {
    // This effect should only run on the client, after the component has mounted.
    // It's safe to access localStorage here.
    setIsInitialized(true);
    try {
      const item = window.localStorage.getItem(key);
      // Ensure the item is not null, not undefined, and not the string 'undefined'
      if (item && item !== 'undefined') {
        setState(JSON.parse(item));
      }
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      // We can fallback to initialState if there's an error.
      setState(initialState);
    }
  }, [key, initialState]); // The dependencies are correct as they are.

  useEffect(() => {
    // This effect runs whenever 'state' changes, but only after initialization.
    if (isInitialized) {
      try {
        // Prevent storing 'undefined' as a string
        if (state === undefined) {
          window.localStorage.removeItem(key);
        } else {
          window.localStorage.setItem(key, JSON.stringify(state));
        }
      } catch (error) {
        console.error(`Error setting localStorage key “${key}”:`, error);
      }
    }
  }, [key, state, isInitialized]);

  return [state, setState];
}

export default usePersistentState;
