import { execSync } from "child_process"
import * as fs from "fs-extra"
import * as path from "path"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"

const projectRootPath = process.cwd();

export const CommandBuild = async () => {
  const config = getConfig(projectRootPath, "prod")

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config)
  })

  const entryPath = await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    return createEntry(info, projectRootPath)
  })

  let publicUrl = ""
  if (config.publicPath) {
    publicUrl = `--public-url ${config.publicPath}`
  }

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel build ${entryPath} --out-dir ${path.join(projectRootPath, config.distDir)} ${publicUrl} --no-cache`, {
    stdio: "inherit",
    cwd: __dirname
  });

  createEntryHtmlFile("/entry.js")
}

function createEntryHtmlFile(entryPath: string) {
  const htmlPath = path.join(projectRootPath, "dist/index.html")

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
