// Public facts about the live deployment, shown on the landing page and in the
// whitepaper. The env var wins so a redeploy never leaves the page stale.
export const NETWORK_LABEL = "Midnight Preprod";

export const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined) ||
  "ed713051c3d2e0e138c4c509f976746de1f741492321f51e616d537fd641fafd";

export const LACE_URL = "https://www.lace.io/";
export const FAUCET_URL = "https://midnight-tmnight-preprod.nethermind.dev/";
export const REPO_URL = "https://github.com/artomily/parity";
export const VIDEO_URL = "https://youtu.be/luBz-gQ5mzI";
export const X_URL = "https://x.com/paritycompany";
export const FEEDBACK_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeG_2KelqXWlerN_GAhmxnIZ7KMss4zKMcx0fnVI8dYvtIJlw/viewform";

export const shortHex = (s: string) => (s.length > 18 ? `${s.slice(0, 8)}…${s.slice(-6)}` : s);
