import * as koaCors from "@koa/cors"
import * as chokidar from "chokidar"
import * as fs from "fs"
import * as http from "http"
import * as https from "https"
import * as Koa from "koa"
import * as koaCompress from "koa-compress"
import * as koaMount from "koa-mount"
import * as koaStatic from "koa-static"
import * as path from "path"
import * as socketIo from "socket.io"
import * as yargs from "yargs"
import * as zlib from "zlib"
import { generateCertificate } from "../../../../utils/generate-certificate"
import { log } from "../../../../utils/log"
import { IProjectConfig } from "../../../../utils/project-config-interface"

const app = new Koa()

const staticPrefix = "/static"

interface IOptions {
  clientPort: number
  serverPort: number
  projectRootPath: string
  staticRootPath: string
  projectConfig: IProjectConfig
}

export default (opts: IOptions) => {
  app.use(koaCors())

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }))

  app.use(koaMount(staticPrefix, koaStatic(opts.staticRootPath, { gzip: true })))

  app.use(async ctx => {
    ctx.set("Content-Type", "text/html; charset=utf-8")

    ctx.body = `
    <html>

    <head>
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
      <script>
        window.serverPort = ${opts.serverPort}
      </script>
      <script src="${staticPrefix}/dlls/main.dll.js"></script>
      <script src="${staticPrefix}/dashboard-bundle/main.js"></script>
    </body>

    </html>
  `
  })

  if (opts.projectConfig.useHttps) {
    https
      .createServer(
        generateCertificate(path.join(opts.projectRootPath, ".temp/dashboard-client-server")),
        app.callback()
      )
      .listen(opts.clientPort)
  } else {
    http.createServer(app.callback()).listen(opts.clientPort)
  }
}
