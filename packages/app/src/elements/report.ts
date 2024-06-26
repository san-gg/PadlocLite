import { translate as $l } from "@padloc/locale/src/translate";
import { AuditType, VaultItem } from "@padloc/core/src/item";
import { customElement, state } from "lit/decorators.js";
import { css, html } from "lit";
import { app } from "../globals";
import { StateMixin } from "../mixins/state";
import { Routing } from "../mixins/routing";
import { View } from "./view";
import { descriptionForAudit, iconForAudit, titleTextForAudit } from "../lib/audit";
import { Vault } from "@padloc/core/src/vault";
import "./popover";
import "./rich-content";

@customElement("pl-report")
export class Audit extends StateMixin(Routing(View)) {
    readonly routePattern = /^report/;

    @state()
    private _selected: Vault | null = null;

    private get _items() {
        const filterBy = this._selected;

        if (filterBy instanceof Vault) {
            return app.auditedItems.filter((item) => item.vault.id === filterBy.id);
        } else {
            return app.auditedItems;
        }
    }

    shouldUpdate() {
        return !!app.account;
    }

    static styles = [
        ...View.styles,
        css`
            .counts {
                display: grid;
                grid-gap: 1em;
                margin: 0 0.5em;
                grid-template-columns: repeat(auto-fit, minmax(20em, 1fr));
            }

            @media (max-width: 700px) {
                .counts {
                    grid-template-columns: repeat(auto-fit, minmax(15em, 1fr));
                }
            }
        `,
    ];

    render() {
        const allItems = app.auditedItems;
        this._selected = app.mainVault;
        return html`
            <div class="fullbleed vertical layout">
                <header class="padded">
                    <div class="spacing center-aligning horizontal layout">
                        <pl-button
                            class="transparent skinny menu-button header-title"
                            @click=${() =>
                                this.dispatchEvent(new CustomEvent("toggle-menu", { composed: true, bubbles: true }))}
                        >
                            <div class="half-margined horizontal spacing center-aligning layout text-left-aligning">
                                <pl-icon icon="audit-pass"></pl-icon>
                                <div class="stretch ellipsis">${$l("Security Report")}</div>
                            </div>
                        </pl-button>

                        <div class="stretch"></div>

                        <pl-button class="transparent slim" @click=${() => this.router.go("settings/security")}
                            ><pl-icon icon="settings"></pl-icon
                        ></pl-button>
                    </div>
                    <div class="small horizontally-half-padded horizontal spacing wrapping layout">
                        <div class="slim menu-item" aria-selected="${"true"}">
                            <pl-icon icon="vault" class="right-margined"></pl-icon>
                            <div>${$l("My Vault")}</div>
                            <div class="small subtle">
                                ${allItems.filter((item) => item.vault.id === app.mainVault?.id).length}
                            </div>
                        </div>
                    </div>
                </header>
                <pl-scroller class="stretch vertically-padded"> ${this._renderResults()} </pl-scroller>
            </div>
        `;
    }

    private _renderResults() {
        if (
            !app.account?.settings.securityReport.weakPasswords &&
            !app.account?.settings.securityReport.reusedPasswords &&
            !app.account?.settings.securityReport.compromisedPaswords &&
            !app.account?.settings.securityReport.expiredItems
        ) {
            return html`
                <div class="fullbleed centering double-padded text-centering vertical layout">
                    <pl-icon icon="audit-fail" class="enormous thin subtle"></pl-icon>

                    <div class="subtle padded">${$l("All Security Reports have been disabled.")}</div>

                    <pl-button class="small top-margined ghost" @click=${() => this.router.go("settings/security")}>
                        <pl-icon class="right-margined" icon="settings"></pl-icon>
                        ${$l("Enable In Settings")}
                        <pl-icon class="left-margined" icon="arrow-right"></pl-icon>
                    </pl-button>
                </div>
            `;
        }

        const items = this._items;
        return html`
            <div class="counts">
                ${app.account?.settings.securityReport.weakPasswords
                    ? this._renderSection(items, AuditType.WeakPassword)
                    : ""}
                ${app.account?.settings.securityReport.reusedPasswords
                    ? this._renderSection(items, AuditType.ReusedPassword)
                    : ""}
                ${app.account?.settings.securityReport.compromisedPaswords
                    ? this._renderSection(items, AuditType.CompromisedPassword)
                    : ""}
                ${app.account?.settings.securityReport.expiredItems
                    ? this._renderSection(items, AuditType.ExpiredItem)
                    : ""}
            </div>
        `;
    }

    private _renderSection(listItems: { item: VaultItem; vault: Vault }[], type: AuditType) {
        listItems = listItems.filter(({ item }) => item.auditResults.some((res) => res.type === type));
        return html`
            <section class="box count">
                <h2 class="bg-dark border-bottom center-aligning spacing horizontal layout">
                    <pl-icon icon="${iconForAudit(type)}" class="left-margined"></pl-icon>
                    <div class="uppercase semibold">${titleTextForAudit(type)}</div>
                    <div class="small bold subtle">${listItems.length}</div>
                    <div class="stretch"></div>
                    <pl-button class="subtle skinny transparent half-margined">
                        <pl-icon icon="info-round"></pl-icon>
                    </pl-button>
                    <pl-popover class="small double-padded max-width-20em"> ${descriptionForAudit(type)} </pl-popover>
                </h2>
                ${listItems.length
                    ? html`
                          <pl-list>
                              ${listItems.slice(0, 5).map(
                                  (listItem) => html`
                                      <div
                                          class="list-item hover click"
                                          @click=${() => this.go(`items/${listItem.item.id}`)}
                                      >
                                          <pl-vault-item-list-item
                                              .item=${listItem.item}
                                              .vault=${listItem.vault}
                                              class="none-interactive"
                                          ></pl-vault-item-list-item>
                                      </div>
                                  `
                              )}
                          </pl-list>
                      `
                    : html`
                          <div class="small double-padded subtle text-centering">
                              <pl-icon icon="audit-pass" class="inline"></pl-icon> ${$l("Nothing Found")}
                          </div>
                      `}
                <pl-button
                    class="slim margined transparent"
                    @click=${() => this.go("items", { report: type })}
                    ?hidden=${listItems.length < 6}
                >
                    <div>${$l("Show All")}</div>
                    <pl-icon icon="arrow-right" class="small left-margined"></pl-icon>
                </pl-button>
            </section>
        `;
    }
}
