import * as React from "react";

interface DecodeTask {
  id: string;
  url: string;
  priority: number;
  abortController: AbortController;
}

export function useDecodeQueue(maxConcurrent = 3) {
  const queueRef = React.useRef<DecodeTask[]>([]);
  const activeDecodesRef = React.useRef<Set<string>>(new Set());
  const [decodedSet, setDecodedSet] = React.useState<Set<string>>(new Set());

  const processQueue = React.useCallback(function processQueueFn() {
    if (activeDecodesRef.current.size >= maxConcurrent || queueRef.current.length === 0) {
      return;
    }

    // Sort by priority (lower number = higher priority)
    queueRef.current.sort((a, b) => a.priority - b.priority);
    const toProcess = queueRef.current.slice(0, maxConcurrent - activeDecodesRef.current.size);

    const toProcessIds = new Set(toProcess.map(t => t.id));
    queueRef.current = queueRef.current.filter(t => !toProcessIds.has(t.id));

    toProcess.forEach((task) => {
      activeDecodesRef.current.add(task.id);
      
      const img = new window.Image();
      
      img.onload = () => {
        setDecodedSet(prev => new Set(prev).add(task.id));
        activeDecodesRef.current.delete(task.id);
        processQueueFn();
      };

      img.onerror = (e) => {
        console.debug("Decode error/abort", e);
        activeDecodesRef.current.delete(task.id);
        processQueueFn();
      };

      img.src = task.url;

      task.abortController.signal.addEventListener("abort", () => {
        img.src = ""; // Stop loading
      });
    });
  }, [maxConcurrent]);

  const addToQueue = React.useCallback(function addToQueueFn(id: string, url: string, priority: number) {
    if (decodedSet.has(id) || activeDecodesRef.current.has(id)) return;

    const existing = queueRef.current.find(t => t.id === id);
    if (existing) {
      existing.priority = priority;
    } else {
      queueRef.current.push({ id, url, priority, abortController: new AbortController() });
    }
    
    // Defer processQueue to avoid blocking main thread during rapid calls
    setTimeout(processQueue, 0);
  }, [decodedSet, processQueue]);

  const removeFromQueue = React.useCallback((id: string) => {
    const taskIndex = queueRef.current.findIndex(t => t.id === id);
    if (taskIndex !== -1) {
      queueRef.current[taskIndex].abortController.abort();
      queueRef.current.splice(taskIndex, 1);
    }
  }, []);

  const isDecoded = React.useCallback((id: string) => {
    return decodedSet.has(id);
  }, [decodedSet]);

  return { addToQueue, removeFromQueue, isDecoded, decodedSet };
}
