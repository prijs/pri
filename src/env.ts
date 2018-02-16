class GlobalEnv {
  public isLocal = false
  public isProd = false
  public customEnv: any = {}
  public get = (name: string) => {
    return this.customEnv[name]
  }
}

let env = new GlobalEnv()

const tag = "priEnv"
if ((window as any)[tag]) {
  env = (window as any)[tag]
} else {
  (window as any)[tag] = env
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
