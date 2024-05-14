import { Serializable, AsSerializable } from "./encoding";
import { Account } from "./account";
import { VaultID } from "./vault";
import { AttachmentID } from "./attachment";
import { RequestProgress } from "./transport";
import { StorageListOptions, StorageQuery } from "./storage";
import { AccountStatus } from "./auth";

export class CreateAccountParams extends Serializable {
    /** The [[Account]] object containing the relevant information */
    @AsSerializable(Account)
    account!: Account;

    constructor(props?: Partial<CreateAccountParams>) {
        super();
        props && Object.assign(this, props);
    }
}

export class StartAuthRequestResponse extends Serializable {
    email: string = "";

    accountStatus: AccountStatus = AccountStatus.Unregistered;

    name: string = "";

    constructor(props?: Partial<StartAuthRequestResponse>) {
        super();
        props && Object.assign(this, props);
    }
}

/**
 * Parameters for fetching an [[Attachment]]
 */
export class GetAttachmentParams extends Serializable {
    /** The vault id */
    vault: VaultID = "";

    /** The attachment id */
    id: AttachmentID = "";

    constructor(props?: Partial<GetAttachmentParams>) {
        super();
        props && Object.assign(this, props);
    }
}

export class DeleteAttachmentParams extends GetAttachmentParams {}

export type PromiseWithProgress<T> = Promise<T> & { progress?: RequestProgress };

export class ListParams extends Serializable implements StorageListOptions {
    constructor(init: Partial<ListParams> = {}) {
        super();
        Object.assign(this, init);
    }

    limit: number = 100;
    offset: number = 0;
    query?: StorageQuery = undefined;
    orderBy?: string = undefined;
    orderByDirection?: "asc" | "desc" = undefined;
}

/**
 * Parameters for changing a users email address with [[API.changeEmail]]
 */
export class ChangeEmailParams extends Serializable {
    authToken: string = "";

    email: string = "";

    constructor(props?: Partial<ChangeEmailParams>) {
        super();
        props && Object.assign(this, props);
    }
}
