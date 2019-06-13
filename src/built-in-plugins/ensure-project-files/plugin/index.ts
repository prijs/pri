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

pri.event.once('beforeEnsureFiles', async () => {
  ensureGitignore();
  ensureNpmignore();
  ensureNpmrc();
  ensureTsconfig();
  ensureJestTsconfig();
  ensureVscode();
  ensureEslint();
  ensurePackageJson();
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
});

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
            outDir: globalState.projectConfig.distDir,
            baseUrl: '.',
            lib: ['dom', 'es5', 'es6', 'scripthost', 'es2018.promise'],
            paths: {
              [`${PRI_PACKAGE_NAME}/*`]: [PRI_PACKAGE_NAME, path.join(tempTypesPath.dir, '*')],
              'src/*': ['src/*'],
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

function ensureJestTsconfig() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, 'tsconfig.jest.json'),
    pipeContent: async () => {
      return `${JSON.stringify(
        {
          extends: './tsconfig',
          compilerOptions: {
            module: 'commonjs'
          }
        },
        null,
        2
      )}\n`;
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
          'eslint.provideLintTask': true
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

function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, 'package.json'),
    pipeContent: (prev: string) => {
      let prevJson = safeJsonParse(prev);

      const priDeps = pkg.dependencies || {};

      if (pri.projectConfig.type === 'project') {
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
      if (pri.projectConfig.type === 'plugin') {
        prevJson = mvPriPlugins(prevJson, 'devDependencies', 'dependencies');
        prevJson = mvPriPlugins(prevJson, 'peerDependencies', 'dependencies');
      } else {
        prevJson = mvPriPlugins(prevJson, 'dependencies', 'devDependencies');
        prevJson = mvPriPlugins(prevJson, 'peerDependencies', 'devDependencies');
      }

      switch (pri.projectConfig.type) {
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

            _.set(prevJson, 'types', 'declaration/index.d.ts');

            _.set(prevJson, 'scripts.prepublishOnly', 'npm run build && npm run bundle --skipLint');

            // Add babel-runtime
            _.set(prevJson, 'dependencies.@babel/runtime', '^7.0.0');
          }
          break;
        default:
      }

      return `${JSON.stringify(
        _.merge({}, prevJson, {
          main: `${pri.projectConfig.distDir}/${pri.projectConfig.outFileName}`,
          scripts: {
            start: 'pri dev',
            docs: 'pri docs',
            build: 'pri build',
            bundle: 'pri bundle',
            preview: 'pri preview',
            analyse: 'pri analyse',
            test: 'pri test',
            format: `eslint ${eslintParam}`
          },
          husky: {
            hooks: {
              'pre-commit': 'npm run format && npm test -- --package root'
            }
          }
        }),
        null,
        2
      )}\n`;
    }
  });
}

function ensurePriConfig() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.projectRootPath, CONFIG_FILE),
    pipeContent: (prev: string) => {
      return `${JSON.stringify(
        _.merge({}, safeJsonParse(prev), {
          type: pri.projectConfig.type
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
