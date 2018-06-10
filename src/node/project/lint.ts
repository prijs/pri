import { ILintFilter, plugin } from '../../utils/plugins';
import { lint } from '../../utils/tslint';

export { lint };

export const lintFilter = (callback: ILintFilter) => {
  plugin.lintFilters.push(callback);
};
