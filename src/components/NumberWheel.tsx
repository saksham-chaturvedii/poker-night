import { useEffect, useMemo, useRef, useState } from "react";

type NumberWheelProps = {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  /** Accessible name — what this number represents (e.g. "₹25 chip count"). */
  label: string;
  /** Row height in px. Default suits an inline wheel; bump it up (e.g. 52)
   * for a wheel that's the sole focus of a bottom sheet. */
  itemHeight?: number;
  /** How many rows are visible at once — must be odd so one row centers. */
  visibleCount?: number;
};

/** A touch-scrollable, snapping number picker — the mobile-native way to
 * set a small bounded integer (chip counts, rebuy stock) without summoning
 * a keyboard. Built on CSS scroll-snap so momentum/inertia and snapping are
 * the browser's own native touch scrolling, not a reimplemented physics
 * engine.
 *
 * Three ways to change the value, so touch is never the only option:
 * drag-scroll, tap any visible row to jump to it, or focus + Arrow keys
 * (it's a real `role="spinbutton"`). A "type a number" fallback is also
 * one tap away for exact/large jumps or anyone who can't scroll or use a
 * keyboard. */
export function NumberWheel({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  itemHeight = 44,
  visibleCount = 5,
}: NumberWheelProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const lastCommitted = useRef(value);
  const isSyncingRef = useRef(false);
  const mountedRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const values = useMemo(() => {
    const arr: number[] = [];
    for (let v = min; v <= max; v += step) arr.push(v);
    return arr;
  }, [min, max, step]);

  const padCount = Math.floor(visibleCount / 2);
  const viewportHeight = itemHeight * visibleCount;
  const indexOf = (v: number) => Math.round((v - min) / step);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const scrollToValue = (v: number, smooth: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    isSyncingRef.current = true;
    el.scrollTo({ top: indexOf(v) * itemHeight, behavior: smooth ? "smooth" : "auto" });
    window.setTimeout(() => {
      isSyncingRef.current = false;
    }, 300);
  };

  // Keep the wheel scrolled to `value` when it changes from outside (initial
  // mount, an external reset) — but not while the user is mid-gesture.
  useEffect(() => {
    if (value === lastCommitted.current && mountedRef.current) return;
    scrollToValue(value, mountedRef.current);
    lastCommitted.current = value;
    mountedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const commitFromScroll = () => {
    const el = trackRef.current;
    if (!el || isSyncingRef.current) return;
    const idx = Math.min(values.length - 1, Math.max(0, Math.round(el.scrollTop / itemHeight)));
    const v = values[idx];
    if (v !== lastCommitted.current) {
      lastCommitted.current = v;
      onChange(v);
    }
  };

  const handleScroll = () => {
    if (settleTimer.current) window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(commitFromScroll, 120);
  };

  // Prefer the real "scrolling has stopped" event where the browser supports
  // it — snappier than the debounce fallback above (which still covers
  // every other browser).
  useEffect(() => {
    const el = trackRef.current;
    if (!el || !("onscrollend" in window)) return;
    const handler = () => {
      if (settleTimer.current) window.clearTimeout(settleTimer.current);
      commitFromScroll();
    };
    el.addEventListener("scrollend", handler);
    return () => el.removeEventListener("scrollend", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const jumpTo = (v: number) => {
    const clamped = clamp(v);
    scrollToValue(clamped, true);
    lastCommitted.current = clamped;
    onChange(clamped);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      jumpTo(value + step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      jumpTo(value - step);
    }
  };

  if (editing) {
    return (
      <div className="wheel-editing">
        <input
          className="text-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          autoFocus
          aria-label={label}
          value={draft}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              jumpTo(draft === "" ? min : Number(draft));
              setEditing(false);
            }
          }}
        />
        <button
          type="button"
          className="btn btn-secondary btn-compact"
          onClick={() => {
            jumpTo(draft === "" ? min : Number(draft));
            setEditing(false);
          }}
        >
          Set
        </button>
      </div>
    );
  }

  return (
    <div className="wheel-wrap">
      <div className="wheel" style={{ height: viewportHeight }}>
        <div
          ref={trackRef}
          className="wheel-track"
          role="spinbutton"
          tabIndex={0}
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          onScroll={handleScroll}
          onKeyDown={onKeyDown}
          style={{ paddingTop: itemHeight * padCount, paddingBottom: itemHeight * padCount }}
        >
          {values.map((v) => (
            <div
              key={v}
              className="wheel-item"
              style={{ height: itemHeight, lineHeight: `${itemHeight}px` }}
              onClick={() => jumpTo(v)}
            >
              {v}
            </div>
          ))}
        </div>
        <div className="wheel-selection-frame" style={{ height: itemHeight }} aria-hidden="true" />
      </div>
      <button
        type="button"
        className="wheel-edit-toggle"
        aria-label={`Type ${label} instead of scrolling`}
        onClick={() => {
          setDraft(String(value));
          setEditing(true);
        }}
      >
        123
      </button>
    </div>
  );
}
