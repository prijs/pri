import * as fs from "fs-extra"
import * as path from "path"
import * as prettier from "prettier"
import { IProjectInfo } from "./analyse-project-interface"
import { md5 } from "./md5"
import { IConfig } from "./project-config-interface"

interface IEntryInfo {
  pageImporter: string
  pageRoutes: string
  layoutImporter: string
  notFoundImporter: string
  notFoundRoute: string
  setEnv: string
  setCustomEnv: string
}

// Entry file content
const entryFileContent = (entryInfo: IEntryInfo) => `
  import { BrowserRouter, Loadable, React, ReactDOM, Redirect, Route, Switch, setEnvLocal, setEnvProd, setCustomEnv } from "pri"

  ${entryInfo.setEnv}
  ${entryInfo.setCustomEnv}

  ${entryInfo.layoutImporter}
  ${entryInfo.notFoundImporter}
  ${entryInfo.pageImporter}

  class Root extends React.PureComponent<any, any> {
    public render() {
      return (
        <BrowserRouter>
          <Switch>
            ${entryInfo.pageRoutes}
            ${entryInfo.notFoundRoute}
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

export async function createEntry(info: IProjectInfo, projectRootPath: string, env: string, config: IConfig) {
  const entryInfo: IEntryInfo = {
    pageImporter: "",
    pageRoutes: "",
    layoutImporter: "",
    notFoundImporter: "",
    notFoundRoute: "",
    setEnv: "",
    setCustomEnv: ""
  }

  // Set env
  switch (env) {
    case "local":
      entryInfo.setEnv = `setEnvLocal()`
      break
    case "prod":
      entryInfo.setEnv = `setEnvProd()`
      break
    default:
  }

  // Set custom env
  if (config.env) {
    entryInfo.setCustomEnv = `setCustomEnv(${JSON.stringify(config.env)})`
  }

  // Set routes
  info.routes.forEach(route => {
    const filePath = path.parse(route.filePath)
    const relativePageFilePath = path.relative(projectRootPath, filePath.dir + "/" + filePath.name)
    const componentName = relativePageFilePath.split("/").join("_")

    const pathInfo = path.parse(route.filePath)

    if (info.routes.length < 2) {
      // If only one page, don't need code splitting.
      entryInfo.pageImporter += `
        import ${componentName} from "${path.join(pathInfo.dir, pathInfo.name)}"
      `
    } else {
      entryInfo.pageImporter += `
        const ${componentName} = Loadable({
          loader: () => import("${path.join(pathInfo.dir, pathInfo.name)}"),
          loading: () => null
        })\n
      `
    }

    const routeComponent = info.layout ? "LayoutRoute" : "Route"

    entryInfo.pageRoutes += `<${routeComponent} exact path="${route.path}" component={${componentName}} />\n`
  })

  // Set layout
  if (info.layout) {
    const layoutPath = path.parse(info.layout.filePath)
    entryInfo.layoutImporter = `
      import LayoutComponent from "${path.join(layoutPath.dir, layoutPath.name)}"

      const LayoutRoute = ({ component: Component, ...rest }) => {
        return (
          <Route {...rest} render={matchProps => (
            <LayoutComponent>
              <Component {...matchProps} />
            </LayoutComponent>
          )} />
        )
      };\n
    `
  }

  // Set not found
  if (info.notFound) {
    const notFoundPath = path.parse(info.notFound.filePath)
    entryInfo.notFoundImporter = `import NotFoundComponent from "${path.join(notFoundPath.dir, notFoundPath.name)}"`
    entryInfo.notFoundRoute = `
      <Route component={NotFoundComponent} />
    `
  }

  // Create entry tsx file
  const entryPath = path.join(projectRootPath, ".temp/entry.tsx")
  fs.outputFileSync(entryPath, prettier.format(entryFileContent(entryInfo), {
    semi: false,
    parser: "typescript"
  }))

  return entryPath
}
