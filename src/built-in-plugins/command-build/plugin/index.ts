import { pri } from '../../../node';
import { globalState } from '../../../utils/global-state';
import text from '../../../utils/text';

pri.project.onCreateEntry((analyseInfo, entry) => {
  if (!pri.isDevelopment) {
    entry.pipeEnvironmentBody(envText => {
      return `
          ${envText}
          priStore.globalState = ${JSON.stringify(globalState)}
        `;
    });
  }
});

pri.commands.registerCommand({
  name: ['build'],
  options: {
    cloud: {
      alias: 'c',
      description: 'Cloud build tag'
    },
    publicPath: {
      alias: 'p',
      description: 'rewrite publicPath'
    }
  },
  description: text.commander.build.description,
  action: async (options: any) => {
    switch (pri.projectPackageJson.pri.type) {
      case 'project':
        const projectBuildModule = await import('./build');
        await projectBuildModule.buildProject(options);
        break;
      case 'component':
        const componentBuildModule = await import('./build');
        await componentBuildModule.buildComponent();
        break;
      case 'plugin':
      case 'cli':
        const pluginBuildModule = await import('./build');
        await pluginBuildModule.buildPlugin();
      default:
    }
  }
});
