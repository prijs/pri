import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as prettier from "prettier"
import { pri } from "../../node"
import { IProjectConfig } from "../../utils/project-config-interface"
import { declarePath, getGitignores, pagesPath, tsBuiltPath } from "../../utils/structor-config"

export function ensureDeclares(projectRootPath: string) {
  const declareAbsolutePath = path.join(projectRootPath, declarePath.dir)
  fs.copySync(path.join(__dirname, "../../../declare"), declareAbsolutePath)
}

export const ensurePrettierrc = (projectRootPath: string) => ({
  fileRelativePath: ".prettierrc",
  fileContentOrResolve: JSON.stringify(
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
})

export const ensureTsconfig = (projectRootPath: string) => ({
  fileRelativePath: "tsconfig.json",
  fileContentOrResolve: JSON.stringify(
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
        outDir: tsBuiltPath.dir,
        lib: ["dom", "es5", "es6", "scripthost"]
      },
      exclude: ["node_modules", tsBuiltPath.dir, "lib"]
    },
    null,
    2
  )
})

export const ensureTslint = (projectRootPath: string) => ({
  fileRelativePath: "tslint.json",
  fileContentOrResolve: JSON.stringify(
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
})

export const ensureVscode = (projectRootPath: string) => ({
  fileRelativePath: ".vscode/settings.json",
  fileContentOrResolve: JSON.stringify(
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
})

export const ensureGitignore = (projectConfig: IProjectConfig) => ({
  fileRelativePath: ".gitignore",
  fileContentOrResolve: getGitignores(projectConfig).join("\n")
})

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()
  const projectConfig = instance.project.getProjectConfig("local")

  instance.project.onEnsureProjectFiles(ensureGitignore(projectConfig))

  instance.project.onEnsureProjectFiles(ensureTsconfig(projectRootPath))

  instance.project.onEnsureProjectFiles(ensureVscode(projectRootPath))

  instance.project.onEnsureProjectFiles(ensurePrettierrc(projectRootPath))

  ensureDeclares(projectRootPath)

  const homePagePath = path.join(pagesPath.dir, "index.tsx")
  const homePageAbsolutePath = path.join(projectRootPath, homePagePath)
  const homeMarkdownPagePath = path.join(pagesPath.dir, "index.md")
  const homeMarkdownPageAbsolutePath = path.join(projectRootPath, homeMarkdownPagePath)
  if (!fs.existsSync(homePageAbsolutePath) && !fs.existsSync(homeMarkdownPageAbsolutePath)) {
    instance.project.onEnsureProjectFiles({
      fileRelativePath: homePagePath,
      fileContentOrResolve: prettier.format(
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
    })
  }

  instance.project.onEnsureProjectFiles({
    fileRelativePath: "package.json",
    fileContentOrResolve: prev => {
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
    }
  })

  instance.project.onEnsureProjectFiles({
    fileRelativePath: "tests/index.ts",
    fileContentOrResolve: prettier.format(
      `
      import test from "ava"

      test("Example", t => {
        t.true(true)
      })
    `,
      { semi: false, parser: "typescript" }
    )
  })
}