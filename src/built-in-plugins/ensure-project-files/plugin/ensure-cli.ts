import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { cliEntry, docsPath, pri, srcPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { prettierConfig } from '../../../utils/prettier-config';
import { ensureTest } from './ensure-project';

export function ensureCliFiles() {
  ensurePackageJson();
  ensureEntryFile();
  ensureTest();
}

const ensureEntryFile = () =>
  pri.project.addProjectFiles({
    fileName: path.format(cliEntry),
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');
      return (
        '#!/usr/bin/env node\n\n' +
        prettier.format(
          `
        import { createCli } from 'pri';

        createCli();
      `,
          { ...prettierConfig, parser: 'typescript' }
        )
      );
    }
  });

export function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: prev => {
      const prevJson = prev ? JSON.parse(prev) : {};
      const projectPriVersion =
        _.get(prevJson, 'devDependencies.pri') || _.get(prevJson, 'dependencies.pri') || pkg.version;

      _.unset(prevJson, 'devDependencies.pri');
      _.set(prevJson, `dependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

      return (
        JSON.stringify(
          _.merge({}, prevJson, {
            main: `${pri.projectConfig.distDir}/index.js`,
            types: path.format(cliEntry),
            scripts: { prepublishOnly: 'npm run build' }
          }),
          null,
          2
        ) + '\n'
      );
    }
  });
}
