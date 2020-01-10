import { pri } from '../../../node';
import text from '../../../utils/text';
import { PublishOption } from './interface';

pri.commands.registerCommand({
  name: ['publish'],
  description: text.commander.publish.description,
  options: {
    tag: {
      description: 'npm tag',
    },
    bundle: {
      description: 'create bundle',
    },
    skipLint: {
      description: 'Skip lint',
    },
    skipNpm: {
      description: 'Skip npm publish',
    },
    semver: {
      description: 'Semver version: patch minor major',
    },
    private: {
      description: 'private publish',
    },
  },
  action: async (options: PublishOption) => {
    const commandPublishModule = await import('./run-publish');
    await commandPublishModule.publish(options);
  },
});
