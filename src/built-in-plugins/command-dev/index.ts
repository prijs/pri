import { exec, execSync, fork } from "child_process"
import * as colors from "colors"
import * as fs from "fs-extra"
import * as _ from "lodash"
import * as open from "opn"
import * as path from "path"
import * as portfinder from "portfinder"
import * as prettier from "prettier"
import * as webpack from "webpack"
import * as webpackDevServer from "webpack-dev-server"
import { pri } from "../../node"
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodulesFile } from "../../utils/npm-finder"
import { getPluginsByOrder } from "../../utils/plugins"
import { getConfig } from "../../utils/project-config"
import { IProjectConfig } from "../../utils/project-config-interface"
import { hasNodeModules, hasNodeModulesModified, hasPluginsModified } from "../../utils/project-helper"
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

export const CommandDev = async (projectConfig: IProjectConfig, analyseInfo: any, env: "local" | "prod") => {
  bundleDlls()

  // Bundle dashboard if plugins changed or dashboard bundle not exist.
  const dashboardDistDir = path.join(projectRootPath, tempPath.dir, "/static/dashboard-bundle")
  if (
    (await hasPluginsModified(projectRootPath)) ||
    !fs.existsSync(path.join(dashboardDistDir, dashboardBundleFileName + ".js"))
  ) {
    log(colors.blue("\nBundle dashboard\n"))
    const dashboardEntryFilePath = createDashboardEntry()

    await runWebpack({
      mode: "production",
      projectRootPath,
      env,
      publicPath: "/bundle/",
      entryPath: dashboardEntryFilePath,
      distDir: dashboardDistDir,
      distFileName: "main",
      projectConfig
    })
  }

  log(colors.blue("\nStart dev server.\n"))

  const freePort = await portfinder.getPortPromise()
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })
  const dashboardClientPort = await portfinder.getPortPromise({ port: freePort + 2 })

  // Start dashboard server
  dashboardServer({ serverPort: dashboardServerPort, projectRootPath, env, projectConfig, analyseInfo })

  if (projectConfig.useHttps) {
    log(`you should set chrome://flags/#allow-insecure-localhost, to trust local certificate.`)
  }

  // Start dashboard client production server
  dashboardClientServer({
    projectRootPath,
    projectConfig,
    serverPort: dashboardServerPort,
    clientPort: dashboardClientPort,
    staticRootPath: path.join(projectRootPath, tempPath.dir, "static")
  })

  // Serve project
  await runWebpackDevServer({
    projectRootPath,
    env,
    publicPath: "/static/",
    entryPath: path.join(projectRootPath, path.format(tempJsEntryPath)),
    devServerPort: freePort,
    htmlTemplatePath: path.join(__dirname, "../../../template-project.ejs"),
    htmlTemplateArgs: {
      dashboardServerPort,
      dashboardClientPort,
      libraryStaticPath
    },
    projectConfig
  })
}

export const debugDashboard = async (projectConfig: IProjectConfig, analyseInfo: any, env: "local" | "prod") => {
  const freePort = await portfinder.getPortPromise()
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })

  bundleDlls()

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
    distFileName: "main",
    devServerPort: freePort,
    htmlTemplatePath: path.join(__dirname, "../../../template-dashboard.ejs"),
    htmlTemplateArgs: {
      dashboardServerPort,
      libraryStaticPath
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
      { semi: false, parser: "typescript" }
    )
  )

  return dashboardEntryFilePath
}

export default async (instance: typeof pri) => {
  instance.project.onCreateEntry((analyseInfo, entry, env, projectConfig) => {
    if (env === "local") {
      entry.pipeHeader(header => {
        return `
          ${header}
          import { hot } from "react-hot-loader"
          setEnvLocal()
        `
      })

      // Redirect to basename
      if (projectConfig.baseHref !== "/") {
        entry.pipeBody(body => {
          return `
            ${body}
            if (location.pathname === "/") {
              customHistory.push("/")
            }
          `
        })
      }

      // Set custom env
      if (projectConfig.customEnv) {
        entry.pipeBody(body => {
          return `
            ${body}
            setCustomEnv(${JSON.stringify(projectConfig.customEnv)})
          `
        })
      }

      // Jump page from iframe dashboard event.
      entry.pipeEntryClassDidMount(entryDidMount => {
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
      entry.pipeFooter(footer => {
        return `
          const HotRoot = hot(module)(Root)

          ReactDOM.render(
            <HotRoot />,
            document.getElementById("root")
          )
          `
      })
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
      const env = "local"
      const projectConfig = instance.project.getProjectConfig(env)
      instance.project.lint()
      await instance.project.ensureProjectFiles(projectConfig)
      await instance.project.checkProjectFiles(projectConfig)

      const analyseInfo = await spinner("Analyse project", async () => {
        const scopeAnalyseInfo = await analyseProject(projectRootPath, env, projectConfig)
        createEntry(projectRootPath, env, projectConfig)
        return scopeAnalyseInfo
      })

      if (options && options.debugDashboard) {
        await debugDashboard(projectConfig, analyseInfo, env)
      } else {
        await CommandDev(projectConfig, analyseInfo, env)
      }
    },
    isDefault: true
  })
}

/**
 * Bundle dlls if node_modules changed, or dlls not exist.
 */
function bundleDlls() {
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
