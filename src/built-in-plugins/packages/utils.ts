import * as fs from 'fs-extra';
import * as path from 'path';
import * as ts from 'typescript';
import * as walk from 'walk';
import { exec } from '../../utils/exec';
import { getPackageJson, IPackageJson } from '../../utils/file-operate';
import { globalState } from '../../utils/global-state';
import { packagesPath } from './config';

export const getPackages = (() => {
  let result: Array<{
    name: string;
    path: string;
    packageJson: IPackageJson;
  }> = null;

  return async function foo() {
    if (result) {
      return result;
    }

    const submoduleStatus = await exec(`git submodule status | awk '{ print $2 }'`);
    const submodulePaths = submoduleStatus
      .split('\n')
      .map(each => each.trim())
      .filter(each => !!each);
    result = await Promise.all(
      submodulePaths.map(async submodulePath => {
        const packagesPathEndWithSep = packagesPath.endsWith(path.sep) ? packagesPath : packagesPath + path.sep;
        const submoduleName = submodulePath.replace(new RegExp(`^${packagesPathEndWithSep}`), '');
        const submodulePackageJson = await getPackageJson(path.join(globalState.projectRootPath, submodulePath));
        return {
          name: submoduleName,
          path: submodulePath,
          packageJson: submodulePackageJson
        };
      })
    );

    return result;
  };
})();

type WalkStats = fs.Stats & {
  name: string;
};
function getAllTsFiles(rootPath: string): Promise<string[]> {
  return new Promise(resolve => {
    const walker = walk.walk(rootPath, { filters: [path.join(rootPath, 'node_modules'), path.join(rootPath, '.git')] });

    const filePaths: string[] = [];

    walker.on('file', (root: string, fileStats: WalkStats, next: () => void) => {
      const filePath = path.join(root, fileStats.name);
      const fileInfo = path.parse(filePath);

      if (fileInfo.ext === '.ts' || fileInfo.ext === '.tsx') {
        filePaths.push(filePath);
      }

      next();
    });

    walker.on('errors', (root: string, nodeStatsArray: WalkStats, next: () => void) => {
      next();
    });

    walker.on('end', () => {
      resolve(filePaths);
    });
  });
}

function createProgram(entryFilePaths: string[]) {
  return ts.createProgram(entryFilePaths, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.CommonJS
  });
}

async function getExternalImportsFromEntry(program: ts.Program, entryFilePath: string, importPaths: string[] = []) {
  const sourceFile = program.getSourceFile(entryFilePath);

  if (!sourceFile) {
    return;
  }

  const resolveModules = (sourceFile as any).resolvedModules;

  if (resolveModules) {
    Array.from<string>(resolveModules.keys()).forEach(importPath => {
      const resolveInfo = (sourceFile as any).resolvedModules.get(importPath);

      if (resolveInfo && !resolveInfo.isExternalLibraryImport) {
        // Find import file
        getExternalImportsFromEntry(program, resolveInfo.resolvedFileName, importPaths);
      } else if (!importPath.startsWith('./') && !importPath.startsWith('../')) {
        importPaths.push(importPath);
      }
    });
  }

  return importPaths;
}

export async function getExternalImportsFromProjectRoot(projectRootPath: string) {
  const packageJson = await getPackageJson(projectRootPath);
  const allTsFiles = await getAllTsFiles(projectRootPath);
  const entryFilePath = path.join(projectRootPath, packageJson.types || packageJson.typings);
  const program = createProgram(allTsFiles);
  return getExternalImportsFromEntry(program, entryFilePath);
}
