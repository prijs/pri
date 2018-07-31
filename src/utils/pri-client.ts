import { GlobalState } from './global-state-class';

export class GlobalPriStore {
  public globalState = new GlobalState();
}

let store = new GlobalPriStore();

declare var global: any;

const globalOrWindow: any =
  (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global);

const tag = 'pri';
if (globalOrWindow[tag]) {
  store = globalOrWindow[tag];
} else {
  globalOrWindow[tag] = store;
}

export { store };
