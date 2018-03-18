# Pri &middot; [![npm version](https://img.shields.io/npm/v/pri.svg?style=flat-square)](https://www.npmjs.com/package/pri)

Pri is a toolkit for building web applications with React. **Helps you deal with everything, and you can focus on business logic.**

[Read docs](https://ascoders.github.io/pri-docs/).

## Setup

First, create an empty folder:

```shell
# test folder
npm init
npm i pri --save
```

Then, init the pri project:

```shell
npx pri init
```

No `npx`? Run `./node_modules/.bin/pri init`.

</details>

### npm start

Run dev server in development mode with files watching and HMR.

> You should set `chrome://flags/#allow-insecure-localhost`, to trust local certificate

### npm run preview

Preview in production mode, won't watch files change.

### npm run build

Production deployment. By default the dist folder is `./dist`.

## Usage

* [Pages are routes.](https://ascoders.github.io/pri-docs/usage/pages-are-routes)
* [Markdown support.](https://ascoders.github.io/pri-docs/usage/markdown-support)
* [Scss/Less/Css support.](https://ascoders.github.io/pri-docs/usage/scss-less-css)
* [Layout support.](https://ascoders.github.io/pri-docs/usage/layout-support)
* [Page not found.](https://ascoders.github.io/pri-docs/usage/page-not-found)
* [Built in data stream.](https://ascoders.github.io/pri-docs/usage/built-in-data-stream)
* [Environment variable.](https://ascoders.github.io/pri-docs/usage/environment-variable)
* [Deploy to github pages.](https://ascoders.github.io/pri-docs/usage/deploy-to-github-pages)

#### TODO

* Static file serving.
* Testing.

## Features

* [Project Dashboard.](https://ascoders.github.io/pri-docs/features/project-dashboard)
* [Typescript support.](https://ascoders.github.io/pri-docs/features/typescript-support)
* [Tslint support.](https://ascoders.github.io/pri-docs/features/tslint-support)
* [Dynamic import.](https://ascoders.github.io/pri-docs/features/dynamic-import)
* [Automatic HMR.](https://ascoders.github.io/pri-docs/features/automatic-hmr)
* [Automatic code splitting.](https://ascoders.github.io/pri-docs/features/automatic-code-splitting)
* [Import on demand.](https://ascoders.github.io/pri-docs/features/import-on-demand)
* [Auto create project files.](https://ascoders.github.io/pri-docs/features/auto-create-project-files)
* [Auto pick shared modules.](https://ascoders.github.io/pri-docs/features/auto-pick-shared-modules)
* [Tree Shaking.](https://ascoders.github.io/pri-docs/features/tree-shaking)
* [Scope Hoist.](https://ascoders.github.io/pri-docs/features/scope-hoist)

### TODO

* PWA support.
* Prefetch.
* Code coverage.

## Built-in packages in 0.x version

* [react@16.2.0](https://www.npmjs.com/package/react)
* [react-dom@16.2.0](https://www.npmjs.com/package/react-dom)
* [react-router-dom@4.2.2](https://www.npmjs.com/package/react-router-dom)
* [antd@3.2.1](https://www.npmjs.com/package/antd)
* [dob@2.5.8](https://www.npmjs.com/package/dob)
* [lodash@4.17.4](https://www.npmjs.com/package/lodash)
* [react-loadable@5.3.1](https://www.npmjs.com/package/react-loadable)
* [webpack@4.1.0](https://www.npmjs.com/package/parcel-bundler)
* [babel@7.0.0](https://www.npmjs.com/package/babel-core)
* [typescript@2.7.1](https://github.com/Microsoft/TypeScript)

## Inspired

* [next.js](https://github.com/zeit/next.js)
* [umi](https://github.com/umijs/umi)
* [rekit](https://github.com/supnate/rekit)
