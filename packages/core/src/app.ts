import { loadLanguage } from "@padloc/locale/src/translate";
import { Vault } from "./vault";
import {
    VaultItem,
    VaultItemID,
    Field,
    Tag,
    createVaultItem,
    AuditResult,
    ItemHistoryEntry,
    ITEM_HISTORY_ENTRIES_LIMIT,
    TagInfo,
} from "./item";
import { Account } from "./account";
import { CreateAccountParams, GetAttachmentParams, DeleteAttachmentParams, ChangeEmailParams } from "./params";
import { getDeviceInfo } from "./platform";
import { throttle } from "./util";
import { Err, ErrorCode } from "./error";
import { Attachment, AttachmentInfo } from "./attachment";
import { Controller } from "./controller";
import { AppState, Settings, Index, StoredAppState } from "./state";
import { PromiseWithProgress } from "./params";
import { RequestProgress } from "./transport";

/**
 * The `App` class is *the* user-facing top level component encapsulating all
 * functionality of the Padloc client app. It is responsible for managing
 * state, client-side persistence and synchronization with the [[Server]] and
 * exposes methods for manipulating a users [[Account]] and [[Vault]].
 *
 * [[App]] is completely platform-agnostic and can be used in any environment
 * capable of running JavaScript. It does however rely on platform-specific
 * providers for a number of features like storage and encryption which can
 * be "plugged in" as needed.
 *
 * ### Encryption
 *
 * The `@padloc/core` module does not provide or depend on any specific
 * implementation of cryptographic primitives but instead relies on
 * the [[CryptoProvider]] interface to provide those.
 *
 * Users of the [[App]] class (and of the `@padloc/core` package in general)
 * are responsible for ensuring that a secure implemenation of the
 * [[CryptoProvider]] interface is available before using any methods that
 * require cryptographic functionality. This is done through the
 * `crypto.setProvider` function (see example below).
 *
 * ### Platform API
 *
 * Certain functionality requires access to some platform APIs. For this,
 * an implementation of the [[Platform]] interface can be provided via
 * `platform.setPlatform`.
 *
 * ### Persistent Storage
 *
 * Persistent storage is provided by an implementation of the [[Storage]]
 * interface.
 *
 * ### Initialization Example
 *
 * ```ts
 * @import { setProvider } from "@padloc/core/src/crypto";
 * @import { setPlatform } from "@padloc/core/src/platform";
 *
 * setProvider(new NodeCryptoProvider());
 * setPlatform(new NodePlatform());
 *
 * const app = new App();
 *
 * app.loaded.then(() => console.log("app ready!");
 * ```
 */
export class App {
    /** App version */
    version = "4.3.0";

    /** API client for RPC calls */
    api: Controller = new Controller();

    /** Application state */
    state = AppState;

    private _resolveLoad!: () => void;

    /** Promise that is resolved when the app has been fully loaded */
    loaded = new Promise<void>((resolve) => (this._resolveLoad = resolve));

    /** Current account */
    get account() {
        return AppState.account;
    }

    /** The current account's vault */
    private get vault() {
        if (AppState.vault == null) throw "Account needs to be unlocked first before accessing vault.";
        return AppState.vault.clone();
    }

    /** Application settings */
    get settings() {
        return AppState.settings;
    }

    /** The current users main, or "private" [[Vault]] */
    get mainVault(): Vault | null {
        return (this.account && AppState.vault?.clone()) || null;
    }

    get auditedItems() {
        let items: { item: VaultItem; vault: Vault }[] = [];
        const vault = this.mainVault;
        if (vault) {
            for (const item of vault.items) {
                if (item.auditResults?.length) {
                    items.push({ item, vault });
                }
            }
        }
        return items;
    }

    get count() {
        const count = {
            favorites: 0,
            attachments: 0,
            // recent: 0,
            total: 0,
            currentHost: AppState.context.browser?.url ? this.getItemsForUrl(AppState.context.browser.url).length : 0,
            report: 0,
        };

        const vault = this.mainVault;
        if (vault) {
            for (const item of vault.items) {
                count.total++;
                if (this.account && this.account.favorites.has(item.id)) {
                    count.favorites++;
                }
                if (item.attachments.length) {
                    count.attachments++;
                }
                if (item.auditResults?.length) {
                    count.report++;
                }
            }
        }
        return count;
    }

    /** All [[Tag]]s found within the user's [[Vault]] */
    get tags(): TagInfo[] {
        const tagNames = new Map<string, { count: number; readonly: number }>();

        const vault = this.mainVault;
        if (vault) {
            for (const item of vault.items) {
                for (const tag of item.tags) {
                    if (!tagNames.has(tag)) {
                        tagNames.set(tag, { count: 0, readonly: 0 });
                    }
                    tagNames.get(tag)!.count++;
                }
            }
        }

        const sortedTagnames = [...tagNames.entries()].sort(([, a], [, b]) => b.count - a.count);
        const tags = this.account?.tags ? [...this.account.tags] : [];

        for (const [name, { count }] of sortedTagnames) {
            let tagInfo = tags.find((t) => t.name === name);
            if (!tagInfo) {
                tagInfo = { name };
                tags.push(tagInfo);
            }
            tagInfo.count = count;
        }

        return tags;
    }

    private _subscriptions: Array<(state: AppState) => void> = [];

    /** Load application state from persistent storage */
    async load() {
        // Update device info
        const { ...rest } = await getDeviceInfo();
        Object.assign(AppState.device, rest);

        try {
            await loadLanguage(AppState.device.locale);
        } catch (e) {
            // Failed to load language, so we'll fallback to default (English)
        }
        let appSettings: StoredAppState = new StoredAppState();
        try {
            appSettings = await this.api.storage.get(StoredAppState, appSettings.id);
        } catch (e) {
            //Not Found
            await this.api.storage.save(appSettings);
        }

        this.state.settings = appSettings.settings;
        this.state.device = appSettings.device;

        this._resolveLoad();

        // Notify state change
        this.publish();

        return this.loaded;
    }

    /**
     * Unlocks the current [[Account]].
     */
    async unlock(password: string) {
        if (!this.account) {
            throw "Unlocking only works if the user is logged in!";
        }

        // Unlock account using the master password
        await this.account.unlock(password);

        await this._unlocked();
    }

    /**
     * Locks the app and wipes all sensitive information from memory.
     */
    async lock() {
        this.account?.lock();
        this.vault.lock();
        this.publish();
    }

    /**
     * Notifies of changes to the app [[state]] via the provided function
     *
     * @returns A unsubscribe function
     */
    subscribe(fn: (state: AppState) => void) {
        this._subscriptions.push(fn);
        return () => this.unsubscribe(fn);
    }

    /**
     * Unsubscribes a function previously subscribed through [[subscribe]].
     */
    unsubscribe(fn: (state: AppState) => void) {
        this._subscriptions = this._subscriptions.filter((f) => f !== fn);
    }

    /**
     * Notifies all subscribers of a [[state]] change
     */
    publish = throttle(() => {
        for (const fn of this._subscriptions) {
            fn(AppState);
        }
    }, 1000);

    /**
     * Updates the app [[state]]
     */
    setState(state: Partial<AppState>) {
        Object.assign(AppState, state);
        this.publish();
    }

    /** Update application settings */
    async setSettings(obj: Partial<Settings>) {
        Object.assign(AppState.settings, obj);
        let storeAppSetting = new StoredAppState();
        storeAppSetting.settings = AppState.settings;
        this.api.storage.save(storeAppSetting);
        // await this.save();
        this.publish();
    }

    /*
     * ===============================
     *  ACCOUNT MANGAGEMENT
     * ===============================
     */

    /**
     * Creates a new Padloc [[Account]] and signs in the user.
     */
    async signup({
        /** The desired email address */
        email,
        /** The users master password */
        password,
        /** The desired display name */
        name,
    }: {
        email: string;
        password: string;
        name: string;
    }) {
        // Inialize account object
        const account = new Account();
        account.email = email;
        account.name = name;
        await account.initialize(password);

        // Initialize auth object
        // const auth = new Auth(email);

        // Send off request to server
        await this.api.createAccount(
            new CreateAccountParams({
                account,
            })
        );

        // Sign into new account
        await this.login(password);
    }

    /**
     * Log in user loading [[Account]] and [[Vault]] info.
     */
    async login(password: string) {
        // Fetch and unlock account object
        const account = await this.api.getAccount(AppState.auth.account!);
        const vault = await this.api.getVault(account.mainVault.id);
        try {
            await account.unlock(password);
            await vault.unlockVault(account.UnlockedAccount);
        } catch (e) {
            throw new Err(ErrorCode.INVALID_CREDENTIALS, "Failed to decrypt account data");
        }
        this.setState({ account });
        this.setState({ _loggedIn: true });
        this.putVault(vault);
    }

    /**
     * Logs out user and clears all sensitive information
     */
    async logout() {
        await this._logout();
    }

    async deleteAccount() {
        await this.api.deleteAccount();
        await this._logout();
    }

    private async _logout() {
        // Reset application state
        this.setState({
            account: null,
            vault: null,
            index: new Index(),
            _loggedIn: false,
        });
    }

    /**
     * Updates the users master password
     */
    async changePassword(oldPassword: string, newPassword: string) {
        // TODO: Add option to rotate keys

        await this.updateAccount(async (account) => {
            // Update account object
            await account.unlock(oldPassword);
            await account.setPassword(newPassword);
            const vault = this.vault;
            await vault.setPassword(account.UnlockedAccount);
            this.saveVault(vault);
        });
    }

    async changeEmail(email: string) {
        if (!this.account) {
            throw "You must be logged in to change your email!";
        }

        const account = await this.api.changeEmail(new ChangeEmailParams({ email }));

        // account.copySecrets(this.account);

        // Update and save state
        this.setState({ account });
    }

    /**
     * Fetches the user's [[Account]]
     */
    async fetchAccount() {
        const account = await this.api.getAccount(AppState.auth.account!);

        // Copy over secret properties so we don't have to
        // unlock the account object again.
        if (this.account) {
            account.copySecrets(this.account);
        }

        // Update and save state
        this.setState({ account });
    }

    /**
     * Updates the user's [[Account]] information
     * @param transform A function applying the changes to the account
     */
    async updateAccount(transform: (account: Account) => Promise<any>) {
        if (!this.account) {
            throw "User needs to be logged in in order to update their account!";
        }

        // Create a clone of the current account to prevent inconsistencies in
        // case something goes wrong.
        let account = this.account.clone();

        // Apply changes
        await transform(account);

        // Send request to server
        try {
            await this.api.updateAccount(account);
        } catch (e) {
            throw "Unable to Update the Account.";
        }

        this.setState({ account });
    }

    /**
     * ==================
     *  VAULT MANAGEMENT
     * ==================
     */

    /** Locally update the given `vault` object */
    putVault(vault: Vault) {
        this.setState({
            vault: vault,
        });
    }

    /** Commit changes to vault object and save */
    async saveVault(vault: Vault): Promise<void> {
        await vault.commitSecrets();
        await this.api.updateVault(vault);
        this.putVault(vault);
    }

    /**
     * =======================
     *  Vault Item Management
     * =======================
     */

    /** Get the [[VaultItem]] and [[Vault]] for the given item `id` */
    getItem(id: VaultItemID): { item: VaultItem; vault: Vault } | null {
        const vault = this.vault;
        const item = vault.items.get(id);
        if (item) {
            return { item, vault };
        }
        return null;
    }

    /** Adds a number of `items` to the given `vault` */
    async addItems(items: VaultItem[]) {
        const vault = this.vault;
        vault.items.update(...items);

        await this.saveVault(vault);
    }

    /** Creates a new [[VaultItem]] */
    async createItem({
        name = "",
        fields,
        tags,
        icon,
    }: {
        name: string;
        fields?: Field[];
        tags?: Tag[];
        icon?: string;
    }): Promise<VaultItem> {
        const item = await createVaultItem({ name, fields, tags, icon });
        await this.addItems([item]);
        return item;
    }

    /** Update a given [[VaultItem]]s name, fields, tags and attachments */
    async updateItem(
        item: VaultItem,
        upd: {
            name?: string;
            fields?: Field[];
            tags?: Tag[];
            attachments?: AttachmentInfo[];
            auditResults?: AuditResult[];
            lastAudited?: Date;
            expiresAfter?: number;
        },
        save = true
    ) {
        const { vault } = this.getItem(item.id)!;
        const newItem = new VaultItem({
            ...item,
            ...upd,
        });

        if (
            item.name !== newItem.name ||
            JSON.stringify(item.tags) !== JSON.stringify(newItem.tags) ||
            JSON.stringify(item.fields) !== JSON.stringify(newItem.fields)
        ) {
            newItem.history = [new ItemHistoryEntry(item), ...item.history].slice(0, ITEM_HISTORY_ENTRIES_LIMIT);
        }

        vault.items.update(newItem);
        if (save) await this.saveVault(vault);
    }

    async toggleFavorite(id: VaultItemID, favorite: boolean) {
        await this.updateAccount((acc) => acc.toggleFavorite(id, favorite));
    }

    /** Delete a number of `items` */
    async deleteItems(items: VaultItem[]) {
        const attachments: AttachmentInfo[] = [];

        for (const item of items) attachments.push(...item.attachments);

        const promises: Promise<void>[] = [];

        // Delete all attachments for this item
        promises.push(...attachments.map((att) => this.api.deleteAttachment(new DeleteAttachmentParams(att))));

        // Remove items from vault
        const vault = this.vault;
        vault.items.remove(...items);
        promises.push(this.saveVault(vault));
        await Promise.all(promises);
    }

    getItemsForHost(host: string) {
        const items: { vault: Vault; item: VaultItem }[] = [];
        const vault = this.vault;
        for (const item of vault.items) {
            if (
                item.fields.some((field) => {
                    if (field.type !== "url") {
                        return false;
                    }

                    // Try to parse host from url. If field value is not a valid URL,
                    // assume its the bare host name
                    let h = field.value;
                    try {
                        h = new URL(field.value).host;
                    } catch (e) {}

                    return AppState.index.getHostnameVariants(host).includes(h);
                })
            ) {
                items.push({ vault, item });
            }
        }
        return items;
    }

    getItemsForUrl(url: string) {
        try {
            const { host } = new URL(url);
            return this.getItemsForHost(host);
        } catch (e) {
            return [];
        }
    }

    getTagInfo(name: Tag): TagInfo {
        return this.tags.find((t) => t.name === name) || { name };
    }

    async deleteTag(tag: Tag) {
        const vault = this.vault;
        for (const item of vault.items) {
            if (item.tags.includes(tag)) {
                this.updateItem(item, { tags: item.tags.filter((t) => t !== tag) }, false);
            }
        }

        await this.saveVault(vault);

        await this.updateAccount(async (account) => {
            account.tags = account.tags.filter((t) => t.name !== tag);
            await account.commitSecrets();
        });
    }

    async renameTag(tag: Tag, newName: string) {
        const vault = this.vault;
        for (const item of vault.items) {
            if (item.tags.includes(tag)) {
                this.updateItem(item, { tags: [...item.tags.filter((t) => t !== tag), newName] }, false);
            }
        }

        await this.saveVault(vault);

        await this.updateAccount(async (account) => {
            const existing = account.tags.find((t) => t.name === tag);
            if (existing) {
                existing.name = newName;
            }
            await account.commitSecrets();
        });
    }

    /**
     * =============
     *  ATTACHMENTS
     * =============
     */

    async createAttachment(itemId: VaultItemID, file: File, name: string, password: string): Promise<Attachment> {
        const { vault, item } = this.getItem(itemId)!;

        const att = new Attachment({ vault: vault.id });
        await att.initialize(password);
        await att.fromFile(file);
        if (name) {
            att.name = name;
        }

        const progress = new RequestProgress();
        const promise = this.api.createAttachment(att) as PromiseWithProgress<any>;

        att.uploadProgress = promise.progress = progress;

        promise.then((id) => {
            att.id = id;
            this.updateItem(item, { attachments: [...item.attachments, att.info] });
            promise.progress!.complete();
        });

        return att;
    }

    async downloadAttachment(attInfo: AttachmentInfo) {
        const att = new Attachment(attInfo);

        const progress = new RequestProgress();
        const promise = this.api.getAttachment({
            id: attInfo.id,
            vault: attInfo.vault,
        } as GetAttachmentParams) as PromiseWithProgress<any>;

        att.downloadProgress = promise.progress = progress;

        promise.then((a) => {
            att.fromRaw(a.toRaw());
            att.type = a.type;
            att.name = a.name;
            promise.progress!.complete();
        });

        return att;
    }

    async deleteAttachment(itemId: VaultItemID, att: Attachment | AttachmentInfo): Promise<void> {
        const { item } = this.getItem(itemId)!;
        try {
            await this.api.deleteAttachment(new DeleteAttachmentParams(att));
        } catch (e) {
            if (e.code !== ErrorCode.NOT_FOUND) {
                throw e;
            }
        }
        await this.updateItem(item, { attachments: item.attachments.filter((a) => a.id !== att.id) });
    }

    private async _unlocked() {
        // Unlock all vaults
        const vault = this.vault;
        try {
            if (!this.account) throw "Account needs to be Unlocked first";
            await vault.unlockVault(this.account.UnlockedAccount);
        } catch (e) {
            vault.error = e;
        }

        // Notify state change
        this.publish();
    }
}
