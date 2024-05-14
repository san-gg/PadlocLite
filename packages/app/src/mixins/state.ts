import { LitElement } from "lit";
import { app } from "../globals";

type Constructor<T> = new (...args: any[]) => T;

export const StateMixin = <T extends Constructor<LitElement>>(baseElement: T) =>
    class extends baseElement {
        get app() {
            return app;
        }

        get state() {
            return app.state;
        }

        get theme() {
            if (this.state.settings.theme === "auto") {
                return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
            }
            return this.state.settings.theme;
        }

        _stateHandler = this.stateChanged.bind(this);

        connectedCallback() {
            super.connectedCallback();

            app.subscribe(this._stateHandler);
            try {
                window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.stateChanged());
            } catch (e) {}
            this.stateChanged();
        }

        disconnectedCallback() {
            app.unsubscribe(this._stateHandler);

            super.disconnectedCallback();
        }

        /**
         * The `stateChanged()` method will be called when the state is updated.
         */
        protected stateChanged() {
            this.requestUpdate();
        }
    };
