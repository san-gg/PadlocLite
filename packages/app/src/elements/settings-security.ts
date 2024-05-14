import "./drawer";
import "./popover";
import "./list";
import "./button";
import "./scroller";
import { html, LitElement } from "lit";
import { StateMixin } from "../mixins/state";
import { app, router } from "../globals";
import { prompt, alert, choose } from "../lib/dialog";
import { translate as $l } from "@padloc/locale/src/translate";
import { ToggleButton } from "./toggle-button";
import { customElement, query } from "lit/decorators.js";
import { shared } from "../styles";
import { Slider } from "./slider";
import { Routing } from "../mixins/routing";
import { passwordStrength } from "../lib/util";
import { auditVault } from "../lib/audit";
import "./icon";

@customElement("pl-settings-security")
export class SettingsSecurity extends StateMixin(Routing(LitElement)) {
    readonly routePattern = /^settings\/security/;

    @query("#securityReportWeakToggle")
    private _securityReportWeakToggle: ToggleButton;

    @query("#securityReportReusedToggle")
    private _securityReportReusedToggle: ToggleButton;

    @query("#securityReportCompromisedToggle")
    private _securityReportCompromisedToggle: ToggleButton;

    @query("#securityReportExpiredToggle")
    private _securityReportExpiredToggle: ToggleButton;

    connectedCallback() {
        super.connectedCallback();
        this.addEventListener("change", () => this._updateSettings());
    }

    //* Opens the change password dialog and resets the corresponding input elements
    private async _changePassword(askForExisting = true): Promise<void> {
        const oldPassword =
            !askForExisting ||
            (await prompt($l("Please enter your current password!"), {
                title: $l("Change Master Password"),
                label: $l("Enter Current Password"),
                type: "password",
                validate: async (pwd) => {
                    try {
                        await app.account!.unlock(pwd);
                    } catch (e) {
                        throw $l("Wrong password! Please try again!");
                    }

                    return pwd;
                },
            }));

        if (!oldPassword) {
            return;
        }

        const newPassword = await prompt($l("Now choose a new master password!"), {
            title: $l("Change Master Password"),
            label: $l("Enter New Password"),
            type: "password",
            validate: async (val: string) => {
                if (val === "") {
                    throw $l("Please enter a password!");
                }
                return val;
            },
        });

        const strength = await passwordStrength(newPassword);

        if (strength.score < 2) {
            const choice = await choose(
                $l(
                    "The password you entered is weak which makes it easier for attackers to break " +
                        "the encryption used to protect your data. Try to use a longer password or include a " +
                        "variation of uppercase, lowercase and special characters as well as numbers!"
                ),
                [$l("Choose Different Password"), $l("Use Anyway")],
                {
                    type: "warning",
                    title: $l("WARNING: Weak Password"),
                    icon: null,
                    preventDismiss: true,
                }
            );
            if (choice === 0) {
                return this._changePassword(false);
            }
        }

        if (newPassword === null) {
            return;
        }

        const confirmed = await prompt($l("Please confirm your new password!"), {
            title: $l("Change Master Password"),
            label: $l("Repeat New Password"),
            type: "password",
            validate: async (pwd) => {
                if (pwd !== newPassword) {
                    throw "Wrong password! Please try again!";
                }

                return pwd;
            },
        });

        if (!confirmed) {
            return;
        }

        await app.changePassword(oldPassword, newPassword);
        alert($l("Master password changed successfully."), { type: "success" });
    }

    private async _updateSettings() {
        await app.setSettings({
            autoLock: (this.renderRoot.querySelector("#autoLockButton") as ToggleButton).active,
            autoLockDelay: (this.renderRoot.querySelector("#autoLockDelaySlider") as Slider).value,
        });
        await app.updateAccount(async (account) => {
            account.settings.securityReport.weakPasswords = this._securityReportWeakToggle.active;
            account.settings.securityReport.reusedPasswords = this._securityReportReusedToggle.active;
            account.settings.securityReport.compromisedPaswords = this._securityReportCompromisedToggle.active;
            account.settings.securityReport.expiredItems = this._securityReportExpiredToggle.active;
        });
        await auditVault(true);
    }

    static styles = [shared];

    private _renderSecurityReport() {
        return html`
            <div class="box">
                <h2 class="padded uppercase bg-dark border-bottom semibold">${$l("Security Report")}</h2>

                <div>
                    <pl-toggle-button
                        class="transparent"
                        id="securityReportWeakToggle"
                        .active=${app.account?.settings.securityReport.weakPasswords || false}
                        .label=${html`<div class="horizontal center-aligning spacing layout">
                            <pl-icon icon="weak"></pl-icon>
                            <div>${$l("Weak Passwords")}</div>
                        </div>`}
                        reverse
                    >
                    </pl-toggle-button>
                </div>

                <div class="border-top">
                    <pl-toggle-button
                        class="transparent"
                        id="securityReportReusedToggle"
                        .active=${app.account?.settings.securityReport.reusedPasswords || false}
                        .label=${html`<div class="horizontal center-aligning spacing layout">
                            <pl-icon icon="reused"></pl-icon>
                            <div>${$l("Reused Passwords")}</div>
                        </div>`}
                        reverse
                    >
                    </pl-toggle-button>
                </div>

                <div class="border-top">
                    <pl-toggle-button
                        class="transparent"
                        id="securityReportCompromisedToggle"
                        .active=${app.account?.settings.securityReport.compromisedPaswords || false}
                        .label=${html`<div class="horizontal center-aligning spacing layout">
                            <pl-icon icon="compromised"></pl-icon>
                            <div>${$l("Compromised Passwords")}</div>
                        </div>`}
                        reverse
                    >
                    </pl-toggle-button>
                </div>

                <div class="border-top">
                    <pl-toggle-button
                        class="transparent"
                        id="securityReportExpiredToggle"
                        .active=${app.account?.settings.securityReport.expiredItems || false}
                        .label=${html`<div class="horizontal center-aligning spacing layout">
                            <pl-icon icon="expired"></pl-icon>
                            <div>${$l("Expiring or Expired Items")}</div>
                        </div>`}
                        reverse
                    >
                    </pl-toggle-button>
                </div>
            </div>
        `;
    }

    render() {
        return html`
            <div class="fullbleed vertical layout stretch background">
                <header class="padded center-aligning horizontal layout">
                    <pl-button class="transparent slim back-button" @click=${() => router.go("settings")}>
                        <pl-icon icon="backward"></pl-icon>
                    </pl-button>
                    <pl-icon icon="lock" class="left-margined vertically-padded wide-only"></pl-icon>
                    <div class="padded stretch ellipsis">${$l("Security")}</div>
                </header>

                <pl-scroller class="stretch">
                    <div class="wrapper double-padded double-spacing vertical layout">
                        <div class="box">
                            <h2 class="padded uppercase bg-dark border-bottom semibold">${$l("Master Password")}</h2>

                            <pl-button class="transparent" @click=${() => this._changePassword()}>
                                ${$l("Change Master Password")}
                            </pl-button>
                        </div>

                        <div class="box">
                            <h2 class="padded uppercase bg-dark border-bottom semibold">${$l("Auto Lock")}</h2>

                            <div>
                                <pl-toggle-button
                                    class="transparent"
                                    id="autoLockButton"
                                    .active=${app.settings.autoLock}
                                    .label=${$l("Lock Automatically")}
                                    reverse
                                >
                                </pl-toggle-button>
                            </div>

                            <pl-drawer .collapsed=${!app.settings.autoLock}>
                                <div class="half-padded border-top">
                                    <pl-slider
                                        id="autoLockDelaySlider"
                                        min="${["ios", "android"].includes(
                                            app.state.device.platform.toLowerCase() || ""
                                        )
                                            ? "0"
                                            : "1"}"
                                        max="10"
                                        step="1"
                                        .value=${app.settings.autoLockDelay}
                                        .unit=${$l(" min")}
                                        .label=${$l("After")}
                                        class="item"
                                    >
                                    </pl-slider>
                                </div>
                            </pl-drawer>
                        </div>

                        ${this._renderSecurityReport()}
                    </div>
                </pl-scroller>
            </div>
        `;
    }
}
