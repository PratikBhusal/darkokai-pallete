import { defineConfig } from "oxfmt";

export default defineConfig({
  sortImports: true,
  sortTailwindcss: true,
  sortPackageJson: {
    sortScripts: true,
  },
  ignorePatterns: ["_site", "node_modules", "catppuccin-palette"],
});
