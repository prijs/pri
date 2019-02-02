import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['packages', 'push [packageName] [message]'],
  description: `Push package.`,
  action: async options => {
    const { ensurePackagesLinks } = await import('../../../utils/packages');
    const { packagesPush } = await import('./run-push');

    await ensurePackagesLinks(true);
    await packagesPush(options.packageName, options.semver);
  }
});
