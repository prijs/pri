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
      description: 'Cloud build tag',
    },
    publicPath: {
      alias: 'p',
      description: 'Rewrite publicPath',
    },
    skipLint: {
      description: 'Skip lint',
    },
  },
  description: text.commander.build.description,
  action: async (options: IOpts) => {
    const buildModule = await import('./build');

    switch (pri.sourceConfig.type) {
      case 'project': {
        await buildModule.prepareBuild(options);
        await buildModule.buildProject(options);
        break;
      }
      case 'component': {
        await buildModule.prepareBuild(options);
        await buildModule.buildComponent();
        break;
      }
      case 'plugin': {
        await buildModule.prepareBuild(options);
        await buildModule.buildPlugin();
        break;
      }
      default:
    }
  },
});
