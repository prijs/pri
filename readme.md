# Pri &middot;  [![npm version](https://img.shields.io/npm/v/pri.svg?style=flat-square)](https://www.npmjs.com/package/pri)

Pri is a toolkit for building web applications with React. **Helps you deal with everything, and you can focus on business logic.**

## Setup

First, create an empty folder:

```shell
mkdir test; cd test
npm init
npm i pri --save
```

Then, init the pri project:

```shell
npx pri init
```

<details>
  <summary>
  No <code>npx</code>?
  </summary>

  <p>

  If you haven't `npx` cli, you can copy following npm scripts into `package.json`:
  
  ```json
  "scripts": {
    "start": "pri",
    "build": "pri build",
    "preview": "pri preview"
  }
  ```

  Or, upgrade your `npm`!
  
  </p>

</details>

### npm start

Run dev server in development mode with files watching and HMR.

> You should set `chrome://flags/#allow-insecure-localhost`, to trust local certificate

### npm run preview

Preview in production mode, won't watch files change.

### npm run build

Production deployment. By default the dist folder is `./dist`.

## Usage

<details>
  <summary>Pages are routes.</summary>

  <p>

  > You can also create pages by project dashboard easily!
  
  Populate `./src/pages/index.tsx` inside your project:

  ```tsx
  import * as React from "react"
  export default () => <div>Hello pri!</div>
  ```

  Then, just run `npm start`, this home page will route to `/`.

  **Routes**

  Routes will be automatically created by the file's path in `./src/pages/**/index.tsx`.

  `index.tsx` will be read as router under each folders, The folder path is the URL path.
  
  For example, file `./src/pages/user/about/index.tsx` will be found in route `/user/about`.
  
  </p>

</details>

<details>
  <summary>Markdown support.</summary>
  
  <p>

  Populate `./src/pages/example-page/index.md` inside your project:

  ```text
  ## Markdown File
  ```

  Then, just run `npm start`, this page will route to `/example-page`.

  **Markdown layout**

  Create `./src/layouts/markdown.tsx`, then all markdown pages will use this layout template. For example:

  ```tsx
  export default () => (
    <div style={{ padding: 10 }}>
      {this.props.children}
    </div>
  )
  ```

  </p>

</details>

<details>
  <summary>Scss/Less/Css support.</summary>
  
  <p>

  **sass**

  Install `node-sass` first, or it will be auto installed on the first execution of `npm start` :

  ```shell
  npm i node-sass --save
  ```

  Then you can create scss files, and include it from `pages/**/index.tsx`:

  ```typescript
  import "./index.scss"
  ```

  **less**

  Install `less` first, or it will be auto installed on the first execution of `npm start` :

  ```shell
  npm i less --save
  ```

  The same as sass.

  **css**

  Native support it.

  </p>

</details>

<details>
  <summary>Layouts support.</summary>

  <p>

  > You can also create layout by project dashboard easily!
  
  Populate `./src/layouts/index.tsx` inside your project:

  ```tsx
  import * as React from "react"

  export default (props: React.Props<any>) => (
    <div>
      <p>Layout header</p>
      {props.children}
    </div>
  )
  ```

  This file will automatically become the layout file, and `props.children` are the content of the files in `./src/pages`
  
  </p>

</details>

<details>
  <summary>Page not found.</summary>
  
  <p>

  > You can also create 404 page by project dashboard easily!

  Populate `.src/pages/404.tsx` inside your project:

  ```typescript
  import * as React from "react"

  export default () => (
    <div>
      Page not found!
    </div>
  )
  ```

  </p>

</details>

<details>
  <summary>Custom config.</summary>
  
  <p>

  > You can also create config files by project dashboard easily!

  You can create these files to config `pri`:
  - `./src/config/config.default.ts`.
  - `./src/config/config.local.ts`, enable when exec `npm start`.
  - `./src/config/config.prod.ts`, enable when exec `npm run build`.

  `config.local.ts` and `config.prod.ts` have a higher priority than `config.default.ts`

  **Example**

  ```typescript
  // ./src/config/config.default.ts

  import { ProjectConfig } from "pri"

  export default {
    distDir: "output"
  } as ProjectConfig
  ```

  **`ProjectConfig` Details**

  ```typescript
    export class IProjectConfig {
    /**
     * Title for html <title>
     */
    public title?: string = "pri"
    /**
     * Dist dir path
     * Only take effect on npm run build | pri build
     */
    public distDir?: string = "dist"
    /**
     * Dist main file name
     * Only take effect on npm run build | pri build
     */
    public outFileName?: string = "main"
    /**
     * Assets public path. eg: some.com, some.com/somePath, /somePath
     * If not set, result: /<distPath>
     * If set /somePath for example, result: /somePath/<distPath>
     * If set some.com for example, result: //some.com/<distPath>
     * If set some.com/somePath for example, result: //some.com/somePath/<distPath>
     * Only take effect on npm run build | pri build
     */
    public publicPath?: string | null = null
    /**
     * Base href for all pages.
     * For example, /admin is the root path after deploy, you should set baseHref to /admin.
     * There is no need to modify the code, routing / can automatically maps to /admin.
     * Only take effect on npm run build | pri build
     */
    public baseHref?: string = "/"
    /**
     * Generate static index file for each route, when building.
     * Usefal for static service who don't serve fallback html, like github-pages.
     * Only take effect on npm run build | pri build
     */
    public staticBuild = false
    /**
     * Custom env
     */
    public env?: {
      [key: string]: any
    }
  }
  ```

  </p>

</details>

<details>
  <summary>Built-in MVVM data stream.</summary>
  
  <p>

  > You can also create stores by project dashboard easily!

  Populate `./src/stores/[storeName].ts` inside your project, for example `user`:

  ```typescript
  // ./src/stores/user.ts

  import { observable, inject, Action } from "dob"

  @observable
  export class UserStore {
    public testValue = 1
  }

  export class UserAction {
    @inject(UserStore) userStore: UserStore

    @Action
    public async test() {
      this.userStore.testValue++
    }
  }
  ```

  Then, **all pages are automatically injected into all stores**, and automatically create type helper file in `./src/helper.ts`.

  All you should do is call or use this store on pages:

  ```tsx
  // ./src/pages/index.tsx

  // Only for type support. You can delete next line, if you are using js.
  import { stores } from "../helper"

  import * as React from "react"

  export default class Page extends React.PureComponent<typeof stores, any> {
    public render() {
      return (
        <div onClick={this.props.UserAction.test}>
          {this.props.UserStore.testValue}
        </div>
      )
    }
  }
  ```

  </p>

</details>

<details>
  <summary>Environment variable.</summary>
  
  <p>

  You can use environment variable from `pri`:

  ```typescript
  // ./src/pages/index.tsx

  import { env } from "pri"

  if (env.isLocal) {
    console.log("I'm running in local now!")
  }

  if (env.isProd) {
    console.log("I'm running in production now!")
  }

  console.log("Custom env", env.get("theme"))
  ```

  `Pri` has some built-in env, like `isLocal` and `isProd`.

  When execute `npm start`, `env.isLocal === true`, when execute `npm run build` or `npm run preview`, `env.isProd === true`.
  
  You can also set your own custom env variable in config files, and get them by using `env.get()`.

  ```typescript
  // ./src/config/config.default.ts

  import { ProjectConfig } from "pri"

  export default {
    env: {
      theme: "One Dark"
    }
  } as ProjectConfig
  ```

  - After running `npm start`, `env.get()` will get from the map merged by `config.local.ts` and `config.default.ts`
  - After running `npm run build`, `env.get()` will get from the map merged by `config.prod.ts` and `config.default.ts`

  </p>

</details>

<details>
  <summary>Deploy to github pages.</summary>
  
  <p>

  Set up `publicPath`, `baseHref` and `staticBuild` in the **Custom config**.

  ```typescript
  // src/config/config.default.ts

  import { ProjectConfig } from "pri"

  export default {
    staticBuild: true,
    publicPath: "/<your-repo-name>",
    baseHref: "/<your-repo-name>"
  } as ProjectConfig
  ```

  Then, execute `npm i gh-pages --save-dev`, and add npm scripts:

  ```json
  "deploy": "pri build && gh-pages -d dist"
  ```

  Finally, execute `npm run deploy`!

  > This is because js files will be served from `/<your-repo-name>` and the root path changed to `/<your-repo-name>` on github-pages.

  > `staticBuild` will generate static index file for each route.

  </p>

</details>

#### TODO

- Static file serving.
- Testing.

## Features

<details>
  <summary>Project Dashboard.</summary>
  
  <p>

  <img src="https://img.alicdn.com/tfs/TB19jNdaDtYBeNjy1XdXXXXyVXa-1437-802.png" width=600 />

  As you see, when execute `npm start`, a dashboard appears on the right by iframe.

  It can manage and analyze your project code. You can use it to view all the routes of the current project, jumping page, create new pages or stores.

  > More still in continuous development!

  </p>

</details>

<details>
  <summary>Typescript support.</summary>
  
  <p>

  `Pri` is written by typescript, so it's easy to use in typescript.

  </p>

</details>

<details>
  <summary>TSlint support.</summary>
  
  <p>

  After the `pri` is installed, the tslint will take effect automatically.

  **We enforce tslint check when execute `npm run build`**, and you can't skip it!

  </p>

</details>

<details>
  <summary>Dynamic import.</summary>
  
  <p>

  **Dynamic package**

  ```typescript
  async function mergeObject(source: object, target: object) {
    const _ = await import("lodash")
    return _.mergeDeep(source, target)
  }
  ```

  **Dynamic component**

  ```typescript
  import { Loadable } from "pri"

  const SomePage = Loadable({
    loader: () => import("../components/some-page"),
    loading: () => <div>loading..</div>
  })

  function renderDynamicPage() {
    return <SomePage />
  }
  ```

  See more in [react-loadable](https://github.com/thejameskyle/react-loadable).

  </p>

</details>

<details>
  <summary>Automatic HMR and watching files.</summary>
  
  <p>

  After run `npm start`, the develop server support HMR.

  And when you add or delete any files in `src/pages` or `src/layouts`, new routes will automatically create, you don't need to restart the command.

  </p>

</details>

<details>
  <summary>Automatic code splitting.</summary>
  
  <p>

  > As long as there are two or more files under `pages`, will automatically use code splitting.
  
  We will automatically generate the following routing in `.temp` folder:

  ```typescript
  const srcPagesIndex = Loadable({
    loader: () => import("..."),
    loading: () => null
  })

  const srcPagesOther = Loadable({
    loader: () => import("..."),
    loading: () => null
  })
  ```

  </p>

</details>

<details>
  <summary>Import on demand.</summary>
  
  <p>

  By using [babel-plugin-import](https://github.com/ant-design/babel-plugin-import), we can import individual components on demand:

  ```typescript
  import { Button } from 'antd'

  ↓ ↓ ↓ ↓ ↓ ↓

  var _button = require('antd/lib/button')
  ```

  </p>

</details>

<details>
  <summary>Automatic Ensure project files.</summary>
  
  <p>
  
  After any of this three commands are executed: `npm start|build|preview` or `npx pri init`, will create following files automatically:

  **.gitignore**

  Ensure that `.gitignore` has some basic rules: `node_modules` `dist` and so on.

  **tsconfig.json**

  Ensure that typescript working.

  **tslint.json**

  Ensure uniform code inspection rules.

  **.babelrc**

  Everyone likes `babel`.

  **package.json**

  Ensure `package.json` has these npm scripts: `npm start|build|preview`.

  **.vscode**

  Ensure that developers have a unified editor experience.
  
  </p>

</details>

<details>
  <summary>Automatic pick shared module.</summary>
  
  <p>

  **Isolated dependence**

  If `jquery` and `lodash` are either dependent by each files like following code:

  ```typescript
  // src/pages/foo.tsx
  import * as $ from "jquery"

  // src/pages/bar.tsx
  import * as _ from "lodash"
  ```

  `JQuery` will be packaged into the `foo.tsx`, and `lodash` will be packaged into the `bar.tsx`.

  **Shared dependence**

  If `jquery` is both dependent by each files like following code:

  ```typescript
  // src/pages/foo.tsx
  import * as $ from "jquery"

  // src/pages/bar.tsx
  import * as $ from "jquery"
  ```

  Neither `foo.tsx` nor `bar.tsx` will package `jquery`, instand, `jquery` will be packaged into main entry file.

  </p>

</details>

<details>
  <summary>Tree Shaking.</summary>
  
  <p>

  Tree shaking is a term commonly used in the JavaScript context for dead-code elimination. It relies on the [static structure](http://exploringjs.com/es6/ch_modules.html#static-module-structure) of ES2015 module syntax.

  Read [more](https://webpack.js.org/guides/tree-shaking/#caveats).

  </p>

</details>

<details>
  <summary>Scope Hoist.</summary>
  
  <p>

  In comparison, tools like Closure Compiler and RollupJS ‘hoist’ or concatenate the scope of all your modules into one closure and allow for your code to have a faster execution time in the browser. Pri do this by using webpack.

  </p>

</details>

### TODO

- PWA support.
- Prefetching.
- Code coverage.

## Built-in packages in 0.x version

- [react@16.2.0](https://www.npmjs.com/package/react)
- [react-dom@16.2.0](https://www.npmjs.com/package/react-dom)
- [react-router-dom@4.2.2](https://www.npmjs.com/package/react-router-dom)
- [webpack@4.0.2](https://www.npmjs.com/package/parcel-bundler)
- [babel@7.0.0](https://www.npmjs.com/package/babel-core)
- [dob@2.5.8](https://www.npmjs.com/package/dob)
- [react-loadable@5.3.1](https://www.npmjs.com/package/react-loadable)
- [antd@3.2.1](https://www.npmjs.com/package/antd)
- [typescript@2.7.1](https://github.com/Microsoft/TypeScript)

## Inspired

- [next.js](https://github.com/zeit/next.js)
- [umi](https://github.com/umijs/umi)
- [rekit](https://github.com/supnate/rekit)