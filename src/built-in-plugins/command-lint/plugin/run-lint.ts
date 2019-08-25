import * as path from 'path';
import * as colors from 'colors';
import { spinner, logFatal, logSuccess, logInfo } from '../../../utils/log';
import { pri, srcPath } from '../../../node';
import { lint } from '../../../utils/lint';

export const CommandLint = async () => {
  await lint({
    lintAll: true,
    showBreakError: true,
    needFix: true,
  });
};
