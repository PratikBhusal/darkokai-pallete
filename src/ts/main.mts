import Alpine from "alpinejs";

import collapse from "./collapse.js";
// import transition from "./x-transition.js";

Alpine.plugin(collapse);

// Alpine.plugin(transition);

Alpine.data("accentSection", () => ({
    showTrueOklch: false,
    getValue(display: string, raw: string): string {
        return this.showTrueOklch ? raw : display;
    },
    async copyValue(event: MouseEvent, display: string, raw: string) {
        const el = event.currentTarget as HTMLElement;
        try {
            await navigator.clipboard.writeText(this.getValue(display, raw));
            el.classList.add("copied");
            setTimeout(() => el.classList.remove("copied"), 1200);
        } catch {
            el.classList.add("failed");
            setTimeout(() => el.classList.remove("failed"), 1200);
        }
    },
}));

Alpine.data("copyBtn", () => ({
    async copy(value: string) {
        try {
            await navigator.clipboard.writeText(value);
            this.$el.classList.add("copied");
            setTimeout(() => this.$el.classList.remove("copied"), 1200);
        } catch {
            this.$el.classList.add("failed");
            setTimeout(() => this.$el.classList.remove("failed"), 1200);
        }
    },
}));

Alpine.data("collapsible", () => ({
    open: true,
    init() {
        if (this.$el.dataset.collapsed !== undefined) {
            this.open = false;
        }
    },
    toggle() {
        this.open = !this.open;
    },
}));

Alpine.start();
