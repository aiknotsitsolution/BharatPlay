import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");
          const packageMatch = normalizedId.match(
            /\/node_modules\/(@[^/]+\/[^/]+|[^/]+)/,
          );
          if (!packageMatch) return;

          const packageName = packageMatch[1];
          if (
            [
              "react",
              "react-dom",
              "scheduler",
              "react-is",
              "loose-envify",
            ].includes(packageName)
          ) {
            return "react-vendor";
          }
          if (
            [
              "react-router",
              "react-router-dom",
              "@remix-run/router",
            ].includes(packageName)
          ) {
            return "router-vendor";
          }
          if (
            [
              "@reduxjs/toolkit",
              "redux",
              "redux-thunk",
              "reselect",
              "immer",
            ].includes(packageName)
          ) {
            return "state-vendor";
          }
          if (["axios", "follow-redirects", "proxy-from-env"].includes(packageName)) {
            return "http-vendor";
          }
          if (
            [
              "@react-oauth/google",
              "jwt-decode",
              "gaxios",
              "google-auth-library",
            ].includes(packageName)
          ) {
            return "oauth-vendor";
          }
          if (
            [
              "socket.io-client",
              "socket.io-parser",
              "engine.io-client",
              "engine.io-parser",
              "@socket.io/component-emitter",
            ].includes(packageName)
          ) {
            return "realtime-vendor";
          }
          if (
            [
              "lucide-react",
              "react-toastify",
              "react-swipeable",
              "uuid",
            ].includes(packageName)
          ) {
            return "ui-vendor";
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: true,
  },
});
