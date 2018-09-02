import { ensureFiles } from '../../utils/ensure-files';
import { IEnsureProjectFilesQueue, plugin } from '../../utils/plugins';

export function addProjectFiles(info: IEnsureProjectFilesQueue) {
  plugin.ensureProjectFilesQueue.push(info);
}

/**
 * Trigger ensure project files
 */
export async function ensureProjectFiles() {
  await ensureFiles();
}
