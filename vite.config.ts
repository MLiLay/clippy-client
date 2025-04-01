import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [vue()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 3000,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // store chunks
          'stores': [
            './src/stores/useClipRegStore.ts',
            './src/stores/useChatStore.ts',
            './src/stores/useConnectionStore.ts',
            './src/stores/useSettingsStore.ts'
          ],
          // services chunks
          'core-services': [
            './src/services/SocketService.ts',
            './src/services/HotkeyService.ts'
          ],
          // ui components chunks
          'ui-components': [
            './src/components/Settings.vue'
          ],
          // vendors chunks
          'vendors': [
            'vue',
            'pinia',
            '@tauri-apps/api',
            'socket.io-client'
          ]
        }
      }
    }
  }
}));
