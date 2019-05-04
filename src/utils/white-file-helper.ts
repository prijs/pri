import * as path from 'path';
import { pri } from '../node';
import { globalState } from './global-state';
import { srcPath } from './structor-config';

// For component/plugin, add `src` to white list.
export function addWhiteFilesByProjectType() {
  if (globalState.sourceConfig.type === 'component' || globalState.sourceConfig.type === 'plugin') {
    pri.project.whiteFileRules.add(file => {
      return path.format(file).startsWith(path.join(globalState.projectRootPath, srcPath.dir));
    });
  }

  globalState.packages.forEach(eachPackage => {
    if (eachPackage.config.type === 'component' || eachPackage.config.type === 'plugin') {
      pri.project.whiteFileRules.add(file => {
        return path.format(file).startsWith(path.join(eachPackage.rootPath, srcPath.dir));
      });
    }
  });
}
