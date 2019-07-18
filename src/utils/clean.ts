import * as path from 'path';
import * as fs from 'fs-extra';
import { pri } from '../node';
import { globalState } from './global-state';

export async function cleanDist() {
  // Clean dist dir
  await fs.remove(path.join(globalState.projectRootPath, pri.sourceConfig.distDir));

  // Clean declaration if component
  if (pri.sourceConfig.type === 'component') {
    await fs.remove(path.join(pri.projectRootPath, 'declaration'));
  }
}
