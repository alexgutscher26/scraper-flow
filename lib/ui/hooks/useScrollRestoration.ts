import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export function useScrollRestoration(container?: HTMLElement | null) {
  const pathname = usePathname();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const key = `scroll:${pathname}`;
    const restore = () => {
      const raw = sessionStorage.getItem(key);
      const y = raw ? Number(raw) : 0;
      if (container) container.scrollTo({ top: y });
      else window.scrollTo({ top: y });
    };
    const save = () => {
      const y = container ? container.scrollTop : window.scrollY;
      sessionStorage.setItem(key, String(y));
    };
    try {
      (history as any).scrollRestoration = 'manual';
    } catch {}
    restore();
    window.addEventListener('pagehide', save);
    window.addEventListener('beforeunload', save);
    return () => {
      save();
      window.removeEventListener('pagehide', save);
      window.removeEventListener('beforeunload', save);
    };
  }, [pathname, container]);
}
