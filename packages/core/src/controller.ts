import {
    CreateAccountParams,
    GetAttachmentParams,
    DeleteAttachmentParams,
    StartAuthRequestResponse,
    ChangeEmailParams,
} from "./params";
import { Attachment, getAttachmentStorage } from "./attachment";
import { Account, AccountID } from "./account";
import { Auth, AccountStatus } from "./auth";
import { Err, ErrorCode } from "./error";
import { Vault, VaultID } from "./vault";
import { getIdFromEmail, uuid } from "./util";
import { AppState } from "./state";
import { getStorageDB } from "./platform";

/**
 * Controller class for processing app requests
 */
export class Controller {
    get storage() {
        return getStorageDB();
    }

    get attachmentStorage() {
        return getAttachmentStorage();
    }

    async startAuthRequest(email: string): Promise<StartAuthRequestResponse> {
        const auth = (AppState.auth = await this._getAuth(email));

        const response = new StartAuthRequestResponse({
            email: email,
            accountStatus: auth.accountStatus,
            name: auth.name,
        });

        return response;
    }

    async createAccount({ account }: CreateAccountParams): Promise<Account> {
        const auth = (AppState.auth = await this._getAuth(account.email));

        // Make sure that no account with this email exists and that the email is not blocked from signing up
        if (auth.account) {
            throw new Err(ErrorCode.ACCOUNT_EXISTS, "This account already exists!");
        }

        // Most of the account object is constructed locally but account id and
        // revision are exclusively managed by the server
        account.id = await uuid();
        auth.account = account.id;
        auth.accountStatus = AccountStatus.Active;
        auth.name = account.name;

        // Provision the private vault for this account
        const vault = new Vault();
        vault.id = await uuid();
        vault.name = "My Vault";
        vault.owner = account.id;
        vault.created = new Date();
        vault.updated = new Date();
        await vault.setPassword(account.UnlockedAccount);
        account.mainVault = { id: vault.id, name: vault.name };

        // Persist data
        await Promise.all([this.storage.save(account), this.storage.save(vault), this.storage.save(auth)]);

        AppState.account = account = await this.storage.get(Account, account.id);

        return account;
    }

    async getAccount(id: AccountID) {
        const account = await this.storage.get(Account, id);

        if (!account) {
            throw new Err(ErrorCode.NOT_FOUND, "Account not found");
        }

        return account;
    }

    async updateAccount({ name, keyParams, encryptionParams, encryptedData, settings }: Account) {
        const { account, auth } = AppState;
        if (!account) {
            throw new Err(ErrorCode.NOT_FOUND, "Account not found");
        }

        // Update account object
        Object.assign(account, { name, keyParams, encryptionParams, encryptedData, settings });

        // Update auth object
        Object.assign(auth, { name });

        // Persist changes
        account.updated = new Date();
        await this.storage.save(account);
        await this.storage.save(auth);

        return account;
    }

    async changeEmail({ email }: ChangeEmailParams) {
        const { account, auth } = this._requireAuth();

        if ((await this._getAuth(email)).accountId) {
            throw new Err(ErrorCode.BAD_REQUEST, "There already exists an account with this email address!");
        }

        await this.storage.delete(auth);
        auth.email = email;
        await auth.init();
        await this.storage.save(auth);

        account.email = email;
        account.updated = new Date();
        await this.storage.save(account);

        return this.storage.get(Account, account.id);
    }

    async deleteAccount(id?: AccountID) {
        let { account, auth } = this._requireAuth();

        // Deleting other accounts than one's one is only allowed to super admins
        if (id && account.id !== id) {
            account = await this.storage.get(Account, id);
            auth = await this._getAuth(account.email);
        }

        // await this.provisioner.accountDeleted(auth);

        // Delete main vault
        await this.storage.delete(Object.assign(new Vault(), { id: account.mainVault }));

        // Delete auth object
        await this.storage.delete(auth);

        // Delete account object
        await this.storage.delete(account);
    }

    async getVault(id: VaultID) {
        return await this.storage.get(Vault, id);
    }

    async updateVault({ id, keyParams, encryptionParams, encryptedData }: Vault) {
        // const { account } = this._requireAuth();

        const vault = await this.storage.get(Vault, id);

        // Update vault properties
        Object.assign(vault, { keyParams, encryptionParams, encryptedData });

        vault.updated = new Date();

        // Persist changes
        await this.storage.save(vault);

        return this.storage.get(Vault, vault.id);
    }

    async createAttachment(att: Attachment) {
        att.id = await uuid();
        await this.attachmentStorage.put(att);
        return att.id;
    }

    async getAttachment({ id, vault: vaultId }: GetAttachmentParams) {
        return this.attachmentStorage.get(vaultId, id);
    }

    async deleteAttachment({ vault: vaultId, id }: DeleteAttachmentParams) {
        await this.attachmentStorage.delete(vaultId, id);
    }

    private _requireAuth() {
        const { account, auth } = AppState;
        if (!account || !auth) {
            throw new Err(ErrorCode.NOT_FOUND, "Please re-login again");
        }
        return { account, auth };
    }

    protected async _getAuth(email: string) {
        let auth: Auth | null = null;

        try {
            auth = await this.storage.get(Auth, await getIdFromEmail(email));
        } catch (e) {
            if (e.code !== ErrorCode.NOT_FOUND) {
                throw e;
            }
        }

        if (!auth) {
            auth = new Auth(email);
            await auth.init();
        }

        return auth;
    }
}
