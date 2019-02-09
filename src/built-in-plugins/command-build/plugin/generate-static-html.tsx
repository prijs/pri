import * as path from 'path';
import { globalState } from '../../../utils/global-state';

export function getStaticHtmlPaths(analyseInfo: any) {
  const pages = analyseInfo.projectAnalysePages ? analyseInfo.projectAnalysePages.pages : [];

  const allPages = [...pages];

  return allPages.map(page => {
    const relativePathWithSuffix = path.join(page.routerPath, 'index.html');
    return path.join(globalState.projectRootPath, globalState.projectConfig.distDir, relativePathWithSuffix);
  });
}
