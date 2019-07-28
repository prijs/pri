import { pri } from '../../../node';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['docs'],
  description: text.commander.docs.description,
  action: async () => {
    const devDocsModule = await import('./dev-docs');
    devDocsModule.devDocs();
  },
});
