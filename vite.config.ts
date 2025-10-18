import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
// https://vite.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                side_panel: "index.html",
            },
            output: {
                entryFileNames: "[name].js",
            },
        },
        outDir: "dist",
    },
    plugins: [react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
});
