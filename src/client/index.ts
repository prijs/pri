import createBrowserHistory from 'history/createBrowserHistory';
import { GlobalState } from '../utils/global-state-class';

const globalState: GlobalState = (window as any)['pri'];

export const history = createBrowserHistory({
  basename: globalState.projectConfig.baseHref
});

export const isDevelopment = globalState.isDevelopment;

export const projectConfig = globalState.projectConfig;

export type ProjectConfig = typeof projectConfig;
