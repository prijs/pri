import * as fs from 'fs-extra';
import * as path from 'path';
import { pri } from '../../../node';
import { CONFIG_FILE } from '../../../utils/constants';

// config
const whiteList = ['config'];
pri.project.whiteFileRules.add(file => {
  return whiteList.some(whiteName => {
    return path.format(file) === path.join(pri.projectRootPath, whiteName);
  });
});

// config/config.default|local|prod.ts
pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, file.dir);
  return (
    relativePath === 'config' &&
    file.ext === '.ts' &&
    (file.name === 'config.default' || file.name === 'config.local' || file.name === 'config.prod')
  );
});

pri.project.onAnalyseProject(() => {
  return {
    projectAnalyseConfig: {
      hasConfig: fs.existsSync(path.join(pri.projectRootPath, CONFIG_FILE)),
    },
  };
});
