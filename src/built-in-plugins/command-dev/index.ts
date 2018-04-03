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
import { hasNodeModules, hasNodeModulesModified } from "../../utils/project-helper"
import { tempJsEntryPath, tempPath } from "../../utils/structor-config"
import text from "../../utils/text"

const projectRootPath = process.cwd()
const dllFileName = "main.dll.js"
const dllMainfestName = "mainfest.json"
const dllOutPath = path.join(projectRootPath, ".temp/static/dlls")
const libraryStaticPath = "/dlls/" + dllFileName

const dashboardBundleFileName = "main"

export const CommandDev = async () => {
  const env = "local"
  const projectConfig = getConfig(projectRootPath, env)

  await spinner("Analyse project", async () => {
    await analyseProject(projectRootPath, env, projectConfig)
    createEntry(projectRootPath, env, projectConfig)
  })

  bundleDlls()

  // Bundle dashboard
  const dashboardDistDir = path.join(projectRootPath, tempPath.dir, "/static/dashboard-bundle")
  if (
    (hasNodeModules(projectRootPath) && hasNodeModulesModified(projectRootPath)) ||
    !fs.existsSync(path.join(dashboardDistDir, dashboardBundleFileName + ".js"))
  ) {
    log(colors.blue("\nBundle dashboard\n"))
    const dashboardEntryFilePath = createDashboardEntry()
    execSync(
      [
        `${findNearestNodemodulesFile("/.bin/webpack")}`,
        `--progress`,
        `--mode production`,
        `--config ${path.join(__dirname, "../../utils/webpack-config.js")}`,
        `--env.projectRootPath ${projectRootPath}`,
        `--env.env ${env}`,
        `--env.publicPath /bundle/`,
        `--env.entryPath ${dashboardEntryFilePath}`,
        `--env.distDir ${dashboardDistDir}`,
        `--env.distFileName main`
      ].join(" "),
      {
        stdio: "inherit"
      }
    )
  }

  log(colors.blue("\nStart dev server.\n"))

  const freePort = await portfinder.getPortPromise()
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })
  const dashboardClientPort = await portfinder.getPortPromise({ port: freePort + 2 })

  // Start dashboard server
  fork(path.join(__dirname, "dashboard/server/index.js"), [
    "--serverPort",
    dashboardServerPort.toString(),
    "--projectRootPath",
    projectRootPath,
    "--env",
    env
  ])

  if (projectConfig.useHttps) {
    log(`you should set chrome://flags/#allow-insecure-localhost, to trust local certificate.`)
  }

  // Start dashboard client production server
  fork(path.join(__dirname, "dashboard/server/client-server.js"), [
    "--serverPort",
    dashboardServerPort.toString(),
    "--clientPort",
    dashboardClientPort.toString(),
    "--projectRootPath",
    projectRootPath,
    "--staticRootPath",
    path.join(projectRootPath, tempPath.dir, "static")
  ])

  // Serve project
  execSync(
    [
      `${findNearestNodemodulesFile("/.bin/webpack-dev-server")}`,
      `--mode development`,
      `--progress`,
      `--hot`,
      `--hotOnly`,
      `--config ${path.join(__dirname, "../../utils/webpack-config.js")}`,
      `--env.projectRootPath ${projectRootPath}`,
      `--env.env ${env}`,
      `--env.publicPath /static/`,
      `--env.entryPath ${path.join(projectRootPath, path.format(tempJsEntryPath))}`,
      `--env.devServerPort ${freePort}`,
      `--env.htmlTemplatePath ${path.join(__dirname, "../../../template-project.ejs")}`,
      `--env.htmlTemplateArgs.dashboardServerPort ${dashboardServerPort}`,
      `--env.htmlTemplateArgs.dashboardClientPort ${dashboardClientPort}`,
      `--env.htmlTemplateArgs.libraryStaticPath ${libraryStaticPath}`
    ].join(" "),
    {
      stdio: "inherit"
    }
  )
}

export const debugDashboard = async () => {
  const env = "local"
  const freePort = await portfinder.getPortPromise()
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })

  bundleDlls()

  // Start dashboard server
  const server = fork(path.join(__dirname, "dashboard/server/index.js"), [
    "--serverPort",
    dashboardServerPort.toString(),
    "--projectRootPath",
    projectRootPath,
    "--env",
    env
  ])

  // Create dashboard entry
  const dashboardEntryFilePath = createDashboardEntry()

  // Serve dashboard
  execSync(
    [
      `${findNearestNodemodulesFile("/.bin/webpack-dev-server")}`,
      `--mode development`,
      `--progress`,
      `--hot`,
      `--hotOnly`,
      `--config ${path.join(__dirname, "../../utils/webpack-config.js")}`,
      `--env.projectRootPath ${projectRootPath}`,
      `--env.env ${env}`,
      `--env.publicPath /static/`,
      `--env.entryPath ${dashboardEntryFilePath}`,
      `--env.distFileName main`,
      `--env.devServerPort ${freePort}`,
      `--env.htmlTemplatePath ${path.join(__dirname, "../../../template-dashboard.ejs")}`,
      `--env.htmlTemplateArgs.dashboardServerPort ${dashboardServerPort}`,
      `--env.htmlTemplateArgs.libraryStaticPath ${libraryStaticPath}`
    ].join(" "),
    {
      stdio: "inherit"
    }
  )
}

function createDashboardEntry() {
  const dashboardEntryMainPath = path.join(__dirname, "dashboard/client/index")
  const dashboardEntryFilePath = path.join(projectRootPath, tempPath.dir, "dashboard", "main.tsx")

  const webUiEntries: string[] = []

  Array.from(getPluginsByOrder()).forEach(plugin => {
    try {
      const packageJsonPath = require.resolve(path.join(plugin.pathOrModuleName, "package.json"))
      const packageJson = fs.readJsonSync(packageJsonPath, { throws: false })
      const webEntry = _.get(packageJson, "pri.web-entry", null)
      if (webEntry) {
        const webEntryAbsolutePath = path.resolve(path.parse(packageJsonPath).dir, webEntry)
        const parsedPath = path.parse(webEntryAbsolutePath)
        const importPath = path.join(parsedPath.dir, parsedPath.name)
        webUiEntries.push(`
          // tslint:disable-next-line:no-var-requires
          const plugin${webUiEntries.length} = require("${importPath}").default`)
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

export default (instance: typeof pri) => {
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
      const projectConfig = instance.project.getProjectConfig("local")
      instance.project.lint()
      await instance.project.ensureProjectFiles(projectConfig)
      await instance.project.checkProjectFiles(projectConfig)

      if (options && options.debugDashboard) {
        await debugDashboard()
      } else {
        await CommandDev()
      }
    },
    isDefault: true
  })
}

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
