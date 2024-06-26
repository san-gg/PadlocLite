import "./drawer";
import "./button";
import "./scroller";
import { html, LitElement } from "lit";
import { StateMixin } from "../mixins/state";
import { customElement, query } from "lit/decorators.js";
import { shared } from "../styles";
import { app, router } from "../globals";
import { translate as $l } from "@padloc/locale/src/translate";
import { prompt, confirm, alert } from "../lib/dialog";
import { Input } from "./input";
import { Routing } from "../mixins/routing";

@customElement("pl-settings-account")
export class SettingsAccount extends Routing(StateMixin(LitElement)) {
    routePattern = /^settings\/account/;

    get hasChanges() {
        return (
            !!app.account &&
            this._nameInput &&
            (app.account.name !== this._nameInput.value || app.account.email !== this._emailInput.value)
        );
    }

    @query("#nameInput")
    private _nameInput: Input;

    @query("#emailInput")
    private _emailInput: Input;

    private async _updateNameAndEmail() {
        if (!this._emailInput.reportValidity()) {
            return;
        }

        if (this._emailInput.value !== app.account!.email) {
            let message = $l(
                "Are you sure you want to change your email address to {0}? Please enter your master password to continue.",
                this._emailInput.value
            );

            const confirmed = await prompt(message, {
                title: $l("Change Email Address"),
                label: $l("Enter Master Password"),
                type: "password",
                confirmLabel: $l("Continue"),
                validate: async (pwd) => {
                    try {
                        await app.account!.unlock(pwd);
                    } catch (e) {
                        throw $l("Wrong password! Please try again!");
                    }

                    return pwd;
                },
            });

            if (!confirmed) {
                return;
            }

            try {
                await app.changeEmail(this._emailInput.value);
                await alert($l("Your email address has been changed successfully!"), {
                    type: "success",
                    title: "Change Email Address",
                });
            } catch (e) {
                await alert(e.message, { type: "warning" });
            }
        }
        if (this._nameInput.value !== app.account!.name) {
            try {
                await app.updateAccount(async (account) => (account.name = this._nameInput.value));
            } catch (e) {
                alert(e.message, { type: "warning" });
            }
        }
    }

    private _resetNameAndEmail() {
        this._nameInput.value = app.account?.name || "";
        this._emailInput.value = app.account?.email || "";
        this.requestUpdate();
    }

    static styles = [shared];

    private async _logout() {
        const confirmed = await confirm($l("Do you really want to log out?"), $l("Log Out"));
        if (confirmed) {
            await app.logout();
            router.go("start");
        }
    }

    private async _deleteAccount() {
        const success = await prompt($l("Please enter your master password to proceed."), {
            title: $l("Delete Account"),
            label: $l("Enter Master Password"),
            type: "password",
            validate: async (pwd) => {
                try {
                    await app.account!.unlock(pwd);
                } catch (e) {
                    throw $l("Wrong password! Please try again!");
                }

                return pwd;
            },
        });

        if (!success) {
            return;
        }

        const deleted = await prompt(
            html`
                <div>
                    ${$l(
                        "Are you sure you want to delete this account? " +
                            "All associated vaults and the data within them will be lost and any active subscriptions will be canceled immediately. " +
                            "This action can not be undone!"
                    )}
                </div>
            `,
            {
                type: "destructive",
                title: $l("Delete Account"),
                confirmLabel: $l("Delete"),
                placeholder: $l("Type 'DELETE' to confirm"),
                validate: async (val) => {
                    if (val !== "DELETE") {
                        throw $l("Type 'DELETE' to confirm");
                    }

                    try {
                        await app.deleteAccount();
                    } catch (e) {
                        throw e.message || $l("Something went wrong. Please try again later!");
                    }

                    return val;
                },
            }
        );

        if (deleted) {
            router.go("");
        }
    }

    render() {
        if (!app.account) {
            return;
        }
        return html`
            <div class="fullbleed vertical layout stretch background">
                <header class="padded center-aligning horizontal layout">
                    <pl-button class="transparent slim back-button" @click=${() => router.go("settings")}>
                        <pl-icon icon="backward"></pl-icon>
                    </pl-button>
                    <pl-icon icon="user" class="left-margined vertically-padded wide-only"></pl-icon>
                    <div class="padded stretch ellipsis">${$l("Account")}</div>
                </header>

                <pl-scroller class="stretch">
                    <div class="padded">
                        <div class="margined box">
                            <h2 class="padded uppercase bg-dark border-bottom semibold">${$l("Profile")}</h2>

                            <div>
                                <div class="list-item">
                                    <pl-input
                                        id="emailInput"
                                        .label=${$l("Email")}
                                        .value=${app.account.email}
                                        @input=${() => this.requestUpdate()}
                                        type="email"
                                        class="transparent"
                                        @enter=${this._updateNameAndEmail}
                                    ></pl-input>
                                </div>

                                <div class="list-item">
                                    <pl-input
                                        id="nameInput"
                                        .label=${$l("Display Name")}
                                        .value=${app.account.name}
                                        @input=${() => this.requestUpdate()}
                                        class="transparent"
                                        @enter=${this._updateNameAndEmail}
                                    ></pl-input>
                                </div>
                            </div>

                            <pl-drawer .collapsed=${!this.hasChanges}>
                                <div class="horizontal padded spacing evenly stretching layout border-top">
                                    <pl-button class="primary" @click=${this._updateNameAndEmail}
                                        >${$l("Save")}</pl-button
                                    >
                                    <pl-button @click=${this._resetNameAndEmail}>${$l("Cancel")}</pl-button>
                                </div>
                            </pl-drawer>
                        </div>

                        <div class="horizontal padded spacing evenly stretching layout">
                            <pl-button @click=${() => this._logout()}>${$l("Log Out")}</pl-button>

                            <pl-button @click=${() => this._deleteAccount()} class="ghost">
                                ${$l("Delete Account")}
                            </pl-button>
                        </div>
                    </div>
                </pl-scroller>
            </div>
        `;
    }
}
