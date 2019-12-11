import * as fs from 'fs-extra';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as prettier from 'prettier';
import * as urlJoin from 'url-join';
import * as webpack from 'webpack';
import { pri } from '../../../node';
import { analyseProject } from '../../../utils/analyse-project';
import { createEntry } from '../../../utils/create-entry';
import { globalState } from '../../../utils/global-state';
import { logInfo, spinner } from '../../../utils/log';
import { WrapContent } from '../../../utils/webpack-plugin-wrap-content';
import { getPluginsByOrder } from '../../../utils/plugins';
import { prettierConfig } from '../../../utils/prettier-config';
import * as projectState from '../../../utils/project-state';
import { tempJsEntryPath, tempPath } from '../../../utils/structor-config';
import { runWebpack } from '../../../utils/webpack';
import { runWebpackDevServer } from '../../../utils/webpack-dev-server';
import dashboardClientServer from './dashboard/server/client-server';
import dashboardServer from './dashboard/server/index';
import { bundleDlls, dllMainfestName, dllOutPath, libraryStaticPath } from './dll';

const dashboardBundleFileName = 'main';

export const projectDev = async (options: any) => {
  if (options && options.debugDashboard) {
    await debugDashboard();
  } else {
    await debugProject();
  }
};

async function debugDashboard() {
  const analyseInfo = await spinner('Analyse project', async () => {
    const scopeAnalyseInfo = await analyseProject();
    await createEntry();
    return scopeAnalyseInfo;
  });

  const freePort = await portfinder.getPortPromise();
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 });

  // Start dashboard server
  dashboardServer({ serverPort: dashboardServerPort, analyseInfo });

  // Create dashboard entry
  const dashboardEntryFilePath = createDashboardEntry();

  // Serve dashboard
  await runWebpackDevServer({
    mode: 'development',
    autoOpenBrowser: true,
    hot: pri.sourceConfig.hotReload,
    publicPath: '/static/',
    entryPath: dashboardEntryFilePath,
    devServerPort: freePort,
    outFileName: 'main.[hash].js',
    htmlTemplatePath: path.join(__dirname, '../../../../template-dashboard.ejs'),
    htmlTemplateArgs: {
      dashboardServerPort,
    },
  });
}

async function debugProject() {
  const freePort = pri.sourceConfig.devPort || (await portfinder.getPortPromise());
  const dashboardServerPort = await portfinder.getPortPromise({ port: freePort + 1 });
  const dashboardClientPort = await portfinder.getPortPromise({ port: freePort + 2 });

  const pipeConfig = async (config: webpack.Configuration) => {
    const dllHttpPath = urlJoin(
      `${globalState.sourceConfig.useHttps ? 'https' : 'http'}://127.0.0.1:${freePort}`,
      libraryStaticPath,
    );

    config.plugins.push(
      new WrapContent(
        `
        var dllScript = document.createElement("script");
        dllScript.src = "${dllHttpPath}";
        dllScript.onload = runEntry;
        document.body.appendChild(dllScript);
        function runEntry() {
      `,
        '}',
      ),
    );
    return config;
  };

  debugProjectPrepare(dashboardClientPort);

  await pri.project.ensureProjectFiles();
  await pri.project.checkProjectFiles();

  const analyseInfo = await spinner('Analyse project', async () => {
    const scopeAnalyseInfo = await analyseProject();
    await createEntry();
    return scopeAnalyseInfo;
  });

  await bundleDlls();

  // Bundle dashboard if plugins changed or dashboard bundle not exist.
  const dashboardDistDir = path.join(pri.projectRootPath, tempPath.dir, 'static/dashboard-bundle');
  if (!fs.existsSync(path.join(dashboardDistDir, `${dashboardBundleFileName}.js`))) {
    const dashboardEntryFilePath = createDashboardEntry();

    const status = await runWebpack({
      mode: 'production',
      publicPath: '/bundle/',
      entryPath: dashboardEntryFilePath,
      distDir: dashboardDistDir,
      outFileName: 'main.[hash].js', // dashboard has no css file
      pipeConfig,
    });
    projectState.set('dashboardHash', status.hash);
  }
  const stdoutOfAnyType = process.stdout as any;
  try {
    stdoutOfAnyType.clearLine(0);
  } catch {
    //
  }

  logInfo('\nStart dev server.\n');

  // Start dashboard server
  dashboardServer({ serverPort: dashboardServerPort, analyseInfo });

  if (globalState.sourceConfig.useHttps) {
    logInfo('you should set chrome://flags/#allow-insecure-localhost, to trust local certificate.');
  }

  // Start dashboard client production server
  dashboardClientServer({
    serverPort: dashboardServerPort,
    clientPort: dashboardClientPort,
    staticRootPath: path.join(pri.projectRootPath, tempPath.dir, 'static'),
    hash: projectState.get('dashboardHash'),
  });

  // Serve project
  await runWebpackDevServer({
    mode: 'development',
    autoOpenBrowser: true,
    hot:pri.sourceConfig.hotReload,
    publicPath: globalState.sourceConfig.publicPath,
    entryPath: path.join(globalState.projectRootPath, path.format(tempJsEntryPath)),
    devServerPort: freePort,
    htmlTemplatePath: path.join(__dirname, '../../../../template-project.ejs'),
    htmlTemplateArgs: {
      dashboardServerPort,
    },
    pipeConfig,
  });
}

function debugProjectPrepare(dashboardClientPort: number) {
  pri.project.onCreateEntry((__, entry) => {
    if (pri.isDevelopment) {
      entry.pipeEnvironmentBody(envText => {
        return `
            ${envText}
            priStore.globalState = ${JSON.stringify(globalState)}
          `;
      });

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
        `;
      });

      // React hot loader
      entry.pipeAppHeader(header => {
        return `
        ${header}
        import { hot } from "react-hot-loader/root"
        import { setConfig } from "react-hot-loader"
      `;
      });

      entry.pipeAppBody(str => {
        return `
        setConfig({
          ignoreSFC: true, // RHL will be __completely__ disabled for SFC
          pureRender: true, // RHL will not change render method
        })
        ${str}
      `;
      });

      entry.pipe.set('appExportName', () => {
        return 'hot(App)';
      });

      // Load webui iframe
      entry.pipeEntryRender(str => {
        return `
        ${str}
        const webUICss = \`
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
      `;
      });
    }
  });

  if (pri.majorCommand === 'dev') {
    pri.build.pipeConfig(config => {
      if (!pri.isDevelopment) {
        return config;
      }

      config.plugins.push(
        new webpack.DllReferencePlugin({
          context: '.',
          // eslint-disable-next-line import/no-dynamic-require,global-require
          manifest: require(path.join(dllOutPath, dllMainfestName)),
        }),
      );

      return config;
    });
  }
}

function createDashboardEntry() {
  const dashboardEntryMainPath = path.join(__dirname, 'dashboard/client/index');
  const dashboardEntryFilePath = path.join(pri.projectRootPath, tempPath.dir, 'dashboard/main.tsx');

  const webUiEntries: string[] = [];

  Array.from(getPluginsByOrder()).forEach(() => {
    // try {
    //   const packageJsonPath = require.resolve(path.join(plugin.pathOrModuleName, 'package.json'), {
    //     paths: [__dirname, globalState.projectRootPath]
    //   });
    //   const packageJson = fs.readJsonSync(packageJsonPath, { throws: false });
    //   const webEntry = _.get(packageJson, 'pri.web-entry', null);
    //   if (webEntry) {
    //     const webEntrys: string[] = typeof webEntry === 'string' ? [webEntry] : webEntry;
    //     webEntrys.forEach(eachWebEntry => {
    //       const webEntryAbsolutePath = path.resolve(path.parse(packageJsonPath).dir, eachWebEntry);
    //       const parsedPath = path.parse(webEntryAbsolutePath);
    //       const importPath = path.join(parsedPath.dir, parsedPath.name);
    //       webUiEntries.push(`
    //       const plugin${webUiEntries.length} = require("${importPath}").default`);
    //     });
    //   }
    // } catch (error) {
    //   //
    // }
  });

  fs.outputFileSync(
    dashboardEntryFilePath,
    prettier.format(
      `
      const dashboard = require("${dashboardEntryMainPath}").default

      ${
        webUiEntries.length > 0
          ? `
          ${webUiEntries.join('\n')}
          dashboard([${webUiEntries
            .map((each, index) => {
              return `plugin${index}`;
            })
            .join(',')}])
        `
          : `
          dashboard()
        `
      }
    `,
      { ...prettierConfig, parser: 'typescript' },
    ),
  );

  return dashboardEntryFilePath;
}
