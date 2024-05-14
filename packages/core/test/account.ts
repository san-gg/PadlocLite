import { assert } from "chai";
import { suite, test } from "mocha";
import { ErrorCode } from "../src/error";
import { Account } from "../src/account";
import { assertReject } from "../src/spec/spec";

suite("Account", () => {
    test("Initialize Account", async () => {
        const email = "hello@example.com";
        const name = "Sir Kuddlesworth";
        const password = "correct battery horse staple";

        let account = new Account();
        account.email = email;
        account.name = name;
        account.tags = [{ name: "SanGG" }];

        await account.initialize(password);

        account.lock();
        assert(account.locked);

        account = new Account().fromRaw(account.toRaw());

        // @ts-ignore
        assert.include(account, { email, name });

        await assertReject(assert, () => account.unlock("wrong password"), ErrorCode.DECRYPTION_FAILED);

        await account.unlock(password);
        assert.equal(account.tags.length, 1, "Should have 1 tag");
        assert.equal(account.tags[0].name, "SanGG", "Should contain SanGG tag");
    });
});
