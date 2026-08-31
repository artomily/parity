import type { ReactNode } from "react";

/** The wordmark's P, inline so it needs no network request and stays crisp. */
function ParityMark() {
  return (
    <svg className="mark" viewBox="0 0 320 320" aria-hidden="true">
      <defs>
        <linearGradient id="parity-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF9838" />
          <stop offset="1" stopColor="#F26F1A" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="76" fill="url(#parity-mark)" />
      <path
        fill="#ffffff"
        fillRule="evenodd"
        d="M98 70 H182 A53 53 0 0 1 182 176 H138 V250 H98 Z
           M138 104 H180 A21 21 0 0 1 180 146 H138 Z"
      />
    </svg>
  );
}

/** Page shell. The subtitle states the product's central claim, because the
 *  privacy behaviour is the feature — not a footnote further down the page. */
export function Layout({ children, wallet }: { children: ReactNode; wallet: ReactNode }) {
  return (
    <div className="shell">
      <header className="site-header">
        <div className="brand">
          <ParityMark />
          <div>
            <h1>Parity</h1>
            <p className="tagline">
              A gender pay-gap filing that can be verified — without anyone seeing a single salary.
            </p>
          </div>
        </div>
        {wallet}
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <p>
          Built on Midnight. Salaries are private witnesses: they are used to compute the published
          aggregates inside the circuit, and never leave the machine that supplied them.
        </p>
      </footer>
    </div>
  );
}
