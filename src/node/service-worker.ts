import { set } from './pipe';

export const pipe = (callback: (text?: string) => string) => {
  set('serviceWorker', callback);
};

export const pipeAfterProdBuild = (callback: (text?: string) => string) => {
  set('serviceWorkerAfterProdBuild', callback);
};
