import * as path from 'path';
import { pri } from '../node';
import { exec } from './exec';
import { globalState } from './global-state';
import { findNearestNodemodulesFile } from './npm-finder';

export async function cleanDist() {
  // Clean dist dir
  await exec(
    `${findNearestNodemodulesFile('.bin/rimraf')} ${path.join(globalState.projectRootPath, pri.projectConfig.distDir)}`
  );
}
