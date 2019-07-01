import * as _ from 'lodash';
import * as path from 'path';
import { pri } from '../../../node';
import { CONFIG_FILE } from '../../../utils/constants';
import {
  componentPath,
  docsPath,
  gitIgnores,
  npmIgnores,
  pagesPath,
  requestsPath,
  srcPath,
  utilPath,
  packagesPath,
  expandPath
} from '../../../utils/structor-config';
import { addWhiteFilesByProjectType } from '../../../utils/white-file-helper';
import { transferToAllAbsolutePaths } from '../../../utils/global-state';

const whiteList = [
  CONFIG_FILE,
  srcPath.dir,
  docsPath.dir,
  '.git',
  `src${path.sep}components`,
  ...(pri.projectConfig.packageLock ? ['package-lock.json', 'yarn.lock'] : [])
];

const allIgnores = _.union(gitIgnores, npmIgnores).concat(whiteList);

const allAbsoluteIgnores = _.flatten(
  allIgnores.map(fileName => {
    return transferToAllAbsolutePaths(fileName);
  })
);

// Add ignore file/dir to whiteRules
pri.project.whiteFileRules.add(file => {
  return allAbsoluteIgnores.some(absoluteFilePath => {
    return path.format(file) === absoluteFilePath;
  });
});

pri.project.whiteFileRules.add(file => {
  return transferToAllAbsolutePaths(utilPath.dir)
    .concat(transferToAllAbsolutePaths(pagesPath.dir))
    .concat(transferToAllAbsolutePaths(docsPath.dir))
    .concat(transferToAllAbsolutePaths(componentPath.dir))
    .concat(transferToAllAbsolutePaths(requestsPath.dir))
    .concat(transferToAllAbsolutePaths(expandPath.dir))
    .concat(transferToAllAbsolutePaths(`src${path.sep}layouts`))
    .concat(path.join(pri.projectRootPath, packagesPath.dir))
    .some(absoluteFilePath => {
      return path.format(file).startsWith(absoluteFilePath);
    });
});

addWhiteFilesByProjectType();
