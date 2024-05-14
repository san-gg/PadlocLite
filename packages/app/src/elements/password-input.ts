import { Input } from "./input";
import "./icon";
import "./button";
import { customElement } from "lit/decorators.js";
import { css, html } from "lit";

@customElement("pl-password-input")
export class PasswordInput extends Input {
    constructor() {
        super();
        this.type = "password";
    }

    static styles = [
        ...Input.styles,
        css`
            input {
                font-family: var(--font-family-mono);
            }

            ::placeholder {
                font-family: var(--font-family);
            }
        `,
    ];

    _renderAfter() {
        return html`
            <pl-button class="slim right-half-margined transparent round" @click=${this._toggleMasked}>
                <pl-icon icon="${this.type === "password" ? "show" : "hide"}"> </pl-icon>
            </pl-button>
        `;
    }

    private _toggleMasked() {
        this.type = this.type === "password" ? "text" : "password";
    }
}
