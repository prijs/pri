import * as fs from "fs-extra"
import * as path from "path"
import { Info } from "./analyse-project"
import { md5 } from "./md5"

interface IEntryInfo {
  pageImporter: string
  pageRoutes: string
  layoutImporter: string
}

const layoutContent = (entryInfo: IEntryInfo) => {
  if (entryInfo.layoutImporter) {
    return `
      <LayoutComponent>
        <Switch>
          ${entryInfo.pageRoutes}
        </Switch>
      </LayoutComponent>
    `
  } else {
    return `
      <Switch>
        ${entryInfo.pageRoutes}
      </Switch>
    `
  }
}

// Entry file content
const entryFileContent = (entryInfo: IEntryInfo) => `
  import { BrowserRouter, Loadable, React, ReactDOM, Redirect, Route, Switch } from "pri"

  ${entryInfo.layoutImporter}
  ${entryInfo.pageImporter}

  class Root extends React.PureComponent<any, any> {
    public render() {
      return (
        <BrowserRouter>
          ${layoutContent(entryInfo)}
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
    pageRoutes: "",
    layoutImporter: ""
  }

  // Set routes
  info.routes.forEach(route => {
    const filePath = path.parse(route.filePath)
    const relativePageFilePath = path.relative(projectRootPath, filePath.dir + "/" + filePath.name)
    const componentName = relativePageFilePath.split("/").join("_")

    const pathInfo = path.parse(route.filePath)
    entryInfo.pageImporter += `
      const ${componentName} = Loadable({
        loader: () => import("${path.join(pathInfo.dir, pathInfo.name)}"),
        loading: () => null
      })\n
    `
    entryInfo.pageRoutes += `<Route exact path="/${route.path}" component={${componentName}} />\n`
  })

  // Set layout
  if (info.layout) {
    const layoutPath = path.parse(info.layout.filePath)
    entryInfo.layoutImporter = `import LayoutComponent from "${path.join(layoutPath.dir, layoutPath.name)}"`
  }

  // Create entry tsx file
  const entryPath = path.join(projectRootPath, ".temp/entry.tsx")
  fs.outputFileSync(entryPath, entryFileContent(entryInfo))

  return entryPath
}
