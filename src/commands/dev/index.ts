import { exec, execSync, fork } from "child_process"
import * as fs from "fs-extra"
import * as open from "opn";
import * as path from "path"
import * as portfinder from "portfinder";
import { analyseProject } from "../../utils/analyse-project"
import { createEntry } from "../../utils/create-entry"
import { ensureFiles } from "../../utils/ensure-files"
import { log, spinner } from "../../utils/log"
import { findNearestNodemodules } from "../../utils/npm-finder"
import { getConfig } from "../../utils/project-config"
import { IConfig } from "../../utils/project-config-interface"

const projectRootPath = process.cwd();

export const CommandDev = async () => {
  const env = "local"
  const config = getConfig(projectRootPath, env)

  await spinner("Ensure project files", async () => {
    ensureFiles(projectRootPath, config)
  })

  const entryPath = await spinner("Analyse project", async () => {
    const info = await analyseProject(projectRootPath)
    return createEntry(info, projectRootPath, env, config)
  })

  const freePort = await portfinder.getPortPromise()
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 })
  const dashboardClientPort = await portfinder.getPortPromise({ port: freePort + 2 })

  const htmlEntryPath = createEntryHtmlFile(entryPath, config, dashboardClientPort)

  // If has dashboard bundle, run project with dashboard prod in iframe.
  // If has't dashboard bundle, run dashboard dev server only.
  const dashboardBundleRootPath = path.join(__dirname, "../../bundle")
  const hasDashboardBundle = fs.existsSync(path.join(dashboardBundleRootPath, "index.js"))

  // Start dashboard server
  fork(path.join(__dirname, "dashboard/server/index.js"), [
    "--serverPort",
    dashboardServerPort.toString(),
    "--projectRootPath",
    projectRootPath,
    "--env",
    env
  ])

  if (hasDashboardBundle) {
    log(`you should set chrome://flags/#allow-insecure-localhost, to trust local certificate.`)

    // Start dashboard client production server
    fork(path.join(__dirname, "dashboard/server/client-server.js"), [
      "--serverPort",
      dashboardServerPort.toString(),
      "--clientPort",
      dashboardClientPort.toString(),
      "--projectRootPath",
      projectRootPath,
      "--dashboardBundleRootPath",
      dashboardBundleRootPath
    ])

    // Serve project
    execSync(`${findNearestNodemodules()}/.bin/parcel serve --https --port ${freePort} --open ${htmlEntryPath}`, {
      stdio: "inherit",
      cwd: __dirname
    });
  } else {
    // Start dashboard client dev server
    execSync(`${findNearestNodemodules()}/.bin/parcel serve --https --port ${dashboardClientPort}  --open ${path.join(__dirname, "../../../dev-dashboard-entry.html")}`, {
      stdio: "inherit",
      cwd: projectRootPath
    })
  }
}

function createEntryHtmlFile(entryPath: string, config: IConfig, dashboardServerPort: number) {
  const htmlPath = path.join(projectRootPath, ".temp/dev.html")

  fs.outputFileSync(htmlPath, `
    <html>

    <head>
      <title>${config.title}</title>

      <style>
        html,
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }

        #pri-help-button {
          position: absolute;
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
          position: absolute;
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
      </style>
    </head>

    <body>
      <div id="root"></div>
      <div id="pri-help-button" onclick="priToggleHelpIframe()">Toggle dashboard</div>
      <iframe id="pri-help-iframe" src="https://localhost:${dashboardServerPort}"></iframe>
      <script>
        const priHelpButton = document.getElementById("pri-help-button")
        const priHelpIframe = document.getElementById("pri-help-iframe")

        function priToggleHelpIframe() {
          const activeClassName = "active"
          const isShow = priHelpIframe.classList.contains(activeClassName)

          if (isShow) {
            priHelpIframe.classList.remove(activeClassName)
            priHelpButton.classList.remove(activeClassName)
          } else {
            priHelpIframe.classList.add(activeClassName)
            priHelpButton.classList.add(activeClassName)
          }
        }
      </script>
      <script src="${entryPath}"></script>
    </body>

    </html>
  `)

  return htmlPath
}
