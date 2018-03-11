import { execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import { pri } from "../../node"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { log, spinner } from "../../utils/log"
import { getConfig } from "../../utils/project-config"
import text from "../../utils/text"

const projectRootPath = process.cwd()

export const CommandInit = async () => {
  const config = getConfig(projectRootPath, null)

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config, true)
  })

  log("\n Success init your project, you can run serval commands:\n")

  log(colors.blue("  npm start"))
  log(`    ${text.commander.dev.description}\n`)

  log(colors.blue("  npm run build"))
  log(`    ${text.commander.build.description}\n`)

  log(colors.blue("  npm run preview"))
  log(`    ${text.commander.dev.description}\n`)

  log("\n Happy hacking!")

  // log(colors.blue("  npm test"))
  // log("    Starts the test runner.\n")
}

export default (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "init",
    description: text.commander.init.description,
    action: CommandInit
  })
}
