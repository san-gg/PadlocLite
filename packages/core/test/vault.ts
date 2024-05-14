import { assert } from "chai";
import { suite, test } from "mocha";
import { Vault } from "../src/vault";
import { createVaultItem } from "../src/item";

suite("Vault", () => {
    test("CRUD", async () => {
        const vault: Vault = new Vault();

        const items = await Promise.all([
            createVaultItem({ name: "Added Item 1" }),
            createVaultItem({ name: "Added Item 2" }),
        ]);
        await vault.items.update(...items);
        assert.equal(vault.items.size, 2, "Item count should be 2.");
        assert.ok(vault.items.get(items[0].id), "Created item 1");
        assert.ok(vault.items.get(items[1].id), "Created item 2");

        items[0].name = "Edited Item 1";
        items[1].name = "Edited Item 2";
        await vault.items.update(...items);
        assert.equal(vault.items.get(items[0].id)!.name, "Edited Item 1");
        assert.equal(vault.items.get(items[1].id)!.name, "Edited Item 2");

        await vault.items.remove(...items);
        assert.equal(vault.items.size, 0, "Item count should be 0 after deleting 2 items.");
    });
});
