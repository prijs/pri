import * as webpack from "webpack"

// tslint:disable-next-line:no-var-requires
const ProgressPlugin = require("webpack/lib/ProgressPlugin")

export const compilerLogger = (compiler: webpack.Compiler & { apply: any }) => {
  let modulepath = ""
  let current = ""
  let active = ""

  compiler.apply(
    new ProgressPlugin((percentage: number, msg: string) => {
      const stdoutOfAnyType = process.stdout as any
      if (stdoutOfAnyType.isTTY && percentage < 1) {
        stdoutOfAnyType.cursorTo(0)
        modulepath = modulepath ? " …" + modulepath.substr(modulepath.length - 30) : ""
        current = current ? " " + current : ""
        active = active ? " " + active : ""
        stdoutOfAnyType.write((percentage * 100).toFixed(0) + "% " + msg + current + active + modulepath + " ")
        stdoutOfAnyType.clearLine(1)
      } else if (percentage === 1) {
        stdoutOfAnyType.clearLine(0)
        stdoutOfAnyType.write("\n")
      }
    })
  )
}
