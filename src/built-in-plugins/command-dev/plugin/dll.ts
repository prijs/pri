import * as path from 'path';
import { globalState } from '../../../utils/global-state';

export const dllOutPath = path.join(globalState.projectRootPath, '.temp/static/dlls');
export const dllFileName = 'main.dll.js';
export const dllMainfestName = 'mainfest.json';
export const libraryStaticPath = `/dlls/${dllFileName}`;
