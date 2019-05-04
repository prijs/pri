import { pri } from '../../../node';
import { globalState } from '../../../utils/global-state';
import text from '../../../utils/text';
import { IOpts } from './interface';

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
      description: 'Rewrite publicPath'
    },
    skipLint: {
      description: 'Skip lint'
    }
  },
  description: text.commander.build.description,
  action: async (options: IOpts) => {
    switch (pri.sourceConfig.type) {
      case 'project': {
        const projectBuildModule = await import('./build');
        await projectBuildModule.buildProject(options);
        break;
      }
      case 'component': {
        const componentBuildModule = await import('./build');
        await componentBuildModule.buildComponent(options);
        break;
      }
      case 'plugin': {
        const pluginBuildModule = await import('./build');
        await pluginBuildModule.buildPlugin(options);
        break;
      }
      default:
    }
  }
});
