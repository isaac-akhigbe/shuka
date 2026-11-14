"use client";

import { useLayoutEffect, useRef } from "react";

// Counts from 0 up to `to` when the number scrolls into view.
// The server renders the final number, so it still shows without JavaScript.
export default function CountUp({
  to,
  duration = 1600,
  prefix = "",
  suffix = "",
}: {
  to: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const format = (n: number) => `${prefix}${Math.round(n).toLocaleString("en-GB")}${suffix}`;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const fmt = (n: number) => `${prefix}${Math.round(n).toLocaleString("en-GB")}${suffix}`;
    el.textContent = fmt(0);

    let frame = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          el.textContent = fmt(to * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      el.textContent = fmt(to);
    };
  }, [to, duration, prefix, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(to)}
    </span>
  );
}
