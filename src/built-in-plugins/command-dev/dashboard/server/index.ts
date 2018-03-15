import * as koaCors from "@koa/cors"
import { execSync } from "child_process"
import * as chokidar from "chokidar"
import * as fs from "fs"
import * as http from "http"
import * as https from "https"
import * as Koa from "koa"
import * as koaCompress from "koa-compress"
import * as koaMount from "koa-mount"
import * as koaRoute from "koa-route"
import * as koaStatic from "koa-static"
import * as path from "path"
import * as socketIo from "socket.io"
import * as yargs from "yargs"
import * as zlib from "zlib"
import { analyseProject } from "../../../../utils/analyse-project"
import { createEntry } from "../../../../utils/create-entry"
import { generateCertificate } from "../../../../utils/generate-certificate"
import { log } from "../../../../utils/log"
import { md5 } from "../../../../utils/md5"
import { initPlugins } from "../../../../utils/plugins"
import { getConfig } from "../../../../utils/project-config"
import * as projectManage from "../../../../utils/project-manager"

const app = new Koa()

const projectRootPath = yargs.argv.projectRootPath
const serverPort = yargs.argv.serverPort

const distFileDir = path.join(projectRootPath, ".temp")

initPlugins(projectRootPath)

app.use(koaCors())

app.use(
  koaCompress({
    flush: zlib.Z_SYNC_FLUSH
  })
)

app.use(
  koaMount(
    "/static",
    koaStatic(path.join(projectRootPath, ".temp"), {
      gzip: true
    })
  )
)

// app.use(koaRoute.get("/api/status", async ctx => {
//   const info = await analyseProject(projectRootPath)
//   ctx.body = info
// }))

const initProjectConfig = getConfig(projectRootPath, yargs.argv.env)

const server = initProjectConfig.useHttps
  ? https.createServer(
      generateCertificate(path.join(projectRootPath, ".temp/dashboard-server")),
      app.callback()
    )
  : http.createServer(app.callback())

const io = socketIo(server)

io.on("connection", async socket => {
  const projectStatus = await getProjectStatus()
  socket.emit("freshProjectStatus", projectStatus)

  function socketListen(
    name: string,
    fn: (
      data: any,
      resolve: (data?: any) => void,
      reject: (error?: Error) => void
    ) => void
  ) {
    socket.on(name, async (data, callback) => {
      fn(
        data,
        resData => {
          callback({
            success: true,
            data: resData
          })
        },
        error => {
          callback({
            success: false,
            data: error.toString()
          })
        }
      )
    })
  }

  socketListen("addPage", async (data, resolve, reject) => {
    try {
      await projectManage.addPage(projectRootPath, data)
      resolve()
    } catch (error) {
      reject(error)
    }
  })

  socketListen("addStore", async (data, resolve, reject) => {
    try {
      await projectManage.addStore(projectRootPath, data)
      resolve()
    } catch (error) {
      reject(error)
    }
  })

  socketListen("createLayout", async (data, resolve, reject) => {
    try {
      await projectManage.createLayout(projectRootPath)
      resolve()
    } catch (error) {
      reject(error)
    }
  })

  socketListen("create404", async (data, resolve, reject) => {
    try {
      await projectManage.create404(projectRootPath)
      resolve()
    } catch (error) {
      reject(error)
    }
  })

  socketListen("createConfig", async (data, resolve, reject) => {
    try {
      await projectManage.createConfig(projectRootPath)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
})

// Watch project file's change
chokidar
  .watch(path.join(projectRootPath, "/**"), {
    ignored: /(^|[\/\\])\../,
    ignoreInitial: true
  })
  .on("add", async filePath => {
    await fresh()
  })
  .on("unlink", async filePath => {
    await fresh()
  })
  .on("unlinkDir", async filePath => {
    await fresh()
  })
  .on("change", async filePath => {
    // fresh when config change
    const relativePath = path.relative(projectRootPath, filePath)
    const pathInfo = path.parse(filePath)

    try {
      io.emit("changeFile", {
        path: filePath,
        fileContent: fs.readFileSync(filePath).toString()
      })
    } catch (error) {
      //
    }

    if (relativePath.startsWith("src/config")) {
      await fresh()
    } else if (pathInfo.ext === ".md") {
      await fresh()
    }
  })

async function fresh() {
  const projectStatus = await getProjectStatus()
  createEntry(projectRootPath, yargs.argv.env, projectStatus.projectConfig)
  io.emit("freshProjectStatus", projectStatus)
}

async function getProjectStatus() {
  const projectConfig = getConfig(projectRootPath, yargs.argv.env)

  const projectInfo = await analyseProject(
    projectRootPath,
    yargs.argv.env,
    projectConfig
  )

  return {
    projectConfig,
    projectInfo
  }
}

// Socket

server.listen(serverPort)
