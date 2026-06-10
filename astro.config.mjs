// @ts-check
import { defineConfig } from "astro/config";

// Static hub for fctc.fun. All build assets live under /_astro/ — the root
// /assets and /data namespaces are reserved for the dashboard app (see
// vercel.json rewrites). Don't put anything at those paths, ever.
export default defineConfig({
  site: "https://fctc.fun",
});
