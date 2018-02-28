import { execSync } from "child_process"
import * as fs from "fs"
import * as https from "https"
import * as Koa from "koa"
import * as koaCompress from "koa-compress"
import * as koaMount from "koa-mount"
import * as koaStatic from "koa-static"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder"
import * as url from "url"
import * as zlib from "zlib"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { generateCertificate } from "../../utils/generate-certificate"
import { spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"
import { lint } from "../../utils/tslint"

const app = new Koa();

const projectRootPath = process.cwd();

export const CommandPreview = async () => {
  const env = "prod"
  const config = getConfig(projectRootPath, env)

  // tslint check
  lint(projectRootPath)

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config, false)
  })

  const entryPath = await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    return createEntry(info, projectRootPath, env, config)
  })

  // Run parcel
  execSync(`${findNearestNodemodules()}/.bin/parcel build ${entryPath} --out-dir ${path.join(projectRootPath, ".temp/preview")}`, {
    stdio: "inherit",
    cwd: __dirname
  })

  const freePort = await portfinder.getPortPromise()

  app.use(koaCompress({
    flush: zlib.Z_SYNC_FLUSH
  }))

  const previewDistPath = path.join(projectRootPath, ".temp/preview")

  app.use(
    koaMount("/static",
      koaStatic(previewDistPath, {
        gzip: true
      })
    )
  )

  const cssPath = path.join(previewDistPath, "entry.css")
  const hasCssOutput = fs.existsSync(cssPath)

  app.use(async (ctx, next) => {
    await next()
    ctx.response.type = "html"
    ctx.response.body = `
      <html>

      <head>
        <title>pri</title>

        ${hasCssOutput ? `
          <link rel="stylesheet" type="text/css" href="/static/entry.css"/>
        ` : ""}

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
        <script src="/static/entry.js"></script>
      </body>

      </html>
    `
  });

  await spinner("Create https server", async () =>
    https.createServer(generateCertificate(path.join(projectRootPath, ".temp/preview")), app.callback()).listen(freePort)
  )

  open(`https://localhost:${freePort}`)
}
