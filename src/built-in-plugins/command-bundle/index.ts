import * as path from 'path';
import { componentEntry, pri } from '../../node';
import text from '../../utils/text';
import { runWebpack } from '../../utils/webpack';

async function bundle(instance: typeof pri) {
  await instance.project.ensureProjectFiles();
  await instance.project.lint();
  await instance.project.checkProjectFiles();

  await runWebpack({
    mode: 'production',
    outFileName: instance.projectConfig.bundleFileName,
    entryPath: path.join(instance.projectRootPath, path.format(componentEntry)),
    pipeConfig: config => {
      config.output.libraryTarget = 'umd';
      return config;
    }
  });
}

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['bundle'],
    description: text.commander.bundle.description,
    action: async () => {
      await bundle(instance);
    }
  });
};
