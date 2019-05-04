import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { globalState } from './global-state';

/**
 * Top level definition start
 */

export const srcPath = { dir: 'src' };

export const testsPath = { dir: 'tests' };

export const docsPath = { dir: 'docs' };

export const tempPath = { dir: '.temp' };

export const assetsPath = { dir: 'assets' };

/**
 * Sub level definition end
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

export const declarePath = {
  dir: path.join(tempPath.dir, 'declare')
};

export const layoutPath = {
  dir: path.join(srcPath.dir, `layouts`),
  name: 'index',
  ext: '.tsx'
};

export const componentEntry = {
  dir: path.join(srcPath.dir),
  name: 'index',
  ext: getComponentEntryExt()
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
  '.temp',
  '.DS_Store',
  'coverage',
  '.nyc_output',
  'npm-debug.log',
  'yarn.lock',
  '.node'
];

export const gitIgnores = _.union([...ignores, globalState.projectConfig.distDir, 'declaration']);

// npm ignores extends git ingores.
export const npmIgnores = _.union([...ignores, 'tests', 'packages']);

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

function getComponentEntryExt() {
  const projectEntryExt = path.join(globalState.sourceRoot, path.join(srcPath.dir), 'index');
  return fs.existsSync(`${projectEntryExt}.ts`) ? '.ts' : '.tsx';
}
