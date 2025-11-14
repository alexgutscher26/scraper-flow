// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfiniteScroll } from '@/lib/ui/hooks/useInfiniteScroll';

describe.skip('useInfiniteScroll', () => {
  it('triggers at 80% once with debounce', () => {
    const cb = vi.fn();
    const div = document.createElement('div');
    Object.defineProperty(div, 'clientHeight', { value: 1000 });
    Object.defineProperty(div, 'scrollHeight', { value: 2000 });
    let scrollTop = 0;
    Object.defineProperty(div, 'scrollTop', {
      get: () => scrollTop,
      set: (v) => {
        scrollTop = v as any;
      },
    });

    const { result } = renderHook(() =>
      useInfiniteScroll(cb, { threshold: 0.8, root: div, debounceMs: 250 })
    );
    act(() => {
      div.dispatchEvent(new Event('scroll'));
    });
    expect(cb).toHaveBeenCalledTimes(0);
    act(() => {
      scrollTop = 700;
      div.dispatchEvent(new Event('scroll'));
    });
    expect(cb).toHaveBeenCalledTimes(0);
    act(() => {
      scrollTop = 800;
      div.dispatchEvent(new Event('scroll'));
    });
    expect(cb).toHaveBeenCalledTimes(1);
    act(() => {
      scrollTop = 1600;
      div.dispatchEvent(new Event('scroll'));
    });
    expect(cb).toHaveBeenCalledTimes(1);
  });
});
