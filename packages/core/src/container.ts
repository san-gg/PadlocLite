import { Serializable, stringToBytes, AsBytes, AsSerializable } from "./encoding";
import { Err, ErrorCode } from "./error";
import { PBKDF2Params, AESKey, AESEncryptionParams } from "./crypto";
import { getCryptoProvider as getProvider } from "./platform";

/**
 * Base class for all **Container** implementations. In general, a **Container** is
 * an object for holding data encrypted using a symmetric cipher. Implementations
 * vary mostly in how the encryption key is generated. Sub classes must implement
 * the [[unlock]] method and may likely also want to augment [[lock]], [[validate]],
 * [[_fromRaw]] and [[_toRaw]].
 */
export abstract class BaseContainer extends Serializable {
    /** Parameters used for encryption of content data */
    @AsSerializable(AESEncryptionParams)
    encryptionParams: AESEncryptionParams = new AESEncryptionParams();

    /** Encrypted data */
    @AsBytes()
    encryptedData?: Uint8Array;

    /**
     * The key used for encryption. Sub classes must set this property in the [[unlock]] method.
     */
    protected _key?: AESKey;

    /**
     * Encrypts the provided `data` and stores it in the container
     */
    async setData(data: Uint8Array) {
        if (!this._key) {
            throw new Err(ErrorCode.ENCRYPTION_FAILED, "No encryption key provided!");
        }

        // Generate random initialization vector
        this.encryptionParams.iv = await getProvider().randomBytes(16);

        // Generate additional authenticated data.
        // Note: Without knowing anything about the nature of the encrypted data,
        // we can't really choose a meaningful value for this. In the future,
        // we may want to provide the option to pass this as an argument but for now
        // a random value should be sufficient.
        this.encryptionParams.additionalData = await getProvider().randomBytes(16);

        // Encrypt the data and store it.
        this.encryptedData = await getProvider().encrypt(this._key, data, this.encryptionParams);
    }

    /**
     * Decrypts and extracts the plain text data from the container. This will
     * usually require unlocking the container first.
     */
    async getData(): Promise<Uint8Array> {
        if (!this.encryptedData || !this._key) {
            throw new Err(ErrorCode.DECRYPTION_FAILED);
        }
        return await getProvider().decrypt(this._key, this.encryptedData, this.encryptionParams);
    }

    /**
     * Unlocks the container, making it possible to extract the plain text
     * data via [[getData]]. The type of **secret** provided will differ based
     * on the encryption scheme used by implemenations.
     */
    abstract unlock(secret: unknown): Promise<void>;

    /**
     * Locks the container, removing the possibility to extract the plain text data
     * via [[getData]] until the container is unlocked again. Subclasses extending
     * this class must take care to delete any keys or other sensitive data
     * that may have been stored temporarily after unlocking the container.
     */
    lock() {
        delete this._key;
    }

    clone() {
        const clone = super.clone();
        clone._key = this._key;
        return clone;
    }
}

/**
 * Most basic **Container** implementation where the encryption key is
 * simply passed explicitly.
 */
export class SimpleContainer extends BaseContainer {
    async unlock(key: AESKey) {
        this._key = key;
    }
}

/**
 * Password-based **Container** that uses the
 * [PBES2](https://tools.ietf.org/html/rfc2898#section-6.2) encryption scheme,
 * deriving the encryption key from a user-provided passphrase.
 */
export class PBES2Container extends BaseContainer {
    /** Parameters used for key derivation */
    @AsSerializable(PBKDF2Params)
    keyParams: PBKDF2Params = new PBKDF2Params();

    protected async _deriveAndSetKey(password: string | Uint8Array) {
        if (!this.keyParams.salt.length) {
            this.keyParams.salt = await getProvider().randomBytes(16);
        }
        if (password instanceof Uint8Array) this._key = await getProvider().deriveKey(password, this.keyParams);
        else this._key = await getProvider().deriveKey(stringToBytes(password as string), this.keyParams);
    }

    /**
     * Unlocks the container using the given **password**
     */
    async unlock(password: string | Uint8Array) {
        await this._deriveAndSetKey(password);
        // If this container has data already, make sure the derived key properly decrypts it.
        if (this.encryptedData) {
            await this.getData();
        }
    }
}
