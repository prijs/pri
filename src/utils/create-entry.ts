import * as fs from "fs-extra"
import * as path from "path"
import * as prettier from "prettier"
import * as pipe from "../node/pipe"
import { IProjectInfo } from "./analyse-project-interface"
import { plugin } from "./plugins"
import { IProjectConfig } from "./project-config-interface"
import { tempJsAppPath, tempJsEntryPath } from "./structor-config"

export class Entry {
  private env: "local" | "prod"
  private projectConfig: IProjectConfig

  constructor(env: "local" | "prod", projectConfig: IProjectConfig) {
    this.env = env
    this.projectConfig = projectConfig
  }

  public getApp() {
    return [this.getAppHeader(), this.getAppBody(), this.getAppComponent()].join("\n")
  }

  public getEntry() {
    return [this.getEntryHeader(), this.getEntryRender()].join("\n")
  }

  public get pipe() {
    return pipe
  }

  public pipeAppHeader(fn: (header: string) => string) {
    pipe.set("appHeader", fn)
  }

  public pipeAppBody(fn: (body: string) => string) {
    pipe.set("appBody", fn)
  }

  public pipeAppComponent(fn: (entryComponent: string) => string) {
    pipe.set("appComponent", fn)
  }

  public pipeAppClassDidMount(fn: (renderRouter: string) => string) {
    pipe.set("appClassDidMount", fn)
  }

  public pipeAppRoutes(fn: (renderRoutes: string) => string) {
    pipe.set("appRoutes", fn)
  }

  public pipeAppRouter(fn: (renderRouter: string) => string) {
    pipe.set("appRouter", fn)
  }

  public pipeEntryHeader(fn: (render: string) => string) {
    pipe.set("entryHeader", fn)
  }

  public pipeEntryRender(fn: (render: string) => string) {
    pipe.set("entryRender", fn)
  }

  protected getAppHeader() {
    return pipe.get(
      "appHeader",
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

  protected getAppBody() {
    return pipe.get(
      "appBody",
      `
      export const pageLoadableMap = new Map<string, any>()
      export const customHistory = createBrowserHistory({
        basename: "${this.projectConfig.baseHref}"
      })
    `
    )
  }

  protected getAppComponent() {
    return pipe.get(
      "appComponent",
      `
      export default class App extends React.PureComponent<any, any> {
        public componentDidMount() {
          ${this.getAppClassDidMount()}
        }

        public render() {
          return (
            ${this.getAppRouter()}
          )
        }
      }
    `
    )
  }

  protected getAppRoutes() {
    return pipe.get("appRoutes", "")
  }

  protected getAppRouter() {
    return pipe.get(
      "appRouter",
      `
      <Router history={customHistory}>
        <Switch>
          ${this.getAppRoutes()}
        </Switch>
      </Router>
    `
    )
  }

  protected getAppClassDidMount() {
    return pipe.get("appClassDidMount", "")
  }

  protected getEntryHeader() {
    return pipe.get(
      "entryHeader",
      `
      import * as React from "react"
      import * as ReactDOM from "react-dom"
      import App, { pageLoadableMap } from "./app"
    `
    )
  }

  protected getEntryRender() {
    return pipe.get(
      "entryRender",
      `
      ReactDOM.render(<App />, document.getElementById("root"))
    `
    )
  }
}

export function createEntry(projectRootPath: string, env: "local" | "prod", projectConfig: IProjectConfig) {
  const newEntryObject = new Entry(env, projectConfig)

  plugin.projectCreateEntrys.forEach(projectCreateEntry => {
    projectCreateEntry(plugin.analyseInfo, newEntryObject, env, projectConfig)
  })

  // Create entry tsx file
  const entryPath = path.join(projectRootPath, path.format(tempJsEntryPath))
  const appPath = path.join(projectRootPath, path.format(tempJsAppPath))

  fs.outputFileSync(
    appPath,
    prettier.format(newEntryObject.getApp(), {
      semi: true,
      singleQuote: true,
      parser: "typescript"
    })
  )

  fs.outputFileSync(
    entryPath,
    prettier.format(newEntryObject.getEntry(), {
      semi: true,
      singleQuote: true,
      parser: "typescript"
    })
  )

  return entryPath
}
