import * as path from 'path';
import { pri } from '../../../node';
import { getPackages, packagesPath } from '../../../utils/packages';

export const initPackages = async () => {
  // Used for packages plugin register.
  const packages = await getPackages();

  pri.project.whiteFileRules.add(file => {
    const relativePath = path.relative(pri.projectRootPath, path.format(file));
    return relativePath.startsWith(packagesPath);
  });

  // pri.project.addProjectFiles({
  //   fileName: 'tsconfig.json',
  //   pipeContent: async prev => {
  //     const packagePaths = packages.reduce((obj: any, next) => {
  //       obj[next.name] = [next.path];
  //       return obj;
  //     }, {});

  //     const jsonData = safeJsonParse(prev);

  //     _.set(jsonData, 'compilerOptions.paths', { ..._.get(jsonData, 'compilerOptions.paths'), ...packagePaths });

  //     return `${JSON.stringify(jsonData, null, 2)}\n`;
  //   }
  // });

  pri.build.pipeConfig(async config => {
    const packagePaths = packages.reduce((obj: any, next) => {
      obj[next.name] = path.join(pri.projectRootPath, next.path, next.packageJson.types || next.packageJson.typings);
      return obj;
    }, {});

    config.resolve.alias = { ...config.resolve.alias, ...packagePaths };

    return config;
  });

  pri.build.pipeJsInclude(includes => {
    includes.push(path.join(pri.projectRootPath, packagesPath));
    return includes;
  });

  pri.build.pipeLessInclude(includes => {
    includes.push(path.join(pri.projectRootPath, packagesPath));
    return includes;
  });

  pri.build.pipeSassInclude(includes => {
    includes.push(path.join(pri.projectRootPath, packagesPath));
    return includes;
  });
};
