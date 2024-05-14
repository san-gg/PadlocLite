import { App } from "@padloc/core/src/app";
import { getPlatform } from "@padloc/core/src/platform";
import { Router } from "./lib/route";

export const app = (window.app = new App());
export const router = (window.router = new Router());
window.getPlatform = getPlatform;
