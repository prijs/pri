import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['packages', 'rm [gitUri]'],
  description: `Remove remote package(Won't delete it).`,
  action: async options => {
    const { ensurePackagesLinks } = await import('../../../utils/packages');
    const { packagesRemove } = await import('./run-remove');

    await packagesRemove(options.gitUri);
    await ensurePackagesLinks(false);
  }
});
