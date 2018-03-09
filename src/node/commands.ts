import * as commander from "commander"

export const registerCommand = (callback: (cmd: commander.CommanderStatic) => void) => {
  callback(commander)
}
