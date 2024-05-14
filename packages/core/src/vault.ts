import { PBES2Container } from "./container";
import { Storable } from "./storage";
import { VaultItemCollection } from "./collection";
import { AccountID, UnlockedAccount } from "./account";
import { Exclude, AsDate, Serializable, AsBytes, AsSerializable } from "./encoding";
import { Err } from "./error";

/** Unique identifier for [[Vault]] objects */
export type VaultID = string;

class VaultSecrete extends Serializable {
    constructor({ privateKey, items, owner }: Partial<VaultSecrete> = {}) {
        super();
        Object.assign(this, { privateKey, items, owner });
    }

    @AsBytes()
    privateKey!: Uint8Array;

    @AsSerializable(VaultItemCollection)
    items = new VaultItemCollection();

    owner: AccountID = "";
}

/**
 * Container for securely storing a collection of [[VaultItem]]s. Vault is owned by a single user.
 */
export class Vault extends PBES2Container implements Storable {
    /** unique identifier */
    id: VaultID = "";

    /** Vault name */
    name = "";

    /** The vault owner (the [[Account]] that created this vault) */
    owner: AccountID = "";

    /** Time of creation */
    @AsDate()
    created = new Date(0);

    /** Time of last update */
    @AsDate()
    updated = new Date(0);

    /**
     * A collection [[VaultItem]]s representing the senstive data store in this vault
     *
     * @secret
     *
     * **IMPORTANT**: This property is considered **secret**
     * and should never stored or transmitted in plain text
     */
    @Exclude()
    items = new VaultItemCollection();

    @Exclude()
    error?: Err;

    /**
     * Convenience getter for getting a display label truncated to a certain maximum length
     */
    get label() {
        return this.name;
    }

    async setPassword(account: UnlockedAccount) {
        if (this.encryptedData && !this._key) {
            throw "Vault has to be unlocked first.";
        }
        await this._deriveAndSetKey(account.privateKey);
        await this.commitSecrets();
    }

    /**
     * Unlocks the vault with the given `account`, decrypting the data stored in the vault
     * and populating the [[items]] property. For this to be successful, the `account` object
     * needs to be unlocked and the account must have access to this vault.
     */
    async unlockVault(account: UnlockedAccount) {
        await super.unlock(account.privateKey);
        await this._loadSecrets();
    }

    async lock() {
        await super.lock();
        this.items = new VaultItemCollection();
    }

    /**
     * Commit changes to `items` by reencrypting the data.
     */
    async commitSecrets() {
        const secretes = new VaultSecrete({
            privateKey: this._key,
            owner: this.owner,
            items: this.items,
        } as VaultSecrete);
        await this.setData(secretes.toBytes());
    }

    private async _loadSecrets() {
        const secret = new VaultSecrete().fromBytes(await this.getData());
        Object.assign(this, secret);
    }

    /**
     * Merges in changes from another `vault`. This requires both vaults to be unlocked.
     */
    merge(vault: Vault) {
        this.items.merge(vault.items);
        this.name = vault.name;
        this.updated = vault.updated;
    }

    toString() {
        return this.name;
    }

    clone() {
        const clone = super.clone();
        clone.items = this.items.clone();
        return clone;
    }
}
