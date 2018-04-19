import { exec, execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as portfinder from "portfinder"
import * as prettier from "prettier"
import * as webpack from "webpack"
import * as webpackDevServer from "webpack-dev-server"
import { pri } from "../../node"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureEndWithSlash } from "../../utils/functional"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { getPluginsByOrder } from "../../utils/plugins"
import { getConfig } from "../../utils/project-config"
import { IProjectConfig } from "../../utils/project-config-interface"
import { hasNodeModules, hasNodeModulesModified, hasPluginsModified } from "../../utils/project-helper"
import * as projectState from "../../utils/project-state"
import { tempJsEntryPath, tempPath } from "../../utils/structor-config"
import text from "../../utils/text"
import { runWebpack } from "../../utils/webpack"
import { runWebpackDevServer } from "../../utils/webpack-dev-server"
import dashboardClientServer from "./dashboard/server/client-server"
import dashboardServer from "./dashboard/server/index"

const projectRootPath = process.cwd()
const dllFileName = "main.dll.js"
const dllMainfestName = "mainfest.json"
const dllOutPath = path.join(projectRootPath, ".temp/static/dlls")
const libraryStaticPath = "/dlls/" + dllFileName

const dashboardBundleFileName = "main"

export const CommandDev = async (
  projectConfig: IProjectConfig,
  analyseInfo: any,
  env: "local" | "prod",
  portInfo: { freePort: number; dashboardServerPort: number; dashboardClientPort: number }
) => {
  await bundleDlls()

  // Bundle dashboard if plugins changed or dashboard bundle not exist.
  const dashboardDistDir = path.join(projectRootPath, tempPath.dir, "/static/dashboard-bundle")
  if (
    (await hasPluginsModified(projectRootPath)) ||
    !fs.existsSync(path.join(dashboardDistDir, dashboardBundleFileName + ".js"))
  ) {
    log(colors.blue("\nBundle dashboard\n"))
    const dashboardEntryFilePath = createDashboardEntry()

    const status = await runWebpack({
      mode: "production",
      projectRootPath,
      env,
      publicPath: "/bundle/",
      entryPath: dashboardEntryFilePath,
      distDir: dashboardDistDir,
      outFileName: "main.[hash].js", // dashboard has no css file
      projectConfig
    })
    projectState.set("dashboardHash", status.hash)
  }

  log(colors.blue("\nStart dev server.\n"))

  // Start dashboard server
  dashboardServer({ serverPort: portInfo.dashboardServerPort, projectRootPath, env, projectConfig, analyseInfo })

  if (projectConfig.useHttps) {
    log(`you should set chrome://flags/#allow-insecure-localhost, to trust local certificate.`)
  }

  // Start dashboard client production server
  dashboardClientServer({
    projectRootPath,
    projectConfig,
    serverPort: portInfo.dashboardServerPort,
    clientPort: portInfo.dashboardClientPort,
    staticRootPath: path.join(projectRootPath, tempPath.dir, "static"),
    hash: projectState.get("dashboardHash")
  })

  // Serve project
  await runWebpackDevServer({
    projectRootPath,
    env,
    publicPath: projectConfig.publicPath,
    entryPath: path.join(projectRootPath, path.format(tempJsEntryPath)),
    devServerPort: portInfo.freePort,
    htmlTemplatePath: path.join(__dirname, "../../../template-project.ejs"),
    htmlTemplateArgs: {
      dashboardServerPort: portInfo.dashboardServerPort,
      libraryStaticPath: path.join(projectConfig.baseHref, libraryStaticPath)
    },
    projectConfig
  })
}

export const debugDashboard = async (projectConfig: IProjectConfig, analyseInfo: any, env: "local" | "prod") => {
  const freePort = await portfinder.getPortPromise()
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })

  await bundleDlls()

  // Start dashboard server
  dashboardServer({ serverPort: dashboardServerPort, projectRootPath, env, projectConfig, analyseInfo })

  // Create dashboard entry
  const dashboardEntryFilePath = createDashboardEntry()

  // Serve dashboard
  await runWebpackDevServer({
    projectRootPath,
    env,
    publicPath: "/static/",
    entryPath: dashboardEntryFilePath,
    devServerPort: freePort,
    outFileName: "main.[hash].js",
    htmlTemplatePath: path.join(__dirname, "../../../template-dashboard.ejs"),
    htmlTemplateArgs: {
      dashboardServerPort,
      libraryStaticPath: path.join(projectConfig.baseHref, libraryStaticPath)
    },
    projectConfig
  })
}

function createDashboardEntry() {
  const dashboardEntryMainPath = path.join(__dirname, "dashboard/client/index")
  const dashboardEntryFilePath = path.join(projectRootPath, tempPath.dir, "dashboard", "main.tsx")

  const webUiEntries: string[] = []

  Array.from(getPluginsByOrder()).forEach(plugin => {
    try {
      const packageJsonPath = require.resolve(path.join(plugin.pathOrModuleName, "package.json"), {
        paths: [__dirname, projectRootPath]
      })
      const packageJson = fs.readJsonSync(packageJsonPath, { throws: false })
      const webEntry = _.get(packageJson, "pri.web-entry", null)

      if (webEntry) {
        const webEntrys: string[] = typeof webEntry === "string" ? [webEntry] : webEntry

        webEntrys.forEach(eachWebEntry => {
          const webEntryAbsolutePath = path.resolve(path.parse(packageJsonPath).dir, eachWebEntry)
          const parsedPath = path.parse(webEntryAbsolutePath)
          const importPath = path.join(parsedPath.dir, parsedPath.name)
          webUiEntries.push(`
          // tslint:disable-next-line:no-var-requires
          const plugin${webUiEntries.length} = require("${importPath}").default`)
        })
      }
    } catch (error) {
      //
    }
  })

  fs.outputFileSync(
    dashboardEntryFilePath,
    prettier.format(
      `
      // tslint:disable-next-line:no-var-requires
      const dashboard = require("${dashboardEntryMainPath}").default

      ${
        webUiEntries.length > 0
          ? `
          ${webUiEntries.join("\n")}
          dashboard([${webUiEntries.map((each, index) => `plugin${index}`).join(",")}])
        `
          : `
          dashboard()
        `
      }
    `,
      { semi: true, singleQuote: true, parser: "typescript" }
    )
  )

  return dashboardEntryFilePath
}

export default async (instance: typeof pri) => {
  const currentEnv = "local"
  const currentProjectConfig = instance.project.getProjectConfig(currentEnv)
  const freePort = currentProjectConfig.devPort || (await portfinder.getPortPromise())
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })
  const dashboardClientPort = await portfinder.getPortPromise({ port: freePort + 2 })

  instance.project.onCreateEntry((analyseInfo, entry, env, projectConfig) => {
    if (env === "local") {
      entry.pipeAppHeader(header => {
        return `
          ${header}
          setEnvLocal()
        `
      })

      // Set custom env
      if (projectConfig.customEnv) {
        entry.pipeAppBody(body => {
          return `
            ${body}
            setCustomEnv(${JSON.stringify(projectConfig.customEnv)})
          `
        })
      }

      // Jump page from iframe dashboard event.
      entry.pipeAppClassDidMount(entryDidMount => {
        return `
          ${entryDidMount}
          window.addEventListener("message", event => {
            const data = event.data
            switch(data.type) {
              case "changeRoute":
                customHistory.push(data.path)
                break
              default:
            }
          }, false)
        `
      })

      // React hot loader
      entry.pipeEntryHeader(
        header => `
        ${header}
        import { hot } from "react-hot-loader"
      `
      )

      entry.pipeEntryRender(
        str => `
        const HotApp = hot(module)(App)
        ${str}
      `
      )

      entry.pipe.set("entryRenderApp", () => `<HotApp />`)

      // Load webui iframe
      entry.pipeEntryRender(
        str => `
        ${str}
        const webUICss = \`
          html,
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }

          #pri-help-button {
            position: fixed;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 140px;
            height: 30px;
            transform: rotate(90deg);
            font-size: 14px;
            right: -55px;
            top: calc(50% - 15px);
            border: 1px solid #ddd;
            border-top: none;
            border-bottom-left-radius: 5px;
            border-bottom-right-radius: 5px;
            color: #666;
            z-index: 10001;
            cursor: pointer;
            transition: all .2s;
            background-color: white;
            user-select: none;
          }

          #pri-help-button.active {
            right: 744px !important;
          }

          #pri-help-button:hover {
            color: black;
          }

          #pri-help-iframe {
            position: fixed;
            right: -810px;
            z-index: 10000;
            background-color: white;
            width: 800px;
            top: 0;
            height: 100%;
            border: 0;
            outline: 0;
            box-shadow: -1px 0 1px #d4d4d4;
            transition: right .2s;
          }

          #pri-help-iframe.active {
            right: 0 !important;
          }
        \`
        const webUIStyle = document.createElement('style')

        webUIStyle.type = "text/css"
        if ((webUIStyle as any).styleSheet){
          (webUIStyle as any).styleSheet.cssText = webUICss
        } else {
          webUIStyle.appendChild(document.createTextNode(webUICss))
        }

        document.head.appendChild(webUIStyle)

        // Add dashboard iframe
        const dashboardIframe = document.createElement("iframe")
        dashboardIframe.id = "pri-help-iframe"
        dashboardIframe.src = "//127.0.0.1:${dashboardClientPort}"
        document.body.appendChild(dashboardIframe)

        // Add dashboard button
        const dashboardButton = document.createElement("div")
        dashboardButton.id = "pri-help-button"
        dashboardButton.innerText = "Toggle dashboard"
        dashboardButton.onclick = () => {
          const activeClassName = "active"
          const isShow = dashboardIframe.classList.contains(activeClassName)

          if (isShow) {
            dashboardIframe.classList.remove(activeClassName)
            dashboardButton.classList.remove(activeClassName)
          } else {
            dashboardIframe.classList.add(activeClassName)
            dashboardButton.classList.add(activeClassName)
          }
        }
        document.body.appendChild(dashboardButton)
      `
      )
    }
  })

  instance.build.pipeConfig((env, config) => {
    if (env !== "local") {
      return config
    }

    config.plugins.push(
      new webpack.DllReferencePlugin({
        context: ".",
        manifest: require(path.join(dllOutPath, dllMainfestName))
      })
    )

    return config
  })

  instance.commands.registerCommand({
    name: "dev",
    options: [["-d, --debugDashboard", "Debug dashboard"]],
    description: text.commander.dev.description,
    action: async (options: any) => {
      await instance.project.lint()
      await instance.project.ensureProjectFiles(currentProjectConfig)
      await instance.project.checkProjectFiles(currentProjectConfig)

      const analyseInfo = await spinner("Analyse project", async () => {
        const scopeAnalyseInfo = await analyseProject(projectRootPath, currentEnv, currentProjectConfig)
        createEntry(projectRootPath, currentEnv, currentProjectConfig)
        return scopeAnalyseInfo
      })

      if (options && options.debugDashboard) {
        await debugDashboard(currentProjectConfig, analyseInfo, currentEnv)
      } else {
        await CommandDev(currentProjectConfig, analyseInfo, currentEnv, {
          freePort,
          dashboardServerPort,
          dashboardClientPort
        })
      }
    },
    isDefault: true
  })
}

/**
 * Bundle dlls if node_modules changed, or dlls not exist.
 */
async function bundleDlls() {
  if (
    (hasNodeModules(projectRootPath) && hasNodeModulesModified(projectRootPath)) ||
    !fs.existsSync(path.join(dllOutPath, dllFileName))
  ) {
    log(colors.blue("\nBundle dlls\n"))

    execSync(
      [
        `${findNearestNodemodulesFile("/.bin/webpack")}`,
        `--mode development`,
        `--progress`,
        `--config ${path.join(__dirname, "./webpack.dll.config.js")}`,
        `--env.projectRootPath ${projectRootPath}`,
        `--env.dllOutPath ${dllOutPath}`,
        `--env.dllFileName ${dllFileName}`,
        `--env.dllMainfestName ${dllMainfestName}`
      ].join(" "),
      {
        stdio: "inherit"
      }
    )
  }
}
