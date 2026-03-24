import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isAndroid = mode === "android";
  const apiKey = isAndroid
    ? (env.GOOGLE_MAPS_API_KEY_ANDROID ?? env.GOOGLE_MAPS_API_KEY ?? "")
    : (env.GOOGLE_MAPS_API_KEY ?? "");

  return {
    base: isAndroid ? "./" : "/",
    plugins: [react()],
    define: {
      "import.meta.env.GOOGLE_MAPS_API_KEY": JSON.stringify(apiKey)
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src")
      }
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      strictPort: true
    }
  };
});
