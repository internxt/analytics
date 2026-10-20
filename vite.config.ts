import { defineConfig } from "vitest/config";
import packageJson from "./package.json" with { type: "json" };

const externalPackages = Object.keys(packageJson.dependencies);

export default defineConfig({
  build: {
    lib: {
      entry: "src/index.ts",
      fileName: "internxt-analytics",
      formats: ["es"],
    },
    rolldownOptions: {
      external: (id) => externalPackages.some((pkg) => id === pkg || id.startsWith(`${pkg}/`)),
    },
    emptyOutDir: false,
  },
  test: {
    environment: "jsdom",
  },
});
