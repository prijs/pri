import { pri } from '../../../node';
import text from '../../../utils/text';
import { PublishOption } from './interface';

pri.commands.registerCommand({
  name: ['publish'],
  description: text.commander.publish.description,
  options: {
    tag: {
      description: 'npm tag'
    }
  },
  action: async (options: PublishOption) => {
    const commandPublishModule = await import('./run-publish');
    await commandPublishModule.publish(options);
  }
});
