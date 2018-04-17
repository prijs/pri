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
      if (navigator.serviceWorker) {
        navigator.serviceWorker.addEventListener("message", event => {
          if (event.data.type === "getServerRenderContent") {
            const baseHrefRegex = new RegExp(escapeRegExp("${projectConfig.baseHref}"), "g")
            const matchRouterPath = event.data.pathname.replace(baseHrefRegex, "")
            const loadableMap = pageLoadableMap.get(matchRouterPath === "/" ? "/" : trimEnd(matchRouterPath, "/"))
            if (loadableMap) {
              loadableMap.preload().then(() => {
                const ssrResult = renderToString(
                  <StaticRouter location={event.data.pathname} context={{}}>
                    <App />
                  </StaticRouter>
                );

                if (navigator.serviceWorker.controller) {
                  navigator.serviceWorker.controller.postMessage({
                    type: 'serverRenderContent',
                    pathname: event.data.pathname,
                    content: ssrResult
                  });
                }
              })
            }
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

        var currentCacheSsrRequest = null
        var currentCacheSsrOriginHtml = null

        // Get ssr content from client, and save to cache.
        self.addEventListener('message', event => {
          if (event.data && event.data.type && event.data.type === 'serverRenderContent') {
            var responseInit = {
              status: 200,
              statusText: 'OK',
              headers: { 'Content-Type': 'text/html;charset=utf-8' }
            };

            var textAddContent = currentCacheSsrOriginHtml.replace(/(\\<div\\sid\\=\\"root\\"\\>)(\\<\\/div\\>)/g, \`$1\${event.data.content}$2\`)
            var textAddScript = textAddContent.replace(/(\\<script\\sid\\=\\"script-before\\"\\>)(\\<\\/script\\>)/g, \`$1\\nwindow.enableSsr = true;\\n$2\`)

            const ssrResponse = new Response(
              textAddScript,
              responseInit
            );

            caches.open(BUNDLE_VERSION).then(cache => {
              cache.put(currentCacheSsrRequest, ssrResponse);
            })
          }
        });

        // Replace entry html to ssr result.
        self.addEventListener('fetch', event => {
          if (
            event.request.mode === 'navigate' &&
            event.request.method === 'GET' &&
            event.request.headers.get('accept').includes('text/html')
          ) {
            event.respondWith(
              caches.open(BUNDLE_VERSION).then(cache => {
                return cache.match(event.request).then(response => {
                  if (response) {
                    return response;
                  }
                  return fetch(event.request).then(response => {
                    const newResponse = response.clone();
                    return newResponse
                      .text()
                      .then(text => {
                        currentCacheSsrRequest = event.request
                        currentCacheSsrOriginHtml = text

                        // Tell client, i want ssrContent!
                        setTimeout(() => {
                          self.clients.matchAll().then(clients => {
                            if (!clients || !clients.length) {
                              return
                            }
                            clients.forEach(client => {
                              client.postMessage({
                                type: "getServerRenderContent",
                                pathname: new URL(event.request.url, location).pathname
                              })
                            })
                          })
                        }, 1000)

                        return response
                      })
                      .catch(err => response);
                  });
                });
              })
            );
          }
        });
      `
    )
  })
}
