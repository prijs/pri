import { plugin } from '../utils/plugins';
import { ProjectType } from '../utils/define';

export const lockInitType = (initType: ProjectType) => {
  plugin.initType = initType;
};
