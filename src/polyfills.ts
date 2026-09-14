// The Midnight SDK uses Node's global Buffer when building and proving
// transactions (e.g. the deploy path). Browsers have no Buffer, so provide it
// before any SDK module runs. This lives in its own module because imports are
// hoisted: main.tsx must import it first for the global to exist in time.
import { Buffer } from "buffer";

if (!("Buffer" in globalThis)) {
  (globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
}
