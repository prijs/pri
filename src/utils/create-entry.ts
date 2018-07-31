import * as fs from 'fs-extra';
import * as path from 'path';
import * as prettier from 'prettier';
import * as pipe from '../node/pipe';
import { IProjectInfo } from './analyse-project-interface';
import { PRI_PACKAGE_NAME } from './constants';
import { globalState } from './global-state';
import { plugin } from './plugins';
import { prettierConfig } from './prettier-config';
import { tempEnvironmentPath, tempJsAppPath, tempJsEntryPath } from './structor-config';

export class Entry {
  public getApp() {
    return [this.getAppHeader(), this.getAppBody(), this.getAppComponent()].join('\n');
  }

  public getEntry() {
    return [this.getEntryHeader(), this.getEntryRender()].join('\n');
  }

  public getEnvironment() {
    return [this.getEnvironmentBody()].join('\n');
  }

  public get pipe() {
    return pipe;
  }

  public pipeAppHeader(fn: (header: string) => string) {
    pipe.set('appHeader', fn);
  }

  public pipeAppBody(fn: (body: string) => string) {
    pipe.set('appBody', fn);
  }

  public pipeAppComponent(fn: (entryComponent: string) => string) {
    pipe.set('appComponent', fn);
  }

  public pipeAppClassDidMount(fn: (renderRouter: string) => string) {
    pipe.set('appClassDidMount', fn);
  }

  public pipeAppRoutes(fn: (renderRoutes: string) => string) {
    pipe.set('appRoutes', fn);
  }

  public pipeAppRouter(fn: (renderRouter: string) => string) {
    pipe.set('appRouter', fn);
  }

  public pipeEntryHeader(fn: (render: string) => string) {
    pipe.set('entryHeader', fn);
  }

  public pipeEntryRender(fn: (render: string) => string) {
    pipe.set('entryRender', fn);
  }

  public pipeEnvironmentBody(fn: (render: string) => string) {
    pipe.set('environmentBody', fn);
  }

  protected getAppHeader() {
    return pipe.get(
      'appHeader',
      `
      import './environment'

      import createBrowserHistory from "history/createBrowserHistory"
      import { history as customHistory } from "${PRI_PACKAGE_NAME}/client"
      import * as React from "react"
      import * as ReactDOM from "react-dom"
      import Loadable from "react-loadable"
      import { Redirect, Route, Router, Switch } from "react-router-dom"
    `
    );
  }

  protected getAppBody() {
    return pipe.get(
      'appBody',
      `
      export const pageLoadableMap = new Map<string, any>()
    `
    );
  }

  protected getAppComponent() {
    return pipe.get(
      'appComponent',
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
    );
  }

  protected getAppRoutes() {
    return pipe.get('appRoutes', '');
  }

  protected getAppRouter() {
    return pipe.get(
      'appRouter',
      `
      <Router history={${pipe.get('appRouterHistory', 'customHistory')}}>
        <Switch>
          ${this.getAppRoutes()}
        </Switch>
      </Router>
    `
    );
  }

  protected getAppClassDidMount() {
    return pipe.get('appClassDidMount', '');
  }

  protected getEntryHeader() {
    return pipe.get(
      'entryHeader',
      `
      import * as React from "react"
      import * as ReactDOM from "react-dom"
      import Loadable from "react-loadable"
      import App, { pageLoadableMap } from "./app"

      const ROOT_ID = "root"
    `
    );
  }

  protected getEntryRender() {
    return pipe.get(
      'entryRender',
      `
      // Create entry div if not exist.
      if (!document.getElementById(ROOT_ID)) {
        const rootDiv = document.createElement("div")
        rootDiv.id = ROOT_ID
        document.body.appendChild(rootDiv)
      }

      if ((window as any).enableSsr) {
        // Need wait preloadAll, because we already have ssr html.
        Loadable.preloadAll().then(() => {
          (ReactDOM as any).hydrate(${pipe.get('entryRenderApp', '<App />')}, document.getElementById(ROOT_ID))
        })
      } else {
        // Don't need wait preloadAll.
        Loadable.preloadAll()
        ReactDOM.render(${pipe.get('entryRenderApp', '<App />')}, document.getElementById(ROOT_ID))
      }
    `
    );
  }

  protected getEnvironmentBody() {
    return pipe.get(
      'environmentBody',
      `
      let priStore: any = {};
        
      const tag = 'pri';
      if ((window as any)[tag]) {
        priStore = (window as any)[tag];
      } else {
        (window as any)[tag] = priStore;
      }
    `
    );
  }
}

export function createEntry() {
  const newEntryObject = new Entry();

  plugin.projectCreateEntrys.forEach(projectCreateEntry => {
    projectCreateEntry(plugin.analyseInfo, newEntryObject);
  });

  // Create entry tsx file
  const environmentPath = path.join(globalState.projectRootPath, path.format(tempEnvironmentPath));
  const entryPath = path.join(globalState.projectRootPath, path.format(tempJsEntryPath));
  const appPath = path.join(globalState.projectRootPath, path.format(tempJsAppPath));

  fs.outputFileSync(
    environmentPath,
    prettier.format(newEntryObject.getEnvironment(), { ...prettierConfig, parser: 'typescript' })
  );

  fs.outputFileSync(appPath, prettier.format(newEntryObject.getApp(), { ...prettierConfig, parser: 'typescript' }));

  fs.outputFileSync(
    entryPath,
    prettier.format(newEntryObject.getEntry(), {
      ...prettierConfig,
      parser: 'typescript'
    })
  );

  return entryPath;
}
