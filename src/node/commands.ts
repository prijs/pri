import * as commander from "commander"
import { plugin } from "../utils/plugins"

interface IRegisterCommand {
  name: string
  description?: string
  action?: any
}

export const registerCommand = (opts: IRegisterCommand) => {
  plugin.commands.push(opts)
}
