import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"

const projectRootPath = process.cwd();

export const CommandBuild = async () => {
  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath)
  })

  const entryPath = await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    return createEntry(info, projectRootPath)
  })

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel build ${entryPath} --out-dir ${path.join(projectRootPath, "dist")} --no-cache`, {
    stdio: "inherit",
    cwd: __dirname
  });
}
