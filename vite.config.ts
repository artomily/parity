import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import wasm from "vite-plugin-wasm";

// ZK proving runs as WebAssembly in the browser, hence the wasm plugin. We
// build straight to esnext, so top-level await is supported natively and no
// TLA transform plugin is needed (that plugin's swc dependency also conflicts
// with current @swc/core). The compiled contract lives in ./managed, inside
// this project root, so no extra fs.allow entry is needed.
export default defineConfig({
  plugins: [react(), wasm()],
  // esbuild's default downlevel target chokes on destructuring inside some
  // wasm-bindgen glue; the wasm/TLA plugins need a modern target anyway.
  build: { target: "esnext" },
  esbuild: { target: "esnext" },
  optimizeDeps: {
    exclude: ["@midnight-ntwrk/compact-runtime"],
    // compact-runtime is excluded above, so Vite's scanner never crawls into it
    // to find this CJS transitive dep; without pre-bundling it here the browser
    // is served raw CJS and errors on `import inspect from 'object-inspect'`.
    include: ["object-inspect"],
    esbuildOptions: { target: "esnext" },
  },
});
