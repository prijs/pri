import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as ts from "typescript"
import { pri } from "../../node"

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()
  const projectConfig = instance.project.getProjectConfig("prod")

  instance.project.onCreateEntry((analyseInfo, entry, env) => {
    entry.pipeEntryHeader(header => {
      return `
        ${header}
        import { renderToString } from "react-dom/server"
        import StaticRouter from "react-router-dom/StaticRouter"
        import { escapeRegExp, trimEnd } from "lodash"
      `
    })

    entry.pipeEntryRender(
      render => `
      ${render}
      const baseHrefRegex = new RegExp(escapeRegExp("${projectConfig.baseHref}"), "g")
      const matchRouterPath = location.pathname.replace(baseHrefRegex, "")
      const loadableMap = pageLoadableMap.get(matchRouterPath === "/" ? "/" : trimEnd(matchRouterPath, "/"))
      if (loadableMap) {
        loadableMap.preload().then(() => {
          const ssrResult = renderToString(
            <StaticRouter location={location.pathname} context={{}}>
              <App />
            </StaticRouter>
          );

          if (navigator.serviceWorker && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'serverRender',
              matchRouterPath,
              content: ssrResult
            });
          }
        })
      }
    `
    )
  })

  instance.build.afterProdBuild(stats => {
    instance.serviceWorker.pipeAfterProdBuild(
      str => `
        ${str}
        self.addEventListener('message', event => {
          if (event.data && event.data.type && event.data.type === "serverRender") {
            // console.log(event.data.content)
          }
        });
      `
    )
  })
}
