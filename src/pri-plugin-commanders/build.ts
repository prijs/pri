import { tsBuiltPath } from '../utils/structor-config';
import { tsPlusBabel } from '../utils/ts-plus-babel';

export default async (projectRootPath: string) => {
  await tsPlusBabel(projectRootPath, tsBuiltPath.dir);
};
