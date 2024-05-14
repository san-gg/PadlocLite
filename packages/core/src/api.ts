import { Account, AccountID } from "./account";
import { Attachment, AttachmentID } from "./attachment";
import {
    PromiseWithProgress,
    StartAuthRequestResponse,
    CreateAccountParams,
    ChangeEmailParams,
    GetAttachmentParams,
    DeleteAttachmentParams,
} from "./params";

export interface API {
    startAuthRequest(email: string): PromiseWithProgress<StartAuthRequestResponse>;

    /**
     * Create a new [[Account]]
     */
    createAccount(_params: CreateAccountParams): PromiseWithProgress<Account>;

    /**
     * Get the [[Account]] associated with the current session
     *
     * @authentication_required
     */
    getAccount(_id?: AccountID): PromiseWithProgress<Account>;

    /**
     * Update the [[Account]] associated with the current session.
     *
     * @authentication_required
     */
    updateAccount(_account: Account): PromiseWithProgress<Account>;

    /**
     * Change the email address of an [[Account]].
     *
     * @authentication_required
     */
    changeEmail(_params: ChangeEmailParams): PromiseWithProgress<Account>;

    /**
     * Delete current account
     */
    deleteAccount(_id?: AccountID): PromiseWithProgress<void>;

    createAttachment(_attachment: Attachment): PromiseWithProgress<AttachmentID>;

    getAttachment(_attachment: GetAttachmentParams): PromiseWithProgress<Attachment>;

    deleteAttachment(_attachment: DeleteAttachmentParams): PromiseWithProgress<void>;

    removeTrustedDevice(_id: string): PromiseWithProgress<void>;
}
