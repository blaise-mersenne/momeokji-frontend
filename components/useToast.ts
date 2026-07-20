"use client";

import { useRef, useState } from "react";

export function useToast(duration = 2000) {
  const [toastText, setToastText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(message: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToastText(message);
    timerRef.current = setTimeout(() => setToastText(null), duration);
  }

  return { toastText, showToast };
}
