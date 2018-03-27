import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as prettier from "prettier"
import { builtDir } from "./static"

export function ensureNpmIgnore(projectRootPath: string) {
  const filePath = path.join(projectRootPath, ".npmignore")
  const ensureContents = ["node_modules", ".cache", ".vscode", ".temp", builtDir, "tests", ".nyc_output", "coverage"]

  const exitFileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath).toString() || "" : ""
  const exitFileContentArray = exitFileContent.split("\n").filter(content => content !== "")

  ensureContents.forEach(content => {
    if (exitFileContentArray.indexOf(content) === -1) {
      exitFileContentArray.push(content)
    }
  })

  fs.writeFileSync(filePath, exitFileContentArray.join("\n"))
}

export function ensureGitignore(projectRootPath: string) {
  const filePath = path.join(projectRootPath, ".gitignore")
  const ensureContents = ["node_modules", ".cache", ".vscode", ".temp", builtDir, ".nyc_output", "coverage"]

  const exitFileContent = fs.existsSync(filePath) ? fs.readFileSync(filePath).toString() || "" : ""
  const exitFileContentArray = exitFileContent.split("\n").filter(content => content !== "")

  ensureContents.forEach(content => {
    if (exitFileContentArray.indexOf(content) === -1) {
      exitFileContentArray.push(content)
    }
  })

  fs.writeFileSync(filePath, exitFileContentArray.join("\n"))
}

export function ensurePackageJson(projectRootPath: string) {
  const filePath = path.join(projectRootPath, "package.json")

  const ensureScripts = {
    types: "src/index.ts",
    main: builtDir + "/index.js",
    scripts: {
      start: "pri plugin-watch",
      prepublishOnly: "pri plugin-build",
      release: "npm publish",
      test: "pri test"
    },
    dependencies: { pri: "*" }
  }

  let exitFileContent: any = {}

  try {
    exitFileContent = JSON.parse(fs.readFileSync(filePath).toString()) || {}
    if (!exitFileContent.scripts) {
      exitFileContent.scripts = {}
    }
  } catch (error) {
    //
  }

  _.merge(exitFileContent || {}, ensureScripts)

  fs.writeFileSync(filePath, JSON.stringify(exitFileContent, null, 2))
}

export function ensureEntry(projectRootPath: string) {
  const filePath = path.join(projectRootPath, "src/index.tsx")

  fs.outputFileSync(
    filePath,
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

  ensureEntryMethods(projectRootPath)
}

function ensureEntryMethods(projectRootPath: string) {
  const filePath = path.join(projectRootPath, "src/methods.ts")

  fs.outputFileSync(
    filePath,
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
  const filePath = path.join(projectRootPath, "tests/index.ts")

  const fileContent = `
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
  `

  fs.outputFileSync(filePath, prettier.format(fileContent, { semi: false, parser: "typescript" }))
}
