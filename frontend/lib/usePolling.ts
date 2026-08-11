import { useEffect, useRef } from 'react';

/**
 * Периодически вызывает callback, пока вкладка активна (пропускает тики, пока она в фоне —
 * document.visibilityState !== 'visible'), и сразу подхватывает при возврате на вкладку.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled: boolean = true) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (document.visibilityState === 'visible') callbackRef.current();
    };

    const id = setInterval(tick, intervalMs);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [intervalMs, enabled]);
}
