import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { pri } from '../../node';
import { CONFIG_FILE } from '../../utils/constants';
import { globalState } from '../../utils/global-state';
import { gitIgnores, npmIgnores, srcPath } from '../../utils/structor-config';

const whiteList = [
  CONFIG_FILE,
  'readme.md',
  srcPath.dir,
  `${srcPath.dir}${path.sep}pages`,
  `${srcPath.dir}${path.sep}utils`,
  '.git',
  `src${path.sep}components`
];

export default async (instance: typeof pri) => {
  const allIgnores = _.union(gitIgnores, npmIgnores);

  instance.project.whiteFileRules.add(file => {
    return whiteList
      .concat(allIgnores)
      .some(whiteName => path.format(file) === path.join(instance.projectRootPath, whiteName));
  });

  // src/utils/**
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath.startsWith(`${srcPath.dir}${path.sep}utils`);
  });

  // src/pages/[folder]
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath.startsWith(`${srcPath.dir}${path.sep}pages`) && file.isDir;
  });

  // src/components/**
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath.startsWith(`${srcPath.dir}${path.sep}components`);
  });
};
