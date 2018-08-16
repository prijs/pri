import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import { pri } from '../../node';
import { PRI_PACKAGE_NAME } from '../../utils/constants';
import { globalState } from '../../utils/global-state';
import { prettierConfig } from '../../utils/prettier-config';
import { ProjectConfig } from '../../utils/project-config-interface';
import {
  componentEntry,
  declarePath,
  docsPath,
  gitIgnores,
  npmIgnores,
  pagesPath,
  srcPath,
  tempTypesPath,
  testsPath
} from '../../utils/structor-config';

export function ensureDeclares(projectRootPath: string) {
  const declareAbsolutePath = path.join(projectRootPath, declarePath.dir);
  fs.copySync(path.join(__dirname, '../../../declare'), declareAbsolutePath);
}

export const ensurePrettierrc = () => ({
  fileName: '.prettierrc',
  pipeContent: () => JSON.stringify(prettierConfig, null, 2) + '\n'
});

export const ensureTsconfig = () => ({
  fileName: 'tsconfig.json',
  pipeContent: async () => {
    return (
      JSON.stringify(
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
            rootDir: './',
            baseUrl: '.',
            lib: ['dom', 'es5', 'es6', 'scripthost'],
            paths: { [PRI_PACKAGE_NAME + '/*']: [PRI_PACKAGE_NAME, path.join(tempTypesPath.dir, '*')] }
          },
          include: [
            '.temp/**/*',
            ['src/**/*', 'tests/**/*', 'docs/**/*'].map(each => path.join(globalState.projectConfig.sourceRoot, each))
          ],
          exclude: ['node_modules', globalState.projectConfig.distDir]
        },
        null,
        2
      ) + '\n'
    ); // Make sure ./src structor. # https://github.com/Microsoft/TypeScript/issues/5134
  }
});

export const ensureTslint = () => ({
  fileName: 'tslint.json',
  pipeContent: () =>
    JSON.stringify(
      {
        extends: ['tslint:latest', 'tslint-config-prettier'],
        defaultSeverity: 'error',
        rules: {
          'object-literal-sort-keys': false,
          'max-classes-per-file': [true, 5],
          'trailing-comma': [false],
          'no-string-literal': true,
          'arrow-parens': false,
          'no-var-requires': true,
          'prefer-conditional-expression': false,
          'no-implicit-dependencies': false,
          'no-object-literal-type-assertion': false,
          'no-submodule-imports': false,
          'no-empty': true
        }
      },
      null,
      2
    ) + '\n'
});

export const ensureVscode = () => ({
  fileName: '.vscode/settings.json',
  pipeContent: (prev: string) =>
    JSON.stringify(
      _.merge({}, prev ? JSON.parse(prev) : {}, {
        'editor.formatOnSave': true,
        'tslint.autoFixOnSave': true,
        'files.autoSave': 'afterDelay',
        'typescript.tsdk': 'node_modules/typescript/lib'
      }),
      null,
      2
    ) + '\n'
});

export const ensureGitignore = () => ({
  fileName: '.gitignore',
  pipeContent: () => gitIgnores.map(name => `/${name}`).join('\n')
});

export const ensureNpmignore = () => ({
  fileName: '.npmignore',
  pipeContent: () => npmIgnores.map(name => `/${name}`).join('\n')
});

export const ensurePackageJson = () => ({
  fileName: 'package.json',
  pipeContent: (prev: string) =>
    JSON.stringify(
      _.merge({}, prev ? JSON.parse(prev) : {}, {
        scripts: {
          start: 'pri dev',
          docs: 'pri docs',
          build: 'pri build',
          bundle: 'pri bundle',
          preview: 'pri preview',
          analyse: 'pri analyse',
          test: 'pri test',
          format: "tslint --fix './src/**/*.?(ts|tsx)' && prettier --write './src/**/*.?(ts|tsx)'"
        }
      }),
      null,
      2
    ) + '\n'
});

export const ensureTest = () => ({
  fileName: path.join(testsPath.dir, 'index.ts'),
  pipeContent: (prev: string) =>
    prev
      ? prev
      : prettier.format(
          `
      import test from "ava"

      test("Example", t => {
        t.true(true)
      })
    `,
          { ...prettierConfig, parser: 'typescript' }
        )
});

export default async (instance: typeof pri) => {
  instance.event.once('beforeEnsureFiles', () => {
    instance.project.addProjectFiles(ensureGitignore());

    instance.project.addProjectFiles(ensureNpmignore());

    instance.project.addProjectFiles(ensureTsconfig());

    instance.project.addProjectFiles(ensureVscode());

    instance.project.addProjectFiles(ensurePrettierrc());

    instance.project.addProjectFiles(ensureTslint());

    instance.project.addProjectFiles(ensurePackageJson());

    instance.project.addProjectFiles(ensureTest());

    ensureDeclares(instance.projectRootPath);

    if (instance.projectType === 'project') {
      const homePagePath = path.join(pagesPath.dir, 'index.tsx');
      const homePageAbsolutePath = path.join(instance.projectRootPath, homePagePath);
      const homeMarkdownPagePath = path.join(pagesPath.dir, 'index.md');
      const homeMarkdownPageAbsolutePath = path.join(instance.projectRootPath, homeMarkdownPagePath);

      if (!fs.existsSync(homePageAbsolutePath) && !fs.existsSync(homeMarkdownPageAbsolutePath)) {
        instance.project.addProjectFiles({
          fileName: homePagePath,
          pipeContent: () =>
            prettier.format(
              `
      import { isDevelopment } from "${PRI_PACKAGE_NAME}/client"
      import * as React from "react"

      class Props {

      }

      class State {

      }

      export default class Page extends React.PureComponent<Props, State> {
        public static defaultProps = new Props()
        public state = new State()

        public render() {
          return (
            <div>
              <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center"}}>
                Welcome to pri!
              </h1>
              <p style={{ padding: "10 50px" }}>
                Current env: {isDevelopment ? "local" : "prod"}
              </p>
            </div>
          )
        }
      }
    `,
              { ...prettierConfig, parser: 'typescript' }
            )
        });
      }
    } else if (instance.projectType === 'component') {
      instance.project.addProjectFiles({
        fileName: 'package.json',
        pipeContent: prev => {
          const prevJson = JSON.parse(prev);
          return (
            JSON.stringify(
              _.merge({}, prevJson, {
                main: `${instance.projectConfig.distDir}/${srcPath.dir}/index.js`,
                types: path.format(componentEntry),
                peerDependencies: {
                  react: '>=16.0.0',
                  'react-dom': '>=16.0.0'
                },
                dependencies: {
                  '@babel/runtime': '7.0.0-beta.56'
                },
                scripts: {
                  prepublishOnly: 'npm run build'
                }
              }),
              null,
              2
            ) + '\n'
          );
        }
      });

      // Create entry file
      instance.project.addProjectFiles({
        fileName: path.format(componentEntry),
        pipeContent: text =>
          text
            ? text
            : prettier.format(
                `
          import * as React from 'react'

          export default () => <div>My Component</div>
    `,
                { ...prettierConfig, parser: 'typescript' }
              )
      });

      // Create first demos
      const basicDocsPath = path.join(docsPath.dir, 'basic.tsx');
      const relativeToEntryPath = path.relative(
        path.parse(path.join(instance.projectRootPath, basicDocsPath)).dir,
        path.join(instance.projectRootPath, srcPath.dir, 'index')
      );
      instance.project.addProjectFiles({
        fileName: basicDocsPath,
        pipeContent: text =>
          text
            ? text
            : prettier.format(
                `
      import Component from "${relativeToEntryPath}"
      import * as React from "react"

      class Props {

      }

      class State {

      }

      export default class Page extends React.PureComponent<Props, State> {
        public static defaultProps = new Props()
        public state = new State()

        public render() {
          return (
            <Component />
          )
        }
      }
    `,
                { ...prettierConfig, parser: 'typescript' }
              )
      });
    }
  });
};
