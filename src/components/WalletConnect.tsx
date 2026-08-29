import type { WalletState } from "../hooks/useMidnight.js";

const short = (a: string) => (a.length > 18 ? `${a.slice(0, 10)}…${a.slice(-6)}` : a);

export function WalletConnect({
  walletState,
  address,
  onConnect,
  onDisconnect,
}: {
  walletState: WalletState;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (walletState === "detecting") {
    return <div className="wallet muted">Looking for a Midnight wallet…</div>;
  }

  if (walletState === "no-wallet") {
    return (
      <div className="wallet warn">
        No Midnight wallet detected.{" "}
        <a href="https://www.lace.io/" target="_blank" rel="noreferrer">
          Install Lace
        </a>{" "}
        and reload.
      </div>
    );
  }

  if (walletState === "connected" && address) {
    return (
      <div className="wallet connected">
        <span className="dot" aria-hidden="true" />
        <code title={address}>{short(address)}</code>
        <button className="ghost" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button className="primary" onClick={onConnect} disabled={walletState === "connecting"}>
      {walletState === "connecting" ? "Connecting…" : "Connect Lace wallet"}
    </button>
  );
}
