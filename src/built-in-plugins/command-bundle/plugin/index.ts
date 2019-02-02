import { pri } from '../../../node';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['bundle'],
  description: text.commander.bundle.description,
  action: async () => {
    const commandBundleModule = await import('./command-bundle');
    await commandBundleModule.commandBundle();
  }
});
