import type { ReactNode } from "react";

/** A browser window around the app, so the recording reads as the deployed
 *  product at its real URL rather than as a slide about it. */
export function BrowserWindow({
  children,
  scrollY,
}: {
  children: ReactNode;
  scrollY: number;
}) {
  return (
    <div className="window">
      <div className="chrome">
        <div className="lights">
          <i style={{ background: "#ff5f57" }} />
          <i style={{ background: "#febc2e" }} />
          <i style={{ background: "#28c840" }} />
        </div>
        <div className="url">
          <span>🔒</span>
          <span>
            <strong>parity-tech.vercel.app</strong>
          </span>
        </div>
        <div style={{ width: 62 }} />
      </div>
      <div className="viewport">
        <div className="page" style={{ transform: `translateY(${-scrollY}px)` }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/** The pointer. Drawn rather than screen-captured, so it stays crisp at 1080p. */
export function Cursor({ x, y }: { x: number; y: number }) {
  return (
    <div className="cursor" style={{ left: x, top: y }}>
      <svg width="26" height="30" viewBox="0 0 26 30" fill="none">
        <path d="M2 2 L2 22.5 L7.4 17.6 L11.2 26.5 L15.1 24.8 L11.4 16.2 L18.6 15.7 Z" fill="#14181f" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export function ClickRing({ x, y, progress }: { x: number; y: number; progress: number }) {
  const size = 12 + progress * 46;
  return (
    <div
      className="click-ring"
      style={{
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: 1 - progress,
      }}
    />
  );
}
