import { IProjectType } from '../utils/global-state-class';
import { plugin } from '../utils/plugins';

export const lockInitType = (initType: IProjectType) => {
  plugin.initType = initType;
};
