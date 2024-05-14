import { Err, ErrorCode } from "@padloc/core/src/error";
import { translate as $l } from "@padloc/locale/src/translate";
import { app } from "../globals";
import { alert } from "../lib/dialog";

type Constructor<T> = new (...args: any[]) => T;

export interface ErrorHandling {
    handleError(error: any): Promise<boolean>;
}

export function ErrorHandling<B extends Constructor<Object>>(baseClass: B) {
    return class extends baseClass implements ErrorHandling {
        constructor(...args: any[]) {
            super(...args);
            window.addEventListener("error", (e: ErrorEvent) => this.handleError(e.error));
            window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => this.handleError(e.reason));
        }

        private _currentErrorHandling: Promise<boolean> = Promise.resolve(false);

        async handleError(error: any) {
            await this._currentErrorHandling;
            this._currentErrorHandling = this._handleError(error);
            return this._currentErrorHandling;
        }

        async _handleError(error: any) {
            error =
                error instanceof Err
                    ? error
                    : error instanceof Error
                    ? new Err(ErrorCode.UNKNOWN_ERROR, error.message, { error })
                    : new Err(ErrorCode.UNKNOWN_ERROR, error.toString());

            switch (error.code) {
                // These are expected to occur during a user lifecycle and can be ingored.
                case ErrorCode.ACCOUNT_EXISTS:
                case ErrorCode.AUTHENTICATION_REQUIRED:
                case ErrorCode.AUTHENTICATION_FAILED:
                case ErrorCode.AUTHENTICATION_TRIES_EXCEEDED:
                // case ErrorCode.PROVISIONING_NOT_ALLOWED:
                // case ErrorCode.PROVISIONING_QUOTA_EXCEEDED:
                case ErrorCode.OUTDATED_REVISION:
                case ErrorCode.INVALID_CREDENTIALS:
                    return true;

                case ErrorCode.UNSUPPORTED_VERSION:
                    await alert(
                        error.message ||
                            $l(
                                `Some data associated with your account was saved with a newer version of this app and cannot be decoded. Please install the latest version!`
                            ),
                        { title: $l("Update Required"), type: "warning" }
                    );
                case ErrorCode.UNKNOWN_ERROR:
                    if (error.message.indexOf("Failed to fetch") != -1) {
                        return true;
                    }

                default:
                    app.state._errors.push(error);
                    app.publish();
            }

            return false;
        }
    };
}
