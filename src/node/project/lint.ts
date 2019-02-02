import { plugin } from '../../utils/plugins';
import { ILintFilter } from '../../utils/plugins-interface';
import { lint } from '../../utils/tslint';

export { lint };

export const lintFilter = (callback: ILintFilter) => {
  plugin.lintFilters.push(callback);
};
