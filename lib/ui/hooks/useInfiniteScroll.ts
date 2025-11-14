import { useEffect, useRef, useState } from 'react';

type Options = {
  threshold?: number;
  disabled?: boolean;
  root?: HTMLElement | null;
  debounceMs?: number;
};

export function useInfiniteScroll(onReach: () => void, opts: Options = {}) {
  const { threshold = 0.8, disabled = false, root = null, debounceMs = 250 } = opts;
  const [loading, setLoading] = useState(false);
  const lastCallRef = useRef(0);

  useEffect(() => {
    if (disabled) return;
    const target = root ?? (typeof window !== 'undefined' ? window : null);
    if (!target) return;
    const handle = () => {
      const now = Date.now();
      if (now - lastCallRef.current < debounceMs) return;
      const scrollTop = root ? (root as HTMLElement).scrollTop : window.scrollY;
      const viewportHeight = root ? (root as HTMLElement).clientHeight : window.innerHeight;
      const scrollHeight = root
        ? (root as HTMLElement).scrollHeight
        : document.documentElement.scrollHeight;
      const ratio = (scrollTop + viewportHeight) / scrollHeight;
      if (ratio >= threshold && !loading) {
        lastCallRef.current = now;
        setLoading(true);
        Promise.resolve(onReach()).finally(() => setLoading(false));
      }
    };
    const optsListener: any = { passive: true };
    target.addEventListener('scroll', handle, optsListener);
    return () => {
      target.removeEventListener('scroll', handle, optsListener);
    };
  }, [threshold, disabled, root, debounceMs, onReach, loading]);

  return { loading };
}
