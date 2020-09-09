import { lint } from '../../../utils/lint';
import { LintOption } from './index';

export const CommandLint = async (opt: LintOption) => {
  if (opt.def) {
    await lint({
      lintAll: true,
      showBreakError: true,
      needFix: false,
      typeCheck: false,
    });
  } else {
    await lint({
      lintAll: true,
      showBreakError: true,
      needFix: true,
      typeCheck: true,
    });
  }
};
