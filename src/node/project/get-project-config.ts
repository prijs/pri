import { getConfig } from '../../utils/project-config';
import { getProjectRootPath } from './get-project-root-path';

export const getProjectConfig = (env: 'local' | 'prod') => {
  return getConfig(getProjectRootPath(), env);
};
