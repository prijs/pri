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
  utilPath
} from '../../../utils/structor-config';
import { addWhiteFilesByProjectType } from '../../../utils/white-file-helper';

const whiteList = [CONFIG_FILE, srcPath.dir, docsPath.dir, '.git', `src${path.sep}components`];

const allIgnores = _.union(gitIgnores, npmIgnores);

pri.project.whiteFileRules.add(file => {
  return whiteList
    .concat(allIgnores)
    .some(whiteName => path.format(file) === path.join(pri.projectRootPath, whiteName));
});

// [utils]/
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, path.format(file));
  return relativePath.startsWith(utilPath.dir);
});

// [pages]/*
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, path.format(file));
  return relativePath.startsWith(pagesPath.dir);
});

// [docs]/*
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, path.format(file));
  return relativePath.startsWith(docsPath.dir);
});

// [components]/*
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, path.format(file));
  return relativePath.startsWith(componentPath.dir);
});

// [requests]/*
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, path.format(file));
  return relativePath.startsWith(requestsPath.dir);
});

// [layouts]/*
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, path.format(file));
  return relativePath.startsWith(`src${path.sep}layouts`);
});

addWhiteFilesByProjectType();
