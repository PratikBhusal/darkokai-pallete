import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
    base: process.env.BASE_URL || "/",
    plugins: [tailwindcss()],
    build: {
        cssMinify: true,
    },
});
