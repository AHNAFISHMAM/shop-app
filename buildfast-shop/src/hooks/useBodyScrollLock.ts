import { useEffect, useRef } from 'react';

/**
 * Hook to lock/unlock body scroll when modal is open
 * Preserves scroll position and restores it when modal closes
 */
export function useBodyScrollLock(isLocked: boolean): void {
  const scrollOffsetRef = useRef<number>(0);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    if (!body) return;

    const unlock = () => {
      body.classList.remove('modal-open');
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.width = '';
      window.scrollTo(0, scrollOffsetRef.current || 0);
    };

    if (isLocked) {
      scrollOffsetRef.current = window.scrollY || window.pageYOffset || 0;
      body.classList.add('modal-open');
      body.style.overflow = 'hidden';
      body.style.position = 'fixed';
      body.style.top = `-${scrollOffsetRef.current}px`;
      body.style.width = '100%';

      return unlock;
    }

    unlock();
  }, [isLocked]);
}

