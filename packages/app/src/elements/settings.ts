import { translate as $l } from "@padloc/locale/src/translate";
import { app } from "../globals";
import { StateMixin } from "../mixins/state";
import { View } from "./view";
import "./icon";
import "./scroller";
import "./button";
import "./list";
import { customElement, state } from "lit/decorators.js";
import { css, html } from "lit";
import "./select";
import { Routing } from "../mixins/routing";
import "./settings-security";
import "./settings-tools";
import "./settings-account";
import "./settings-display";
import "./settings-extension";
import "./settings-tags";

@customElement("pl-settings")
export class Settings extends StateMixin(Routing(View)) {
    readonly routePattern = /^settings(?:\/(\w+))?/;

    private readonly _pages = ["", "account", "security", "display", "tools", "tags"];

    @state()
    private _page?: string;

    handleRoute([page]: [string]) {
        if (page && !this._pages.includes(page)) {
            this.redirect(`settings`);
            return;
        }

        this._page = page;
    }

    shouldUpdate() {
        return !!app.account;
    }

    static styles = [
        ...View.styles,
        css`
            .wrapper {
                max-width: 30em;
                margin: 0 auto;
            }

            .menu {
                width: 15em;
                border-right: solid 1px var(--border-color);
            }

            .selectable-list > :not(:last-child) {
                border-bottom: solid 1px var(--border-color);
            }

            .pane {
                --pane-left-width: var(--menu-width);
            }
        `,
    ];

    render() {
        return html`
            <div class="fullbleed pane layout ${this._page ? "open" : ""}">
                <div class="vertical layout menu">
                    <header class="padded spacing center-aligning horizontal layout">
                        <pl-button
                            class="transparent skinny menu-button header-title"
                            @click=${() =>
                                this.dispatchEvent(new CustomEvent("toggle-menu", { composed: true, bubbles: true }))}
                        >
                            <div class="half-margined horizontal spacing center-aligning layout text-left-aligning">
                                <pl-icon icon="settings"></pl-icon>
                                <div class="stretch ellipsis">${$l("Settings")}</div>
                            </div>
                        </pl-button>
                    </header>
                    <pl-scroller class="stretch">
                        <nav>
                            <pl-list>
                                <div
                                    role="link"
                                    class="double-padded center-aligning spacing horizontal layout list-item click hover"
                                    aria-selected=${this._page === "account"}
                                    @click=${() => this.go("settings/account")}
                                >
                                    <pl-icon icon="user"></pl-icon>
                                    <div class="stretch ellipsis">${$l("Account")}</div>
                                </div>
                                <div
                                    role="link"
                                    class="double-padded center-aligning spacing horizontal layout list-item click hover"
                                    aria-selected=${this._page === "security"}
                                    @click=${() => this.go("settings/security")}
                                >
                                    <pl-icon icon="lock"></pl-icon>
                                    <div class="stretch ellipsis">${$l("Security")}</div>
                                </div>
                                <div
                                    role="link"
                                    class="double-padded center-aligning spacing horizontal layout list-item click hover"
                                    aria-selected=${this._page === "display"}
                                    @click=${() => this.go("settings/display")}
                                >
                                    <pl-icon icon="display"></pl-icon>
                                    <div class="stretch ellipsis">${$l("Display")}</div>
                                </div>
                                <div
                                    role="link"
                                    class="double-padded center-aligning spacing horizontal layout list-item click hover"
                                    aria-selected=${this._page === "tags"}
                                    @click=${() => this.go("settings/tags")}
                                >
                                    <pl-icon icon="tags"></pl-icon>
                                    <div class="stretch ellipsis">${$l("Tags")}</div>
                                </div>
                                <div
                                    role="link"
                                    class="double-padded center-aligning spacing horizontal layout list-item click hover"
                                    aria-selected=${this._page === "tools"}
                                    @click=${() => this.go("settings/tools")}
                                >
                                    <pl-icon icon="tools"></pl-icon>
                                    <div class="stretch ellipsis">${$l("Tools")}</div>
                                </div>
                            </pl-list>
                        </nav>
                    </pl-scroller>
                </div>

                <div class="stretch background relative">
                    <pl-settings-security class="fullbleed" ?hidden=${this._page !== "security"}></pl-settings-security>

                    <pl-settings-tools class="fullbleed" ?hidden=${this._page !== "tools"}></pl-settings-tools>

                    <pl-settings-account class="fullbleed" ?hidden=${this._page !== "account"}></pl-settings-account>

                    <pl-settings-display class="fullbleed" ?hidden=${this._page !== "display"}></pl-settings-display>

                    <pl-settings-tags class="fullbleed" ?hidden=${this._page !== "tags"}></pl-settings-tags>

                    <pl-settings-billing class="fullbleed" ?hidden=${this._page !== "billing"}></pl-settings-billing>

                    <pl-settings-extension
                        class="fullbleed"
                        ?hidden=${this._page !== "extension"}
                    ></pl-settings-extension>
                </div>
            </div>
        `;
    }
}
