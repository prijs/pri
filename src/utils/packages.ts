import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as glob from 'glob';
import { exec } from './exec';
import { getPackageJson } from './file-operate';
import { globalState } from './global-state';
import { PackageJson, PackageInfo } from './define';
import { srcPath } from '../node';
import { logFatal } from './log';
import { packagesPath } from './structor-config';

export const getPackages = (() => {
  let result: {
    name: string;
    path: string;
    packageJson: PackageJson;
    pri?: {
      type: 'project' | 'component' | 'plugin';
    };
  }[] = null;

  // Ensure run once in each command.
  return async function foo(useCache = true) {
    if (useCache && result) {
      return result;
    }

    const submoduleStatus = await exec("git submodule status | awk '{ print $2 }'");
    const submodulePaths = submoduleStatus
      .split('\n')
      .map(each => {
        return each.trim();
      })
      .filter(each => {
        return !!each;
      });
    result = await Promise.all(
      submodulePaths.map(async submodulePath => {
        const packagesPathEndWithSep = packagesPath.dir.endsWith(path.sep)
          ? packagesPath.dir
          : packagesPath.dir + path.sep;
        const submoduleName = submodulePath.replace(new RegExp(`^${packagesPathEndWithSep}`), '');
        const submodulePackageJson = await getPackageJson(path.join(globalState.projectRootPath, submodulePath));
        return {
          name: submoduleName,
          path: submodulePath,
          packageJson: submodulePackageJson,
        };
      }),
    );

    result = result.filter(eachResult => {
      return !_.isEmpty(eachResult.packageJson);
    });

    return result;
  };
})();

export async function ensurePackagesLinks(useCache: boolean) {
  const packages = await getPackages(useCache);

  for (const packageInfo of packages) {
    // linkEveryPackagesToRootNodeModules
    await fs.ensureSymlink(
      path.join(globalState.projectRootPath, packageInfo.path),
      path.join(globalState.projectRootPath, 'node_modules', packageInfo.name),
      'dir',
    );

    // linkRootNodeModulesToEveryPackages
    await fs.ensureSymlink(
      path.join(globalState.projectRootPath, 'node_modules'),
      path.join(globalState.projectRootPath, packageInfo.path, 'node_modules'),
      'dir',
    );
  }
}

export type DepMap = Map<
  string,
  {
    depMonoPackages: PackageInfo[];
    depNpmPackages: string[];
  }
>;

export const getMonoAndNpmDepsOnce = _.once(getMonoAndNpmDeps);

async function getMonoAndNpmDeps() {
  if (globalState.packages.length > 0) {
    // Get all dep maps
    const depMap: DepMap = new Map();

    depMap.set(
      'root',
      await getMonoAndNpmDepsByPath(path.join(globalState.projectRootPath, srcPath.dir, '**/*.{ts,tsx}')),
    );

    for (const eachPackage of globalState.packages) {
      depMap.set(
        eachPackage.name,
        await getMonoAndNpmDepsByPath(path.join(eachPackage.rootPath, srcPath.dir, '**/*.{ts,tsx}')),
      );
    }

    const selectedDepMonoPackages = depMap.get(globalState.selectedSourceType).depMonoPackages;
    const selectedDepNpmPackages = depMap.get(globalState.selectedSourceType).depNpmPackages;

    const monoDepASC = getMonoDepASC(depMap);

    // Sort selectedDepMonoPackages by deps DESC
    selectedDepMonoPackages.sort((left, right) => {
      return monoDepASC.findIndex(name => name === left.name) - monoDepASC.findIndex(name => name === right.name);
    });

    return { depMonoPackages: selectedDepMonoPackages, depNpmPackages: selectedDepNpmPackages, depMap };
  }

  return { depMonoPackages: [] as PackageInfo[], depNpmPackages: [] as string[], depMap: null };
}

function getMonoDepASC(depMap: DepMap) {
  const newMap = _.cloneDeep(depMap);

  const monoDepASC: string[] = [];

  // delete root, because it cannot participate in dependency analysis
  newMap.delete('root');

  // Get mono sort by deps DESC
  while (newMap.size > 0) {
    let zeroMonoDepsPackageName: string = null;
    newMap.forEach((value, key) => {
      if (value.depMonoPackages.length === 0) {
        zeroMonoDepsPackageName = key;
      }
    });

    if (zeroMonoDepsPackageName === null) {
      logFatal(`Cyclic dependence happend!`);
    }

    monoDepASC.push(zeroMonoDepsPackageName);

    newMap.delete(zeroMonoDepsPackageName);

    newMap.forEach(value => {
      const zeroMonoDepsPackageCurrentIndex = value.depMonoPackages.findIndex(
        eachPackage => eachPackage.name === zeroMonoDepsPackageName,
      );
      if (zeroMonoDepsPackageCurrentIndex > -1) {
        value.depMonoPackages.splice(zeroMonoDepsPackageCurrentIndex, 1);
      }
    });
  }

  return monoDepASC;
}

export async function getMonoAndNpmDepsByPath(rootPath: string) {
  const ts = await import('typescript');
  const tsFiles = glob.sync(rootPath);
  const depMonoPackages = new Set<PackageInfo>();
  const depNpmPackages = new Set<string>();

  tsFiles.forEach(tsFile => {
    const sourceFile = ts.createSourceFile(tsFile, fs.readFileSync(tsFile).toString(), ts.ScriptTarget.ESNext);

    sourceFile.statements.forEach(statement => {
      if ([ts.SyntaxKind.ImportDeclaration, ts.SyntaxKind.ExportDeclaration].includes(statement.kind)) {
        statement.forEachChild(each => {
          if (each.kind === ts.SyntaxKind.StringLiteral) {
            const importStringLiteral = _.trim(each.getText(sourceFile), `'"`);
            const targetPackage = globalState.packages.find(
              eachPackage => eachPackage.packageJson && eachPackage.packageJson.name === importStringLiteral,
            );
            if (targetPackage) {
              depMonoPackages.add(targetPackage);
            } else if (!importStringLiteral.startsWith('.')) {
              const importStringLiteralSplit = importStringLiteral.split('/');
              if (importStringLiteralSplit[0].startsWith('@')) {
                if (importStringLiteralSplit.length > 1) {
                  depNpmPackages.add(`${importStringLiteralSplit[0]}/${importStringLiteralSplit[1]}`);
                } else {
                  depNpmPackages.add(importStringLiteralSplit[0]);
                }
              } else {
                depNpmPackages.add(importStringLiteralSplit[0]);
              }
            }
          }
        });
      }
    });
  });

  return { depMonoPackages: Array.from(depMonoPackages), depNpmPackages: Array.from(depNpmPackages) };
}
