import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import { pri } from '../../node';
import { ProjectConfig } from '../../utils/project-config-interface';
import {
  declarePath,
  gitIgnores,
  npmIgnores,
  pagesPath,
  srcPath,
  tempTypesPath,
  tsBuiltPath
} from '../../utils/structor-config';

export function ensureDeclares(projectRootPath: string) {
  const declareAbsolutePath = path.join(projectRootPath, declarePath.dir);
  fs.copySync(path.join(__dirname, '../../../declare'), declareAbsolutePath);
}

export const ensurePrettierrc = () => ({
  fileName: '.prettierrc',
  pipeContent: () =>
    JSON.stringify(
      {
        bracketSpacing: true,
        printWidth: 120,
        proseWrap: 'never',
        requirePragma: false,
        semi: true,
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'none',
        useTabs: false,
        overrides: [{ files: '*.json', options: { printWidth: 200 } }]
      },
      null,
      2
    ) + '\n'
});

export const ensureTsconfig = () => ({
  fileName: 'tsconfig.json',
  pipeContent: () =>
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
          outDir: tsBuiltPath.dir,
          rootDir: './', // Make sure ./src structor. # https://github.com/Microsoft/TypeScript/issues/5134
          baseUrl: '.',
          lib: ['dom', 'es5', 'es6', 'scripthost'],
          paths: { 'pri/*': ['pri', path.join(tempTypesPath.dir, '*')] }
        },
        include: ['.temp/**/*', 'src/**/*', 'config/**/*', 'tests/**/*'],
        exclude: ['node_modules', tsBuiltPath.dir]
      },
      null,
      2
    ) + '\n'
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
          'no-string-literal': false,
          'arrow-parens': false,
          'no-var-requires': false,
          'prefer-conditional-expression': false,
          'no-implicit-dependencies': false,
          'no-object-literal-type-assertion': false,
          'no-submodule-imports': false,
          'no-empty': false
        }
      },
      null,
      2
    ) + '\n'
});

export const ensureVscode = () => ({
  fileName: '.vscode/settings.json',
  pipeContent: () =>
    JSON.stringify(
      {
        'editor.formatOnPaste': true,
        'editor.formatOnType': true,
        'editor.formatOnSave': true,
        'typescript.tsdk': 'node_modules/typescript/lib'
      },
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
  pipeContent: (prev: string) => {
    const prevJson = JSON.parse(prev);
    return (
      JSON.stringify(
        _.merge({}, prevJson, {
          scripts: {
            start: 'pri dev',
            build: 'pri build',
            preview: 'pri preview',
            analyse: 'pri analyse',
            test: 'pri test'
          }
        }),
        null,
        2
      ) + '\n'
    );
  }
});

export const ensureTest = () => ({
  fileName: 'tests/index.ts',
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
          { semi: true, singleQuote: true, parser: 'typescript' }
        )
});

export default async (instance: typeof pri) => {
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
      import { env } from "pri/client"
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
                Current env: {env.isLocal && "local"}{env.isProd && "prod"}
              </p>
            </div>
          )
        }
      }
    `,
            { semi: true, singleQuote: true, parser: 'typescript' }
          )
      });
    }
  } else {
    instance.project.addProjectFiles({
      fileName: 'package.json',
      pipeContent: prev => {
        const prevJson = JSON.parse(prev);
        return (
          JSON.stringify(
            _.merge({}, prevJson, {
              main: `${instance.projectConfig.distDir}/${srcPath.dir}/index.js`,
              types: `${srcPath.dir}/index.tsx`,
              scripts: {
                publish: 'npm run build && npm publish'
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
      fileName: `${srcPath.dir}/index.tsx`,
      pipeContent: text =>
        text
          ? text
          : prettier.format(
              `
          import * as React from 'react'

          export default () => <div>My Component</div>
    `,
              { semi: true, singleQuote: true, parser: 'typescript' }
            )
    });

    // Create first demos
    const basicDocsPath = path.join(pagesPath.dir, 'basic/index.tsx');
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
              { semi: true, singleQuote: true, parser: 'typescript' }
            )
    });
  }
};
