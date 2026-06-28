import { useEffect } from 'react';

/**
 * Toggles the `.dark` class on <html> based on the user's system color scheme
 * preference (prefers-color-scheme). Re-evaluates when the preference changes.
 */
export function useSystemDarkMode() {
  useEffect(() => {
    const root = document.documentElement;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (isDark) => {
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    apply(mq.matches);

    const handler = (e) => apply(e.matches);
    mq.addEventListener('change', handler);

    return () => mq.removeEventListener('change', handler);
  }, []);
}