import { lint } from '../../../utils/lint';

export const CommandLint = async () => {
  await lint({
    lintAll: true,
    showBreakError: true,
    needFix: true,
    typeCheck: true,
  });
};
