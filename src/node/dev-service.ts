import { plugin } from "../utils/plugins"

export const on = (name: string, callback: any) => {
  plugin.devServices.socketListeners.push({
    name,
    callback
  })
}
