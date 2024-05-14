// // @ts-ignore
// import { BrowserLevel } from "browser-level";
// import { Storage, Storable, StorableConstructor, StorageListOptions, StorageQuery } from "@padloc/core/src/storage";
// import { Attachment, AttachmentID, AttachmentStorage } from "@padloc/core/src/attachment";
// import { VaultID } from "@padloc/core/src/vault";
// import { Err, ErrorCode } from "@padloc/core/src/error";

// export class LevelDBStorage implements Storage {
//     private _db = new BrowserLevel("data");

//     async get<T extends Storable>(cls: StorableConstructor<T> | T, id: string) {
//         const res = cls instanceof Storable ? cls : new cls();
//         try {
//             const raw = await this._db.get(`${res.kind}_${id}`);
//             return res.fromJSON(raw);
//         } catch (e) {
//             if (e.notFound) {
//                 throw new Err(ErrorCode.NOT_FOUND, `Cannot find object: ${res.kind}_${id}`);
//             } else {
//                 throw e;
//             }
//         }
//     }

//     async save<T extends Storable>(obj: T) {
//         await this._db.put(`${obj.kind}_${obj.id}`, obj.toJSON());
//     }

//     async delete<T extends Storable>(obj: T) {
//         await this._db.del(`${obj.kind}_${obj.id}`);
//     }

//     async clear() {
//         throw "not implemented";
//     }
// }

// export class LevelAttachmentStorage implements AttachmentStorage {
//     private _storage = new BrowserLevel<string, string>("attachment");

//     async put(a: Attachment): Promise<void> {
//         await this._storage.put(`${a.vault}_${a.id}`, a.toJSON());
//     }

//     async get(vault: VaultID, id: AttachmentID): Promise<Attachment> {
//         const att = await this._storage.get(`${vault}_${id}`);
//         if (!att) {
//             throw new Err(ErrorCode.NOT_FOUND);
//         }
//         return new Attachment().fromJSON(att);
//     }

//     async delete(vault: VaultID, id: AttachmentID): Promise<void> {
//         await this._storage.del(`${vault}_${id}`);
//     }

//     async deleteAll(vault: VaultID): Promise<void> {
//         for await (const key of this._storage.keys()) {
//             if (key.startsWith(vault)) {
//                 await this._storage.del(key);
//             }
//         }
//     }

//     async getUsage(vault: VaultID): Promise<number> {
//         let size = 0;
//         let _attachment: Attachment = new Attachment();
//         for await (const key of this._storage.keys()) {
//             if (key.startsWith(vault)) {
//                 const att = _attachment.fromJSON(await this._storage.get(key));
//                 size += att.size;
//             }
//         }
//         return size;
//     }
// }
