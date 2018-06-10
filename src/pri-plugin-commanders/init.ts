import { execSync, fork } from 'child_process';
import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import {
  ensureDeclares,
  ensureGitignore,
  ensurePrettierrc,
  ensureTsconfig,
  ensureTslint,
  ensureVscode
} from '../built-in-plugins/ensure-project-files';
import { ensureFile } from '../utils/ensure-files';
import { globalState } from '../utils/global-state';
import { log } from '../utils/log';
import { findNearestNodemodulesFile } from '../utils/npm-finder';
import { loadedPlugins } from '../utils/plugins';
import { ProjectConfig } from '../utils/project-config-interface';
import { tsBuiltPath } from '../utils/structor-config';
import { ensureEntry, ensureNpmIgnore, ensurePackageJson, ensureTest } from './utils/ensure-plugin-files';

export default async () => {
  ensureDeclares(globalState.projectRootPath);

  const ensurePrettierrcResult = ensurePrettierrc();
  ensureFile(ensurePrettierrcResult.fileName, [ensurePrettierrcResult.pipeContent]);

  const ensureTsconfigResult = ensureTsconfig();
  ensureFile(ensureTsconfigResult.fileName, [ensureTsconfigResult.pipeContent]);

  const ensureTslintResult = ensureTslint();
  ensureFile(ensureTslintResult.fileName, [ensureTslintResult.pipeContent]);

  const ensureVscodeResult = ensureVscode();
  ensureFile(ensureVscodeResult.fileName, [ensureVscodeResult.pipeContent]);

  const ensureGitignoreResult = ensureGitignore();
  ensureFile(ensureGitignoreResult.fileName, [ensureGitignoreResult.pipeContent]);

  ensurePackageJson();
  ensureNpmIgnore();
  ensureEntry();
  ensureTest();

  log('\n Success init pri plugin, you can run serval commands:\n');

  log(colors.blue('  npm start'));

  log(`    Run typescript watch.`);

  log(colors.blue('  npm run release'));

  log(`    Publish this plugin.`);

  log(colors.blue('  npm test'));

  log(`    Run test.`);
};
