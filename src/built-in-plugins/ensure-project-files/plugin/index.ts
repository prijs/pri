import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { pri } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { safeJsonParse } from '../../../utils/functional';
import { globalState } from '../../../utils/global-state';
import { prettierConfig } from '../../../utils/prettier-config';
import { declarePath, gitIgnores, npmIgnores, tempPath, tempTypesPath } from '../../../utils/structor-config';
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
  ensurePrettierrc();
  ensureEslint();
  ensurePackageJson();

  ensureDeclares(pri.projectRootPath);

  switch (pri.projectPackageJson.pri.type) {
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

function ensureDeclares(projectRootPath: string) {
  const declareAbsolutePath = path.join(projectRootPath, declarePath.dir);
  fs.copySync(path.join(__dirname, '../../../../declare'), declareAbsolutePath);
}

function ensurePrettierrc() {
  pri.project.addProjectFiles({
    fileName: '.prettierrc',
    pipeContent: () => `${JSON.stringify(prettierConfig, null, 2)}\n`
  });
}

function ensureTsconfig() {
  pri.project.addProjectFiles({
    fileName: 'tsconfig.json',
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
            lib: ['dom', 'es5', 'es6', 'scripthost'],
            paths: {
              [`${PRI_PACKAGE_NAME}/*`]: [PRI_PACKAGE_NAME, path.join(tempTypesPath.dir, '*')],
              ...(pri.projectPackageJson.pri.type === 'project' && { '@/*': ['src/*'] })
            }
          },
          include: [
            `${tempPath.dir}/**/*`,
            ...['src/**/*'].map(each => path.join(globalState.projectConfig.sourceRoot, each))
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
    fileName: 'tsconfig.jest.json',
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
    fileName: '.eslintrc',
    pipeContent: () =>
      `${JSON.stringify(
        {
          parser: '@typescript-eslint/parser',
          parserOptions: {
            project: './tsconfig.json'
          },
          env: {
            jest: true,
            browser: true
          },
          settings: {
            react: {
              version: '16.8'
            },
            'import/resolver': {
              node: {
                extensions: ['.js', '.jsx', '.ts', '.tsx', '.eslintrc']
              },
              webpack: {
                config: {
                  resolve: {
                    alias: {
                      '@': 'src'
                    }
                  }
                }
              }
            }
          },
          plugins: ['@typescript-eslint', 'react-hooks'],
          extends: [
            'eslint:recommended',
            'plugin:@typescript-eslint/recommended',
            'plugin:react/recommended',
            'airbnb-base',
            'plugin:prettier/recommended',
            'prettier',
            'prettier/@typescript-eslint'
          ],
          rules: {
            'import/prefer-default-export': false,
            '@typescript-eslint/explicit-function-return-type': 0,
            '@typescript-eslint/interface-name-prefix': 0,
            'no-use-before-define': ['error', { functions: false }],
            '@typescript-eslint/no-use-before-define': 0,
            'class-methods-use-this': 0,
            'import/no-dynamic-require': false,
            'consistent-return': 0,
            'no-param-reassign': 'off',
            '@typescript-eslint/no-explicit-any': 0,
            'prefer-destructuring': 'off',
            'import/no-extraneous-dependencies': false,
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',
            'no-invalid-this': 'off',
            'react/display-name': false,
            'no-await-in-loop': 'off',
            'no-restricted-syntax': 'off',
            'array-callback-return': 'off',
            'global-require': 'off',
            '@typescript-eslint/no-var-requires': 0,
            'no-unused-vars': 0,
            'no-script-url': 'off',
            'import/no-unresolved': [0]
          }
        },
        null,
        2
      )}\n`
  });
}

function ensureVscode() {
  pri.project.addProjectFiles({
    fileName: '.vscode/settings.json',
    pipeContent: (prev: string) =>
      `${JSON.stringify(
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
      )}\n`
  });
}

function ensureGitignore() {
  pri.project.addProjectFiles({
    fileName: '.gitignore',
    pipeContent: (prev = '') => {
      const values = prev.split('\n').filter(eachRule => !!eachRule);
      const gitIgnoresInRoot = gitIgnores.map(name => `/${name}`);
      return _.union(values, gitIgnoresInRoot).join('\n');
    }
  });
}

function ensureNpmignore() {
  pri.project.addProjectFiles({
    fileName: '.npmignore',
    pipeContent: (prev = '') => {
      const values = prev.split('\n').filter(eachRule => !!eachRule);
      const npmIgnoresInRoot = npmIgnores.map(name => `/${name}`);

      if (pri.projectConfig.hideSourceCodeForNpm) {
        npmIgnoresInRoot.push('/src');
      }

      return _.union(values, npmIgnoresInRoot).join('\n');
    }
  });
}

function ensureNpmrc() {
  pri.project.addProjectFiles({
    fileName: '.npmrc',
    pipeContent: () => `package-lock=${globalState.projectConfig.packageLock ? 'true' : 'false'}`
  });
}

function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: (prev: string) => {
      const prevJson = safeJsonParse(prev);

      const priDeps = pkg.dependencies || {};

      if (pri.projectPackageJson.pri.type === 'project') {
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
        setVersionIfExist(prevJson, 'devDependencies', priDeps);
        setVersionIfExist(prevJson, 'peerDependencies', priDeps);
      }

      // Mv pri-plugins to devDeps except plugin
      if (pri.projectPackageJson.pri.type === 'plugin') {
        mvPriPlugins(prevJson, 'devDependencies', 'dependencies');
        mvPriPlugins(prevJson, 'peerDependencies', 'dependencies');
      } else {
        mvPriPlugins(prevJson, 'dependencies', 'devDependencies');
        mvPriPlugins(prevJson, 'peerDependencies', 'devDependencies');
      }

      return `${JSON.stringify(
        _.merge({}, prevJson, {
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
          pri: { type: pri.projectPackageJson.pri.type },
          husky: {
            hooks: {
              'pre-commit': 'npm test'
            }
          }
        }),
        null,
        2
      )}\n`;
    }
  });
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
  if (!obj[sourceKey]) {
    obj[sourceKey] = {};
  }

  if (!obj[targetKey]) {
    obj[targetKey] = {};
  }

  const priPlugins = Object.keys(obj[sourceKey]).filter(
    packageName => packageName.startsWith('pri-plugin') || packageName.startsWith('@ali/pri-plugin')
  );

  // Add plugins to targetKey
  priPlugins.forEach(packageName => {
    obj[targetKey][packageName] = obj[sourceKey][packageName];
  });

  // Remove plugins from sourceKey
  obj[sourceKey] = _.omit(obj[sourceKey], priPlugins);
}
