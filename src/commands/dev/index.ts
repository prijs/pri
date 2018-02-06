import { execSync } from "child_process"
import * as fs from "fs"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"

const projectRootPath = process.cwd();

export const CommandDev = async () => {
  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath)
  })

  await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    await createEntry(info, projectRootPath)
  })

  const validatePort = await portfinder.getPortPromise()
  open(`http://localhost:${validatePort}`);

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel --port ${validatePort} ${path.join(__dirname, "../../../dev.html")}`, {
    stdio: "inherit",
    cwd: __dirname
  });
}
