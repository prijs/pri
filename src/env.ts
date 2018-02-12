let customEnv: any = {}

const env = {
  isLocal: false,
  isProd: false,
  get: (name: string) => {
    return customEnv[name]
  }
}

export function setEnvLocal() {
  env.isLocal = true
}

export function setEnvProd() {
  env.isProd = true
}

export function setCustomEnv(info: any) {
  customEnv = info
}

export { env }
