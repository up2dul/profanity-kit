import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "core/index": "src/core/index.ts",
    "languages/en": "src/languages/en.ts",
    "languages/id": "src/languages/id.ts",
  },
  format: "esm",
  platform: "neutral",
  target: ["node22.13", "baseline-widely-available"],
  fixedExtension: false,
  dts: true,
  sourcemap: true,
  minify: false,
  clean: true,
  hash: false,
  treeshake: true,
});
