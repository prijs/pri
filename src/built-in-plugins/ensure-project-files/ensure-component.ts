import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import * as pkg from '../../../package.json';
import { componentEntry, docsPath, pri, srcPath } from '../../node';
import { PRI_PACKAGE_NAME } from '../../utils/constants';
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
      const prevJson = prev ? JSON.parse(prev) : {};
      const projectPriVersion =
        _.get(prevJson, 'devDependencies.pri') || _.get(prevJson, 'dependencies.pri') || pkg.version;

      _.unset(prevJson, 'dependencies.pri');
      _.set(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

      return (
        JSON.stringify(
          _.merge({}, prevJson, {
            main: `${instance.projectConfig.distDir}/index.js`,
            types: path.format(componentEntry),
            scripts: { prepublishOnly: 'npm run build' },
            dependencies: {
              '@babel/runtime': '^7.0.0'
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
