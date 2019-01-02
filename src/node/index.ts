import { globalState } from '../utils/global-state';
import { priEvent } from '../utils/pri-events';
import * as build from './build';
import * as commands from './commands';
import * as context from './context';
import { createCli } from './create-cli';
import * as devService from './dev-service';
import * as project from './project/index';
import * as self from './self';
import * as serviceWorker from './service-worker';

const pri = {
  /**
   * Operate cli commands
   */
  commands,
  /**
   * Build configs
   */
  build,
  /**
   * Project management
   */
  project,
  /**
   * Context operate
   */
  context,
  /**
   * Register dev service
   */
  devService,
  /**
   * Control service worker
   */
  serviceWorker,

  event: priEvent,

  ...self
};

const outputPri = pri as typeof pri & {
  projectType: typeof globalState.projectType;
  projectRootPath: typeof globalState.projectRootPath;
  isDevelopment: typeof globalState.isDevelopment;
  majorCommand: typeof globalState.majorCommand;
  projectConfig: typeof globalState.projectConfig;
};

Object.defineProperty(pri, 'projectType', {
  get() {
    return globalState.projectType;
  }
});

Object.defineProperty(pri, 'projectRootPath', {
  get() {
    return globalState.projectRootPath;
  }
});

Object.defineProperty(pri, 'isDevelopment', {
  get() {
    return globalState.isDevelopment;
  }
});

Object.defineProperty(pri, 'majorCommand', {
  get() {
    return globalState.majorCommand;
  }
});

Object.defineProperty(pri, 'projectConfig', {
  get() {
    return globalState.projectConfig;
  }
});

export { outputPri as pri, createCli };

export * from '../utils/structor-config';
