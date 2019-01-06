import * as _ from 'lodash';
import * as path from 'path';
import { pri } from '../../node';
import { CONFIG_FILE } from '../../utils/constants';
import {
  componentPath,
  docsPath,
  gitIgnores,
  npmIgnores,
  pagesPath,
  requestsPath,
  srcPath,
  utilPath
} from '../../utils/structor-config';
import { addWhiteFilesByProjectType } from '../../utils/white-file-helper';

const whiteList = [CONFIG_FILE, srcPath.dir, docsPath.dir, '.git', `src${path.sep}components`];

export default async (instance: typeof pri) => {
  const allIgnores = _.union(gitIgnores, npmIgnores);

  instance.project.whiteFileRules.add(file => {
    return whiteList
      .concat(allIgnores)
      .some(whiteName => path.format(file) === path.join(instance.projectRootPath, whiteName));
  });

  // [utils]/
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(utilPath.dir);
  });

  // [pages]/*
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(pagesPath.dir);
  });

  // [docs]/*
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(docsPath.dir);
  });

  // [components]/*
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(componentPath.dir);
  });

  // [requests]/*
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(requestsPath.dir);
  });

  // [layouts]/*
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(`src${path.sep}layouts`);
  });

  addWhiteFilesByProjectType(instance);
};
