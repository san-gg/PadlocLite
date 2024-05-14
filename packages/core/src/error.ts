/**
 * Error codes used within Padloc
 */
export enum ErrorCode {
    // SanGG
    SOMETHIND_WENT_WRONG = "something_went_wrong",
    FILE_ALREADY_PRESENT = "file_already_present",

    // Crypto Errors
    INVALID_ENCRYPTION_PARAMS = "invalid_encryption_params",
    DECRYPTION_FAILED = "decryption_failed",
    ENCRYPTION_FAILED = "encryption_failed",
    NOT_SUPPORTED = "not_supported",
    //MISSING_ACCESS = "missing_access",
    VERIFICATION_ERROR = "verification_error",

    // Client Errors
    UNEXPECTED_REDIRECT = "unexpected_redirect",

    // Server Errors
    OUTDATED_REVISION = "merge_conflict",

    BAD_REQUEST = "bad_request",
    INSUFFICIENT_PERMISSIONS = "insufficient_permissions",
    INVALID_CREDENTIALS = "invalid_credentials",
    ACCOUNT_EXISTS = "account_exists",

    // Provisioning Errors
    PROVISIONING_QUOTA_EXCEEDED = "provisioning_quota_exceeded",
    PROVISIONING_NOT_ALLOWED = "provisioning_not_allowed",

    // Generic Errors
    CLIENT_ERROR = "client_error",
    SERVER_ERROR = "server_error",
    UNKNOWN_ERROR = "unknown_error",

    // Encoding errors
    ENCODING_ERROR = "encoding_error",
    UNSUPPORTED_VERSION = "unsupported_version",

    NOT_FOUND = "not_found",
    INVALID_CSV = "invalid_csv",
    INVALID_1PUX = "invalid_1pux",
    INVALID_BITWARDEN = "invalid_bitwarden",

    // BILLING_ERROR = "billing_error",

    // MFA Errors
    AUTHENTICATION_REQUIRED = "email_verification_required",
    AUTHENTICATION_FAILED = "email_verification_failed",
    AUTHENTICATION_TRIES_EXCEEDED = "email_verification_tries_exceeded",
}

export interface ErrorOptions {
    report?: boolean;
    display?: boolean;
    status?: number;
    error?: Error;
}

/**
 * Custom error class augmenting the built-in `Error` with some additional properties
 */
export class Err extends Error {
    /** Error code used for more precise error segmentation */
    code: ErrorCode;
    /** Wether or not this error should be reported to an admin, if that option exists */
    report: boolean;
    /** Wether or not this error should be displayed to the user */
    display: boolean;
    /** The original error, if available */
    originalError?: Error;
    /** Time when the error was created */
    time = new Date();

    constructor(code: ErrorCode, message?: string, { report = false, display = false, error }: ErrorOptions = {}) {
        super(message || (error && error.message) || "");
        this.code = code;
        this.report = report;
        this.display = display;
        this.originalError = error;
    }

    toString() {
        return `Time: ${this.time.toISOString()}
Error Code: ${this.code}
Error Message: ${this.message}
Stack Trace:\n${this.originalError ? this.originalError.stack : this.stack}
`;
    }
}
