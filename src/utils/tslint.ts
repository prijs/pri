import { exec, execSync } from "child_process"
import * as colors from "colors"
import { Configuration, Linter } from "tslint"
import { log, spinner } from "./log"
import { findNearestNodemodulesFile } from "./npm-finder"

export async function lint(projectRootPath: string) {
  const configurationFilename = "tslint.json"
  const lintOptions = {
    fix: true,
    formatter: "json"
  }
  const program = Linter.createProgram("tsconfig.json", projectRootPath)
  const linter = new Linter(lintOptions, program)
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
      log(
        colors.red(`${failure.getFailure()}`),
        ", at: ",
        `${failure.getFileName()}:${errorPosition.line}:${errorPosition.character}`
      )
    })
    process.exit(0)
  }
  if (results.fixes.length > 0) {
    log(`Tslint auto fixed ${results.fixes.length} bugs`)
  }
}
