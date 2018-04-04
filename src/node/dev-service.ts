import { plugin } from "../utils/plugins"

export const on = (name: string, callback: (data?: any, resolve?: any, reject?: any) => void) => {
  plugin.devServices.socketListeners.push({
    name,
    callback
  })
}
