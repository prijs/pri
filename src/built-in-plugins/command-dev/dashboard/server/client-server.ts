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
import { getConfig } from "../../../../utils/project-config"

const app = new Koa()

const projectRootPath = yargs.argv.projectRootPath
const staticRootPath = yargs.argv.staticRootPath
const serverPort = yargs.argv.serverPort
const clientPort = yargs.argv.clientPort

const staticPrefix = "/static"

const projectConfig = getConfig(projectRootPath, "local")

app.use(koaCors())

app.use(
  koaCompress({
    flush: zlib.Z_SYNC_FLUSH
  })
)

app.use(
  koaMount(
    staticPrefix,
    koaStatic(staticRootPath, {
      gzip: true
    })
  )
)

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
        window.serverPort = ${serverPort}
      </script>
      <script src="${staticPrefix}/dlls/main.dll.js"></script>
      <script src="${staticPrefix}/dashboard-bundle/main.js"></script>
    </body>

    </html>
  `
})

if (projectConfig.useHttps) {
  https
    .createServer(generateCertificate(path.join(projectRootPath, ".temp/dashboard-client-server")), app.callback())
    .listen(clientPort)
} else {
  http.createServer(app.callback()).listen(clientPort)
}
