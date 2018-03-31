import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as open from "opn"
import * as path from "path"
import * as portfinder from "portfinder"
import { pri } from "../../node"
import { log, spinner } from "../../utils/log"
import { getConfig } from "../../utils/project-config"
import text from "../../utils/text"

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.commands.registerCommand({
    name: "init",
    description: text.commander.init.description,
    action: async () => {
      canExecuteInit(projectRootPath)

      const projectConfig = instance.project.getProjectConfig("local")
      await instance.project.ensureProjectFiles(projectConfig)
      await instance.project.checkProjectFiles(projectConfig)

      log("\n Success init your project, you can run serval commands:\n")

      log(colors.blue("  npm start"))
      log(`    ${text.commander.dev.description}\n`)

      log(colors.blue("  npm run build"))
      log(`    ${text.commander.build.description}\n`)

      log(colors.blue("  npm run preview"))
      log(`    ${text.commander.dev.description}\n`)

      log(colors.blue("  npm test"))
      log("    Run tests.\n")

      log("\n Happy hacking!")
    }
  })
}

function canExecuteInit(projectRootPath: string) {
  const packageJsonPath = path.join(projectRootPath, "package.json")
  const packageJson = fs.readJsonSync(packageJsonPath, { throws: false })
  if (_.has(packageJson, "pri.type") && _.get(packageJson, "pri.type") !== "project") {
    throw Error(`Can't execute pri init in non project type.`)
  }

  fs.writeFileSync(packageJsonPath, JSON.stringify({ ...packageJson, pri: { type: "project" } }, null, 2))
}
