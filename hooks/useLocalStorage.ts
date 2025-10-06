import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// Fix: Imported Dispatch and SetStateAction and replaced React.Dispatch and React.SetStateAction.
function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  // Fix: Replaced React.Dispatch and React.SetStateAction with imported types.
  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key) {
        try {
          // REAL-TIME SYNCHRONIZATION: When storage changes in another tab (e.g., an asesor updates a lead),
          // this event listener fires, updating the state in the current tab (e.g., the leader's view).
          // This ensures all users see the latest data.
          const item = window.localStorage.getItem(key);
          if (item !== null) {
            setStoredValue(JSON.parse(item));
          } else {
            setStoredValue(initialValue);
          }
        } catch (error) {
          console.log(error);
        }
      }
    };

    // Listen for changes to localStorage from other tabs
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;