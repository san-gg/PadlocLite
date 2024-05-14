# Padloc Lite

This project is forked from original project [PadLoc](https://padloc.app/). It
is a standalone application which defer from original project client server
architecture. For more info checkout
[github.com/padloc/padloc](https://github.com/padloc/padloc).

## About

This repo is split into multiple packages:

| Package Name                          | Description                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------------- |
| [@padloc/core](packages/core)         | Core Logic                                                                         |
| [@padloc/app](packages/app)           | Web-based UI components                                                            |
| [@padloc/web](packages/web)           | Standalone Web, can be used for developent.                                        |
| [@padloc/locale](packages/locale)     | Package containing translations and other localization-related things              |
| [@padloc/electron](packages/electron) | The Desktop App, built with Electron                                               |
| [@padloc/cordova](packages/cordova)   | Cordova project for building iOS and Android app.                                  |
| [@padloc/tauri](packages/tauri)       | Cross-platform native app, powered by [Tauri](https://github.com/tauri-apps/tauri) |

## How to use

As you can see in the [About](#about) section, there are lots of different
components. There are various platforms you can build : electron, cordova and
tauri. You can check respective component for more info.

Install all the component's prerequisite

```sh
npm ci && npm run postinstall
```

For quick start: -

```sh
npm start
```

The web client is now available at `http://localhost:8080`!

Since, this codebase is a standalone application. Their is no use of hosting
this web app. It is best suited for building Mobile/Desktop app. So, before
building and using the application you need to add your own persistence storage
logic as well as you can change the encryption logic. Checkout
[@padloc/web](packages/web) for more info on this.

To build Mobile Apps: -

```sh
npm run cordova:build:android
npm run cordova:build:ios
```

To build Desktop Apps: -

```sh
npm run electron:build
npm run tauri:build
```

## Contributing

If you want to **report a bug or have a feature request**, please
[create an issue](https://github.com/padloc/padloc/issues).

If you **have question, feedback or would just like to chat**, head over to the
[discussions](https://github.com/padloc/padloc/discussions) section.

## Security

For a security design overview, check out the PadLoc project's
[whitepaper](https://github.com/padloc/padloc/blob/main/security.md).

## Licensing

As per the forked project's
[License](https://github.com/padloc/padloc/blob/main/LICENSE), this software is
published under the [GNU Affero General Public License](LICENSE).
