import { globalState } from '../utils/global-state';
import { priEvent } from '../utils/pri-events';
import * as build from './build';
import * as cli from './cli';
import * as commands from './commands';
import { context } from './context';
import * as devService from './dev-service';
import * as project from './project/index';
import * as self from './self';
import * as serviceWorker from './service-worker';
import * as webpackCommand from './webpack';
import * as test from './test';

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
    /**
     * Test configs
     */
    test: typeof test;
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
    test,
    ...self,
  } as any;

  Object.keys(globalState).forEach(globalStateKey => {
    Object.defineProperty((global as any).pri, globalStateKey, {
      get() {
        return (globalState as any)[globalStateKey];
      },
      set(value: any) {
        (globalState as any)[globalStateKey] = value;
      },
    });
  });
}

export const { pri } = globalWithPri;

export * from '../utils/structor-config';
