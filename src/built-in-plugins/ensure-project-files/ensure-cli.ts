import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import { cliEntry, componentEntry, docsPath, pri, srcPath } from '../../node';
import { prettierConfig } from '../../utils/prettier-config';
import { ensureTest } from './ensure-project';

export function ensureCliFiles(instance: typeof pri) {
  ensurePackageJson(instance);
  ensureEntryFile(instance);
  ensureTest(instance);
}

function ensurePackageJson(instance: typeof pri) {
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
