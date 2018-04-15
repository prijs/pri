import * as colors from "colors"
import * as fs from "fs"
import * as http from "http"
import * as https from "https"
import * as Koa from "koa"
import * as koaCompress from "koa-compress"
import * as koaMount from "koa-mount"
import * as koaStatic from "koa-static"
import * as open from "opn"
import * as path from "path"
import * as portfinder from "portfinder"
import * as url from "url"
import * as zlib from "zlib"
import { pri } from "../../node"
import { ensureFiles } from "../../utils/ensure-files"
import { ensureEndWithSlash } from "../../utils/functional"
import { generateCertificate } from "../../utils/generate-certificate"
import { log, spinner } from "../../utils/log"
import { getConfig } from "../../utils/project-config"
import text from "../../utils/text"
import { CommandBuild } from "../command-build"

const app = new Koa()

const projectRootPath = process.cwd()

export const CommandPreview = async (instance: typeof pri) => {
  const env = "prod"
  const projectConfig = getConfig(projectRootPath, env)
  const distDir = path.join(projectRootPath, projectConfig.distDir)

  await CommandBuild(instance)

  const freePort = await portfinder.getPortPromise()

  app.use(koaCompress({ flush: zlib.Z_SYNC_FLUSH }))

  const previewDistPath = distDir

  let previewStaticPrefix = projectConfig.publicPath

  if (projectConfig.publicPath !== projectConfig.baseHref) {
    log(
      colors.yellow(
        "publicPath is not equal to baseHref, in order to ensure preview, we use baseHref as static file prefix instead of publicPath."
      )
    )
    previewStaticPrefix = projectConfig.baseHref
  }

  app.use(koaMount(previewStaticPrefix, koaStatic(previewDistPath, { gzip: true })))

  const cssPath = path.join(previewDistPath, "main.css")
  const hasCssOutput = fs.existsSync(cssPath)

  if (projectConfig.useHttps) {
    await spinner("Create https server", async () =>
      https
        .createServer(generateCertificate(path.join(projectRootPath, ".temp/preview")), app.callback())
        .listen(freePort)
    )
  } else {
    await spinner("Create http server", async () => http.createServer(app.callback()).listen(freePort))
  }

  open(ensureEndWithSlash(url.resolve(`https://localhost:${freePort}`, projectConfig.baseHref)))
}

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: "preview",
    description: text.commander.preview.description,
    action: () => CommandPreview(instance)
  })
}
