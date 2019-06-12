import * as path from 'path';
import { pri } from '../../../node';

// mocks
const whiteList = ['mocks'];
pri.project.whiteFileRules.add(file => {
  return whiteList.some(whiteName => {
    return path.format(file) === path.join(pri.projectRootPath, whiteName);
  });
});

// mocks/**/*.ts
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, file.dir);
  return relativePath === 'mocks' && file.ext === '.ts';
});

pri.project.onAnalyseProject(async files => {
  const mockFilesPath = files
    .filter(file => {
      return file.dir === path.join(pri.projectRootPath, 'mocks');
    })
    .map(file => {
      return path.format(file);
    });

  const compileMockModule = await import('./compile-mock');
  compileMockModule.onAnalyseProject(mockFilesPath);
});
