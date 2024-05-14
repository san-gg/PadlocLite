import { Platform, StubPlatform, DeviceInfo } from "@padloc/core/src/platform";
import { bytesToBase64 } from "@padloc/core/src/encoding";
import { WebCryptoProvider } from "./crypto";
import { AuthType } from "@padloc/core/src/auth";
import { app } from "../globals";
import { translate as $l } from "@padloc/locale/src/translate";

const browserInfo = (async () => {
    const { default: UAParser } = await import(/* webpackChunkName: "ua-parser" */ "ua-parser-js");
    return new UAParser(navigator.userAgent).getResult();
})();

export class WebPlatform extends StubPlatform implements Platform {
    private _clipboardTextArea: HTMLTextAreaElement;

    crypto = new WebCryptoProvider();

    get supportedAuthTypes() {
        return [AuthType.Email];
    }

    // Set clipboard text using `document.execCommand("cut")`.
    // NOTE: This only works in certain environments like Google Chrome apps with the appropriate permissions set
    async setClipboard(text: string): Promise<void> {
        this._clipboardTextArea = this._clipboardTextArea || document.createElement("textarea");
        this._clipboardTextArea.contentEditable = "true";
        this._clipboardTextArea.readOnly = false;
        this._clipboardTextArea.value = text;
        document.body.appendChild(this._clipboardTextArea);
        const range = document.createRange();
        range.selectNodeContents(this._clipboardTextArea);

        const s = window.getSelection();
        s!.removeAllRanges();
        s!.addRange(range);
        this._clipboardTextArea.select();

        this._clipboardTextArea.setSelectionRange(0, this._clipboardTextArea.value.length);

        document.execCommand("cut");
        document.body.removeChild(this._clipboardTextArea);
    }

    // Get clipboard text using `document.execCommand("paste")`
    // NOTE: This only works in certain environments like Google Chrome apps with the appropriate permissions set
    async getClipboard(): Promise<string> {
        this._clipboardTextArea = this._clipboardTextArea || document.createElement("textarea");
        document.body.appendChild(this._clipboardTextArea);
        this._clipboardTextArea.value = "";
        this._clipboardTextArea.select();
        document.execCommand("paste");
        document.body.removeChild(this._clipboardTextArea);
        return this._clipboardTextArea.value;
    }

    async getDeviceInfo() {
        const { os, browser } = await browserInfo;
        const platform = (os.name && os.name.replace(" ", "")) || "";
        return new DeviceInfo({
            platform,
            osVersion: (os.version && os.version.replace(" ", "")) || "",
            appVersion: process.env.PL_VERSION || "",
            locale: navigator.language || "en",
            description:
                browser.name && browser.name !== "Electron"
                    ? $l("{0} on {1}", browser.name, platform)
                    : $l("{0} Device", platform),
            runtime: "web",
        });
    }

    // SanGG : Temporarily it is commented - it is required in reporte error dailog
    async composeEmail(addr: string, subj: string, msg: string) {
        window.open(`mailto:${addr}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(msg)}`, "_");
    }

    openExternalUrl(url: string) {
        window.open(url, "_blank");
    }

    async saveFile(name: string, type: string, contents: Uint8Array) {
        const a = document.createElement("a");
        a.href = `data:${type};base64,${bytesToBase64(contents, false)}`;
        a.download = name;
        a.rel = "noopener";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async startAuthRequest(email: string) {
        return app.api.startAuthRequest(email);
    }
}
