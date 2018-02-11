# Pri

A project from development to release, you may only need one package: `pri`.

## How to use

### Setup

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
  <summary>If you haven't `npx` cli, you can copy following npm scripts into `package.json`.</summary>

  <p>
  
  ```json
  "scripts": {
    "start": "pri",
    "build": "pri build",
    "preview": "pri preview"
  }
  ```
  
  </p>

</details>

#### npm start

Run dev server in development mode with files watching and HMR.

#### npm run preview

Preview in production mode, won't watch files change.

#### npm run build

Production deployment. By default the dist folder is `./dist`.

### Usage

<details>
  <summary>Pages are routes.</summary>

  <p>
  
  Populate `.src/pages/index.tsx` inside your project:

  ```typescript
  export default () => <div>Hello pri!</div>
  ```

  Then, just run `npm start`, this home page will route to `/`.

  **Routes**

  Routes will be automatically created by the file's path in `./src/pages`. For example, file `./src/pages/user/about.tsx` will be found in route `/user/about`.
  
  </p>

</details>

<details>
  <summary>Support layouts.</summary>

  <p>
  
  Populate `.src/layouts/index.tsx` inside your project:

  ```typescript
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

## Features

<details>
  <summary>Typescript first.</summary>
  
  <p>

  `Pri` is written by typescript, so it's easy to use in typescript:

  ```typescript
  // pages/index.tsx
  import { React } from "pri"
  ```

  </p>

</details>

<details>
  <summary>TSlint support.</summary>
  
  <p>

  After the `pri` is installed, the tslint will take effect automatically.

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
  <summary>Automatic Ensure project files.</summary>
  
  <p>
  
  After any of this three commands are executed: `npm start|build|preview`, will create following files automatically:

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

## TODO

- Static file serving.
- PWA support.
- Tree Shaking.
- Scope Hoist.
- Prefetch router.
