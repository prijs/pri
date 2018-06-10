import { ensureFiles } from '../../utils/ensure-files';
import { globalState } from '../../utils/global-state';
import { IEnsureProjectFilesQueue, plugin } from '../../utils/plugins';
import { ProjectConfig } from '../../utils/project-config-interface';

export function addProjectFiles(info: IEnsureProjectFilesQueue) {
  plugin.ensureProjectFilesQueue.push(info);
}

/**
 * Trigger ensure project files
 */
export async function ensureProjectFiles() {
  await ensureFiles();
}
