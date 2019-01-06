import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import * as pkg from '../../../package.json';
import { cliEntry, componentEntry, docsPath, pri, srcPath } from '../../node';
import { PRI_PACKAGE_NAME } from '../../utils/constants';
import { prettierConfig } from '../../utils/prettier-config';
import { ensureTest } from './ensure-project';

export function ensureCliFiles(instance: typeof pri) {
  ensurePackageJson(instance);
  ensureEntryFile(instance);
  ensureTest(instance);
}

const ensureEntryFile = (instance: typeof pri) =>
  instance.project.addProjectFiles({
    fileName: path.format(cliEntry),
    pipeContent: text =>
      text
        ? text
        : '#!/usr/bin/env node\n\n' +
          prettier.format(
            `
            import { createCli } from 'pri';

            createCli();
          `,
            { ...prettierConfig, parser: 'typescript' }
          )
  });

export function ensurePackageJson(instance: typeof pri) {
  instance.project.addProjectFiles({
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
            main: `${instance.projectConfig.distDir}/index.js`,
            types: path.format(componentEntry)
          }),
          null,
          2
        ) + '\n'
      );
    }
  });
}
