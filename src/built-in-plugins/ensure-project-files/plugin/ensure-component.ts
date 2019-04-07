import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { componentEntry, docsPath, pri, srcPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { safeJsonParse } from '../../../utils/functional';
import { prettierConfig } from '../../../utils/prettier-config';
import { ensureTest } from './ensure-project';

export function ensureComponentFiles() {
  ensurePackageJson();
  ensureEntryFile();
  ensureDocs();
  ensureTest();
}

export function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: prev => {
      const prevJson = safeJsonParse(prev);
      const projectPriVersion =
        _.get(prevJson, 'devDependencies.pri') || _.get(prevJson, 'dependencies.pri') || pkg.version;

      _.unset(prevJson, 'dependencies.pri');
      _.set(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

      const types = pri.projectConfig.hideSourceCodeForNpm ? 'declaration/index.d.ts' : path.format(componentEntry);

      return `${JSON.stringify(
        _.merge({}, prevJson, {
          main: `${pri.projectConfig.distDir}/${pri.projectConfig.outFileName}`,
          scripts: { prepublishOnly: 'npm run build && npm run bundle --skipLint' },
          types,
          dependencies: {
            '@babel/runtime': '^7.0.0'
          }
        }),
        null,
        2
      )}\n`;
    }
  });
}

function ensureEntryFile() {
  pri.project.addProjectFiles({
    fileName: path.format(componentEntry),
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');
      return prettier.format(
        `
  import * as React from 'react'
  export default () => <div>My Component</div>
`,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}

function ensureDocs() {
  const basicDocsPath = path.join(docsPath.dir, 'basic.tsx');
  const relativeToEntryPath = path.relative(
    path.parse(path.join(pri.projectRootPath, basicDocsPath)).dir,
    path.join(pri.projectRootPath, srcPath.dir, 'index')
  );
  pri.project.addProjectFiles({
    fileName: basicDocsPath,
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');
      return prettier.format(
        `
          import Component from "${relativeToEntryPath}"
          import * as React from "react"

          export default const Page = () => <Component />
        `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}
