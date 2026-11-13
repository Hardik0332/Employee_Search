/**
 * Generic debounce hook.
 *
 * Returns a value that only updates after the user stops
 * changing it for `delay` ms. This prevents firing an API
 * call on every single keystroke.
 *
 * How it works:
 *  - Every time `value` changes, we start a timer.
 *  - If `value` changes again before the timer fires,
 *    we cancel the old timer and start a new one.
 *  - Only when the user pauses for `delay` ms does the
 *    debounced value actually update.
 */

import { useState, useEffect } from "react";

export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    // Cleanup: cancel the timer if value changes before it fires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

