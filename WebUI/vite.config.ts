import { defineConfig } from "vite";

// 产物输出到 WPF 侧映射目录：SpikeWindow 把 app.local 映射到这里
export default defineConfig({
  base: "/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "chrome120",
  },
});
