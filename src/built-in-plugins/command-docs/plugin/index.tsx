import { pri } from '../../../node';
import { docsPath } from '../../../utils/structor-config';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['docs'],
  description: text.commander.docs.description,
  action: async () => {
    const devDocsModule = await import('./dev-docs');
    devDocsModule.devDocs(docsPath.dir);
  }
});
