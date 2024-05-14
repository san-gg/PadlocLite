import { Serializable, AsBytes, AsDate, AsSet, Exclude, AsSerializable } from "./encoding";
import { PBES2Container } from "./container";
import { Storable } from "./storage";
import { VaultID } from "./vault";
import { TagInfo, VaultItemID } from "./item";

/** Unique identifier for [[Account]] objects */
export type AccountID = string;

export class AccountSecrets extends Serializable {
    constructor({ privateKey, favorites, tags }: Partial<AccountSecrets> = {}) {
        super();
        Object.assign(this, { privateKey, favorites, tags });
    }

    @AsBytes()
    privateKey!: Uint8Array;

    @AsSet()
    favorites = new Set<VaultItemID>();

    tags: TagInfo[] = [];
}

export class SecurityReportSettings extends Serializable {
    weakPasswords = true;
    reusedPasswords = true;
    compromisedPaswords = true;
    expiredItems = true;
}

export class NotificationSettings extends Serializable {
    failedLoginAttempts = true;
    newLogins = true;
}

export class AccountSettings extends Serializable {
    @AsSerializable(SecurityReportSettings)
    securityReport = new SecurityReportSettings();

    @AsSerializable(NotificationSettings)
    notifications = new NotificationSettings();
}

export const ACCOUNT_NAME_MAX_LENGTH = 100;
export const ACCOUNT_EMAIL_MAX_LENGTH = 255;

/**
 * The `Account` object represents an individual Padloc user and holds general
 * account information as well as cryptographic keys necessary for accessing
 * [[Vaults]].
 *
 * The [[privateKey]] properties are considered secret and
 * therefore need to be encrypted at rest. For this, the [[Account]] object
 * serves as a [[PBESContainer]] which is unlocked by the users **master
 * password**.
 */
export class Account extends PBES2Container implements Storable {
    /** Unique account ID */
    id: AccountID = "";

    /** The users email address */
    email = "";

    /** The users display name */
    name = "";

    /** When the account was created */
    @AsDate()
    created = new Date();

    /** when the account was last updated */
    @AsDate()
    updated = new Date();

    /** ID of the accounts main or "private" [[Vault]]. */
    mainVault: {
        id: VaultID;
        name?: string;
        revision?: string;
    } = { id: "" };

    @Exclude()
    favorites = new Set<VaultItemID>();

    @Exclude()
    tags: TagInfo[] = [];

    /** Application Settings */
    @AsSerializable(AccountSettings)
    settings = new AccountSettings();

    /**
     * Whether or not this Account object is current "locked" or, in other words,
     * whether the `privateKey` and `signingKey` properties have been decrypted.
     */
    get locked(): boolean {
        return !this._key;
    }

    get masterKey() {
        return this._key;
    }

    get UnlockedAccount(): UnlockedAccount {
        return { privateKey: this._key } as UnlockedAccount;
    }

    set masterKey(key: Uint8Array | undefined) {
        this._key = key;
    }

    /**
     * Generates the accounts.
     */
    async initialize(password: string) {
        await this.setPassword(password);
    }

    /** Updates the master password by reencrypting properties */
    async setPassword(password: string) {
        if (this.encryptedData && !this._key) {
            throw "Account has to be unlocked first.";
        }
        await this._deriveAndSetKey(password);
        await this.commitSecrets();
        this.updated = new Date();
    }

    /**
     * "Unlocks" the account by decrypting and extracting from [[encryptedData]]
     */
    async unlock(password: string) {
        await super.unlock(password);
        await this._loadSecrets();
    }

    /**
     * Unlocks the account by providing the encryption key directly rather than
     * deriving it from the master password
     */
    async unlockWithMasterKey(key: Uint8Array) {
        this._key = key;
        await this._loadSecrets();
    }

    /**
     * "Locks" the account by deleting all sensitive data from the object
     */
    lock() {
        super.lock();
        // delete this.privateKey;
        this.favorites.clear();
        this.tags = [];
    }

    clone() {
        const clone = super.clone();
        clone.copySecrets(this);
        return clone;
    }

    toString() {
        return this.name || this.email;
    }

    async toggleFavorite(id: VaultItemID, favorite: boolean) {
        favorite ? this.favorites.add(id) : this.favorites.delete(id);
        await this.commitSecrets();
    }

    copySecrets(account: Account) {
        // this.privateKey = account.privateKey;
        this.favorites = account.favorites;
        this.tags = account.tags;
        this._key = account._key;
    }

    validate() {
        if (this.email.length > ACCOUNT_EMAIL_MAX_LENGTH) {
            return false;
        }

        if (this.name.length > ACCOUNT_NAME_MAX_LENGTH) {
            return false;
        }

        return true;
    }

    async commitSecrets() {
        const secrets = new AccountSecrets({ privateKey: this._key, favorites: this.favorites, tags: this.tags });
        await this.setData(secrets.toBytes());
    }

    private async _loadSecrets() {
        const secrets = new AccountSecrets().fromBytes(await this.getData());
        if (!secrets.favorites) {
            secrets.favorites = new Set<VaultItemID>();
        }
        if (!secrets.tags) {
            secrets.tags = [];
        }
        Object.assign(this, secrets);
    }
}

export interface UnlockedAccount extends Account {
    privateKey: Uint8Array;
}
