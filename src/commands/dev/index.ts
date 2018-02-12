import { execSync, fork } from "child_process"
import * as fs from "fs-extra"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"

const projectRootPath = process.cwd();

export const CommandDev = async () => {
  const config = getConfig(projectRootPath, "local")

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config)
  })

  const entryPath = await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    return createEntry(info, projectRootPath)
  })

  const htmlEntryPath = createEntryHtmlFile(entryPath)

  const validatePort = await portfinder.getPortPromise()

  open(`https://localhost:${validatePort}`);

  fork(path.join(__dirname, "re-create-entry.js"))

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel serve --https --port ${validatePort} ${htmlEntryPath}`, {
    stdio: "inherit",
    cwd: __dirname
  });
}

function createEntryHtmlFile(entryPath: string) {
  const htmlPath = path.join(projectRootPath, ".temp/dev.html")

  fs.outputFileSync(htmlPath, `
    <html>

    <head>
      <title>Pri dev</title>

      <style>
        html,
        body {
          margin: 0;
          padding: 0;
        }
      </style>
    </head>

    <body>
      <div id="root"></div>
      <script src="${entryPath}"></script>
    </body>

    </html>
  `)

  return htmlPath
}
