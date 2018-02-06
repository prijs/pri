import * as fs from "fs"
import * as _ from "lodash"
import * as path from "path"

export const ensureFiles = (projectRootPath: string) => {
  ensureGitignore(projectRootPath)
  ensureTsconfig(projectRootPath)
}

function ensureGitignore(projectRootPath: string) {
  const filePath = path.join(projectRootPath, ".gitignore")
  const ensureContents = [
    "node_modules",
    "dist",
    ".vscode"
  ]

  const exitFileContent = fs.existsSync(filePath) ? (fs.readFileSync(filePath).toString() || "") : ""
  const exitFileContentArray = exitFileContent.split("\n").filter(content => content !== "")

  ensureContents.forEach(content => {
    if (exitFileContentArray.indexOf(content) === -1) {
      exitFileContentArray.push(content)
    }
  })

  fs.writeFileSync(filePath, exitFileContentArray.join("\n"))
}

function ensureTsconfig(projectRootPath: string) {
  const filePath = path.join(projectRootPath, "tsconfig.json")
  const ensureContent = {
    compilerOptions: {
      module: "commonjs",
      strict: true,
      jsx: "react",
      target: "es5",
      lib: [
        "dom",
        "es5",
        "es6",
        "scripthost"
      ]
    },
    exclude: [
      "node_modules",
      "built",
      "lib"
    ]
  }

  let exitFileContent: any = {}

  try {
    exitFileContent = JSON.parse(fs.readFileSync(filePath).toString())
    // TODO: Overwrite
    exitFileContent = { ...ensureContent }
  } catch (error) {
    exitFileContent = { ...ensureContent }
  }

  fs.writeFileSync(filePath, JSON.stringify(exitFileContent, null, 2))
}
