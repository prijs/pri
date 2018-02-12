import * as chokidar from "chokidar"
import * as path from "path"
import * as yargs from "yargs"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { getConfig } from "../../utils/project-config"

const projectRootPath = process.cwd();

chokidar.watch(path.join(projectRootPath, "/**"), {
  ignored: /(^|[\/\\])\../,
  ignoreInitial: true
})
  .on("add", async (filePath) => {
    await fresh()
  })
  .on("unlink", async (filePath) => {
    await fresh()
  })
  .on("unlinkDir", async (filePath) => {
    await fresh()
  })
  .on("change", async (filePath) => {
    // fresh when config change
    const relativePath = path.relative(projectRootPath, filePath)

    if (relativePath.startsWith("src/config")) {
      await fresh()
    }
  })

async function fresh() {
  const config = getConfig(projectRootPath, yargs.argv.env)
  const info = await analyseProject(projectRootPath)
  await createEntry(info, projectRootPath, yargs.argv.env, config)
}
