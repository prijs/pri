import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import { componentEntry, docsPath, pri, srcPath } from '../../node';
import { prettierConfig } from '../../utils/prettier-config';
import { ensureTest } from './ensure-project';

export function ensureComponentFiles(instance: typeof pri) {
  ensurePackageJson(instance);
  ensureEntryFile(instance);
  ensureDocs(instance);
  ensureTest(instance);
}

export function ensurePackageJson(instance: typeof pri) {
  instance.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: prev => {
      const prevJson = JSON.parse(prev);
      return (
        JSON.stringify(
          _.merge({}, prevJson, {
            main: `${instance.projectConfig.distDir}/${srcPath.dir}/index.js`,
            types: path.format(componentEntry),
            dependencies: {
              '@babel/runtime': '^7.0.0'
            },
            scripts: {
              // FIXME: Don't know which cli to use.
              // publish: 'npm run build && npm publish'
            }
          }),
          null,
          2
        ) + '\n'
      );
    }
  });
}

const ensureEntryFile = (instance: typeof pri) =>
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

const ensureDocs = (instance: typeof pri) => {
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
};
