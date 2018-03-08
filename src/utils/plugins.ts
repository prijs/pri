const tag = "pri-plugins"

declare var global: any

const globalOrWindow: any = (typeof self === "object" && self.self === self && self) ||
  (typeof global === "object" && global.global === global && global)

export interface IPlugin {
  title: string
}

let plugins = new Set<IPlugin>()

if (globalOrWindow[tag]) {
  plugins = globalOrWindow[tag]
} else {
  globalOrWindow[tag] = plugins
}

export { plugins }
