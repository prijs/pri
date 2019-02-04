import * as path from 'path';
import { componentEntry, pri } from '../../../node';
import { logFatal } from '../../../utils/log';
import { runWebpack } from '../../../utils/webpack';

export const commandBundle = async()=>{
  if (pri.projectPackageJson.pri.type !== 'component') {
    logFatal(`Only component support 'npm run bundle', try 'npm start'!`);
  }

  await pri.project.ensureProjectFiles();
  await pri.project.lint();
  await pri.project.checkProjectFiles();

  await runWebpack({
    mode: 'production',
    outFileName: pri.projectConfig.bundleFileName,
    entryPath: path.join(pri.projectRootPath, path.format(componentEntry)),
    pipeConfig: config => {
      config.output.libraryTarget = 'umd';
      return config;
    }
  });
}