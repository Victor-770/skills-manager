import { useEffect } from "react";

/**
 * Registers a global keyboard shortcut.
 * @param key - The key combo (e.g. "mod+k"). "mod" maps to Meta on Mac, Ctrl elsewhere.
 * @param callback - Function to call when the shortcut fires.
 */
export function useHotkey(key: string, callback: () => void) {
  useEffect(() => {
    const parts = key.toLowerCase().split("+");
    const needsMeta = parts.includes("meta") || parts.includes("mod");
    const needsCtrl = parts.includes("ctrl") || parts.includes("mod");
    const needsShift = parts.includes("shift");
    const mainKey = parts.filter(
      (p) => !["meta", "ctrl", "shift", "mod"].includes(p)
    )[0];

    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const metaOk = needsMeta
        ? isMac
          ? e.metaKey
          : e.ctrlKey
        : !e.metaKey && !e.ctrlKey;
      const ctrlOk = needsCtrl ? e.ctrlKey : !e.ctrlKey || (isMac && needsMeta);
      const shiftOk = needsShift ? e.shiftKey : !e.shiftKey;

      if (
        metaOk &&
        (needsMeta || ctrlOk) &&
        shiftOk &&
        e.key.toLowerCase() === mainKey
      ) {
        e.preventDefault();
        callback();
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [key, callback]);
}
