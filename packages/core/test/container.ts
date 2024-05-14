import { assert } from "chai";
import { suite, test } from "mocha";
import { ErrorCode } from "../src/error";
import { stringToBytes, bytesToString } from "../src/encoding";
import { SimpleContainer, PBES2Container } from "../src/container";
import { StubCryptoProvider } from "../src/stub-crypto-provider";
import { assertReject } from "../src/spec/spec";

const provider = new StubCryptoProvider();

suite("Container", () => {
    test("SimpleContainer", async () => {
        const key = await provider.randomBytes(32);
        const testData = "I'm a very important, very secret message!";

        let container = new SimpleContainer();

        // set encryption key
        await container.unlock(key);

        // encrypt data
        await container.setData(stringToBytes(testData));

        // Make sure no information gets lost during serialization / deserialization
        container = new SimpleContainer().fromRaw(container.toRaw());

        // Trying to decrypt with a different key should throw an error
        await container.unlock(await provider.randomBytes(32));
        await assertReject(assert, async () => container.getData(), ErrorCode.DECRYPTION_FAILED);

        // Using the correct key should allow us to retreive the original message
        await container.unlock(key);
        const data = bytesToString(await container.getData());
        assert.equal(data, testData);
    });

    test("PBES2Container", async () => {
        const password = "correct battery horse staple";
        const testData = "I'm a very important, very secret message!";

        let container = new PBES2Container();

        // set password
        await container.unlock(password);

        // encrypt data
        await container.setData(stringToBytes(testData));

        // Make sure no information gets lost during serialization / deserialization
        container = new PBES2Container().fromRaw(container.toRaw());

        // Trying to decrypt with a different key should throw an error
        await assertReject(assert, async () => container.unlock("wrong password"), ErrorCode.DECRYPTION_FAILED);

        // Using the correct key should allow us to retreive the original message
        await container.unlock(password);
        const data = bytesToString(await container.getData());
        assert.equal(data, testData);
    });
});
