import * as fs from "fs"
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
  import { Redirect, Route, Switch, BrowserRouter } from "react-router-dom";

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
    entryInfo.pageImporter += `import ${componentName} from "${path.join(pathInfo.dir, pathInfo.name)}"\n`
    entryInfo.pageRoutes += `<Route exact path="/${route.path}" component={${componentName} as any} />\n`
  })

  // Create entry file
  const entryPath = path.join(__dirname, "../entry.tsx")
  fs.writeFileSync(entryPath, entryFileContent(entryInfo))

  return entryPath
}
