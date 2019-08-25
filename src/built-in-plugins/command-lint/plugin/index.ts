import { pri } from '../../../node';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['lint'],
  description: text.commander.lint.description,
  action: async () => {
    const { CommandLint } = await import('./run-lint');
    await CommandLint();
  },
});
