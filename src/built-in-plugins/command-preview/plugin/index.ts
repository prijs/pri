import { pri } from '../../../node';
import text from '../../../utils/text';

pri.commands.registerCommand({
  name: ['preview'],
  description: text.commander.preview.description,
  action: async () => {
    const commandPreviewModule = await import('./run-preview');
    await commandPreviewModule.CommandPreview();
  }
});
