# @padloc/electron

Padloc Desktop app, built with [Electron](https://www.electronjs.org/)

## Setup

The `@padloc/electron` package is meant to be used from within the
[Padloc Monorepo](../../README.md).

```sh
git clone git@github.com:padloc/padloc.git
cd padloc
npm ci
cd packages/electron
```

## Building

To build the app, run:

```sh
npm run build
```

The resulting build can be fund in the `dist` folder.

By default code uses the memory storage so, before using the application you
need to add your own persistence storage logic as well as you can change the
existing encryption logic.

## Contributing

For info on how to contribute to Padloc, please refer to the
[Monorepo Readme](../../README.md#contributing).
