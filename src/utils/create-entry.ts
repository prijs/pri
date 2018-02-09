import * as fs from "fs-extra"
import * as path from "path"
import { Info } from "./analyse-project"
import { md5 } from "./md5"

interface IEntryInfo {
  pageImporter: string
  pageRoutes: string
}

// Entry file content
const entryFileContent = (entryInfo: IEntryInfo) => `
  import * as React from "react"
  import * as ReactDOM from "react-dom"
  import Loadable from "react-loadable"
  import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom"

  ${entryInfo.pageImporter}

  class Root extends React.PureComponent<any, any> {
    public render() {
      return (
        <BrowserRouter>
          <Switch>
            ${entryInfo.pageRoutes}
          </Switch>
        </BrowserRouter>
      )
    }
  }

  ReactDOM.render(
    <Root />,
    document.getElementById("root")
  )
`

export async function createEntry(info: Info, projectRootPath: string) {
  const entryInfo: IEntryInfo = {
    pageImporter: "",
    pageRoutes: ""
  }

  info.routes.forEach(route => {
    const componentName = "Page" + md5(route.filePath)
    const pathInfo = path.parse(route.filePath)
    entryInfo.pageImporter += `
      const ${componentName} = Loadable({
        loader: () => import("${path.join(pathInfo.dir, pathInfo.name)}"),
        loading: () => null
      })\n
    `
    entryInfo.pageRoutes += `<Route exact path="/${route.path}" component={${componentName}} />\n`
  })

  // Create entry tsx file
  const entryPath = path.join(projectRootPath, ".temp/entry.tsx")
  fs.outputFileSync(entryPath, entryFileContent(entryInfo))

  return entryPath
}
