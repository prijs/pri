import { globalState } from '../utils/global-state';
import { tsPlusBabel } from '../utils/ts-plus-babel';

export default async () => {
  await tsPlusBabel(globalState.projectConfig.distDir);
};
