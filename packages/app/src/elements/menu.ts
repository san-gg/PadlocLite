import { translate as $l } from "@padloc/locale/src/translate";
import { ErrorCode } from "@padloc/core/src/error";
import { Vault } from "@padloc/core/src/vault";
import { app } from "../globals";
import { shared } from "../styles";
import { alert } from "../lib/dialog";
import { StateMixin } from "../mixins/state";
import { Routing } from "../mixins/routing";
import "./logo";
import "./button";
import "./drawer";
import "./scroller";
import "./list";
import "./popover";
import { customElement, property, state } from "lit/decorators.js";
import { css, html, LitElement } from "lit";
import "./icon";

@customElement("pl-menu")
export class Menu extends Routing(StateMixin(LitElement)) {
    readonly routePattern = /^([^\/]+)(?:\/([^\/]+)\/([^\/]+))?/;

    @property()
    selected: string;

    @state()
    private _expanded = new Set<string>();

    async handleRoute(
        [page]: [string, string, string],
        { vault, tag, favorites, attachments, host }: { [prop: string]: string }
    ) {
        this._expanded.clear();
        if (page === "items") {
            if (vault) {
                this.selected = `vault/${vault}`;
            } else if (tag) {
                this.selected = `tag/${tag}`;
                this._expanded.add(`tags`);
            } else if (favorites) {
                this.selected = "favorites";
            } else if (attachments) {
                this.selected = "attachments";
            } else if (host) {
                this.selected = "host";
            } else {
                this.selected = "items";
            }
        }

        await this.updateComplete;
    }

    private _goTo(path: string, params?: any, e?: Event) {
        this.dispatchEvent(new CustomEvent("toggle-menu", { bubbles: true, composed: true }));
        this.go(path, params);
        e && e.stopPropagation();
    }

    private async _lock() {
        this.dispatchEvent(new CustomEvent("toggle-menu", { bubbles: true, composed: true }));
        await app.lock();
        this.go("unlock");
    }

    private _displayVaultError(vault: Vault, e?: Event) {
        e && e.stopPropagation();

        const error = vault.error!;

        switch (error.code) {
            case ErrorCode.UNSUPPORTED_VERSION:
                alert(
                    error.message ||
                        $l(
                            "A newer version of {0} is required to synchronize this vault. Please update to the latest version now!",
                            process.env.PL_APP_NAME!
                        ),
                    {
                        title: "Update Required",
                        type: "warning",
                    }
                );
                return;
            case ErrorCode.DECRYPTION_FAILED:
            case ErrorCode.ENCRYPTION_FAILED:
                alert(
                    error.message ||
                        $l(
                            "This vault could not be synchronized because you currently don't have access to it's data."
                        ),
                    {
                        title: "Sync Failed",
                        type: "warning",
                    }
                );
                return;
            default:
                alert(
                    error.message ||
                        $l(
                            "An unknown error occured while synchronizing this vault. If this problem persists please contact customer support."
                        ),
                    {
                        title: "Sync Failed",
                        type: "warning",
                    }
                );
                return;
        }
    }

    private _toggleExpanded(val: string) {
        this._expanded.has(val) ? this._expanded.delete(val) : this._expanded.add(val);
        this.requestUpdate();
    }

    private _nextTheme() {
        const currTheme = app.settings.theme;
        app.setSettings({ theme: currTheme === "auto" ? "dark" : currTheme === "dark" ? "light" : "auto" });
    }

    static styles = [
        shared,
        css`
            :host {
                display: flex;
                flex-direction: column;
                position: relative;
                background: var(--menu-background);
                color: var(--color-foreground);
                border-right: solid 1px var(--border-color);
            }

            .sub-list {
                font-size: var(--font-size-small);
                display: block;
                padding-left: calc(2 * var(--spacing));
                padding-right: 0.3em;
            }

            pl-logo {
                height: var(--menu-logo-height, 2.5em);
                width: var(--menu-logo-width, auto);
                margin: 1em auto 0 auto;
            }

            .menu-item {
                margin: 0 var(--spacing);
            }

            .menu-item:not(:last-child) {
                margin-bottom: calc(0.5 * var(--spacing));
            }

            .syncing {
                width: 20px;
                height: 20px;
                margin: 5px;
            }

            .section-header {
                margin: 0.5em 1.5em;
            }

            .errors-button {
                background: var(--color-negative);
                padding: 0;
                padding-right: 8px;
                display: flex;
                align-items: center;
                font-weight: bold;
            }

            .menu-footer {
                border-top: var(--menu-footer-border);
            }

            .menu-footer-button {
                --button-background: transparent;
                --button-color: var(--menu-footer-button-color, var(--button-color));
                --button-padding: var(--menu-footer-button-padding, var(--button-padding));
                --button-border-color: transparent;
                width: var(--menu-footer-button-width);
            }

            .menu-footer-button-icon {
                font-size: var(--menu-footer-button-icon-size);
                color: var(--menu-footer-button-color, var(--button-color));
            }

            .menu-footer-button-label {
                font-size: var(--menu-footer-button-label-size);
                color: var(--menu-footer-button-color, var(--button-color));
            }
        `,
    ];

    render() {
        const mainVault = app.mainVault;

        const tags = app.tags.filter((tag) => !tag.unlisted && !!tag.count);

        const count = app.count;

        const currentHost =
            this.app.state.context.browser?.url &&
            new URL(this.app.state.context.browser.url).hostname.replace(/^www\./, "");

        return html`
            <div class="padded">
                <pl-logo reveal></pl-logo>

                <div class="subtle tiny text-centering">SanGG: v${process.env.PL_VENDOR_VERSION}</div>

                <div class="spacer"></div>
            </div>

            <pl-scroller class="stretch">
                <pl-list itemSelector=".menu-item">
                    <div class="small subtle section-header">${$l("Vault & Items")}</div>

                    ${currentHost
                        ? html`
                              <div
                                  class="menu-item"
                                  role="link"
                                  @click=${() => this._goTo("items", { host: true })}
                                  aria-selected=${this.selected === "host"}
                                  ?hidden=${!count.currentHost}
                              >
                                  <pl-icon icon="web"></pl-icon>

                                  <div class="stretch ellipsis">${currentHost}</div>

                                  <div class="small subtle">${count.currentHost}</div>
                              </div>
                          `
                        : ""}

                    <div
                        class="menu-item"
                        role="link"
                        @click=${() => this._goTo("items", {})}
                        aria-selected=${this.selected === "items"}
                    >
                        <pl-icon icon="vaults"></pl-icon>
                        <div class="stretch">${$l("My Vault")}</div>
                        ${mainVault && mainVault.error
                            ? html`
                                  <pl-button
                                      class="small negative borderless skinny negatively-margined"
                                      @click=${(e: Event) => this._displayVaultError(mainVault, e)}
                                  >
                                      <pl-icon icon="error"></pl-icon>
                                  </pl-button>
                              `
                            : html` <div class="small subtle">${count.total}</div> `}
                    </div>

                    <div
                        class="menu-item favorites"
                        role="link"
                        @click=${() => this._goTo("items", { favorites: true })}
                        aria-selected=${this.selected === "favorites"}
                    >
                        <pl-icon icon="favorite"></pl-icon>

                        <div class="stretch">${$l("Favorites")}</div>

                        <div class="small subtle">${count.favorites}</div>
                    </div>

                    <div
                        class="menu-item"
                        @click=${() => this._goTo("items", { attachments: true })}
                        aria-selected=${this.selected === "attachments"}
                    >
                        <pl-icon icon="attachment"></pl-icon>

                        <div class="stretch">${$l("Attachments")}</div>

                        <div class="small subtle">${count.attachments}</div>
                    </div>

                    <div>
                        <div
                            class="menu-item"
                            @click=${() => this._toggleExpanded("tags")}
                            aria-expanded=${this._expanded.has("tags")}
                        >
                            <pl-icon icon="tags"></pl-icon>
                            <div class="stretch ellipsis">${$l("Tags")}</div>
                            <pl-button
                                class="small transparent round slim negatively-margined reveal-on-parent-hover"
                                @click=${(e: Event) => this._goTo(`settings/tags`, undefined, e)}
                            >
                                <pl-icon icon="settings"></pl-icon>
                            </pl-button>
                            <pl-icon icon="chevron-down" class="small subtle dropdown-icon"></pl-icon>
                        </div>

                        <pl-drawer .collapsed=${!this._expanded.has("tags")}>
                            <pl-list class="sub-list">
                                ${tags.map(
                                    ({ name, count, color }) => html`
                                        <div
                                            class="menu-item"
                                            @click=${() => this._goTo("items", { tag: name })}
                                            aria-selected=${this.selected === `tag/${name}`}
                                            style="color: ${color || "inherit"}"
                                        >
                                            <pl-icon icon="tag"></pl-icon>

                                            <div class="stretch ellipsis">${name}</div>

                                            <div class="small subtle">${count}</div>
                                        </div>
                                    `
                                )}

                                <div class="menu-item subtle" @click=${() => this._goTo(`settings/tags`)}>
                                    <pl-icon icon="settings"></pl-icon>

                                    <div class="stretch">${$l("Manage Tags")}</div>
                                </div>
                            </pl-list>
                        </pl-drawer>
                    </div>

                    <div class="small subtle section-header">${$l("More")}</div>

                    <div
                        class="menu-item"
                        @click=${() =>
                            this._goTo("report", { recent: undefined, attachments: undefined, favorites: undefined })}
                        aria-selected=${this.selected === "report"}
                    >
                        <pl-icon icon="audit-pass"></pl-icon>

                        <div class="stretch">${$l("Security Report")}</div>

                        ${count.report ? html` <div class="small negative highlighted">${count.report}</div> ` : ""}
                    </div>

                    <div
                        class="menu-item"
                        @click=${() =>
                            this._goTo("generator", {
                                recent: undefined,
                                attachments: undefined,
                                favorites: undefined,
                            })}
                        aria-selected=${this.selected === "generator"}
                    >
                        <pl-icon icon="generate"></pl-icon>

                        <div class="stretch">${$l("Password Generator")}</div>
                    </div>

                    <div
                        class="menu-item"
                        @click=${() =>
                            this._goTo("settings", { recent: undefined, attachments: undefined, favorites: undefined })}
                        aria-selected=${this.selected === "settings"}
                    >
                        <pl-icon icon="settings"></pl-icon>

                        <div class="stretch">${$l("Settings")}</div>
                    </div>

                    <div
                        class="menu-item"
                        @click=${() =>
                            this._goTo("support", { recent: undefined, attachments: undefined, favorites: undefined })}
                        aria-selected=${this.selected === "support"}
                    >
                        <pl-icon icon="support"></pl-icon>

                        <div class="stretch">${$l("About")}</div>
                    </div>

                    <div class="spacer"></div>
                </pl-list>
            </pl-scroller>

            <div class="half-padded center-aligning horizontal layout menu-footer">
                <pl-button class="menu-footer-button" @click=${this._lock} title="${$l("Lock App")}">
                    <div class="vertical centering layout">
                        <pl-icon icon="lock" class="menu-footer-button-icon"></pl-icon>
                        <div class="menu-footer-button-label">Lock</div>
                    </div>
                </pl-button>
                <pl-button class="menu-footer-button" @click=${this._nextTheme} title="Theme: ${app.settings.theme}">
                    <div class="vertical centering layout">
                        <pl-icon icon="theme-${app.settings.theme}" class="menu-footer-button-icon"></pl-icon>
                        <div class="menu-footer-button-label">Theme</div>
                    </div>
                </pl-button>
                <pl-popover
                    class="double-padded tiny"
                    trigger="hover"
                    .preferAlignment=${["top", "top-left", "top-right"]}
                >
                    <strong>${$l("Theme:")}</strong> ${app.settings.theme}
                </pl-popover>
            </div>
        `;
    }
}
