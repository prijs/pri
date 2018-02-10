import * as chokidar from "chokidar"
import * as path from "path"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"

const projectRootPath = process.cwd();

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
  await createEntry(info, projectRootPath)
}
