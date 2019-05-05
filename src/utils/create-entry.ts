import * as fs from 'fs-extra';
import * as path from 'path';
import * as pipe from '../node/pipe';
import { PRI_PACKAGE_NAME } from './constants';
import { globalState } from './global-state';
import { plugin } from './plugins';
import { prettierConfig } from './prettier-config';
import { tempEnvironmentPath, tempJsAppPath, tempJsEntryPath } from './structor-config';
import { PipeCallback } from './define';

export class Entry {
  public async getApp() {
    const appHeader = await this.getAppHeader();
    const appBody = await this.getAppBody();
    const appComponent = await this.getAppComponent();

    return [appHeader, appBody, appComponent].join('\n');
  }

  public async getEntry() {
    const entryHeader = await this.getEntryHeader();
    const entryRender = await this.getEntryRender();

    return [entryHeader, entryRender].join('\n');
  }

  public async getEnvironment() {
    const environmentBody = await this.getEnvironmentBody();

    return [environmentBody].join('\n');
  }

  public get pipe() {
    return pipe;
  }

  public pipeAppHeader(fn: PipeCallback) {
    pipe.set('appHeader', fn);
  }

  public pipeAppBody(fn: PipeCallback) {
    pipe.set('appBody', fn);
  }

  public pipeAppComponent(fn: PipeCallback) {
    pipe.set('appComponent', fn);
  }

  public pipeAppClassDidMount(fn: PipeCallback) {
    pipe.set('appClassDidMount', fn);
  }

  public pipeAppRoutes(fn: PipeCallback) {
    pipe.set('appRoutes', fn);
  }

  public pipeAppRouter(fn: PipeCallback) {
    pipe.set('appRouter', fn);
  }

  public pipeEntryHeader(fn: PipeCallback) {
    pipe.set('entryHeader', fn);
  }

  public pipeEntryRender(fn: PipeCallback) {
    pipe.set('entryRender', fn);
  }

  public pipeEnvironmentBody(fn: PipeCallback) {
    pipe.set('environmentBody', fn);
  }

  protected async getAppHeader() {
    return pipe.get(
      'appHeader',
      `
      import './environment'

      import { createBrowserHistory } from "history"
      import { history as customHistory } from "${PRI_PACKAGE_NAME}/client"
      import * as React from "react"
      import * as ReactDOM from "react-dom"
      import Loadable from "react-loadable"
      import { Redirect, Route, Router, Switch, HashRouter } from "react-router-dom"
    `
    );
  }

  protected async getAppBody() {
    return pipe.get(
      'appBody',
      `
      export const pageLoadableMap = new Map<string, any>()
    `
    );
  }

  protected async getAppComponent() {
    return pipe.get(
      'appComponent',
      `
      class App extends React.PureComponent<any, any> {
        public componentDidMount() {
          ${await this.getAppClassDidMount()}
        }

        public render() {
          return (
            ${await this.getAppRouter()}
          )
        }
      }

      export default ${await pipe.get('appExportName', 'App')}
    `
    );
  }

  protected async getAppRoutes() {
    return pipe.get('appRoutes', '');
  }

  protected async getAppRouter() {
    const routerName = globalState.projectConfig.useHashRouter ? 'HashRouter' : 'Router';
    const historyInfo = globalState.projectConfig.useHashRouter
      ? ''
      : `
      history={${await pipe.get('appRouterHistory', 'customHistory')}}
    `;

    return pipe.get(
      'appRouter',
      `
      <${routerName} ${historyInfo}>
        <Switch>
          ${await this.getAppRoutes()}
        </Switch>
      </${routerName}>
    `
    );
  }

  protected async getAppClassDidMount() {
    return pipe.get('appClassDidMount', '');
  }

  protected async getEntryHeader() {
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

  protected async getEntryRender() {
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
          (ReactDOM as any).hydrate(${await pipe.get('entryRenderApp', '<App />')}, document.getElementById(ROOT_ID))
        })
      } else {
        // Don't need wait preloadAll.
        Loadable.preloadAll()
        ReactDOM.render(${await pipe.get('entryRenderApp', '<App />')}, document.getElementById(ROOT_ID))
      }
    `
    );
  }

  protected async getEnvironmentBody() {
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

export async function createEntry() {
  const newEntryObject = new Entry();

  for (const projectCreateEntry of plugin.projectCreateEntrys) {
    await projectCreateEntry(plugin.analyseInfo, newEntryObject);
  }

  // Create entry tsx file
  const environmentPath = path.join(globalState.projectRootPath, path.format(tempEnvironmentPath));
  const entryPath = path.join(globalState.projectRootPath, path.format(tempJsEntryPath));
  const appPath = path.join(globalState.projectRootPath, path.format(tempJsAppPath));

  const environment = await newEntryObject.getEnvironment();
  const app = await newEntryObject.getApp();
  const entry = await newEntryObject.getEntry();

  const prettier = await import('prettier');

  fs.outputFileSync(environmentPath, prettier.format(environment, { ...prettierConfig, parser: 'typescript' }));

  fs.outputFileSync(appPath, prettier.format(app, { ...prettierConfig, parser: 'typescript' }));

  fs.outputFileSync(
    entryPath,
    prettier.format(entry, {
      ...prettierConfig,
      parser: 'typescript'
    })
  );

  return entryPath;
}
