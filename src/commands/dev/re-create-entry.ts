import * as chokidar from "chokidar"
import * as path from "path"
import * as yargs from "yargs"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { getConfig } from "../../utils/project-config"

const projectRootPath = process.cwd();

const config = getConfig(projectRootPath, yargs.argv.env)

chokidar.watch(path.join(projectRootPath, "/**"), {
  ignored: /(^|[\/\\])\../,
  ignoreInitial: true
})
  .on("add", async (event, filePath) => {
    await fresh()
  })
  .on("unlink", async (event, filePath) => {
    await fresh()
  })
  .on("unlinkDir", async (event, filePath) => {
    await fresh()
  })

async function fresh() {
  const info = await analyseProject(projectRootPath)
  await createEntry(info, projectRootPath, yargs.argv.env, config)
}
