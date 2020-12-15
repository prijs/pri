// eslint-disable-next-line import/no-extraneous-dependencies
import { createBrowserHistory } from 'history';

// eslint-disable-next-line no-undef
const priStore = (window as any).pri;

const { globalState } = priStore;

export const history = createBrowserHistory({
  basename: globalState.sourceConfig.baseHref,
});

export const { isDevelopment } = globalState;

export const { projectConfig } = globalState;

export type ProjectConfig = typeof projectConfig;
