export class GlobalEnv {
  public isLocal = false;
  public isProd = false;
  public customEnv: any = {};
  public get = (name: string) => {
    return this.customEnv[name];
  }
}

let env = new GlobalEnv();

declare var global: any;

const globalOrWindow: any =
  (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global);

const tag = 'priEnv';
if (globalOrWindow[tag]) {
  env = globalOrWindow[tag];
} else {
  globalOrWindow[tag] = env;
}

export { env };

export function setEnvLocal() {
  env.isLocal = true;
}

export function setEnvProd() {
  env.isProd = true;
}

export function setCustomEnv(info: any) {
  env.customEnv = info;
}
