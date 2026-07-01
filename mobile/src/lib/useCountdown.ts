// ============================================================
//  useCountdown — شمارشِ معکوس تا لحظهٔ پایانِ سرور.
//  زمان از deadlineِ سرور می‌آید؛ این هوک فقط نمایش را تیک می‌زند.
// ============================================================

import { useEffect, useRef, useState } from 'react';

export function useCountdown(
  endsAtMs: number,
  paused: boolean,
  onExpire: () => void,
): number {
  const [remainingMs, setRemainingMs] = useState(
    Math.max(0, endsAtMs - Date.now()),
  );
  const expiredRef = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    expiredRef.current = false;
    setRemainingMs(Math.max(0, endsAtMs - Date.now()));
  }, [endsAtMs]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      const left = Math.max(0, endsAtMs - Date.now());
      setRemainingMs(left);
      if (left <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpireRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [endsAtMs, paused]);

  return remainingMs;
}
