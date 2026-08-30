// A tiny timeline: each scene is a list of things that happen at a given
// second, and this resolves them into the exact state, pointer position and
// scroll offset for one frame. Keeping it declarative means a scene reads as
// the sequence of clicks a real user would make.
import type { DemoState } from "./state";

export type Action = {
  at: number;
  moveTo?: [number, number];
  click?: boolean;
  patch?: Partial<DemoState>;
  scrollTo?: number;
};

const MOVE_SECONDS = 0.5;
const CLICK_SECONDS = 0.45;
const SCROLL_SECONDS = 0.7;

/** Ease-in-out; a linear pointer looks like a machine, this looks like a hand. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t: number) => Math.max(0, Math.min(1, t));

export type Resolved = {
  state: DemoState;
  cursor: { x: number; y: number };
  click: { x: number; y: number; progress: number } | null;
  scrollY: number;
};

export function resolve(
  base: DemoState,
  actions: Action[],
  startCursor: [number, number],
  startScroll: number,
  t: number,
): Resolved {
  let state = { ...base };
  for (const a of actions) {
    if (a.patch && a.at <= t) state = { ...state, ...a.patch };
  }

  // Pointer: walk every move in order, so the position at time t is the result
  // of the whole path so far rather than of the latest waypoint alone.
  let from = startCursor;
  let cursor = { x: startCursor[0], y: startCursor[1] };
  for (const a of actions) {
    if (!a.moveTo) continue;
    if (t >= a.at) {
      const p = ease(clamp01((t - a.at) / MOVE_SECONDS));
      cursor = {
        x: from[0] + (a.moveTo[0] - from[0]) * p,
        y: from[1] + (a.moveTo[1] - from[1]) * p,
      };
      from = a.moveTo;
    }
  }

  let click: Resolved["click"] = null;
  for (const a of actions) {
    if (!a.click) continue;
    if (t >= a.at && t < a.at + CLICK_SECONDS) {
      click = { x: cursor.x, y: cursor.y, progress: (t - a.at) / CLICK_SECONDS };
    }
  }

  let scrollY = startScroll;
  let scrollFrom = startScroll;
  for (const a of actions) {
    if (a.scrollTo === undefined) continue;
    if (t >= a.at) {
      const p = ease(clamp01((t - a.at) / SCROLL_SECONDS));
      scrollY = scrollFrom + (a.scrollTo - scrollFrom) * p;
      scrollFrom = a.scrollTo;
    }
  }

  return { state, cursor, click, scrollY };
}

/** Linear ramp between two values over a window, for bars that grow. */
export function ramp(t: number, start: number, seconds: number, from: number, to: number): number {
  return from + (to - from) * ease(clamp01((t - start) / seconds));
}
