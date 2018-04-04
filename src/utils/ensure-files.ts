import * as colors from "colors"
import { FILE } from "dns"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as walk from "walk"
import { log } from "./log"
import { plugin } from "./plugins"
import { IProjectConfig } from "./project-config-interface"
import { declarePath, getGitignores, pagesPath, tempPath, tsBuiltPath } from "./structor-config"
import { walkProjectFiles } from "./walk-project-files"

export const ensureFiles = async (projectRootPath: string, projectConfig: IProjectConfig) => {
  log("Ensure project files.\n")

  const ensureProjectFilesQueueGroupByPath = _.groupBy(plugin.ensureProjectFilesQueue, "fileName")

  Object.keys(ensureProjectFilesQueueGroupByPath).forEach(fileRelativePath => {
    const ensureProjectFilesQueue = ensureProjectFilesQueueGroupByPath[fileRelativePath]

    ensureFile(
      projectRootPath,
      fileRelativePath,
      ensureProjectFilesQueue.map(ensureProjectFiles => ensureProjectFiles.pipeContent)
    )
  })
}

export function ensureFile(
  projectRootPath: string,
  fileRelativePath: string,
  pipeContents: Array<((prev: string) => string)>
) {
  const filePath = path.join(projectRootPath, fileRelativePath)
  const fileExist = fs.existsSync(filePath)

  let exitFileContent = ""
  try {
    exitFileContent = fs.readFileSync(filePath, "utf8").toString()
  } catch (error) {
    //
  }

  const nextContent = pipeContents.reduce((preContent, pipeContent) => pipeContent(preContent), exitFileContent)

  if (fileExist) {
    if (exitFileContent === nextContent) {
      log(`${colors.green(`✔ ${fileRelativePath} not modified, skipped.`)} `)
    } else {
      log(`${colors.yellow(`✔ ${fileRelativePath} exist, but the content is not correct, has been recovered.`)}`)
    }
  } else {
    log(`${colors.magenta(`⚠ ${fileRelativePath} not exist, created.`)}`)
  }

  fs.outputFile(filePath, nextContent)
}
