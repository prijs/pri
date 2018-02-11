# Pri

The project from development to on-line, you map only need one npm dependency, it not only the cli, but also providing many package exports.

You can both use `pri` with cli - `pri build`, and npm package - `import { React } from "pri"`

## Features

<details>
  <summary>Pages are routes.</summary>
  TODO
</details>

<details>
  <summary>Tree Shake.</summary>
  TODO
</details>

<details>
  <summary>Automatic code splitting.</summary>
  TODO
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

TODO:

- Static file serving.
- PWA support.

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