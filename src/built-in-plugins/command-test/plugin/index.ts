import * as path from 'path';
import { pri } from '../../../node';
import { testsPath } from '../../../utils/structor-config';

pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, file.dir);
  return relativePath.startsWith(testsPath.dir);
});

pri.commands.registerCommand({
  name: ['test'],
  description: 'Run tests.',
  action: async () => {
    await pri.project.lint();
    await pri.project.ensureProjectFiles();
    await pri.project.checkProjectFiles();

    const runTestModule = await import('./run-test');
    runTestModule.runTest();
  }
});
