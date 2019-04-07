import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../../node';
import { notFoundPath, tempPath } from '../../../utils/structor-config';

interface IResult {
  projectAnalyseNotFound: {
    hasNotFound: boolean;
  };
}

pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, file.dir);
  return relativePath === `src${path.sep}pages` && file.name === '404' && file.ext === '.tsx';
});

pri.project.onAnalyseProject(files => {
  const notFoundFiles = files.filter(file => {
    if (path.format(file) !== path.join(pri.projectRootPath, path.format(notFoundPath))) {
      return false;
    }

    return true;
  });

  return {
    projectAnalyseNotFound: { hasNotFound: notFoundFiles.length === 1 }
  };
});

pri.project.onCreateEntry((analyseInfo: IResult, entry) => {
  if (!analyseInfo.projectAnalyseNotFound.hasNotFound) {
    return;
  }

  entry.pipeAppHeader(header => {
    return `
        ${header}
        import NotFoundComponent from "${normalizePath(
          path.relative(tempPath.dir, path.join(pri.projectRootPath, path.join(notFoundPath.dir, notFoundPath.name)))
        )}"
      `;
  });

  entry.pipeAppRoutes(renderRoutes => {
    return `
        ${renderRoutes}
        <Route component={NotFoundComponent} />
      `;
  });
});
