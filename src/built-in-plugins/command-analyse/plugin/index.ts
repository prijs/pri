import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['analyse'],
  description: 'Analyse project node_modules structor.',
  action: async () => {
    const commandAnalyseModule = await import('./command-analyse');
    await commandAnalyseModule.commandAnalyse();
  }
});
