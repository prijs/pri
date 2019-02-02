import { ensureFiles } from '../../utils/ensure-files';
import { plugin } from '../../utils/plugins';
import { IEnsureProjectFilesQueue } from '../../utils/plugins-interface';

export function addProjectFiles(info: IEnsureProjectFilesQueue) {
  plugin.ensureProjectFilesQueue.push(info);
}

/**
 * Trigger ensure project files
 */
export async function ensureProjectFiles() {
  await ensureFiles();
}
