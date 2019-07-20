import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { pri } from '../../../node';
import { PRI_PACKAGE_NAME, CONFIG_FILE } from '../../../utils/constants';
import { safeJsonParse } from '../../../utils/functional';
import { globalState, transferToAllAbsolutePaths } from '../../../utils/global-state';
import { declarePath, gitIgnores, npmIgnores, tempPath, tempTypesPath, srcPath } from '../../../utils/structor-config';
import { ensureComponentFiles } from './ensure-component';
import { ensurePluginFiles } from './ensure-plugin';
import { ensureProjectFiles } from './ensure-project';
import { eslintParam } from '../../../utils/lint';
import { getDepsPackages } from '../../../utils/packages.js';
import { logFatal } from '../../../utils/log.js';

import yargs = require('yargs');

export const main = async () => {
  ensureGitignore();
  ensureNpmignore();
  ensureNpmrc();
  ensureTsconfig();
  ensureVscode();
  ensureEslint();
  ensureRootPackageJson();
  ensureSourcePackageJson();
  ensurePriConfig();

  ensureDeclares();

  switch (pri.sourceConfig.type) {
    case 'project':
      ensureProjectFiles();
      break;
    case 'component':
      ensureComponentFiles();
      break;
    case 'plugin':
      ensurePluginFiles();
      break;
    default:
  }
};

const commonComponentPackageJson = {
  scripts: {
    start: 'pri dev',
    docs: 'pri docs',
    build: 'pri build',
    bundle: 'pri bundle',
    preview: 'pri preview',
    analyse: 'pri analyse',
    test: 'pri test',
    format: `eslint --fix ${eslintParam}`
  },
  husky: {
    hooks: {
      'pre-commit': 'npm test -- --package root'
    }
  }
};

function ensureDeclares() {
  fs.copySync(path.join(__dirname, '../../../../declare'), path.join(pri.projectRootPath, declarePath.dir));
}

function ensureTsconfig() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, 'tsconfig.json'),
    pipeContent: async () => {
      return `${JSON.stringify(
        {
          compilerOptions: {
            module: 'esnext',
            moduleResolution: 'node',
            strict: true,
            strictNullChecks: false,
            jsx: 'react',
            target: 'esnext',
            experimentalDecorators: true,
            skipLibCheck: true,
            outDir: globalState.sourceConfig.distDir,
            baseUrl: '.',
            lib: ['dom', 'es5', 'es6', 'scripthost', 'es2018.promise'],
            emitDecoratorMetadata: true,
            preserveConstEnums: true,
            paths: {
              [`${PRI_PACKAGE_NAME}/*`]: [PRI_PACKAGE_NAME, path.join(tempTypesPath.dir, '*')],
              ...(pri.sourceConfig.type === 'project' && { 'src/*': ['src/*'] }),
              // Packages alias names
              ...globalState.packages.reduce((obj, eachPackage) => {
                if (eachPackage.packageJson && eachPackage.packageJson.name) {
                  return {
                    ...obj,
                    [eachPackage.packageJson.name]: [
                      path.join(path.relative(pri.projectRootPath, eachPackage.rootPath), 'src')
                    ]
                  };
                }
                return obj;
              }, {})
            }
          },
          include: [
            `${tempPath.dir}/**/*`,
            ...transferToAllAbsolutePaths(srcPath.dir).map(filePath => {
              return `${path.relative(pri.projectRootPath, filePath)}/**/*`;
            })
          ],
          exclude: ['node_modules', globalState.projectConfig.distDir]
        },
        null,
        2
      )}\n`; // Make sure ./src structor. # https://github.com/Microsoft/TypeScript/issues/5134
    }
  });
}

function ensureEslint() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, '.eslintrc'),
    pipeContent: async () => {
      const eslintConfig = await fs.readFile(path.join(__dirname, '../../../../.eslintrc'));

      return `${eslintConfig.toString()}\n`;
    }
  });
}

function ensureVscode() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, '.vscode/settings.json'),
    pipeContent: (prev: string) => {
      return `${JSON.stringify(
        _.merge({}, safeJsonParse(prev), {
          'editor.formatOnSave': true,
          'typescript.tsdk': 'node_modules/typescript/lib',
          'eslint.autoFixOnSave': true,
          'eslint.validate': [
            'javascript',
            'javascriptreact',
            { language: 'typescript', autoFix: true },
            { language: 'typescriptreact', autoFix: true }
          ],
          'eslint.provideLintTask': true,
          'typescript.format.enable': false,
          'javascript.format.enable': false
        }),
        null,
        2
      )}\n`;
    }
  });

  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, '.vscode/extensions.json'),
    pipeContent: (prev: string) => {
      return `${JSON.stringify(
        _.merge({}, safeJsonParse(prev), {
          recommendations: [
            'dbaeumer.vscode-eslint',
            'eamodio.gitlens',
            'zhuangtongfa.material-theme',
            'jasonhzq.vscode-pont'
          ]
        }),
        null,
        2
      )}\n`;
    }
  });
}

function ensureGitignore() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, '.gitignore'),
    pipeContent: (prev = '') => {
      const values = prev.split('\n').filter(eachRule => {
        return !!eachRule;
      });
      const gitIgnoresInRoot = gitIgnores.map(name => {
        return `/${name}`;
      });
      return _.union(values, gitIgnoresInRoot).join('\n');
    }
  });
}

function ensureNpmignore() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, '.npmignore'),
    pipeContent: (prev = '') => {
      const values = prev.split('\n').filter(eachRule => {
        return !!eachRule;
      });
      const npmIgnoresInRoot = npmIgnores.map(name => {
        return `/${name}`;
      });

      return _.union(values, npmIgnoresInRoot).join('\n');
    }
  });
}

function ensureNpmrc() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, '.npmrc'),
    pipeContent: () => {
      return `package-lock=${globalState.projectConfig.packageLock ? 'true' : 'false'}`;
    }
  });
}

async function ensureSourcePackageJson() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.sourceRoot, 'package.json'),
    pipeContent: async (prev: string) => {
      const prevJson = safeJsonParse(prev);
      const priDeps = prevJson.dependencies || {};

      if (pri.packages.length > 0) {
        const { depPackages, depNpmPackages } = await getDepsPackages();

        prevJson.dependencies = {
          ...priDeps,
          ...depPackages.reduce((root, next) => {
            if (!next.packageJson.version) {
              logFatal(
                `${pri.selectedSourceType} depend on ${next.name}, but missing "version" in ${next.name}'s package.json`
              );
            }

            return {
              ...root,
              [next.packageJson.name]: `^${next.packageJson.version}`
            };
          }, {})
        };

        if (pri.selectedSourceType !== 'root') {
          // Find depNpmPackages's version from rootPackageJson
          const projectPackageJsonDeps = (pri.projectPackageJson as any).dependencies || {};
          prevJson.dependencies = {
            ...prevJson.dependencies,
            ...depNpmPackages
              .filter(npmName => !['react', 'react-dom', 'antd'].includes(npmName))
              .reduce((root, next) => {
                if (!projectPackageJsonDeps[next]) {
                  logFatal(
                    `${pri.selectedSourceType}'s code depends on ${next}, but it doesn't exist in root package.json`
                  );
                }

                return {
                  ...root,
                  [next]: projectPackageJsonDeps[next]
                };
              }, {})
          };
        }
      }

      _.set(prevJson, 'main', `${pri.projectConfig.distDir}/main`);
      _.set(prevJson, 'module', `${pri.projectConfig.distDir}/module`);
      _.set(prevJson, 'types', 'declaration/index.d.ts');

      return `${JSON.stringify(_.merge({}, prevJson, commonComponentPackageJson), null, 2)}\n`;
    }
  });
}

function ensureRootPackageJson() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, 'package.json'),
    pipeContent: (prev: string) => {
      let prevJson = safeJsonParse(prev);

      const priDeps = pkg.dependencies || {};

      if (pri.sourceConfig.type === 'project') {
        // Remove all packages which already exists in pri dependencies.
        if (prevJson.dependencies) {
          prevJson.dependencies = _.omit(prevJson.dependencies, Object.keys(priDeps));
        }
        if (prevJson.devDependencies) {
          prevJson.devDependencies = _.omit(prevJson.devDependencies, Object.keys(priDeps));
        }
        if (prevJson.peerDependencies) {
          prevJson.peerDependencies = _.omit(prevJson.peerDependencies, Object.keys(priDeps));
        }
      } else {
        // Not project type, just reset it's version if exist.
        setVersionIfExist(prevJson, 'dependencies', priDeps);

        // Remove devDeps which already exists in pri dependencies.
        if (prevJson.devDependencies) {
          prevJson.devDependencies = _.omit(prevJson.devDependencies, Object.keys(priDeps));
        }
        if (prevJson.peerDependencies) {
          prevJson.peerDependencies = _.omit(prevJson.peerDependencies, Object.keys(priDeps));
        }
      }

      // Mv pri-plugins to devDeps except plugin
      if (pri.sourceConfig.type === 'plugin') {
        prevJson = mvPriPlugins(prevJson, 'devDependencies', 'dependencies');
        prevJson = mvPriPlugins(prevJson, 'peerDependencies', 'dependencies');
      } else {
        prevJson = mvPriPlugins(prevJson, 'dependencies', 'devDependencies');
        prevJson = mvPriPlugins(prevJson, 'peerDependencies', 'devDependencies');
      }

      switch (pri.sourceConfig.type) {
        case 'project':
          {
            // Move pri from devDeps to deps
            const projectPriVersion =
              _.get(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`) ||
              _.get(prevJson, `dependencies.${PRI_PACKAGE_NAME}`) ||
              pkg.version;
            _.unset(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`);
            _.set(prevJson, `dependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);
          }
          break;
        case 'plugin':
          {
            // Move pri from deps to devDeps
            const projectPriVersion =
              _.get(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`) ||
              _.get(prevJson, `dependencies.${PRI_PACKAGE_NAME}`) ||
              pkg.version;
            _.unset(prevJson, `dependencies.${PRI_PACKAGE_NAME}`);
            _.set(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

            _.set(prevJson, 'scripts.prepublishOnly', 'npm run build');

            // Add babel-runtime
            _.set(prevJson, 'dependencies.@babel/runtime', '^7.0.0');
          }
          break;
        case 'component':
          {
            // Move pri from deps to devDeps
            const projectPriVersion =
              _.get(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`) ||
              _.get(prevJson, `dependencies.${PRI_PACKAGE_NAME}`) ||
              pkg.version;
            _.unset(prevJson, `dependencies.${PRI_PACKAGE_NAME}`);
            _.set(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

            _.set(prevJson, 'scripts.prepublishOnly', 'npm run build && npm run bundle -- --skipLint');

            // Add babel-runtime
            _.set(prevJson, 'dependencies.@babel/runtime', '^7.0.0');
          }
          break;
        default:
      }

      switch (pri.sourceConfig.type) {
        case 'project':
        case 'plugin':
          _.set(prevJson, 'main', `${pri.projectConfig.distDir}/${pri.projectConfig.outFileName}`);
          break;
        case 'component':
          if (yargs.argv._[0] === 'dev') {
            // Component dev mode, has a whole project struct
            if (pri.selectedSourceType === 'root') {
              _.set(prevJson, 'main', `${pri.projectConfig.distDir}/main/src`);
              _.set(prevJson, 'module', `${pri.projectConfig.distDir}/module/src`);
            } else {
              _.set(prevJson, 'main', `${pri.projectConfig.distDir}/main/packages/${pri.selectedSourceType}/src`);
              _.set(prevJson, 'module', `${pri.projectConfig.distDir}/module/packages/${pri.selectedSourceType}/src`);
            }
          } else {
            _.set(prevJson, 'main', `${pri.projectConfig.distDir}/main`);
            _.set(prevJson, 'module', `${pri.projectConfig.distDir}/module`);
            _.set(prevJson, 'types', 'declaration/index.d.ts');
          }
          break;
        default:
      }

      return `${JSON.stringify(_.merge({}, prevJson, commonComponentPackageJson), null, 2)}\n`;
    }
  });
}

function ensurePriConfig() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, CONFIG_FILE),
    pipeContent: (prev: string) => {
      return `${JSON.stringify(
        _.merge({}, safeJsonParse(prev), {
          type: pri.sourceConfig.type
        }),
        null,
        2
      )}\n`;
    }
  });

  if (pri.selectedSourceType !== 'root') {
    pri.project.addProjectFiles({
      fileName: path.join(pri.sourceRoot, CONFIG_FILE),
      pipeContent: (prev: string) => {
        return `${JSON.stringify(
          _.merge({}, safeJsonParse(prev), {
            type: pri.sourceConfig.type
          }),
          null,
          2
        )}\n`;
      }
    });
  }
}

function setVersionIfExist(sourceObj: any, key: string, targetObj: any) {
  if (!_.isEmpty(_.get(sourceObj, key))) {
    Object.keys(_.get(sourceObj, key)).forEach(sourceObjKey => {
      if (targetObj[sourceObjKey]) {
        _.set(sourceObj, [key, sourceObjKey], targetObj[sourceObjKey]);
      }
    });
  }
}

function mvPriPlugins(obj: any, sourceKey: string, targetKey: string) {
  const newObj = { ...obj };

  if (!obj[sourceKey]) {
    newObj[sourceKey] = {};
  }

  if (!obj[targetKey]) {
    newObj[targetKey] = {};
  }

  const priPlugins = Object.keys(obj[sourceKey] || {}).filter(packageName => {
    return packageName.startsWith('pri-plugin') || packageName.startsWith('@ali/pri-plugin');
  });

  // Add plugins to targetKey
  priPlugins.forEach(packageName => {
    newObj[targetKey][packageName] = obj[sourceKey][packageName];
  });

  // Remove plugins from sourceKey
  newObj[sourceKey] = _.omit(obj[sourceKey], priPlugins);

  return newObj;
}
