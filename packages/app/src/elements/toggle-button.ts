import { shared } from "../styles";
import { Toggle } from "./toggle";
import "./button";
import { customElement, property, query } from "lit/decorators.js";
import { css, html, LitElement, TemplateResult } from "lit";

@customElement("pl-toggle-button")
export class ToggleButton extends LitElement {
    @property({ type: Boolean })
    active: boolean = false;

    @property({ type: Boolean, reflect: true })
    reverse: boolean = false;

    @property()
    label: string | TemplateResult = "";

    @query("pl-toggle")
    _toggle: Toggle;

    static styles = [
        shared,
        css`
            pl-toggle {
                display: inline-block;
                pointer-events: none;
            }

            :host(.transparent) pl-button {
                --button-ghost-border-color: transparent;
            }
        `,
    ];

    render() {
        const { active, label } = this;
        return html`
            <pl-button class="horizontal center-aligning spacing layout ghost" @click=${() => this.toggle()}>
                <div class="text-left-aligning stretch ellipsis">
                    ${label}
                    <slot></slot>
                </div>

                <pl-toggle .active=${active} @change=${() => (this.active = this._toggle.active)}></pl-toggle>
            </pl-button>
        `;
    }

    toggle() {
        this._toggle.toggle();
    }
}
