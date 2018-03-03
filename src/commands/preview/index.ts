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
import { getConfig } from "../../utils/project-config"
import { CommandBuild } from "../build"

const app = new Koa()

const projectRootPath = process.cwd()

const publicPath = "/static/"

export const CommandPreview = async () => {
  const env = "prod"
  const projectConfig = getConfig(projectRootPath, env)
  const outDir = path.join(projectRootPath, projectConfig.distDir)

  await CommandBuild({
    publicPath
  })

  const freePort = await portfinder.getPortPromise()

  app.use(koaCompress({
    flush: zlib.Z_SYNC_FLUSH
  }))

  const previewDistPath = outDir

  app.use(
    koaMount(publicPath,
      koaStatic(previewDistPath, {
        gzip: true
      })
    )
  )

  const cssPath = path.join(previewDistPath, "main.css")
  const hasCssOutput = fs.existsSync(cssPath)

  app.use(async (ctx, next) => {
    await next()
    ctx.response.type = "html"
    ctx.response.body = `
      <html>

      <head>
        <title>pri</title>

        ${hasCssOutput ? `
          <link rel="stylesheet" type="text/css" href="/static/main.css"/>
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
        <script src="${publicPath}main.js"></script>
      </body>

      </html>
    `
  });

  await spinner("Create https server", async () =>
    https.createServer(generateCertificate(path.join(projectRootPath, ".temp/preview")), app.callback()).listen(freePort)
  )

  open(`https://localhost:${freePort}`)
}
