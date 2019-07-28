import { pri } from '../../../node';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['dev'],
  options: {
    debugDashboard: {
      alias: 'd',
      description: 'Debug dashboard',
    },
  },
  description: text.commander.dev.description,
  action: async (options: any) => {
    switch (pri.sourceConfig.type) {
      case 'project': {
        const projectDevModule = await import('./project-dev');
        await projectDevModule.projectDev(options);
        break;
      }
      case 'component': {
        const componentDevModule = await import('./component-dev');
        await componentDevModule.componentDev();
        break;
      }
      case 'plugin': {
        const pluginDevModule = await import('./plugin-dev');
        await pluginDevModule.pluginDev();
        break;
      }
      default:
    }
  },
});
