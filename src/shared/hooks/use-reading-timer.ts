import { useEffect, useRef } from "react";
import { useStatsStore } from "../store/stats-store";

export function useReadingTimer() {
  const addReadingTime = useStatsStore(state => state.addReadingTime);
  const startTimeRef = useRef<number>(0);
  const isActiveRef = useRef<boolean>(true);

  useEffect(() => {
    startTimeRef.current = Date.now();
    isActiveRef.current = true;

    const flushTime = () => {
      if (isActiveRef.current) {
        const now = Date.now();
        const elapsed = now - startTimeRef.current;
        if (elapsed > 0) {
          addReadingTime(elapsed);
        }
        startTimeRef.current = now;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushTime();
        isActiveRef.current = false;
      } else {
        startTimeRef.current = Date.now();
        isActiveRef.current = true;
      }
    };

    const handleBeforeUnload = () => {
      flushTime();
    };

    // Periodically save to avoid losing data on crash (every 10s)
    const intervalId = setInterval(flushTime, 10000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      flushTime();
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [addReadingTime]);
}
