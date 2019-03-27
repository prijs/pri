import { pri } from '../../../node';

pri.project.onCreateEntry((analyseInfo, entry) => {
  if (!pri.projectConfig.useServiceWorker) {
    return;
  }

  if (!pri.projectConfig.clientServerRender) {
    return;
  }

  entry.pipeEntryHeader(header => {
    return `
      ${header}
      import { renderToString } from "react-dom/server"
      import StaticRouter from "react-router-dom/StaticRouter"
      import { escapeRegExp, trimEnd } from "lodash"
    `;
  });

  entry.pipeEntryRender(
    render => `
    ${render}
    if (navigator.serviceWorker) {
      navigator.serviceWorker.addEventListener("message", event => {
        if (event.data.type === "getServerRenderContent") {
          const baseHrefRegex = new RegExp(escapeRegExp("${pri.projectConfig.baseHref}"), "g")
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
  );
});

pri.build.afterProdBuild(stats => {
  if (!pri.projectConfig.useServiceWorker) {
    return;
  }

  if (!pri.projectConfig.clientServerRender) {
    return;
  }

  pri.serviceWorker.pipeAfterProdBuild(
    str => `
      ${str}

      var SSR_BUNDLE_PREFIX = "__ssr_bundle__"
      var SSR_BUNDLE_VERSION = SSR_BUNDLE_PREFIX + "${stats.hash}";

      var currentCacheSsrRequest = null
      var currentCacheSsrOriginHtml = null

      /**
       * Delete all bundle caches except current SSR_BUNDLE_VERSION.
       */
      self.addEventListener("activate", event => {
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames
                .filter(cacheName => cacheName.startsWith(SSR_BUNDLE_PREFIX))
                .filter(cacheName => cacheName !== SSR_BUNDLE_VERSION)
                .map(cacheName => caches.delete(cacheName))
            )
          })
        )
      })

      // Get ssr content from client, and save to cache.
      self.addEventListener('message', event => {
        if (event.data && event.data.type && event.data.type === 'serverRenderContent') {
          var responseInit = {
            status: 200,
            statusText: 'OK',
            headers: { 'Content-Type': 'text/html;charset=utf-8' }
          };

          var ssrFlag = "<script>window.enableSsr = true;</script>"
          var injectBodyContent = \`<div id="root">\${event.data.content}</div> \\n \${ssrFlag} \\n\`
          var htmlAddContent = currentCacheSsrOriginHtml.replace(/(\\<body\\>)/g, \`$1\${injectBodyContent}\`)

          const ssrResponse = new Response(
            htmlAddContent,
            responseInit
          );

          caches.open(SSR_BUNDLE_VERSION).then(cache => {
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
            caches.open(SSR_BUNDLE_VERSION).then(cache => {
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
  );
});
