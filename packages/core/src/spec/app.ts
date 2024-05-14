// import { CreateAccountParams } from "src/params";
// import { Account } from "../account";
// import { App } from "../app";
// import { Spec } from "./spec";

// export function appSpec(): Spec {
//     console.log("testing app");

//     const user = {
//         email: "lengden@olga.com",
//         name: "Lengden Olga",
//         password: "correct battery horse staple",
//     };

//     const app: App = new App();

//     return (test, assert) => {
//         test("App initializes successfully", async () => {
//             await app.loaded;
//         });

//         test("Login", async () => {
//             const createAccount: Account = new Account();
//             createAccount.name = user.name;
//             createAccount.email = user.email;
//             await createAccount.initialize(user.password);
//             await app.api.createAccount(new CreateAccountParams({account: createAccount}));

//             await app.login(user.password);

//             assert.isNotNull(app.account, "Account should be loaded.");
//             const account = app.account!;
//             assert.ownInclude(account, { email: user.email, name: user.name }, "Account info should be correct.");
//             assert.equal(app.mainVault!.items.size, 1, "Vault Items should be loaded");
//         });

//         test("CRUD Vault", async () => {
//             const item = await app.createItem({name: "My First Item"});
//             assert.equal(app.mainVault!.items.size, 1, "Item count should be 1.");
//             assert.ok(app.getItem(item.id), "Item should be accessible by ID.");
//             assert.equal(app.getItem(item.id)!.item, item);
//             assert.equal(app.getItem(item.id)!.vault, app.mainVault);

//             const [item1, item2] = await Promise.all([
//                 app.createItem({ name: "Added Item 1" }),
//                 app.createItem({ name: "Added Item 2"} ),
//             ]);

//             assert.equal(app.mainVault!.items.size, 3, "Item count should be 3.");
//             assert.ok(app.getItem(item1.id), "Created item 1");
//             assert.ok(app.getItem(item2.id), "Created item 2");

//             await app.updateItem(item1, { name: "Edited Item 1" });
//             await app.updateItem(item2, { name: "Edited Item 2" });

//             assert.equal(app.getItem(item1.id)!.item.name, "Edited Item 1");
//             assert.equal(app.getItem(item2.id)!.item.name, "Edited Item 2");

//             await app.deleteItems([item, item1]);

//             assert.equal(app.mainVault!.items.size, 1, "Item count should be 1 after deleting 2 items.");
//             assert.isNull(app.getItem(item.id));
//             assert.isNull(app.getItem(item1.id));
//             assert.equal(app.getItem(item2.id)!.item.name, "Edited Item 2");
//         });

//         test("Lock", async () => {
//             await app.lock();
//             assert.isTrue(app.state.locked, "App should be in 'locked' state.");
//             assert.equal(app.mainVault!.items.size, 0, "Main vault should be inacessible after locking.");
//         });

//         test("Unlock", async () => {
//             await app.unlock(user.password);
//             assert.isFalse(app.state.locked, "App should be in 'unlocked' state.");
//             assert.isNotNull(app.mainVault, "Main vault should be loaded.");
//             assert.equal(app.mainVault!.items.size, 1, "Items should be loaded.");
//         });

//         test("Logout", async () => {
//             await app.logout();

//             const state = app.state;
//             assert.isNotOk(state.account, "Account should be unloaded.");
//             assert.isNull(state.vault);
//         });
//     };
// }
