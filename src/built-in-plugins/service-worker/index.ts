import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as prettier from "prettier"
import { pri } from "../../node"
import { tempPath } from "../../utils/structor-config"

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onCreateEntry((analyseInfo, entry) => {
    fs.writeFileSync(
      path.join(projectRootPath, tempPath.dir, "static", "sw.js"),
      prettier.format(
        `
        self.addEventListener("install", event => {
          console.log("install!!")
        })

        self.addEventListener("fetch", event => {
          event.respondWith(
            caches.match(event.request)
              .then(response => {
                // Cache hit, return response
                if (response) {
                  return response
                }

                // Cache not hit, send request.
                console.log(123, event.request)
                return fetch(event.request)
              }
            )
          )
        })

        ${entry.pipe.get("serviceWorker", "")}
        `,
        { semi: false, parser: "babylon" }
      )
    )
  })
}
