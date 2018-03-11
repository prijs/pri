import * as commander from "commander"
import { ICommand, plugin } from "../utils/plugins"

export const registerCommand = (opts: ICommand) => {
  plugin.commands.push(opts)
}

interface IExpandCommand {
  name: string
  beforeAction?: any
  afterAction?: any
}

export const expandCommand = (opts: IExpandCommand) => {
  const targetCommand = plugin.commands.find(command => command.name === opts.name)
  if (!targetCommand) {
    throw Error(`Command ${opts.name} not found!`)
  }

  if (opts.beforeAction) {
    if (!targetCommand.beforeActions) {
      targetCommand.beforeActions = []
    }
    targetCommand.beforeActions.push(opts.beforeAction)
  }

  if (opts.afterAction) {
    if (!targetCommand.afterActions) {
      targetCommand.afterActions = []
    }
    targetCommand.afterActions.push(opts.afterAction)
  }
}
