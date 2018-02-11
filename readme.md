# Pri

The project from development to release, you may only need one package: `pri`.

## Features

<details>
  <summary>Pages are routes.</summary>
  TODO
</details>

<details>
  <summary>Automatic code splitting.</summary>
  As long as there are two or more files under `pages`, the code splitting function will be automatically opened.

  We will automatically generate the following routing:

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
</details>

<details>
  <summary>Typescript first.</summary>
  TODO
</details>

<details>
  <summary>TSlint support.</summary>
  TODO
</details>

<details>
  <summary>Ensure project files.</summary>
  TODO
</details>

<details>
  <summary>Source Map.</summary>
  You can see output like this: `index.tsx:3`.
</details>

TODO:

- Static file serving.
- PWA support.
- Tree Shaking.

## Usage

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

If you haven't `npx` cli, you can copy following npm scripts into `package.json`:

```json
"scripts": {
  "start": "pri dev",
  "build": "pri build",
  "preview": "pri preview"
}
```

All the preparations have been completed!

### npm start

TODO

### npm run preview

TODO

### npm run build

TODO