import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

import pluginVite from "@11ty/eleventy-plugin-vite";

import viteConfig from "./vite.config.mts";

function generateCss() {
    const accentConsistent = JSON.parse(
        readFileSync("src/_data/accent_colors_consistent.json", "utf-8"),
    );
    const accentdefault = JSON.parse(readFileSync("src/_data/accent_colors_default.json", "utf-8"));
    const neutral = JSON.parse(readFileSync("src/_data/neutral_colors.json", "utf-8"));
    const darkokaiVars = [
        ...accentdefault.map((c) => {
            const slug = c.name.toLowerCase().replace(/\s+/g, "_");
            return `    --color-darkokai-default-${slug}: ${c.oklch};`;
        }),
        ...accentConsistent.map((c) => {
            const slug = c.name.toLowerCase().replace(/\s+/g, "_");
            return `    --color-darkokai-consistent-${slug}: ${c.oklch};`;
        }),
        ...neutral.map((c) => {
            const slug = c.name.toLowerCase().replace(/\s+/g, "_");
            return `    --color-darkokai-${slug}: ${c.oklch};`;
        }),
    ].join("\n");

    const css = `@theme {
${darkokaiVars}
}
`;

    mkdirSync("src/css", { recursive: true });
    const existing = existsSync("src/css/theme.css")
        ? readFileSync("src/css/theme.css", "utf-8")
        : "";
    if (css !== existing) {
        writeFileSync("src/css/theme.css", css);
    }
}

/** @param { import('@11ty/eleventy/src/UserConfig') } eleventyConfig */
export default function (eleventyConfig) {
    eleventyConfig.addPlugin(pluginVite, {
        viteOptions: viteConfig,
    });

    eleventyConfig.addDataExtension("mts", {
        read: false,
        parser: async (filePath) => {
            const mod = await import(`${filePath}?t=${Date.now()}`);
            return mod.default;
        },
    });

    eleventyConfig.on("eleventy.before", () => {
        generateCss();
    });

    eleventyConfig.addWatchTarget("src/_data/accent_colors_consistent.json");
    eleventyConfig.addWatchTarget("src/_data/accent_colors_default.json");
    eleventyConfig.addWatchTarget("src/_data/neutral_colors.json");

    eleventyConfig.addPassthroughCopy("src/assets");
    eleventyConfig.addPassthroughCopy("src/ts");
    eleventyConfig.addPassthroughCopy("src/css");

    return {
        dir: {
            input: "src",
            output: "_site",
            includes: "_includes",
            data: "_data",
        },
        templateFormats: ["njk"],
        htmlTemplateEngine: "njk",
    };
}
