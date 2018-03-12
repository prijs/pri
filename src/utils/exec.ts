import { exec as nodeExec, ExecOptions } from "child_process"
import * as _ from "lodash"

export function exec(shell: string, options?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    nodeExec(shell, options, (error, stdOut) => {
      if (error) {
        reject(error.toString())
      } else {
        resolve(_.trim(stdOut.toString()))
      }
    })
  })
}
