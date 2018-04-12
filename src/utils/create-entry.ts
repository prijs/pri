import * as fs from "fs-extra"
import * as path from "path"
import * as prettier from "prettier"
import * as pipe from "../node/pipe"
import { IProjectInfo } from "./analyse-project-interface"
import { plugin } from "./plugins"
import { IProjectConfig } from "./project-config-interface"
import { tempJsEntryPath } from "./structor-config"

export class Entry {
  private env: "local" | "prod"
  private projectConfig: IProjectConfig

  constructor(env: "local" | "prod", projectConfig: IProjectConfig) {
    this.env = env
    this.projectConfig = projectConfig
  }

  public getAll() {
    return [this.getHeader(), this.getBody(), this.getEntryComponent(), this.getFooter()].join("\n")
  }

  public get pipe() {
    return pipe
  }

  public pipeHeader(fn: (header: string) => string) {
    pipe.set("entryHeader", fn)
  }

  public pipeBody(fn: (body: string) => string) {
    pipe.set("entryBody", fn)
  }

  public pipeEntryComponent(fn: (entryComponent: string) => string) {
    pipe.set("entryEntryComponent", fn)
  }

  public pipeFooter(fn: (footer: string) => string) {
    pipe.set("entryFooter", fn)
  }

  public pipeRenderRoutes(fn: (renderRoutes: string) => string) {
    pipe.set("entryRenderRoutes", fn)
  }

  public pipeRenderRouter(fn: (renderRouter: string) => string) {
    pipe.set("entryRenderRouter", fn)
  }

  public pipeEntryClassDidMount(fn: (renderRouter: string) => string) {
    pipe.set("entryEntryClassDidMount", fn)
  }

  protected getHeader() {
    return pipe.get(
      "entryHeader",
      `
      import createBrowserHistory from "history/createBrowserHistory"
      import { setCustomEnv, setEnvLocal, setEnvProd } from "pri/client"
      import * as React from "react"
      import * as ReactDOM from "react-dom"
      import Loadable from "react-loadable"
      import { Redirect, Route, Router, Switch } from "react-router-dom"
    `
    )
  }

  protected getBody() {
    return pipe.get(
      "entryBody",
      `
      const customHistory = createBrowserHistory({
        basename: "${this.projectConfig.baseHref}"
      })
    `
    )
  }

  protected getEntryComponent() {
    return pipe.get(
      "entryEntryComponent",
      `
      class Root extends React.PureComponent<any, any> {
        public componentDidMount() {
          ${this.getEntryClassDidMount()}
        }

        public render() {
          return (
            ${this.getRenderRouter()}
          )
        }
      }
    `
    )
  }

  protected getFooter() {
    return pipe.get(
      "entryFooter",
      `
      ReactDOM.render(<Root />, document.getElementById("root"))
    `
    )
  }

  protected getRenderRoutes() {
    return pipe.get("entryRenderRoutes", "")
  }

  protected getRenderRouter() {
    return pipe.get(
      "entryRenderRouter",
      `
      <Router history={customHistory}>
        <Switch>
          ${this.getRenderRoutes()}
        </Switch>
      </Router>
    `
    )
  }

  protected getEntryClassDidMount() {
    return pipe.get("entryEntryClassDidMount", "")
  }
}

export function createEntry(projectRootPath: string, env: "local" | "prod", projectConfig: IProjectConfig) {
  const newEntryObject = new Entry(env, projectConfig)

  plugin.projectCreateEntrys.forEach(projectCreateEntry => {
    projectCreateEntry(plugin.analyseInfo, newEntryObject, env, projectConfig)
  })

  // Create entry tsx file
  const entryPath = path.join(projectRootPath, path.format(tempJsEntryPath))

  fs.outputFileSync(
    entryPath,
    prettier.format(newEntryObject.getAll(), {
      semi: true,
      singleQuote: true,
      parser: "typescript"
    })
  )

  return entryPath
}
