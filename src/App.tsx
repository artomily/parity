import { useMidnight } from "./hooks/useMidnight.js";
import { Layout } from "./components/Layout.js";
import { WalletConnect } from "./components/WalletConnect.js";
import { PayrollFiling } from "./components/PayrollFiling.js";

export default function App() {
  const m = useMidnight();
  const connected = m.walletState === "connected";

  return (
    <Layout
      wallet={
        <WalletConnect
          walletState={m.walletState}
          address={m.address}
          onConnect={() => void m.connect()}
          onDisconnect={m.disconnect}
        />
      }
    >
      {!connected ? (
        <section className="panel intro">
          <h2>Why this exists</h2>
          <p>
            From 2027 every EU employer with 150+ staff must publish its gender pay gap. Nobody can
            check whether that number is true: verifying it would require the individual salaries,
            which data-protection law forbids disclosing. So regulators are reduced to flagging
            filings that look <em>statistically implausible</em> — and have issued almost no fines.
          </p>
          <p>
            Parity closes that gap. Connect a wallet to file a payroll, then check it as the workers
            it describes.
          </p>
        </section>
      ) : (
        <>
          <section className="panel contract">
            <label className="field">
              <span>Filing contract address</span>
              <input
                value={m.contractAddress}
                onChange={(e) => m.setContractAddress(e.target.value)}
                placeholder="Deploy a new filing, or paste an existing contract address"
                spellCheck={false}
              />
            </label>
            <button
              className="ghost"
              onClick={() => void m.join(m.contractAddress)}
              disabled={!m.contractAddress || m.busy !== null}
            >
              Join
            </button>
          </section>

          {m.busy && (
            <div className="banner busy" role="status">
              <span className="spinner" aria-hidden="true" />
              {m.busy}
              <em>Proof generation runs locally — your private inputs never leave this machine.</em>
            </div>
          )}

          {m.error && (
            <div className="banner error" role="alert">
              {m.error}
              <button className="ghost" onClick={() => m.setError(null)}>
                Dismiss
              </button>
            </div>
          )}

          {m.lastResult && !m.busy && (
            <div className="banner ok" role="status">
              Submitted on-chain · <code>{m.lastResult.txId.slice(0, 24)}…</code>
            </div>
          )}

          <PayrollFiling
            ledgerState={m.ledgerState}
            filingMode={m.filingMode}
            setFilingMode={m.setFilingMode}
            onDeploy={() => void m.deploy()}
            onCommit={() => void m.commitPayroll()}
            onConfirm={(i) => void m.confirmRecord(i)}
            onDispute={(i) => void m.disputeRecord(i)}
            busy={m.busy}
            contractAddress={m.contractAddress}
          />
        </>
      )}
    </Layout>
  );
}
