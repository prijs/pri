import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { globalState } from './global-state';

/**
 * Top level definition start
 */

export const srcPath = {
  dir: path.join(globalState.projectConfig.sourceRoot, 'src')
};

export const testsPath = {
  dir: path.join(globalState.projectConfig.sourceRoot, 'tests')
};

export const docsPath = { dir: path.join(globalState.projectConfig.sourceRoot, 'docs') };

export const tempPath = {
  dir: '.temp'
};

/**
 * Top level definition end
 */

export const tempTypesPath = {
  dir: path.join(tempPath.dir, 'types')
};

export const pagesPath = { dir: path.join(srcPath.dir, `pages`) };

export const notFoundPath = {
  dir: pagesPath.dir,
  name: '404',
  ext: '.tsx'
};

export const tempJsEntryPath = {
  dir: tempPath.dir,
  name: 'entry',
  ext: '.tsx'
};

export const tempEnvironmentPath = {
  dir: tempPath.dir,
  name: 'environment',
  ext: '.ts'
};

export const tempJsAppPath = { dir: tempPath.dir, name: 'app', ext: '.tsx' };

export const utilPath = {
  dir: path.join(srcPath.dir, 'utils')
};

export const requestsPath = {
  dir: path.join(srcPath.dir, 'requests')
};

export const componentPath = {
  dir: path.join(srcPath.dir, 'components')
};

export const helperPath = {
  dir: utilPath.dir,
  name: 'helper',
  ext: '.tsx'
};

export const declarePath = {
  dir: path.join(tempPath.dir, 'declare')
};

export const layoutPath = {
  dir: path.join(srcPath.dir, `layouts`),
  name: 'index',
  ext: '.tsx'
};

export const storesPath = {
  dir: path.join(srcPath.dir, `stores`)
};

// Try to find project's entry's ext
const projectEntryExt = path.join(globalState.projectRootPath, path.join(srcPath.dir), 'index');
const componentEntryExt = fs.existsSync(`${projectEntryExt}.ts`) ? '.ts' : '.tsx';

export const componentEntry = {
  dir: path.join(srcPath.dir),
  name: 'index',
  ext: componentEntryExt
};

export const cliEntry = {
  dir: path.join(srcPath.dir),
  name: 'index',
  ext: '.ts'
};

export const pluginEntry = {
  dir: path.join(srcPath.dir),
  name: 'index',
  ext: '.ts'
};

/**
 * Ignores.
 */
const ignores = [
  'node_modules',
  '.cache',
  '.vscode',
  '.idea',
  tempPath.dir,
  '.DS_Store',
  'coverage',
  '.nyc_output',
  'npm-debug.log',
  'yarn.lock',
  '.node'
];

export const gitIgnores = _.union([...ignores, globalState.projectConfig.distDir, 'declaration']);

// npm ignores extends git ingores.
export const npmIgnores = _.union([...ignores, testsPath.dir, 'packages']);

export const ignoreScanFiles = _.union([
  ...ignores,
  '.gitignore',
  '.gitmodules',
  '.npmignore',
  '.prettierrc',
  '.git',
  'package.json',
  'tsconfig.json',
  'tsconfig.jest.json',
  '.eslintrc',
  '.npmrc',
  '.travis.yml',
  '.prettierignore',
  'assets',
  'license',
  'LICENSE',
  'readme.md',
  'README.md',
  'history.md',
  'HISTORY.md'
]);
