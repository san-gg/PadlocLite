import { translate as $l } from "@padloc/locale/src/translate";
import "../elements/generator";
import "../elements/alert-dialog";
import "../elements/prompt-dialog";
import "../elements/export-dialog";
import { AlertDialog, AlertOptions } from "../elements/alert-dialog";
import { PromptDialog, PromptOptions } from "../elements/prompt-dialog";
import { getSingleton } from "./singleton";
import { LitElement, TemplateResult } from "lit";

let lastDialogPromise = Promise.resolve();
let currentDialog: any;

export const getDialog = getSingleton;

export function lineUpDialog(d: string | any, fn: (d: any) => Promise<any>): Promise<any> {
    const dialog = typeof d === "string" ? getSingleton(d) : d;
    const promise = lastDialogPromise.then(() => {
        currentDialog = dialog;
        return fn(dialog);
    });

    lastDialogPromise = promise;

    return promise;
}

export function alert(message: string | TemplateResult, options?: AlertOptions, instant = false): Promise<number> {
    options = options || {};
    options.message = message;
    return instant
        ? getDialog("pl-alert-dialog").show(options)
        : lineUpDialog("pl-alert-dialog", (dialog: AlertDialog) => dialog.show(options));
}

export async function confirm(
    message: string | TemplateResult,
    confirmLabel = $l("Confirm"),
    cancelLabel = $l("Cancel"),
    options: any = {},
    instant?: boolean
) {
    options.options = [confirmLabel, cancelLabel];
    options.type = options.type || "question";
    options.horizontal = typeof options.horizontal !== "undefined" ? options.horizontal : true;
    const choice = await alert(message, options, instant);
    return choice === 0;
}

export function prompt(message: string | TemplateResult, opts: PromptOptions = {}, instant = false) {
    opts.message = message;
    return instant
        ? getDialog("pl-prompt-dialog").show(opts)
        : lineUpDialog("pl-prompt-dialog", (dialog: PromptDialog) => dialog.show(opts));
}

export function choose(
    message: string,
    options: (string | TemplateResult)[],
    opts: AlertOptions = {}
): Promise<number> {
    opts.options = options;
    return alert(message, {
        ...opts,
        options,
        type: "choice",
        vertical: true,
    });
}

export function generate() {
    return lineUpDialog("pl-generator", (dialog) => dialog.show());
}

export function clearDialogs() {
    if (currentDialog) {
        currentDialog.open = false;
    }
    lastDialogPromise = Promise.resolve();
}

export function dialog(name: string) {
    return (prototype: LitElement, propertyName: string) => {
        Object.defineProperty(prototype, propertyName, {
            get() {
                return getDialog(name);
            },
            enumerable: true,
            configurable: true,
        });
    };
}
