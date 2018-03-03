import { execSync, fork } from "child_process"
import * as fs from "fs-extra"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { spinner } from "../../utils/log"
import { getConfig } from "../../utils/project-config"

const projectRootPath = process.cwd();

export const CommandInit = async () => {
  const config = getConfig(projectRootPath, null)

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config, true)
  })
}
