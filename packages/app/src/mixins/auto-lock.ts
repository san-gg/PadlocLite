import { Dialog } from "../elements/dialog";
import { app, router } from "../globals";

type Constructor<T> = new (...args: any[]) => T;

export function AutoLock<B extends Constructor<Object>>(baseClass: B) {
    return class extends baseClass {
        _pausedAt: Date | null = null;
        _lockTimeout?: number;

        get _lockDelay() {
            return app.settings.autoLockDelay * 60 * 1000;
        }

        constructor(...args: any[]) {
            super(...args);
            document.addEventListener("click", () => this._startTimer());
            document.addEventListener("keydown", () => this._startTimer());
            document.addEventListener("pause", () => this._pause());
            document.addEventListener("resume", () => this._resume());
        }

        _cancelAutoLock() {
            this._pausedAt = null;
            if (this._lockTimeout) {
                clearTimeout(this._lockTimeout);
            }
        }

        // Handler for cordova `pause` event. Records the current time for auto locking when resuming
        _pause() {
            this._pausedAt = new Date();
        }

        // Handler for cordova `resume` event. If auto lock is enabled and the specified time has passed
        // since the app was paused, locks the app
        _resume() {
            if (
                app.settings.autoLock &&
                !app.state.locked &&
                this._pausedAt &&
                new Date().getTime() - this._pausedAt.getTime() > this._lockDelay
            ) {
                this._doLock();
            }
            this._startTimer();
        }

        private async _doLock() {
            // if app is currently syncing restart the timer
            if (app.state.syncing) {
                this._startTimer();
                return;
            }

            Dialog.closeAll();
            await app.lock();
            router.go("unlock");
        }

        private _startTimer() {
            this._cancelAutoLock();
            if (app.settings.autoLock && !app.state.locked && this._lockDelay > 0) {
                this._lockTimeout = window.setTimeout(() => this._doLock(), this._lockDelay);
            }
        }
    };
}
