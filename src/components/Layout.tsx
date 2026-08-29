import type { ReactNode } from "react";

/** Page shell. The subtitle states the product's central claim, because the
 *  privacy behaviour is the feature — not a footnote further down the page. */
export function Layout({ children, wallet }: { children: ReactNode; wallet: ReactNode }) {
  return (
    <div className="shell">
      <header className="site-header">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
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
