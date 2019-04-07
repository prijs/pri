import { pri } from '../../../node';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['init'],
  description: text.commander.init.description,
  action: async () => {
    const runInitModule = await import('./run-init');
    await runInitModule.runInit();
  }
});
