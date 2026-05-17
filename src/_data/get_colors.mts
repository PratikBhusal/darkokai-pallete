import { readFileSync } from "node:fs";

import {
    formatHex,
    formatHex8,
    formatRgb,
    modeOklch,
    modeRgb,
    parse,
    parseOklch,
    useMode,
    useParser,
} from "culori/fn";

useMode(modeOklch);
useMode(modeRgb);
useParser(parseOklch);

interface RawColor {
    name: string;
    oklch: string;
    oklch_display?: string;
}

const accentConsistentRaw: RawColor[] = JSON.parse(
    readFileSync("src/_data/accent_colors_consistent.json", "utf-8"),
);
const accentDefaultRaw: RawColor[] = JSON.parse(
    readFileSync("src/_data/accent_colors_default.json", "utf-8"),
);
const neutralRaw: RawColor[] = JSON.parse(readFileSync("src/_data/neutral_colors.json", "utf-8"));

function cssSlug(name: string, prefix: string = "darkokai"): string {
    const lower = name.toLowerCase();
    const match = lower.match(/^neutral\s+(\d+)$/);
    if (match) return `neutral-${match[1]}`;
    return `${prefix}-${lower.replace(/\s+/g, "_")}`;
}

function enrichColor(color: RawColor, prefix: string = "darkokai") {
    const parsed = parse(color.oklch);
    const hasAlpha = parsed?.alpha !== undefined && parsed.alpha < 1;
    return {
        name: color.name,
        slug: cssSlug(color.name, prefix),
        hex: hasAlpha ? formatHex8(parsed) : formatHex(parsed),
        rgb: formatRgb(parsed),
        oklch: color.oklch,
        oklch_display: color.oklch_display,
    };
}

export default {
    accent_consistent: accentConsistentRaw.map((c) => enrichColor(c, "darkokai-consistent")),
    accent_default: accentDefaultRaw.map((c) => enrichColor(c, "darkokai-default")),
    neutral: neutralRaw.map((c) => enrichColor(c)),
};
