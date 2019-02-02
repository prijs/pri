import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['packages', 'update [packageName]'],
  description: `Update package.`,
  action: async options => {
    const { ensurePackagesLinks } = await import('../../../utils/packages');
    const { packagesUpdate } = await import('./run-update');

    await ensurePackagesLinks(true);
    await packagesUpdate(options.packageName);
  }
});
