import * as _ from 'lodash';
import * as path from 'path';
import * as prettier from 'prettier';
import { cliEntry, componentEntry, docsPath, pri, srcPath } from '../../node';
import { prettierConfig } from '../../utils/prettier-config';
import { ensurePackageJson } from './ensure-component';
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
