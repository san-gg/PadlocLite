import { setPlatform } from "@padloc/core/src/platform";
import { WebPlatform } from "@padloc/app/src/lib/platform";
// import { LevelDBStorage, LevelAttachmentStorage } from "./storage";
// import { Storage } from "@padloc/core/src/storage";
// import { setAttachmentStorage } from "@padloc/core/src/attachment";

// class WebPlatformExtended extends WebPlatform {
//     storageDB: Storage = new LevelDBStorage();
// }

if (window.location.search !== "?spinner") {
    (async () => {
        setPlatform(new WebPlatform()); // setPlatform(new WebPlatformExtended());
        // setAttachmentStorage(new LevelAttachmentStorage());

        await import("@padloc/app/src/elements/app");

        window.onload = () => {
            const app = document.createElement("pl-app");
            document.body.appendChild(app);
        };
    })();
}
