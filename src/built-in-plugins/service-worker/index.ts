import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import * as prettier from "prettier"
import { pri } from "../../node"
import { tempPath } from "../../utils/structor-config"

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onCreateEntry((analyseInfo, entry) => {
    fs.outputFileSync(
      path.join(projectRootPath, tempPath.dir, "static", "sw.js"),
      prettier.format(
        entry.pipe.get(
          "serviceWorker",
          `
          self.addEventListener("install", event => {
            self.skipWaiting()
          })

          self.addEventListener("activate", event => {
            self.clients.claim()
          });
        `
        ),
        { semi: true, singleQuote: true, parser: "babylon" }
      )
    )
  })
}
