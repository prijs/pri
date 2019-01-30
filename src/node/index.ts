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

const outputPri = pri as typeof pri & typeof globalState;

Object.keys(globalState).forEach(globalStateKey => {
  Object.defineProperty(pri, globalStateKey, {
    get() {
      return (globalState as any)[globalStateKey];
    }
  });
});

export { outputPri as pri, createCli };

export * from '../utils/structor-config';
