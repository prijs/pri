import * as _ from 'lodash';
import { pri } from '../../../node';

pri.commands.registerCommand({
  name: ['packages', 'publish [packageName] [semver]'],
  description: `Publish package.`,
  action: async options => {
    const { ensurePackagesLinks } = await import('../../../utils/packages');
    const { packagesPublish } = await import('./run-publish');

    await ensurePackagesLinks(true);
    await packagesPublish(options.packageName, options.semver);
  }
});
