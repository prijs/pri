import * as _ from 'lodash';
import { pri } from '../../node';
import { logFatal } from '../../utils/log';
import text from '../../utils/text';
import { pluginDev } from './plugin-dev';
import { projectDev } from './project-dev';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['dev'],
    options: {
      debugDashboard: {
        alias: 'd',
        description: 'Debug dashboard'
      }
    },
    description: text.commander.dev.description,
    action: async (options: any) => {
      switch (instance.projectType) {
        case 'project':
          await projectDev(instance, options);
          break;
        case 'component':
          logFatal(`component not support 'npm start' yet, try 'npm run docs'!`);
        case 'cli':
          logFatal(`cli not support 'npm start' yet, try 'tsc -w'!`);
        case 'plugin':
          await pluginDev();
          break;
        default:
      }
    }
  });
};
