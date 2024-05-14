# @padloc/web

The Padloc Web Client.

## Setup

Currently the `@padloc/web` package is meant to be used from within the
[Padloc Monorepo](../../README.md).

```sh
git clone git@github.com:padloc/padloc.git
cd padloc
npm ci
cd packages/web
```

## Building

To build, simply run the following from within the package directory.

```sh
npm run build
```

## Web Server

This package also has a bundled web server, which can be used to serve the web
app:

```sh
npm run build_and_start
```

By default the app is hosted on port `8080`

## Development

At the movement this standalone app codebase doesn't have logic to persist data
locally. Currently it will store all of its data to memory. Hence, you need to
add your own logic for data persistence. For more info checkout commented code
[storage.ts](src/storage.ts). Then you need to specify persisted class object to
the [platform](src/index.ts).

## Contributing

For info on how to contribute to Padloc, please refer to the
[Monorepo Readme](../../README.md#contributing).
