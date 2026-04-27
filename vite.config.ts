import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  const isVercel = process.env.VERCEL === "1";

  return {
    plugins: [
      tanstackStart(),
      nitro({
        preset: isVercel ? "vercel" : "node-server",
      }),
      react(),
      tailwindcss(),
      tsConfigPaths(),
    ],
    server: {
      host: "0.0.0.0",
      port: 3022,
      strictPort: false,
    },
    preview: {
      host: "0.0.0.0",
      port: 3022,
      strictPort: false,
    },
  };
});
