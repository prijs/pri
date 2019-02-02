import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['packages', 'docs [packageName]'],
  description: 'Develop package docs.',
  action: async options => {
    const { ensurePackagesLinks } = await import('../../../utils/packages');
    const { packagesDocs } = await import('./run-docs');

    await ensurePackagesLinks(true);
    await packagesDocs(options.packageName);
  }
});
