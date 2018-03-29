import { execSync } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as prettier from "prettier"
import { log } from "./log"
import { IProjectConfig } from "./project-config-interface"
import { declarePath, pagesPath } from "./structor-config"

export const ensureFiles = (projectRootPath: string, config: IProjectConfig, createDefaultPage: boolean) => {
  log("Ensure project files\n")

  ensureGitignore(projectRootPath, config)
  ensureTsconfig(projectRootPath)
  ensureTslint(projectRootPath)
  ensurePackageJson(projectRootPath)
  ensureVscode(projectRootPath)
  ensureDeclares(projectRootPath)
  ensurePrettierrc(projectRootPath)
  ensureTest(projectRootPath)

  if (createDefaultPage) {
    const pagesAbsolutePath = path.join(projectRootPath, pagesPath.dir)
    if (
      !fs.existsSync(pagesAbsolutePath) ||
      fs.readdirSync(pagesAbsolutePath).every(fileName => path.parse(fileName).name !== "index")
    ) {
      ensureHomePage(projectRootPath)
    } else {
      log(colors.green(`✔ Entry page exist.`))
    }
  }
}

export function ensureGitignore(projectRootPath: string, config: IProjectConfig) {
  ensureFile(
    projectRootPath,
    ".gitignore",
    ["node_modules", config.distDir || "dist", ".cache", ".vscode", ".temp"].join("\n")
  )
}

export function ensureTsconfig(projectRootPath: string) {
  ensureFile(
    projectRootPath,
    "tsconfig.json",
    JSON.stringify(
      {
        compilerOptions: {
          module: "esnext",
          moduleResolution: "node",
          strict: true,
          strictNullChecks: false,
          jsx: "react",
          target: "esnext",
          experimentalDecorators: true,
          skipLibCheck: true,
          outDir: "built",
          lib: ["dom", "es5", "es6", "scripthost"]
        },
        exclude: ["node_modules", "built", "lib"]
      },
      null,
      2
    )
  )
}

export function ensureTslint(projectRootPath: string) {
  ensureFile(
    projectRootPath,
    "tslint.json",
    JSON.stringify(
      {
        extends: "tslint:latest",
        defaultSeverity: "error",
        rules: {
          semicolon: [false],
          "object-literal-sort-keys": false,
          "max-classes-per-file": [true, 5],
          "trailing-comma": [false],
          "no-string-literal": false,
          "max-line-length": [true, 200],
          "arrow-parens": false,
          "no-implicit-dependencies": false,
          "no-object-literal-type-assertion": false,
          "no-submodule-imports": false
        }
      },
      null,
      2
    )
  )
}

export function ensurePackageJson(projectRootPath: string) {
  ensureFile(projectRootPath, "package.json", prev => {
    const prevJson = JSON.parse(prev)
    return JSON.stringify(
      _.merge({}, prevJson, {
        scripts: {
          start: "pri",
          build: "pri build",
          preview: "pri preview",
          test: "pri test"
        }
      }),
      null,
      2
    )
  })
}

export function ensureVscode(projectRootPath: string) {
  ensureFile(
    projectRootPath,
    ".vscode/settings.json",
    JSON.stringify(
      {
        "editor.formatOnPaste": true,
        "editor.formatOnType": true,
        "editor.formatOnSave": true,
        "files.autoSave": "onFocusChange",
        "typescript.tsdk": "node_modules/typescript/lib",
        "editor.tabSize": 2,
        "beautify.tabSize": 2,
        "tslint.autoFixOnSave": true,
        "tslint.ignoreDefinitionFiles": false,
        "tslint.exclude": "**/node_modules/**/*",
        "prettier.singleQuote": false,
        "prettier.semi": false
      },
      null,
      2
    )
  )
}

export function ensureHomePage(projectRootPath: string) {
  const homePagePath = path.join(pagesPath.dir, "index.tsx")
  const filePath = path.join(projectRootPath, homePagePath)

  if (fs.existsSync(filePath)) {
    return
  }

  ensureFile(
    projectRootPath,
    homePagePath,
    prettier.format(
      `
      import { env } from "pri/client"
      import * as React from "react"

      class Props {

      }

      class State {

      }

      export default class Page extends React.PureComponent<Props, State> {
        public static defaultProps = new Props()
        public state = new State()

        public render() {
          return (
            <div>
              <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center"}}>
                Welcome to pri!
              </h1>
              <p style={{ padding: "10 50px" }}>
                Current env: {env.isLocal && "local"}{env.isProd && "prod"}
              </p>
            </div>
          )
        }
      }
    `,
      {
        semi: false,
        parser: "typescript"
      }
    )
  )
}

export function ensureDeclares(projectRootPath: string) {
  const declareAbsolutePath = path.join(projectRootPath, declarePath.dir)
  fs.copySync(path.join(__dirname, "../../declare"), declareAbsolutePath)
}

export function ensurePrettierrc(projectRootPath: string) {
  ensureFile(
    projectRootPath,
    ".prettierrc",
    JSON.stringify(
      {
        bracketSpacing: true,
        printWidth: 120,
        proseWrap: "never",
        requirePragma: false,
        semi: false,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: "none",
        useTabs: false,
        overrides: [{ files: "*.json", options: { printWidth: 200 } }]
      },
      null,
      2
    )
  )
}

function ensureTest(projectRootPath: string) {
  const filePath = path.join(projectRootPath, "tests/index.ts")

  const fileContent = `
    import test from "ava"

    test("Example", t => {
      t.true(true)
    })
  `

  fs.outputFileSync(filePath, prettier.format(fileContent, { semi: false, parser: "typescript" }))
}

export function ensureFile(
  projectRootPath: string,
  fileRelativePath: string,
  fileContentOrResolve: string | ((prev: string) => string)
) {
  const filePath = path.join(projectRootPath, fileRelativePath)
  const fileExist = fs.existsSync(filePath)

  let exitFileContent = ""
  try {
    exitFileContent = fs.readFileSync(filePath).toString()
  } catch (error) {
    //
  }

  const nextContent =
    typeof fileContentOrResolve === "string" ? fileContentOrResolve : fileContentOrResolve(exitFileContent)

  if (fileExist) {
    if (exitFileContent === nextContent) {
      log(`${colors.green(`✔ ${fileRelativePath} not modified, skipped.`)} `)
    } else {
      log(`${colors.yellow(`✔ ${fileRelativePath} exist, but the content is not correct, has been recovered.`)}`)
    }
  } else {
    log(`${colors.magenta(`⚠ ${fileRelativePath} not exist, created.`)}`)
  }

  fs.writeFileSync(filePath, nextContent)
}
