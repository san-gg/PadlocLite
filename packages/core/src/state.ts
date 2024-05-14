import { Storable } from "./storage";
import { Serializable, AsSerializable, bytesToBase64, stringToBytes } from "./encoding";
import { PBKDF2Params } from "./crypto";
import { DeviceInfo, getCryptoProvider } from "./platform";
import { Err } from "./error";
import { Vault } from "./vault";
import { VaultItem } from "./item";
import { Account } from "./account";
import { Auth } from "./auth";

/** Various application settings */
export class Settings extends Serializable {
    id: string = "app-settings";
    /** Whether to lock app automatically after a certain period of inactivity */
    autoLock: boolean = true;
    /** Duration after which auto-lock is triggered, in minutes */
    autoLockDelay: number = 5;
    /** Interval for automatic sync, in minutes */
    syncInterval: number = 1;
    /** Time threshold used for filtering "recent" items, in days */
    recentLimit: number = 7;
    /** Color theme **/
    theme: "dark" | "light" | "auto" = "auto";
    /** Toggle favicons */
    favicons = true;
    /** Enable badge on web extension icon */
    extensionBadge = true;
    /** Unmask Fields on hover */
    unmaskFieldsOnHover = true;
}

export interface HashedItem {
    hosts: string[];
}

export class Index extends Serializable {
    @AsSerializable(PBKDF2Params)
    hashParams = new PBKDF2Params({ iterations: 1 });

    items: HashedItem[] = [];

    async fromItems(items: VaultItem[]) {
        const crypto = getCryptoProvider();

        if (!this.hashParams.salt.length) {
            this.hashParams.salt = await crypto.randomBytes(16);
        }

        this.items = (
            await Promise.all(
                items.map(async (item) => ({
                    hosts: (
                        await Promise.all(
                            item.fields
                                .filter((f) => f.type === "url")
                                .map(async (f) => {
                                    // try to parse host from url. if url is not valid,
                                    // assume the url field contains just the domain.
                                    let host = f.value;
                                    try {
                                        host = new URL(f.value).host;
                                    } catch (e) {}

                                    if (!host) {
                                        return null;
                                    }

                                    const hashedHost = await crypto.deriveKey(stringToBytes(host), this.hashParams);

                                    return bytesToBase64(hashedHost);
                                })
                        )
                    ).filter((h) => h !== null) as string[],
                }))
            )
        ).filter((item) => item.hosts.length);
    }

    async matchHost(host: string) {
        const hashedHost = bytesToBase64(await getCryptoProvider().deriveKey(stringToBytes(host), this.hashParams));
        return this.items.filter((item) => item.hosts.some((h) => h === hashedHost)).length;
    }

    getHostnameVariants(host: string) {
        const parts = host.split(".");

        // Ignore single domains
        if (parts.length <= 2) {
            return [host, `*.${host}`];
        }

        // Remove the tld and domain from the parts, build it separately
        const domain: string[] = [];

        domain.unshift(parts.pop()!);
        domain.unshift(parts.pop()!);

        // Build list of subdomains to match, so given 'login.accounts.google.com', we'd see ['login', 'accounts'] as parts and ['google', 'com'] as domain, which should return ['google.com', 'accounts.google.com', and 'login.accounts.google.com']
        const subdomains = parts
            .reverse()
            .reduce(
                (currentDomainParts: string[], subdomain: string) => {
                    currentDomainParts.push(`${subdomain}.${currentDomainParts[currentDomainParts.length - 1]}`);

                    return currentDomainParts;
                },
                [domain.join(".")]
            )
            .map((subdomain) => `*.${subdomain}`); // prefix all subdomains with `*.` (can't be done above otherwise you get things like *.login.*.accounts.*.google.com)

        // Add regular domain/host
        subdomains.unshift(host);

        // Add/remove common "www." matching
        if (host.startsWith("www.")) {
            subdomains.push(host.slice(4));
        } else {
            subdomains.push(`www.${host}`);
        }

        return subdomains;
    }

    async fuzzyMatchHost(host: string) {
        const domains = this.getHostnameVariants(host);

        const domainsMatches = (await Promise.all(domains.map(async (domain) => await this.matchHost(domain)))).reduce(
            (previousCount, currentCount) => previousCount + currentCount,
            0
        );

        return domainsMatches;
    }

    async matchUrl(url: string) {
        try {
            const { host } = new URL(url);
            return this.fuzzyMatchHost(host);
        } catch (e) {
            return 0;
        }
    }
}

export interface AppContext {
    browser?: {
        title?: string;
        url?: string;
        favIconUrl?: string;
    };
}

export class StoredAppState extends Storable {
    id = "app-settings";

    @AsSerializable(Settings)
    settings = new Settings();

    @AsSerializable(DeviceInfo)
    device = new DeviceInfo();
}

/** Application state */
export abstract class AppState {
    /** Application Settings */
    static settings = new Settings();

    /** Info about current device */
    static device = new DeviceInfo();

    /** Currently logged in [[Account]] */
    static account: Account | null = null;

    static auth: Auth = new Auth();

    /** All vaults the current [[account]] has access to. */
    static vault: Vault | null = null;

    /** Whether a sync is currently in process. */
    static syncing = false;

    static context: AppContext = {};

    static index: Index = new Index();

    /** IDs of most recently used items. The most recently used item is last */
    // lastUsed = new Map<string, Date>();

    static _errors: Err[] = [];

    static _loggedIn: boolean = false;

    /** Whether the app is in "locked" state */
    static get locked() {
        return !AppState.account || AppState.account.locked;
    }

    /** Whether a user is logged in */
    static get loggedIn() {
        return AppState._loggedIn;
    }
}
