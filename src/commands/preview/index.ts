import * as fs from "fs"
import * as https from "https"
import * as Koa from "koa"
import * as koaCompress from "koa-compress"
import * as koaMount from "koa-mount"
import * as koaStatic from "koa-static"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import * as url from "url"
import * as zlib from "zlib"
import { generateCertificate } from "../../utils/generate-certificate"
import { spinner } from "../../utils/log"
import { getConfig } from "../../utils/project-config"
import { CommandBuild } from "../build"

const app = new Koa();

const projectRootPath = process.cwd();

export const CommandPreview = async () => {
  const config = getConfig(projectRootPath, "prod")

  const freePort = await portfinder.getPortPromise()

  await CommandBuild()

  app.use(koaCompress({
    flush: zlib.Z_SYNC_FLUSH
  }))

  app.use(
    koaMount("/static",
      koaStatic(path.join(projectRootPath, "dist"), {
        gzip: true
      })
    )
  )

  app.use(async (ctx, next) => {
    await next()
    ctx.response.type = "html"
    ctx.response.body = `
      <html>

      <head>
        <title>pri</title>

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
