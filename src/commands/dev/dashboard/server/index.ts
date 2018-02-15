import { execSync } from "child_process"
import * as https from "https"
import * as Koa from "koa"
import * as fs from 'fs'
import * as koaCompress from "koa-compress"
import * as koaMount from "koa-mount"
import * as koaRoute from "koa-route"
import * as koaStatic from "koa-static"
import * as koaCors from '@koa/cors'
import * as path from "path"
import * as yargs from "yargs"
import * as zlib from "zlib"
import { analyseProject } from "../../../../utils/analyse-project"
import { generateCertificate } from "../../../../utils/generate-certificate"
import { log } from "../../../../utils/log"
import { md5 } from "../../../../utils/md5"
import { findNearestNodemodules } from "../../../../utils/npm-finder"
import * as socketIo from 'socket.io'
import * as chokidar from "chokidar"
import { createEntry } from "../../../../utils/create-entry"
import { getConfig } from "../../../../utils/project-config"
import * as projectManage from '../../../../utils/project-manager'

const app = new Koa();

const projectRootPath = yargs.argv.projectRootPath
const serverPort = yargs.argv.serverPort

const distFileDir = path.join(projectRootPath, ".temp")

app.use(koaCors())

app.use(koaCompress({
  flush: zlib.Z_SYNC_FLUSH
}))

app.use(
  koaMount("/static",
    koaStatic(path.join(projectRootPath, ".temp"), {
      gzip: true
    })
  )
)

// app.use(koaRoute.get("/api/status", async ctx => {
//   const info = await analyseProject(projectRootPath)
//   ctx.body = info
// }))

const server = https.createServer(generateCertificate(path.join(projectRootPath, '.temp/dashboard-server')), app.callback())

const io = socketIo(server)

io.on('connection', async (socket) => {
  const projectStatus = await getProjectStatus()
  socket.emit('freshProjectStatus', projectStatus)

  function socketListen(
    name: string,
    fn: (data: any, resolve: (data?: any) => void, reject: (error?: Error) => void) => void
  ) {
    socket.on(name, async (data, callback) => {
      fn(data, data => {
        callback({
          success: true,
          data
        })
      }, error => {
        callback({
          success: false,
          data: error.toString()
        })
      })
    })
  }

  socketListen('addPage', async (data, resolve, reject) => {
    try {
      await projectManage.addPage(projectRootPath, data)
      resolve()
    } catch (error) {
      reject(error)
    }
  })
})

// Watch project file's change
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

    try {
      io.emit('changeFile', {
        path: filePath,
        fileContent: fs.readFileSync(filePath).toString()
      })
    } catch (error) {
      // 
    }

    if (relativePath.startsWith("src/config")) {
      await fresh()
    }
  })

async function fresh() {
  const projectStatus = await getProjectStatus()
  await createEntry(projectStatus.info, projectRootPath, yargs.argv.env, projectStatus.config)
  io.emit('freshProjectStatus', projectStatus);
}

async function getProjectStatus() {
  const config = getConfig(projectRootPath, yargs.argv.env)
  const info = await analyseProject(projectRootPath)
  return {
    config, info
  }
}

// Socket

server.listen(serverPort)