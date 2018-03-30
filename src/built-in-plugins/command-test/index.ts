import { execSync } from "child_process"
import * as fs from "fs-extra"
import * as open from "opn"
import * as path from "path"
import { pri } from "../../node"
import { log } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { testsPath, tsBuiltPath } from "../../utils/structor-config"
import text from "../../utils/text"

export const CommandTest = async (projectRootPath: string) => {
  log(`Build typescript files`)
  execSync(`${findNearestNodemodulesFile("/.bin/rimraf")} ${tsBuiltPath.dir}`, { stdio: "inherit" })
  execSync([findNearestNodemodulesFile("/.bin/tsc"), "--module CommonJS", "--sourceMap"].join(" "), {
    stdio: "inherit"
  })

  execSync(
    [
      findNearestNodemodulesFile("/.bin/nyc"),
      `--reporter lcov`,
      `--reporter text`,
      `--reporter json`,
      `--exclude ${tsBuiltPath.dir}/${testsPath.dir}/**/*.js`,
      `${findNearestNodemodulesFile("/.bin/ava")}`,
      `--files ${path.join(projectRootPath, `${tsBuiltPath.dir}/${testsPath.dir}/**/*.js`)}`,
      `--failFast`
    ].join(" "),
    {
      stdio: "inherit",
      cwd: projectRootPath
    }
  )

  // remove .nyc_output
  execSync(`${findNearestNodemodulesFile(".bin/rimraf")} ${path.join(projectRootPath, ".nyc_output")}`)

  // Open test html in brower
  open(path.join(projectRootPath, "coverage/lcov-report/index.html"))

  process.exit(0)
}

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath.startsWith(testsPath.dir)
  })

  instance.commands.registerCommand({
    name: "test",
    description: text.commander.init.description,
    action: async () => {
      const projectConfig = instance.project.getProjectConfig("prod")
      instance.project.lint()
      await instance.project.checkProjectFiles(projectConfig)
      CommandTest(projectRootPath)
    }
  })
}
