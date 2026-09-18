import type { ReactNode } from "react";
import { href, type Route } from "../hooks/useRoute.js";
import { REPO_URL, X_URL, VIDEO_URL, NETWORK_LABEL, FEEDBACK_URL } from "../utils/network.js";

/** The wordmark's P, inline so it needs no network request and stays crisp. */
export function ParityMark({ className = "mark" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 320 320" aria-hidden="true">
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

const NAV: { route: Route; label: string }[] = [
  { route: "home", label: "Product" },
  { route: "whitepaper", label: "Whitepaper" },
];

/** Page shell shared by every route. The wallet control only appears inside
 *  the app, so the landing page never prompts a visitor's wallet. */
export function Layout({
  route,
  children,
  wallet,
}: {
  route: Route;
  children: ReactNode;
  wallet?: ReactNode;
}) {
  return (
    <div className="shell">
      <header className="site-header">
        <a className="brand" href={href("home")} aria-label="Parity home">
          <ParityMark />
          <span className="brand-name">Parity</span>
          <span className="net-pill">{NETWORK_LABEL}</span>
        </a>
        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <a key={n.route} href={href(n.route)} aria-current={route === n.route ? "page" : undefined}>
              {n.label}
            </a>
          ))}
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            GitHub
          </a>
          {route === "app" ? (
            wallet
          ) : (
            <a className="button primary" href={href("app")}>
              Launch app
            </a>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        <div className="footer-brand">
          <ParityMark className="mark small" />
          <p>
            Built on Midnight. Salaries are private witnesses: they are used to compute the published
            aggregates inside the circuit, and never leave the machine that supplied them.
          </p>
        </div>
        <div className="footer-links">
          <a href={href("app")}>App</a>
          <a href={href("whitepaper")}>Whitepaper</a>
          <a href={VIDEO_URL} target="_blank" rel="noreferrer">Demo video</a>
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer">Feedback</a>
          <a href={REPO_URL} target="_blank" rel="noreferrer">GitHub</a>
          <a href={X_URL} target="_blank" rel="noreferrer">@paritycompany</a>
        </div>
      </footer>
    </div>
  );
}
