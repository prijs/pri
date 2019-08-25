import * as _ from 'lodash';
import * as path from 'path';
import { globalState } from '../../utils/global-state';
import { logFatal } from '../../utils/log';
import { plugin } from '../../utils/plugins';
import { walkProjectFiles } from '../../utils/walk-project-files';

export const checkProjectFiles = async () => {
  if (!globalState.projectConfig.unexpectedFileCheck) {
    return;
  }

  const files = await walkProjectFiles();
  const whiteFileRules = plugin.whiteFileRules.slice();

  files.forEach(file => {
    if (
      !whiteFileRules.some(whiteFileRule => {
        return whiteFileRule(file);
      })
    ) {
      logFatal(`Unexpected file or directory: ${path.format(file)}`);
    }
  });

  // Check for depsCheckLevel
  switch (globalState.projectConfig.allowDepsSemver) {
    case 'major':
      checkDepsLevel([]);
      break;
    case 'minor':
      checkDepsLevel(['*']);
      break;
    case 'patch':
      checkDepsLevel(['*', '^']);
      break;
    case 'fixed':
      checkDepsLevel(['*', '^', '~']);
      break;
    default:
  }
};

function checkDepsLevel(illegalPrefixs: string[]) {
  const allDeps = {
    ..._.get(globalState.projectPackageJson, 'devDependencies', {}),
    ..._.get(globalState.projectPackageJson, 'dependencies', {}),
    ..._.get(globalState.projectPackageJson, 'peerDependencies', {}),
  };

  Object.keys(allDeps).forEach(depName => {
    const depVersion: string = allDeps[depName];

    illegalPrefixs.forEach(illegalPrefix => {
      switch (illegalPrefix) {
        case '*':
          if (depVersion === '*') {
            logFatal(`Deps: "${depName}": "${depVersion}" is illegal!`);
          }
          break;
        default:
          if (depVersion.startsWith(illegalPrefix)) {
            logFatal(`Deps: "${depName}": "${depVersion}" is illegal!`);
          }
      }
    });
  });
}
