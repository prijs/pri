import { execSync } from "child_process"
import * as fs from "fs-extra"
import * as path from "path"
import { pri } from "../../node"
import { log } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import text from "../../utils/text"

const projectRootPath = process.cwd()

export const CommandTest = async () => {
  log(`Build typescript files`)
  execSync([findNearestNodemodulesFile("/.bin/tsc"), "--module CommonJS", "--sourceMap"].join(" "))

  execSync(
    [
      findNearestNodemodulesFile("/.bin/nyc"),
      `--reporter lcov`,
      `--reporter text`,
      `--reporter json`,
      `${findNearestNodemodulesFile("/.bin/ava")}`,
      `--files ${path.join(projectRootPath, "built/tests/**/*.js")}`,
      `--failFast`
    ].join(" "),
    {
      stdio: "inherit",
      cwd: projectRootPath
    }
  )

  // remove .nyc_output
  execSync(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, ".nyc_output")}`)
}

export default (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "test",
    description: text.commander.init.description,
    action: CommandTest
  })
}
