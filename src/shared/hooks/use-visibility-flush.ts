import * as React from "react";

export function useVisibilityFlush(callback: () => void) {
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        callback();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    // Also bind to beforeunload as a fallback
    window.addEventListener("beforeunload", callback);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", callback);
    };
  }, [callback]);
}
