import { Serializable } from "./encoding";
import { Storable } from "./storage";
import { AccountID } from "./account";
import { getIdFromEmail } from "./util";

export enum AuthPurpose {
    Signup = "signup",
    Login = "login",
    //GetLegacyData = "get_legacy_data",
    //TestAuthenticator = "test_authenticator",
    ChangeEmail = "change_email",
}

export enum AuthType {
    Email = "email",
}

export enum AuthenticatorStatus {
    Registering = "registering",
    Active = "active",
    Revoked = "revoked",
}

// To-Do : Keeping Blocked so that if we do more than 3 tries to unlock, app will be blocked for 1 day
export enum AccountStatus {
    Unregistered = "unregistered",
    Active = "active",
    Blocked = "blocked",
}

/**
 * Contains authentication data.
 */
export class Auth extends Serializable implements Storable {
    id: string = "";

    /** Id of the [[Account]] the authentication data belongs to */
    account?: AccountID = undefined;

    name?: string = undefined;

    get accountId() {
        return this.account;
    }

    accountStatus: AccountStatus = AccountStatus.Unregistered;

    constructor(public email: string = "") {
        super();
    }

    async init() {
        this.id = await getIdFromEmail(this.email);
    }
}
