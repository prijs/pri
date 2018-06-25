import { exec as nodeExec, ExecOptions } from 'child_process';
import * as _ from 'lodash';
import { globalState } from './global-state';

export function exec(shell: string, options?: ExecOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    // 默认在 projectRootPath 下执行
    if (options.cwd) {
      options.cwd = globalState.projectRootPath;
    }

    nodeExec(shell, options, (error, stdOut) => {
      if (error) {
        reject(error.toString());
      } else {
        resolve(_.trim(stdOut.toString()));
      }
    });
  });
}
