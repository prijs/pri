import createBrowserHistory from 'history/createBrowserHistory';
import { store as __store } from '../utils/pri-client';

export const history = createBrowserHistory({
  basename: __store.globalState.projectConfig.baseHref
});

export { __store };

export const isDevelopment = __store.globalState.isDevelopment;

export const projectConfig = __store.globalState.projectConfig;

export type ProjectConfig = typeof projectConfig;
