import * as commander from 'commander';
import * as _ from 'lodash';
import * as path from 'path';
import { pri } from '../../node';
import { packagesPath } from './config';
import { getPackages } from './utils';

commander.command('packages', 'Packages manager.');

export default async (instance: typeof pri) => {
  const packages = await getPackages();

  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, path.format(file));
    return relativePath.startsWith(packagesPath);
  });

  instance.project.addProjectFiles({
    fileName: 'tsconfig.json',
    pipeContent: async prev => {
      const packagePaths = packages.reduce((obj: any, next) => {
        obj[next.name] = [next.path];
        return obj;
      }, {});

      const jsonData = prev ? JSON.parse(prev) : {};

      _.set(jsonData, 'compilerOptions.paths', { ..._.get(jsonData, 'compilerOptions.paths'), ...packagePaths });

      return JSON.stringify(jsonData, null, 2) + '\n';
    }
  });

  instance.build.pipeConfig(async config => {
    const packagePaths = packages.reduce((obj: any, next) => {
      obj[next.name] = path.join(
        instance.projectRootPath,
        next.path,
        next.packageJson.types || next.packageJson.typings
      );
      return obj;
    }, {});

    config.resolve.alias = { ...config.resolve.alias, ...packagePaths };

    return config;
  });

  instance.build.pipeTsInclude(includes => {
    includes.push(path.join(instance.projectRootPath, packagesPath));
    return includes;
  });

  instance.build.pipeLessInclude(includes => {
    includes.push(path.join(instance.projectRootPath, packagesPath));
    return includes;
  });

  instance.build.pipeSassInclude(includes => {
    includes.push(path.join(instance.projectRootPath, packagesPath));
    return includes;
  });
};
