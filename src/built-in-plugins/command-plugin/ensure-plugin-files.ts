import * as colors from "colors"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as prettier from "prettier"
import { ensureFile } from "../../utils/ensure-files"
import { log } from "../../utils/log"
import { builtDir } from "./static"

export function ensureNpmIgnore(projectRootPath: string) {
  ensureFile(
    projectRootPath,
    ".npmignore",
    ["node_modules", ".cache", ".vscode", ".temp", builtDir, "tests", ".nyc_output", "coverage"].join("\n")
  )
}

export function ensureGitignore(projectRootPath: string) {
  ensureFile(
    projectRootPath,
    ".gitignore",
    ["node_modules", ".cache", ".vscode", ".temp", builtDir, ".nyc_output", "coverage"].join("\n")
  )
}

export function ensurePackageJson(projectRootPath: string) {
  ensureFile(projectRootPath, "package.json", prev => {
    const prevJson = JSON.parse(prev)
    return JSON.stringify(
      _.merge({}, prevJson, {
        types: "src/index.ts",
        main: builtDir + "/index.js",
        scripts: {
          start: "pri plugin-watch",
          prepublishOnly: "pri plugin-build",
          release: "npm publish",
          test: "pri test"
        },
        dependencies: { pri: "*" }
      }),
      null,
      2
    )
  })
}

export function ensureEntry(projectRootPath: string) {
  const fileName = "src/index.tsx"
  const filePath = path.join(projectRootPath, fileName)

  if (fs.existsSync(filePath)) {
    log(colors.green(`✔ Entry file already exist.`))
    return
  }

  ensureFile(
    projectRootPath,
    fileName,
    prettier.format(
      `
    import * as path from "path"
    import { pri } from "pri"
    import { judgeHasComponents } from "./methods"

    interface IResult {
      customPlugin: {
        hasComponents: boolean
      }
    }

    export default (instance: typeof pri) => {
      const projectRootPath = instance.project.getProjectRootPath()

      instance.commands.registerCommand({
        name: "deploy",
        action: () => {
          //
        }
      })

      instance.commands.expandCommand({
        name: "init",
        beforeAction: (...args: any[]) => {
          //
        }
      })

      instance.project.onAnalyseProject(files => {
        return { customPlugin: { hasComponents: judgeHasComponents(projectRootPath, files) } } as IResult
      })

      instance.project.onCreateEntry((analyseInfo: IResult, entry, env, projectConfig) => {
        if (!analyseInfo.customPlugin.hasComponents) {
          return
        }

        entry.pipeHeader(header => {
          return \`
            \${header}
            import "src/components/xxx"
          \`
        })
      })
    }
  `,
      {
        semi: false,
        parser: "typescript"
      }
    )
  )
}

function ensureEntryMethods(projectRootPath: string) {
  const fileName = "src/methods.ts"
  const filePath = path.join(projectRootPath, fileName)

  if (fs.existsSync(filePath)) {
    log(colors.green(`✔ Methods file already exist.`))
    return
  }

  ensureFile(
    projectRootPath,
    fileName,
    prettier.format(
      `
    import * as path from "path"

    export function judgeHasComponents(projectRootPath: string, files: path.ParsedPath[]) {
      return files.some(file => {
        const relativePath = path.relative(projectRootPath, path.join(file.dir, file.name))
        if (relativePath.startsWith("src/components")) {
          return true
        }
        return false
      })
    }
  `,
      {
        semi: false,
        parser: "typescript"
      }
    )
  )
}

export function ensureTest(projectRootPath: string) {
  const fileName = "tests/index.ts"
  const filePath = path.join(projectRootPath, fileName)

  if (fs.existsSync(filePath)) {
    log(colors.green(`✔ Test file already exist.`))
    return
  }

  ensureFile(
    projectRootPath,
    fileName,
    prettier.format(
      `
    import test from "ava"
    import * as path from "path"
    import { judgeHasComponents } from "../src/methods"

    const testProjectRootPath = "/Users/someOne/workspace"

    const testFilePaths = (filePaths: string[]) =>
      filePaths.map(filePath => path.join(testProjectRootPath, filePath)).map(filePath => path.parse(filePath))

    test("Single file", t => {
      const relativeProjectFiles = ["src/components"]
      t.true(judgeHasComponents(testProjectRootPath, testFilePaths(relativeProjectFiles)))
    })

    test("Multiple files", t => {
      const relativeProjectFiles = [
        "src/components/index.tsx",
        "src/components/button/index.tsx",
        "src/components/select/index.tsx"
      ]
      t.true(judgeHasComponents(testProjectRootPath, testFilePaths(relativeProjectFiles)))
    })

    test("hasn't components", t => {
      const relativeProjectFiles = ["src/pages/index.tsx"]
      t.false(judgeHasComponents(testProjectRootPath, testFilePaths(relativeProjectFiles)))
    })
  `,
      {
        semi: false,
        parser: "typescript"
      }
    )
  )
}
