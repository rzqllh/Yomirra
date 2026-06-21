import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/shared/store/reader-store';

export function useReaderGesture() {
  const { toggleOverlay } = useReaderStore();
  
  // Gesture-safe overlay toggle (Center 40% tap, <=10px, <=250ms)
  useEffect(() => {
    let pointerState = { startX: 0, startY: 0, time: 0 };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Ignore if clicking on UI elements
      if ((e.target as Element).closest('button, a, [role="button"], .pointer-events-auto')) return;
      
      pointerState = {
        startX: e.clientX,
        startY: e.clientY,
        time: Date.now()
      };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      if ((e.target as Element).closest('button, a, [role="button"], .pointer-events-auto')) return;

      const duration = Date.now() - pointerState.time;
      const deltaX = Math.abs(e.clientX - pointerState.startX);
      const deltaY = Math.abs(e.clientY - pointerState.startY);

      // Strict intent disambiguation
      if (duration <= 250 && deltaX <= 10 && deltaY <= 10) {
        // If there are any active pinches (tracked via a class or data attribute added by reader-image), ignore
        if (document.documentElement.classList.contains('is-pinching')) {
            return;
        }

        const viewportHeight = window.innerHeight;
        const tapY = e.clientY;
        const topBoundary = viewportHeight * 0.3;
        const bottomBoundary = viewportHeight * 0.7;

        // Only toggle if tap is within the center 40%
        if (tapY >= topBoundary && tapY <= bottomBoundary) {
          toggleOverlay();
        }
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [toggleOverlay]);
}
