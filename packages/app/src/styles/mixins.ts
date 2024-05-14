import { css, unsafeCSS } from "lit";

export const unselectable = () => css`
    cursor: default;
    user-select: none;
`;

export const positionSticky = () => css`
    position: -webkit-sticky;
    position: -moz-sticky;
    position: -o-sticky;
    position: -ms-sticky;
    position: sticky;
`;

export const fullbleed = () => css`
    position: absolute !important;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
`;

export const scroll = (direction?: "vertical" | "horizontal") => css`
    ${direction === "vertical" ? css`overflow-y` : direction === "horizontal" ? css`overflow-x` : css`overflow`}: auto;
    -webkit-overflow-scrolling: touch;
`;

export const ellipsis = () => css`
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const absoluteCenter = () => css`
    ${fullbleed()};
    margin: auto;
`;

export const shade1 = () => css`
    background: var(--shade-1-color);
`;

export const shade2 = () => css`
    background: var(--shade-2-color);
`;

export const shade3 = () => css`
    background: var(--shade-3-color);
`;

export const shade4 = () => css`
    background: var(--shade-4-color);
`;

export const shade5 = () => css`
    background: var(--shade-5-color);
`;

export const card = () => css`
    background: var(--color-background);
    /* box-shadow: rgba(0, 0, 0, 0.2) 0 0 1px; */
    border-radius: var(--border-radius);
    border: solid 1px rgba(0, 0, 0, 0.1);
    border-bottom-width: 2px;
    overflow: hidden;
`;

export const gradientHighlight = (horizontal = false) => css`
    background: linear-gradient(
        ${horizontal ? css`90deg` : css`0`},
        var(--color-gradient-highlight-from) 0%,
        var(--color-gradient-highlight-to) 100%
    );
`;

export const gradientWarning = (horizontal = false) => css`
    background: linear-gradient(
        ${horizontal ? css`90deg` : css`0`},
        var(--color-gradient-warning-from) 0%,
        var(--color-gradient-warning-to) 100%
    );
`;

export const gradientDark = (horizontal = false) => css`
    background: linear-gradient(
        ${horizontal ? css`90deg` : css`0`},
        var(--color-gradient-dark-from) 0%,
        var(--color-gradient-dark-to) 100%
    );
`;

export const textShadow = () => css`
    text-shadow: rgba(0, 0, 0, 0.2) 0px 2px 0px;
`;

export const click = (selector: string) => css`
    ${unsafeCSS(selector)} {
        position: relative;
        cursor: pointer;
    }

    ${unsafeCSS(selector)}::after {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: currentColor;
        opacity: 0;
        transition: opacity 1s;
        pointer-events: none;
        border-radius: inherit;
    }

    ${unsafeCSS(selector)}:active::after {
        opacity: 0.3;
        transition: none;
    }
`;

export const hover = (selector: string) => css`
    ${unsafeCSS(selector)}::before {
        content: "";
        display: block;
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        border-radius: inherit;
    }

    ${unsafeCSS(selector)}:not(:active):hover::before {
        background: var(--color-shade-1) !important;
    }
`;

export const customScrollbar = (selector: string = "") => css`
    ${unsafeCSS(selector)}::-webkit-scrollbar {
        width: var(--scrollbar-width, 0.8em);
    }

    ${unsafeCSS(selector)}::-webkit-scrollbar-track {
        background-color: rgba(0, 0, 0, 0.025);
        border-radius: var(--scrollbar-width, 0.8em);
        border: solid var(--scrollbar-margin, 0.2em) transparent;
        background-clip: padding-box;
    }

    ${unsafeCSS(selector)}:hover::-webkit-scrollbar-track {
        background-color: var(--color-shade-1);
    }

    ${unsafeCSS(selector)}::-webkit-scrollbar-thumb {
        background-color: var(--color-shade-2);
        border-radius: var(--scrollbar-width, 0.8em);
        border: solid var(--scrollbar-margin, 0.2em) transparent;
        background-clip: padding-box;
        transition: all 0.5s;
    }

    ${unsafeCSS(selector)}::-webkit-scrollbar-thumb:hover {
        border-width: 1px;
        background-color: var(--color-shade-4);
    }
`;
