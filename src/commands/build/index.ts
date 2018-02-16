import { execSync } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as path from "path"
import { Configuration, Linter } from "tslint"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"
import { IConfig } from "../../utils/project-config-interface"

const projectRootPath = process.cwd();

export const CommandBuild = async () => {
  const env = "prod"
  const config = getConfig(projectRootPath, env)

  // tslint check
  log("Pre-commit checks...")

  const configurationFilename = "tslint.json"
  const options = {
    fix: true,
    formatter: "json"
  }

  const program = Linter.createProgram("tsconfig.json", projectRootPath)
  const linter = new Linter(options, program)

  const files = Linter.getFileNames(program)
  files.forEach(file => {
    const fileContents = program.getSourceFile(file).getFullText()
    const configuration = Configuration.findConfiguration(configurationFilename, file).results
    linter.lint(file, fileContents, configuration)
  })

  const results = linter.getResult()

  if (results.errorCount > 0) {
    log(colors.red(`Tslint errors:`))
    results.failures.forEach(failure => {
      const errorPosition = failure.getStartPosition().getLineAndCharacter()
      log(colors.red(`${failure.getFailure()}`), ", at: ", `${failure.getFileName()}:${errorPosition.line}:${errorPosition.character}`)
    })
    process.exit(0)
  }

  if (results.fixes.length > 0) {
    log(`Tslint auto fixed ${results.fixes.length} bugs`)
  }

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config)
  })

  const entryPath = await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    return createEntry(info, projectRootPath, env, config)
  })

  let publicUrl = ""
  if (config.publicPath) {
    publicUrl = `--public-url ${config.publicPath}`
  }

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel build ${entryPath} --out-dir ${path.join(projectRootPath, config.distDir || "dist")} ${publicUrl}`, {
    stdio: "inherit",
    cwd: __dirname
  });

  createEntryHtmlFile("/entry.js", config)
}

function createEntryHtmlFile(entryPath: string, config: IConfig) {
  const htmlPath = path.join(projectRootPath, "dist/index.html")

  fs.outputFileSync(htmlPath, `
    <html>

    <head>
      <title>${config.title}</title>

      <style>
        html,
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>

    <body>
      <div id="root"></div>
      <script src="${entryPath}"></script>
    </body>

    </html>
  `)

  return htmlPath
}
