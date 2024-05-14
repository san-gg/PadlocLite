import { translate as $l } from "@padloc/locale/src/translate";
import { Serializable } from "./encoding";
import { CryptoProvider } from "./crypto";
import { Err, ErrorCode } from "./error";
import { StubCryptoProvider } from "./stub-crypto-provider";
import { Storage, MemoryStorage } from "./storage";
import { StartAuthRequestResponse } from "./params";

/**
 * Object representing all information available for a given device.
 */
export class DeviceInfo extends Serializable {
    /** Platform/Operating System running on the device */
    platform: string = "";

    /** OS version running on the device */
    osVersion: string = "";

    /** Padloc version installed on the device */
    appVersion: string = "";

    /** The user agent of the browser running the application */
    // userAgent: string = "";

    /** The devices locale setting */
    locale: string = "en";

    description: string = $l("Unknown Device");

    runtime: string = "";

    constructor(props?: Partial<DeviceInfo>) {
        super();
        props && Object.assign(this, props);
    }
}

/**
 * Generic interface for various platform APIs
 */
export interface Platform {
    /** Copies the given `text` to the system clipboard */
    setClipboard(text: string): Promise<void>;

    /** Retrieves the current text from the system clipboard */
    getClipboard(): Promise<string>;

    /** Get information about the current device */
    getDeviceInfo(): Promise<DeviceInfo>;

    crypto: CryptoProvider;

    storageDB: Storage;

    composeEmail(addr: string, subject: string, message: string): Promise<void>;

    openExternalUrl(_url: string): void;

    saveFile(name: string, type: string, contents: Uint8Array): Promise<void>;

    startAuthRequest(email: string): Promise<StartAuthRequestResponse>;
}

/**
 * Stub implementation of the [[Platform]] interface. Useful for testing
 */
export class StubPlatform implements Platform {
    crypto = new StubCryptoProvider();
    storageDB: Storage = new MemoryStorage();

    async setClipboard(_val: string) {
        throw new Err(ErrorCode.NOT_SUPPORTED);
    }

    async getClipboard() {
        throw new Err(ErrorCode.NOT_SUPPORTED);
        return "";
    }

    async composeEmail(_addr: string, _subject: string, _message: string) {
        throw new Err(ErrorCode.NOT_SUPPORTED);
    }

    async getDeviceInfo() {
        return new DeviceInfo();
    }

    openExternalUrl(_url: string) {
        throw new Err(ErrorCode.NOT_SUPPORTED);
    }

    async saveFile(_name: string, _type: string, _contents: Uint8Array) {
        throw new Error("Method not implemented.");
    }

    async startAuthRequest(email: string): Promise<StartAuthRequestResponse> {
        throw new Error("Method not implemented. <email: " + email + ">");
    }
}

let platform: Platform = new StubPlatform();

/**
 * Set the appropriate [[Platform]] implemenation for the current environment
 */
export function setPlatform(p: Platform) {
    platform = p;
}

/**
 * Get the current [[Platform]] implemenation
 */
export function getPlatform() {
    return platform;
}

/** Copies the given `text` to the system clipboard */
export function getClipboard() {
    return platform.getClipboard();
}

/** Retrieves the current text from the system clipboard */
export function setClipboard(val: string) {
    return platform.setClipboard(val);
}

/** Get information about the current device */
export function getDeviceInfo() {
    return platform.getDeviceInfo();
}

export function getCryptoProvider() {
    return platform.crypto;
}

export function getStorageDB() {
    return platform.storageDB;
}

export function composeEmail(addr: string, subject: string, message: string) {
    return platform.composeEmail(addr, subject, message);
}

export function saveFile(name: string, type: string, contents: Uint8Array): Promise<void> {
    return platform.saveFile(name, type, contents);
}

export function startAuthRequest(email: string): Promise<StartAuthRequestResponse> {
    return platform.startAuthRequest(email);
}

export function openExternalUrl(url: string) {
    return platform.openExternalUrl(url);
}
