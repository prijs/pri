import * as path from 'path';
import { pri } from '../../../node';
import { testsPath } from '../../../utils/structor-config';
import { typeChecker } from '../../../utils/type-checker';
import { IOpts } from './interface';

pri.project.whiteFileRules.add(file => {
  return path.format(file).startsWith(path.join(pri.projectRootPath, testsPath.dir));
});

pri.packages.forEach(eachPackage => {
  pri.project.whiteFileRules.add(file => {
    return path.format(file).startsWith(path.join(eachPackage.rootPath, testsPath.dir));
  });
});

pri.commands.registerCommand({
  name: ['test'],
  description: 'Run tests.',
  options: {
    skipLint: {
      description: 'Skip lint',
    },
  },
  action: async (options: IOpts) => {
    if (!options.skipLint) {
      await pri.project.lint({
        lintAll: false,
        needFix: true,
        showBreakError: true,
      });
      typeChecker();
    }

    await pri.project.ensureProjectFiles();
    await pri.project.checkProjectFiles();

    const runTestModule = await import('./run-test');
    runTestModule.runTest(options);
  },
});
