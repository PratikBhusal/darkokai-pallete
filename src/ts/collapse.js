// @ts-check
import { setClasses } from "alpinejs/src/utils/classes";

/**
 * @typedef {import('alpinejs').Alpine} Alpine
 */

/**
 * The part of the directive after the colon
 * @example x-collapse:enter
 * @example x-collapse:leave
 * @example x-collapse
 * @typedef {'enter' | 'leave' | '' | undefined} CollapseStage
 */

/**
 * @typedef {Object} TransitionPhase
 * @property {string | Record<string, string>} during
 * @property {Record<string, string>} start
 * @property {Record<string, string>} end
 */

/**
 * @typedef {Object} CollapseConfig
 * @property {number} floor
 * @property {boolean} fullyHide
 */

/**
 * @typedef {Object} CollapseTransition
 * @property {TransitionPhase} enter
 * @property {TransitionPhase} leave
 * @property {CollapseConfig} _config
 * @property {(before?: () => void, after?: () => void) => void} in
 * @property {(before?: () => void, after?: () => void) => void} out
 */

/**
 * Alpine.js collapse plugin with support for separate enter/leave durations.
 *
 *
 * - `x-collapse` — default collapse with 250ms duration
 * - `x-collapse.duration.500ms` — custom duration for both enter and leave
 * - `x-collapse:enter.duration.500ms` — custom enter duration only
 * - `x-collapse:leave.duration.250ms` — custom leave duration only
 * - `x-collapse:enter="duration-500"` — Tailwind class-based enter transition
 * - `x-collapse:leave="duration-250"` — Tailwind class-based leave transition
 * - `x-collapse="duration-300"` — Tailwind class-based transition for both
 *
 * @param {Alpine} Alpine
 */
export default function (Alpine) {
    Alpine.directive("collapse", collapse);

    collapse.inline = (/** @type {HTMLElement} */ el, { value, modifiers }) => {
        if (value === "enter" || value === "leave") return;
        if (!modifiers.includes("min")) return;

        // If we're using a "minimum height", we'll need to disable
        // x-show's default behavior of setting display: 'none'.
        el._x_doShow = () => {};
        el._x_doHide = () => {};
    };

    /**
     * @param {HTMLElement} el
     * @param {{ value: CollapseStage, modifiers: string[], expression: string }} directive
     */
    function collapse(el, { value, modifiers, expression }) {
        // Check tailwindcss classes
        if (typeof expression === "string" && expression.length > 0) {
            registerCollapseFromClassString(el, expression, value, Alpine);
        } else {
            registerCollapseFromModifiers(el, modifiers, value, Alpine);
        }
    }
}

/**
 * Register collapse transition using CSS class strings (e.g. Tailwind classes).
 *
 * @param {HTMLElement} el
 * @param {string} classString
 * @param {CollapseStage} stage
 * @param {Alpine} Alpine
 */
function registerCollapseFromClassString(el, classString, stage, Alpine) {
    registerCollapseObject(el, Alpine);

    let doesntSpecify = !stage;

    if (doesntSpecify || stage === "enter") {
        el._x_transition.enter.during = classString;
    }

    if (doesntSpecify || stage === "leave") {
        el._x_transition.leave.during = classString;
    }

    applyInitialState(el);
}

/**
 * Register collapse transition using directive modifiers (e.g. .duration.500ms).
 *
 * @param {HTMLElement} el
 * @param {string[]} modifiers
 * @param {CollapseStage} stage
 * @param {Alpine} Alpine
 */
function registerCollapseFromModifiers(el, modifiers, stage, Alpine) {
    registerCollapseObject(el, Alpine);

    let doesntSpecify = !stage;
    let transitioningIn = doesntSpecify || stage === "enter";
    let transitioningOut = doesntSpecify || stage === "leave";

    let duration = modifierValue(modifiers, "duration", 250) / 1000;
    let easing = "cubic-bezier(0.4, 0.0, 0.2, 1)";

    if (!stage) {
        el._x_transition._config.floor = modifierValue(modifiers, "min", 0);
        el._x_transition._config.fullyHide = !modifiers.includes("min");
    }

    if (transitioningIn) {
        el._x_transition.enter.during = {
            transitionProperty: "height",
            transitionDuration: `${duration}s`,
            transitionTimingFunction: easing,
        };
    }

    if (transitioningOut) {
        el._x_transition.leave.during = {
            transitionProperty: "height",
            transitionDuration: `${duration}s`,
            transitionTimingFunction: easing,
        };
    }

    applyInitialState(el);
}

/**
 * Apply initial collapsed/expanded state to the element.
 *
 * @param {HTMLElement} el
 */
function applyInitialState(el) {
    let { floor, fullyHide } = el._x_transition._config;

    if (!el._x_isShown) el.style.height = `${floor}px`;
    // We use the hidden attribute for the benefit of Tailwind
    // users as the .space utility will ignore [hidden] elements.
    // We also use display:none as the hidden attribute has very
    // low CSS specificity and could be accidentally overridden
    // by a user.
    if (!el._x_isShown && fullyHide) el.hidden = true;
    if (!el._x_isShown) el.style.overflow = "hidden";
}

/**
 * Returns a set function that handles both class strings and style objects.
 * When `during` is a class string, dispatches to setClasses for strings
 * and Alpine.setStyles for objects (height values). When `during` is a
 * style object, uses Alpine.setStyles exclusively.
 *
 * @param {string | Record<string, string>} during
 * @param {Alpine} Alpine
 * @param {boolean} [preventHeightRevert=false] - When true, prevents the
 *   height style from being reverted during cleanup (needed for the "out"
 *   transition to keep the element collapsed).
 * @returns {(el: HTMLElement, value: string | Record<string, string>) => () => void}
 */
function getSetFunction(during, Alpine, preventHeightRevert = false) {
    if (typeof during === "string") {
        // Hybrid: use setClasses for class strings, setStyles for style objects
        return (el, value) => {
            if (typeof value === "string") return setClasses(el, value);
            let revertFunction = Alpine.setStyles(el, value);
            return preventHeightRevert && value.height ? () => {} : revertFunction;
        };
    }

    // Inline styles only
    return (el, styles) => {
        let revertFunction = Alpine.setStyles(el, styles);
        return preventHeightRevert && styles.height ? () => {} : revertFunction;
    };
}

/**
 * Lazily initialize the collapse transition object on the element.
 * Subsequent calls are no-ops if already initialized.
 *
 * @param {HTMLElement} el
 * @param {Alpine} Alpine
 */
function registerCollapseObject(el, Alpine) {
    if (el._x_transition) return;

    /** @type {CollapseTransition} */
    el._x_transition = {
        enter: { during: {}, start: {}, end: {} },
        leave: { during: {}, start: {}, end: {} },

        _config: {
            floor: 0,
            fullyHide: true,
        },

        in(before = () => {}, after = () => {}) {
            let { floor, fullyHide } = this._config;
            let during = this.enter.during;

            if (fullyHide) el.hidden = false;
            if (fullyHide) el.style.display = null;

            let current = el.getBoundingClientRect().height;

            el.style.height = "auto";

            let full = el.getBoundingClientRect().height;

            if (current === full) {
                current = floor;
            }

            Alpine.transition(
                el,
                getSetFunction(during, Alpine, false),
                {
                    during: during,
                    start: { height: current + "px" },
                    end: { height: full + "px" },
                },
                () => (el._x_isShown = true),
                () => {
                    if (Math.abs(el.getBoundingClientRect().height - full) < 1) {
                        el.style.overflow = null;
                    }
                },
            );
        },

        out(before = () => {}, after = () => {}) {
            let { floor, fullyHide } = this._config;
            let during = this.leave.during;
            let full = el.getBoundingClientRect().height;

            Alpine.transition(
                el,
                getSetFunction(during, Alpine, true),
                {
                    during: during,
                    start: { height: full + "px" },
                    end: { height: floor + "px" },
                },
                () => (el.style.overflow = "hidden"),
                () => {
                    el._x_isShown = false;

                    // check if element is fully collapsed
                    if (el.style.height == `${floor}px` && fullyHide) {
                        el.style.display = "none";
                        el.hidden = true;
                    }
                },
            );
        },
    };
}

/**
 * Extract a modifier value from the modifiers array.
 *
 * @param {string[]} modifiers
 * @param {string} key
 * @param {*} fallback
 * @returns {*}
 */
function modifierValue(modifiers, key, fallback) {
    // If the modifier isn't present, use the default.
    if (modifiers.indexOf(key) === -1) return fallback;

    // If it IS present, grab the value after it: x-show.transition.duration.500ms
    const rawValue = modifiers[modifiers.indexOf(key) + 1];

    if (!rawValue) return fallback;

    if (key === "duration") {
        // Support x-collapse.duration.500ms && duration.500
        let match = rawValue.match(/([0-9]+)ms/);
        if (match) return match[1];
    }

    if (key === "min") {
        // Support x-collapse.min.100px && min.100
        let match = rawValue.match(/([0-9]+)px/);
        if (match) return match[1];
    }

    return rawValue;
}
