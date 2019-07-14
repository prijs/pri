import * as fs from 'fs-extra';
import * as path from 'path';
import { globalState } from '../utils/global-state';

export async function cleanUncessaryFields() {
  await fs.remove(path.join(globalState.projectRootPath, '.prettierrc'));
  await fs.remove(path.join(globalState.projectRootPath, 'tsconfig.jest.json'));
}
