import * as fs from 'fs-extra';
import * as _ from 'lodash';
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
    pri?: {
      type: 'project' | 'component' | 'plugin';
    };
  }> = null;

  // Ensure run once in each command.
  return async function foo(useCache = true) {
    if (useCache && result) {
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

    result = result.filter(eachResult => !_.isEmpty(eachResult.packageJson));

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

async function getExternalImportsFromEntrys(program: ts.Program, entryFilePaths: string[]) {
  return entryFilePaths.reduce(async (allImportPathsPromise, entryFilePath) => {
    let allImportPaths = await allImportPathsPromise;
    allImportPaths = allImportPaths.concat(await getExternalImportsFromEntry(program, entryFilePath));
    return allImportPaths;
  }, Promise.resolve([]));
}

async function getExternalImportsFromEntry(
  program: ts.Program,
  entryFilePath: string,
  importPaths: string[] = [],
  handledEntryFilePaths: string[] = []
) {
  if (handledEntryFilePaths.some(handledEntryFilePath => handledEntryFilePath === entryFilePath)) {
    // Ignore handled file.
    return;
  } else {
    handledEntryFilePaths.push(entryFilePath);
  }

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
        getExternalImportsFromEntry(program, resolveInfo.resolvedFileName, importPaths, handledEntryFilePaths);
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
  const entryRelativePath = packageJson.types || packageJson.typings;
  const program = createProgram(allTsFiles);

  if (entryRelativePath) {
    // Only one entry declared in package.json types | typings
    const entryFilePath = path.join(projectRootPath, packageJson.types || packageJson.typings);
    return getExternalImportsFromEntrys(program, [entryFilePath]);
  } else {
    // All ts files is entry
    return getExternalImportsFromEntrys(program, allTsFiles);
  }
}

export async function resetSymlinkForPackages(useCache: boolean) {
  const packages = await getPackages(useCache);

  for (const packageInfo of packages) {
    await fs.ensureSymlink(
      path.join(globalState.projectRootPath, packageInfo.path),
      path.join(globalState.projectRootPath, 'node_modules', packageInfo.name),
      'dir'
    );
  }
}
