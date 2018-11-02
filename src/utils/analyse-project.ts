import * as fs from 'fs';
import * as pipe from '../node/pipe';
import { plugin } from './plugins';
import { walkProjectFiles } from './walk-project-files';

export const analyseProject = async () => {
  const files = await walkProjectFiles();

  // Clear analyseInfo
  Object.keys(plugin.analyseInfo).forEach(key => delete plugin.analyseInfo[key]);

  // Clear pipe
  pipe.clear();

  plugin.projectAnalyses.forEach(projectAnalyse => {
    const result = projectAnalyse(files, pipe.set);
    if (result && typeof result === 'object') {
      Object.keys(result).forEach(key => (plugin.analyseInfo[key] = result[key]));
    }
  });

  return plugin.analyseInfo;
};
