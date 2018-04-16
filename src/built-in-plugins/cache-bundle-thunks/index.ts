import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as ts from "typescript"
import { pri } from "../../node"

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()
  const projectConfig = instance.project.getProjectConfig("prod")

  instance.build.afterProdBuild(stats => {
    const chunkFileNames: string[] = []
    Object.keys(stats.assetsByChunkName).forEach(chunkKey => {
      const chunkInfo = stats.assetsByChunkName[chunkKey]
      if (typeof chunkInfo === "string") {
        chunkFileNames.push(chunkInfo)
      } else {
        chunkInfo.forEach((chunkName: string) => chunkFileNames.push(chunkName))
      }
    })

    instance.serviceWorker.pipeAfterProdBuild(
      text => `
      ${text}

      var BUNDLE_PREFIX = "__bundle__"
      var BUNDLE_VERSION = BUNDLE_PREFIX + "${stats.hash}";

      var bundleCaches = [${chunkFileNames
        .map(chunkFileName => `"${path.join(projectConfig.baseHref, chunkFileName)}"`)
        .join(",")}]

      self.addEventListener("install", event => {
        event.waitUntil(
          caches.open(BUNDLE_VERSION)
            .then(cache => {
              return cache.addAll(bundleCaches)
            })
        );
      });

      /**
       * Delete all bundle caches except current BUNDLE_VERSION.
       */
      self.addEventListener("activate", event => {
        event.waitUntil(
          caches.keys().then(cacheNames => {
            return Promise.all(
              cacheNames
                .filter(cacheName => cacheName.startsWith(BUNDLE_PREFIX))
                .filter(cacheName => cacheName !== BUNDLE_VERSION)
                .map(cacheName => caches.delete(cacheName))
            )
          })
        )
      })

      self.addEventListener("fetch", event => {
        event.respondWith(
          caches
            .match(event.request)
            .then(response => {
              if (response) {
                return response;
              }
              return fetch(event.request);
            })
            .catch(error => fetch(event.request))
        );
      });
    `
    )
  })
}
