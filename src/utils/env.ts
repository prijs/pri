export class GlobalEnv {
  public isLocal = false
  public isProd = false
  public customEnv: any = {}
  public get = (name: string) => {
    return this.customEnv[name]
  }
}

let env = new GlobalEnv()

declare const window: any

const tag = "priEnv"
if (window[tag]) {
  env = window[tag]
} else {
  window[tag] = env
}

export { env }

export function setEnvLocal() {
  env.isLocal = true
}

export function setEnvProd() {
  env.isProd = true
}

export function setCustomEnv(info: any) {
  env.customEnv = info
}
