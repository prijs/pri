import { globalState } from '../utils/global-state';
import { priEvent } from '../utils/pri-events';
import * as build from './build';
import * as cli from './cli';
import * as commands from './commands';
import * as context from './context';
import { createCli } from './create-cli';
import * as devService from './dev-service';
import * as project from './project/index';
import * as self from './self';
import * as serviceWorker from './service-worker';
import * as webpackCommand from './webpack';

type IPri = typeof globalState &
  typeof self & {
    /**
     * Operate cli commands
     */
    commands: typeof commands;
    /**
     * Build configs
     */
    build: typeof build;
    /**
     * Project management
     */
    project: typeof project;
    /**
     * Context operate
     */
    context: typeof context;
    /**
     * Register dev service
     */
    devService: typeof devService;
    /**
     * Control service worker
     */
    serviceWorker: typeof serviceWorker;
    /**
     * Cli control
     */
    cli: typeof cli;
    /**
     * run or watch webpack directly
     */
    webpack: typeof webpackCommand;

    event: typeof priEvent;
  };

const globalWithPri = global as typeof global & { pri: IPri };

if (!globalWithPri.pri) {
  globalWithPri.pri = {
    commands,
    build,
    project,
    context,
    devService,
    serviceWorker,
    event: priEvent,
    webpack: webpackCommand,
    cli,
    ...self
  } as any;

  Object.keys(globalState).forEach(globalStateKey => {
    Object.defineProperty((global as any).pri, globalStateKey, {
      get() {
        return (globalState as any)[globalStateKey];
      }
    });
  });
}

export const pri = globalWithPri.pri;

export { createCli };

export * from '../utils/structor-config';
