import { pri } from '../../../node';
import text from '../../../utils/text';
import { IOpts } from './interface';

pri.commands.registerCommand({
  name: ['bundle'],
  description: text.commander.bundle.description,
  options: {
    skipLint: {
      description: 'Skip lint'
    }
  },
  action: async (opts?: IOpts) => {
    const commandBundleModule = await import('./command-bundle');
    await commandBundleModule.commandBundle(opts);
  }
});
