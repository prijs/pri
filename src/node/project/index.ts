import { plugin } from '../../utils/plugins';
import { checkProjectFiles } from './check-project-files';
import { lint, lintFilter } from './lint';
import * as whiteFileRules from './white-file-rules';
import { IAnalyseProject, ICreateEntry } from '../../utils/define';

export { ensureProjectFiles, addProjectFiles } from './on-ensure-project-files';

/**
 * Each time, scan this project's files.
 */
export const onAnalyseProject = (fn: IAnalyseProject) => {
  plugin.projectAnalyses.push(fn);
};

export const onCreateEntry = (fn: ICreateEntry) => {
  plugin.projectCreateEntrys.push(fn);
};

export { whiteFileRules };
export { lint, lintFilter };
export { checkProjectFiles };
