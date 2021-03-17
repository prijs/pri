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

export const typingsPath = { dir: 'typings' };

export const tempPath = { dir: '.temp' };

export const assetsPath = { dir: 'assets' };

export const packagesPath = { dir: 'packages' };

export const pluginsPath = { dir: 'plugins' };

export const declarationPath = { dir: 'declaration' };

/**
 * Sub level definition end
 */

export const tempTypesPath = {
  dir: path.join(tempPath.dir, 'types'),
};

export const pagesPath = { dir: path.join(srcPath.dir, 'pages') };

export const notFoundPath = {
  dir: pagesPath.dir,
  name: '404',
  ext: '.tsx',
};

export const tempJsEntryPath = {
  dir: tempPath.dir,
  name: 'entry',
  ext: '.tsx',
};

export const tempEnvironmentPath = {
  dir: tempPath.dir,
  name: 'environment',
  ext: '.ts',
};

export const tempJsAppPath = { dir: tempPath.dir, name: 'app', ext: '.tsx' };

export const utilPath = {
  dir: path.join(srcPath.dir, 'utils'),
};

export const requestsPath = {
  dir: path.join(srcPath.dir, 'requests'),
};

export const expandPath = {
  dir: path.join(srcPath.dir, 'expand'),
};

export const componentPath = {
  dir: path.join(srcPath.dir, 'components'),
};

export const declarePath = {
  dir: path.join(tempPath.dir, 'declare'),
};

export const layoutPath = {
  dir: path.join(srcPath.dir, 'layouts'),
  name: 'index',
  ext: '.tsx',
};

export const componentEntry = {
  dir: path.join(srcPath.dir),
  name: 'index',
  ext: getComponentEntryExt(),
};

export const pluginEntry = {
  dir: path.join(srcPath.dir),
  name: 'index',
  ext: '.ts',
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
  '.node',
];

// FIXME:
if (!(global as any).priGitIgnores) {
  (global as any).priGitIgnores = _.union([...ignores, globalState.projectConfig.distDir, 'declaration']);
}
export const gitIgnores = (global as any).priGitIgnores as string[];

// npm ignores extends git ingores.
export const npmIgnores = _.union([...ignores, 'tests', 'packages']);

export const ignoreScanFiles = _.union([
  ...ignores,
  '.eslintignore',
  '.gitignore',
  '.gitmodules',
  '.npmignore',
  '.git',
  'package.json',
  'tsconfig.json',
  '.eslintrc',
  '.prettierrc',
  '.npmrc',
  '.travis.yml',
  '.prettierignore',
  'assets',
  'license',
  'LICENSE',
  'readme.md',
  'README.md',
  'history.md',
  'HISTORY.md',
]);

function getComponentEntryExt() {
  // FIXME:
  if (!(global as any).priProjectEntryExt) {
    (global as any).priProjectEntryExt = path.join(globalState.sourceRoot, path.join(srcPath.dir), 'index');
  }
  return fs.existsSync(`${(global as any).priProjectEntryExt}.ts`) ? '.ts' : '.tsx';
}
