import { Platform } from "@padloc/core/src/platform";
// import { bytesToBase64 } from "@padloc/core/src/encoding";
import { WebPlatform } from "@padloc/app/src/lib/platform";
import { appleDeviceNames } from "./apple-device-names";
import { Err, ErrorCode } from "@padloc/core/src/error";
import { Permissions, PermissionStatus } from "cordova-plugin-android-permissions/www/permissions";

const cordovaReady = new Promise((resolve) => document.addEventListener("deviceready", resolve));

declare var cordova: any;
declare var device: any;
// declare var plugins: any;
declare var window: any;

export class CordovaPlatform extends WebPlatform implements Platform {
    async getDeviceInfo() {
        await cordovaReady;
        const { manufacturer, model, platform, version: osVersion } = device;
        return Object.assign(await super.getDeviceInfo(), {
            manufacturer,
            model,
            platform,
            osVersion,
            description: appleDeviceNames[model] || model,
            runtime: "cordova",
        });
    }

    async setClipboard(val: string): Promise<void> {
        await cordovaReady;
        return new Promise((resolve, reject) => {
            cordova.plugins.clipboard.copy(val, resolve, reject);
        });
    }

    async getClipboard(): Promise<string> {
        await cordovaReady;
        return new Promise((resolve, reject) => {
            cordova.plugins.clipboard.paste(resolve, reject);
        });
    }

    async saveFile(fileName: string, type: string, data: Uint8Array) {
        let isWritePermission = await this.checkPermission().catch((e) => {
            throw e;
        });

        if (!isWritePermission) throw new Err(ErrorCode.INSUFFICIENT_PERMISSIONS, "Storage permission is required.");

        //

        await this.writeFile(fileName, type, data).catch((err) => {
            throw err;
        });
    }

    async checkPermission() {
        let permissions = cordova.plugins.permissions as Permissions;
        return new Promise<boolean>((resolve, reject) => {
            permissions.checkPermission(
                permissions.WRITE_EXTERNAL_STORAGE,
                (status: PermissionStatus) => {
                    resolve(status.hasPermission);
                },
                function () {
                    reject(new Err(ErrorCode.SOMETHIND_WENT_WRONG, "Something went wrong while checking permission"));
                }
            );
        }).then((isWritePermission: boolean) => {
            if (isWritePermission) return true;
            return new Promise<boolean>((resolve, reject) => {
                permissions.requestPermission(
                    permissions.WRITE_EXTERNAL_STORAGE,
                    (status: PermissionStatus) => {
                        resolve(status.hasPermission);
                    },
                    () => {
                        reject(new Err(ErrorCode.SOMETHIND_WENT_WRONG, "Something went wrong while giving permission"));
                    }
                );
            });
        });
    }

    // async checkPermission1() {
    //     let permissions = cordova.plugins.permissions as Permissions;
    //     let errFunc = function(e: Err) { throw e; };

    //     let isWritePermission: boolean = await new Promise<boolean>((resolve, reject) => {
    //         permissions.checkPermission(permissions.WRITE_EXTERNAL_STORAGE, (status: PermissionStatus) => {
    //             resolve(status.hasPermission);
    //         }, function() {
    //             reject(new Err(ErrorCode.SOMETHIND_WENT_WRONG, "Something went wrong while checking permission"));
    //         });
    //     })
    //     .catch(errFunc);

    //     if(!isWritePermission) {
    //         isWritePermission = await new Promise<boolean>((resolve, reject) => {
    //             permissions.requestPermission(permissions.WRITE_EXTERNAL_STORAGE, (status: PermissionStatus) => {
    //                 resolve(status.hasPermission);
    //             }, () => {
    //                 reject(new Err(ErrorCode.SOMETHIND_WENT_WRONG, "Something went wrong while giving permission"));
    //             });
    //         })
    //         .catch(errFunc);
    //     }

    //     if(!isWritePermission) throw new Err(ErrorCode.INSUFFICIENT_PERMISSIONS, "Storage permission is required.");
    // }

    async writeFile(fileName: string, type: string, data: Uint8Array): Promise<void> {
        let error: Err = new Err(ErrorCode.SOMETHIND_WENT_WRONG, "Something went wrong...");
        return new Promise<void>((resolve, reject) => {
            window.resolveLocalFileSystemURL(
                cordova.file.externalRootDirectory + "Download/" + fileName,
                function () {
                    reject(
                        new Err(
                            ErrorCode.FILE_ALREADY_PRESENT,
                            `File already present in Downloads with the name ${fileName}`
                        )
                    );
                },
                function () {
                    resolve();
                }
            );
        }).then(() => {
            return new Promise<void>((resolve, reject) => {
                window.resolveLocalFileSystemURL(
                    cordova.file.externalRootDirectory + "Download/",
                    function (directoryEntry: any) {
                        directoryEntry.getFile(
                            fileName,
                            { create: true, exclusive: false },
                            function (fileEntry: any) {
                                fileEntry.createWriter(
                                    function (fileWriter: any) {
                                        fileWriter.onerror = () => {
                                            reject(
                                                new Err(
                                                    ErrorCode.SOMETHIND_WENT_WRONG,
                                                    "Something went wrong while saving file..."
                                                )
                                            );
                                        };
                                        fileWriter.onwriteend = () => {
                                            resolve();
                                        };
                                        fileWriter.write(new Blob([data], { type: type }));
                                    },
                                    () => {
                                        reject(error);
                                    }
                                );
                            },
                            () => {
                                reject(error);
                            }
                        );
                    },
                    () => {
                        reject(error);
                    }
                );
            });
        });
    }

    openExternalUrl(url: string) {
        cordova.InAppBrowser.open(url, "_system");
    }
}
