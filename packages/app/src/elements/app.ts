import { css, html, LitElement } from "lit";
import { customElement, property, state, query } from "lit/decorators.js";
import { VaultItem } from "@padloc/core/src/item";
import { shared, mixins } from "../styles";
import { app, router } from "../globals";
import { StateMixin } from "../mixins/state";
import { Routing } from "../mixins/routing";
import { AutoLock } from "../mixins/auto-lock";
import { ErrorHandling } from "../mixins/error-handling";
import { dialog } from "../lib/dialog";
import { Dialog } from "./dialog";
import { CreateItemDialog } from "./create-item-dialog";
import "./icon";
import "./start";
import "./settings";
import "./generator-view";
import "./report";
import "./support";
import "./menu";
import "./rich-content";
import { ItemsView } from "./items";
import { wait } from "@padloc/core/src/util";

@customElement("pl-app")
export class App extends StateMixin(ErrorHandling(AutoLock(Routing(LitElement)))) {
    @property({ attribute: false })
    readonly routePattern = /^([^\/]*)(?:\/([^\/]+))?/;

    @property({ type: Boolean, reflect: true, attribute: "singleton-container" })
    readonly singletonContainer = true;

    @dialog("pl-create-item-dialog")
    private _createItemDialog: CreateItemDialog;

    private _pages = [
        "start",
        "unlock",
        "login",
        "signup",
        "recover",
        "items",
        "settings",
        "orgs",
        "invite",
        "generator",
        "report",
        "support",
    ];

    @state()
    protected _page: string = "start";

    @state()
    private _menuOpen: boolean = false;

    @query(".wrapper")
    protected _wrapper: HTMLDivElement;

    @query("pl-items")
    protected _items: ItemsView;

    constructor() {
        super();
        this.load();
    }

    async load() {
        await app.load();
        // Try syncing account so user can unlock with new password in case it has changed
        if (app.state.loggedIn) {
            app.fetchAccount();
        }
        // this.routeChanged();
        const spinner = document.querySelector(".spinner") as HTMLElement;
        spinner.style.display = "none";
    }

    async handleRoute(
        [page]: [string, string],
        { next, ...params }: { [prop: string]: string | undefined },
        path: string
    ) {
        if (!app.state.loggedIn) {
            if (!["start", "login", "signup"].includes(page)) {
                this.go("start", { next: path || undefined, ...params }, true);
                return;
            }
        } else if (app.state.locked) {
            if (!["unlock"].includes(page)) {
                this.go("unlock", { next: next || path || undefined, ...params }, true);
                return;
            }
        } else if (next && !["start", "login", "unlock", "signup"].includes(next)) {
            this.go(next, params, true);
            return;
        }

        if (!page || !this._pages.includes(page)) {
            this.redirect("items");
            return;
        }

        this._page = page;
        const unlocked = !["start", "login", "signup", "unlock"].includes(page);
        setTimeout(() => this._wrapper.classList.toggle("active", unlocked), unlocked ? 600 : 0);
    }

    static styles = [
        shared,
        css`
            @keyframes fadeIn {
                from {
                    opacity: 0;
                }
            }

            :host {
                font-family: var(--font-family), var(--font-family-fallback) !important;
                font-size: var(--font-size-base);
                font-weight: var(--font-weight-default);
                overflow: hidden;
                color: var(--color-foreground);
                position: fixed;
                width: 100%;
                height: 100%;
                animation: fadeIn 0.5s;
                display: flex;
                flex-direction: column;
                background: var(--app-backdrop-background);
                letter-spacing: var(--letter-spacing);
                --inset-top: max(calc(env(safe-area-inset-top, 0) - 0.5em), 0em);
                --inset-bottom: max(calc(env(safe-area-inset-bottom, 0) - 1em), 0em);
            }

            .main {
                flex: 1;
                position: relative;
                perspective: 1000px;
            }

            .wrapper {
                display: flex;
                transform-origin: 0 center;
                transition: transform 0.4s cubic-bezier(0.6, 0, 0.2, 1), filter 0.4s;
                ${mixins.fullbleed()};
                background: var(--color-background);
            }

            pl-menu {
                width: var(--menu-width);
                padding-top: var(--inset-top);
                padding-bottom: var(--inset-bottom);
            }

            .views {
                flex: 1;
                position: relative;
                overflow: hidden;
            }

            .views > * {
                ${mixins.fullbleed()};
                top: var(--inset-top);
            }

            .wrapper:not(.active),
            :host(.dialog-open) .wrapper {
                transform: translate3d(0, 0, -150px) rotateX(5deg);
                border-radius: 1em;
            }

            :host(.dialog-open.hide-app) {
                background: transparent;
            }

            :host(.dialog-open.hide-app) .main > * {
                opacity: 0;
            }

            .offline-indicator {
                background: var(--color-negative);
                color: var(--color-background);
                --button-transparent-color: var(--color-background);
                padding: var(--spacing);
                text-align: center;
                z-index: 100;
                font-weight: 600;
                font-size: var(--font-size-small);
                position: relative;
                padding-top: max(var(--inset-top), 0.5em);
                margin-bottom: calc(-1 * var(--inset-top));
            }

            .offline-indicator pl-button {
                position: absolute;
                right: 0.2em;
                bottom: 0.15em;
            }

            .menu-scrim {
                ${mixins.fullbleed()};
                z-index: 10;
                background: var(--color-white);
                opacity: 0.3;
                transition: opacity 0.3s;
                display: none;
            }

            @media (max-width: 1000px) {
                .views {
                    transition: transform 0.3s cubic-bezier(0.6, 0, 0.2, 1);
                    ${mixins.fullbleed()};
                }

                .views {
                    margin: 0;
                }

                .views,
                .views > * {
                    border-radius: 0;
                }

                :host(.menu-open) .views {
                    transform: translate(var(--menu-width), 0);
                }

                pl-menu {
                    transition: transform 0.3s cubic-bezier(0.6, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.6, 0, 0.2, 1);
                }

                .menu-scrim {
                    display: block;
                }

                :host(:not(.menu-open)) .menu-scrim {
                    opacity: 0;
                    pointer-events: none;
                }

                :host(:not(.menu-open)) pl-menu {
                    opacity: 0;
                    transform: translate(-100px, 0);
                }
            }

            @media (min-width: 1200px) {
                .wrapper {
                    border-radius: 1em;
                    overflow: hidden;
                    box-shadow: var(--app-wrapper-shadow);
                    margin: auto;
                    overflow: hidden;
                    top: 2em;
                    left: 2em;
                    right: 2em;
                    bottom: 2em;
                    max-width: 1200px;
                    max-height: 900px;
                }

                .wrapper:not(.active),
                :host(.dialog-open) .wrapper {
                    filter: blur(2px);
                }
            }
        `,
    ];

    render() {
        return html`
            <div class="main">
                <pl-start id="startView" active></pl-start>

                <div class="wrapper">
                    <pl-menu></pl-menu>

                    <div class="views">
                        <pl-settings ?hidden=${this._page !== "settings"}></pl-settings>

                        <pl-items ?hidden=${this._page !== "items"}></pl-items>

                        <pl-generator-view ?hidden=${this._page !== "generator"}></pl-generator-view>

                        <pl-report ?hidden=${this._page !== "report"}></pl-report>

                        <pl-support ?hidden=${this._page !== "support"}></pl-support>

                        <div
                            class="menu-scrim"
                            @touchstart=${(e: MouseEvent) => this._closeMenu(e)}
                            @click=${(e: MouseEvent) => this._closeMenu(e)}
                        ></div>
                    </div>
                </div>

                <slot></slot>
            </div>
        `;
    }

    async stateChanged() {
        super.stateChanged();
    }

    updated(changes: Map<string, any>) {
        if (changes.has("_menuOpen")) {
            this.classList.toggle("menu-open", this._menuOpen);
        }

        const theme = this.theme;
        document.body.classList.toggle("theme-dark", theme === "dark");
        document.body.classList.toggle("theme-light", theme === "light");
    }

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("toggle-menu", () => this._toggleMenu());
        this.addEventListener("dialog-open", (e: any) => this._dialogOpen(e));
        this.addEventListener("dialog-close", () => this._dialogClose());
        this.addEventListener("create-item", () => this._newItem());
        this.addEventListener("field-dragged", (e: any) => this._fieldDragged(e));
        window.addEventListener("backbutton", () => this._androidBack());
        //this.addEventListener("enable-biometric-auth", (e: any) => this._enableBiometricAuth(e));
        document.addEventListener("keydown", (e: KeyboardEvent) => this._keydown(e));
    }

    _toggleMenu() {
        this._menuOpen = !this._menuOpen;
    }

    _closeMenu(e: MouseEvent) {
        this._menuOpen = false;
        e.preventDefault();
    }

    _dialogOpen(e: CustomEvent) {
        const dialog = e.target as Dialog<any, any>;
        this.classList.add("dialog-open");
        if (dialog.hideApp) {
            this.classList.add("hide-app");
        }
    }

    _dialogClose() {
        this.classList.remove("dialog-open");
        this.classList.remove("hide-app");
    }

    async _keydown(event: KeyboardEvent) {
        if (this.state.locked) {
            return;
        }

        const control = event.ctrlKey || event.metaKey;

        // ESCAPE -> Back
        if (event.key === "Escape") {
            if (Dialog.openDialogs.size) {
                Dialog.closeAll();
            }
        }
        // CTRL/CMD (+ Shift) + F -> Search (All)
        else if (control && event.key === "f") {
            event.preventDefault();
            this.go("items", { name: undefined, email: undefined });
            await wait(100);
            this._items.search();
        }
    }

    _androidBack() {
        if (!this.app.state.locked && router.canGoBack) {
            router.back();
        } else {
            navigator.Backbutton && navigator.Backbutton.goBack();
        }
    }

    async _newItem() {
        const vault = (router.params.vault && app.mainVault) || undefined;
        await this._createItemDialog.show(vault);
    }

    protected async _fieldDragged({
        detail: { event, item, index },
    }: CustomEvent<{ item: VaultItem; index: number; event: DragEvent }>) {
        const field = item.fields[index];
        const target = event.target as HTMLElement;
        target.classList.add("dragging");
        target.addEventListener("dragend", () => target.classList.remove("dragging"), { once: true });
        event.dataTransfer!.setData("text/plain", field.value);
    }
}
