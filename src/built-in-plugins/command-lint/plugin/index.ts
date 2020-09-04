import { pri } from '../../../node';
import text from '../../../utils/text';
import { logFatal } from '../../../utils/log';

export interface LintOption {
  def?: boolean;
}

pri.commands.registerCommand({
  name: ['lint'],
  description: text.commander.lint.description,
  options: {
    def: {
      description: 'lint on def, no git context',
    },
  },
  action: async (option: LintOption) => {
    try {
      const { CommandLint } = await import('./run-lint');
      await CommandLint(option);
    } catch (error) {
      logFatal(error);
    }
  },
});
