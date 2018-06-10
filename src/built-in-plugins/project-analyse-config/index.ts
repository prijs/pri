import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../node';
import { CONFIG_FILE } from '../../utils/constants';
import { md5 } from '../../utils/md5';

interface IResult {
  projectAnalyseConfig: {
    hasConfig: boolean;
  };
}

export default async (instance: typeof pri) => {
  // config
  const whiteList = ['config'];
  instance.project.whiteFileRules.add(file => {
    return whiteList.some(whiteName => path.format(file) === path.join(instance.projectRootPath, whiteName));
  });

  // config/config.default|local|prod.ts
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return (
      relativePath === 'config' &&
      file.ext === '.ts' &&
      (file.name === 'config.default' || file.name === 'config.local' || file.name === 'config.prod')
    );
  });

  instance.project.onAnalyseProject(files => {
    return {
      projectAnalyseConfig: {
        hasConfig: fs.existsSync(path.join(instance.projectRootPath, CONFIG_FILE))
      }
    } as IResult;
  });
};
