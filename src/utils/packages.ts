import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as glob from 'glob';
import { exec } from './exec';
import { getPackageJson } from './file-operate';
import { globalState } from './global-state';
import { PackageJson, PackageInfo } from './define';
import { srcPath } from '../node';

export const packagesPath = 'packages';

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
      'dir'
    );

    // linkRootNodeModulesToEveryPackages
    await fs.ensureSymlink(
      path.join(globalState.projectRootPath, 'node_modules'),
      path.join(globalState.projectRootPath, packageInfo.path, 'node_modules'),
      'dir'
    );
  }
}

export async function getDepsPackages() {
  if (globalState.packages.length > 0) {
    const ts = await import('typescript');
    const tsFiles = glob.sync(path.join(globalState.sourceRoot, srcPath.dir, '**/*.{ts,tsx}'));
    const depPackages = new Set<PackageInfo>();
    const depNpmPackages = new Set<string>();

    tsFiles.forEach(tsFile => {
      const sourceFile = ts.createSourceFile(tsFile, fs.readFileSync(tsFile).toString(), ts.ScriptTarget.ESNext);

      sourceFile.statements.forEach(statement => {
        if ([ts.SyntaxKind.ImportDeclaration, ts.SyntaxKind.ExportDeclaration].includes(statement.kind)) {
          statement.forEachChild(each => {
            if (each.kind === ts.SyntaxKind.StringLiteral) {
              const importStringLiteral = _.trim(each.getText(sourceFile), `'"`);
              const targetPackage = globalState.packages.find(
                eachPackage => eachPackage.packageJson && eachPackage.packageJson.name === importStringLiteral
              );
              if (targetPackage) {
                depPackages.add(targetPackage);
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

    return { depPackages: Array.from(depPackages), depNpmPackages: Array.from(depNpmPackages) };
  }

  return { depPackages: [] as PackageInfo[], depNpmPackages: [] as string[] };
}
