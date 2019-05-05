import { lint } from '../../utils/lint';
import { plugin } from '../../utils/plugins';
import { ILintFilter } from '../../utils/define';

export { lint };

export const lintFilter = (callback: ILintFilter) => {
  plugin.lintFilters.push(callback);
};
