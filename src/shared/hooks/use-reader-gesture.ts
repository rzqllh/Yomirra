import { useEffect } from 'react';
import { useReaderStore } from '@/shared/store/reader-store';

export function useReaderGesture() {
  const toggleOverlay = useReaderStore(state => state.toggleOverlay);
  
  // Gesture-safe overlay toggle (Center 40% tap, <=10px, <=250ms)
  useEffect(() => {
    let pointerState: { id: number; startX: number; startY: number; time: number } | null = null;
    const cancelTap = () => { pointerState = null; };

    const handlePointerDown = (e: PointerEvent) => {
      cancelTap();
      if (!e.isPrimary || e.button !== 0) return;
      // Ignore if clicking on UI elements
      if ((e.target as Element).closest('button, a, [role="button"], .pointer-events-auto')) return;
      
      pointerState = {
        id: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        time: Date.now()
      };
    };

    const handlePointerUp = (e: PointerEvent) => {
      const start = pointerState;
      cancelTap();
      if (!start || start.id !== e.pointerId || e.button !== 0) return;
      if ((e.target as Element).closest('button, a, [role="button"], .pointer-events-auto')) return;

      const duration = Date.now() - start.time;
      const deltaX = Math.abs(e.clientX - start.startX);
      const deltaY = Math.abs(e.clientY - start.startY);

      // Strict intent disambiguation
      if (duration <= 250 && deltaX <= 10 && deltaY <= 10) {
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
    document.addEventListener('pointercancel', cancelTap);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', cancelTap);
    };
  }, [toggleOverlay]);
}
