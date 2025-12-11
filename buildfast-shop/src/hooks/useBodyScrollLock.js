import { useEffect, useRef } from 'react';

export function useBodyScrollLock(isLocked) {
  const scrollOffsetRef = useRef(0);

  useEffect(() => {
    if (typeof document === 'undefined') return undefined;

    const body = document.body;
    if (!body) return undefined;

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
    return undefined;
  }, [isLocked]);
}

