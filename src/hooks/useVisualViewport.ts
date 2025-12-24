import { useEffect, useMemo, useState } from "react";

export interface VisualViewportSnapshot {
  height: number;
  width: number;
  offsetTop: number;
  offsetLeft: number;
  scale: number;
}

/**
 * Tracks the Visual Viewport when available (mobile keyboard, browser UI, zoom).
 * Falls back to window inner dimensions.
 */
export function useVisualViewport(): VisualViewportSnapshot {
  const getSnapshot = () => {
    const vv = window.visualViewport;
    if (vv) {
      return {
        height: vv.height,
        width: vv.width,
        offsetTop: vv.offsetTop,
        offsetLeft: vv.offsetLeft,
        scale: vv.scale,
      };
    }

    return {
      height: window.innerHeight,
      width: window.innerWidth,
      offsetTop: 0,
      offsetLeft: 0,
      scale: 1,
    };
  };

  const [snapshot, setSnapshot] = useState<VisualViewportSnapshot>(() => getSnapshot());

  useEffect(() => {
    let raf = 0;
    const update = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSnapshot(getSnapshot()));
    };

    // visualViewport events cover keyboard show/hide in iOS Safari
    const vv = window.visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);

    // fallback + orientation changes
    window.addEventListener("resize", update);

    return () => {
      cancelAnimationFrame(raf);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // Avoid re-renders caused by object identity churn
  return useMemo(
    () => snapshot,
    [snapshot.height, snapshot.width, snapshot.offsetTop, snapshot.offsetLeft, snapshot.scale]
  );
}
