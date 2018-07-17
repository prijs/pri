import * as fs from 'fs-extra';
import * as path from 'path';
import * as React from 'react';
import * as url from 'url';
import { globalState } from '../../utils/global-state';
import { ProjectConfig } from '../../utils/project-config-interface';

export function getStaticHtmlPaths(analyseInfo: any) {
  const pages = analyseInfo.projectAnalysePages ? analyseInfo.projectAnalysePages.pages : [];
  const markdownPages = analyseInfo.projectAnalyseMarkdownPages ? analyseInfo.projectAnalyseMarkdownPages.pages : [];

  const allPages = [...pages, ...markdownPages];

  return allPages.map(page => {
    const relativePathWithSuffix = path.join(page.routerPath, 'index.html');
    return path.join(globalState.projectRootPath, globalState.projectConfig.distDir, relativePathWithSuffix);
  });
}
