import { useMidnight } from "../hooks/useMidnight.js";
import { Layout } from "../components/Layout.js";
import { WalletConnect } from "../components/WalletConnect.js";
import { PayrollFiling } from "../components/PayrollFiling.js";
import { TxStepper } from "../components/TxStepper.js";
import { useState } from "react";
import { CONTRACT_ADDRESS, FAUCET_URL, FEEDBACK_URL, LACE_URL, NETWORK_LABEL, shortHex } from "../utils/network.js";

function CopyTxId({ txId }: { txId: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="ghost"
      title={txId}
      onClick={() =>
        void navigator.clipboard.writeText(txId).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
    >
      {copied ? "Copied" : <>Copy tx <code>{shortHex(txId)}</code></>}
    </button>
  );
}

export function AppPage() {
  const m = useMidnight();
  const connected = m.walletState === "connected";

  return (
    <Layout
      route="app"
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
        <section className="panel onboard">
          <div>
            <p className="eyebrow">Before you start</p>
            <h2 className="onboard-title">Three things, about five minutes.</h2>
            <p className="lede">
              You will play both roles: first the employer filing a payroll, then the workers
              checking it. Nothing you enter leaves your browser.
            </p>
          </div>
          <ol className="checklist">
            <li>
              <strong>Install Lace</strong> and switch its Midnight network to <em>Preprod</em>.{" "}
              <a href={LACE_URL} target="_blank" rel="noreferrer">lace.io</a>
            </li>
            <li>
              <strong>Get tNIGHT</strong> from the Preprod faucet, paste your unshielded{" "}
              <code>mn_addr_preprod…</code> address.{" "}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer">Open faucet</a>
            </li>
            <li>
              <strong>Wait for DUST.</strong> Transaction fees are paid in DUST, which your tNIGHT
              generates over a few minutes. Let Lace finish syncing before you submit.
            </li>
          </ol>
          <button
            className="primary big"
            onClick={() => void m.connect()}
            disabled={m.walletState !== "ready"}
          >
            {m.walletState === "connecting" ? "Connecting…" : "Connect Lace wallet"}
          </button>
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
            {m.contractAddress !== CONTRACT_ADDRESS && (
              <button
                className="ghost"
                onClick={() => m.setContractAddress(CONTRACT_ADDRESS)}
                disabled={m.busy !== null}
              >
                Use shared filing
              </button>
            )}
            <button
              className="primary"
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
              {m.progress && <TxStepper progress={m.progress} />}
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
            <div className="banner ok success" role="status">
              <span className="success-mark" aria-hidden="true">✓</span>
              <div className="success-text">
                <strong>Confirmed on {NETWORK_LABEL}</strong>
                {m.progress && <span>{m.progress.outcome}</span>}
              </div>
              <CopyTxId txId={m.lastResult.txId} />
              <a className="button ghost" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
                Share feedback (1 min)
              </a>
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
