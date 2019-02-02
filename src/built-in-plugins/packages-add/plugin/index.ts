import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['packages', 'add [gitUri]'],
  description: 'Add remote package.',
  action: async options => {
    const addPackagesModule = await import('./run-add');
    await addPackagesModule.addPackages(options.gitUri);

    const packagesModule = await import('../../../utils/packages');
    await packagesModule.ensurePackagesLinks(false);
  }
});
