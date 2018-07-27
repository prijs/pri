import * as colors from 'colors';
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
import {
  ensureEntry,
  ensureEntryMethods,
  ensureNpmIgnore,
  ensurePackageJson,
  ensureTest
} from './utils/ensure-plugin-files';

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
  ensureEntryMethods();
  ensureTest();

  log('\n Success init pri plugin, you can run serval commands:\n');

  log(colors.blue('  npm start'));

  log(`    Run typescript watch.`);

  log(colors.blue('  npm run release'));

  log(`    Publish this plugin.`);

  log(colors.blue('  npm test'));

  log(`    Run test.`);
};
