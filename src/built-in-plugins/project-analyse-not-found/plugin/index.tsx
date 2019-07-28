import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../../node';
import { notFoundPath, tempPath } from '../../../utils/structor-config';
import { transferToAllAbsolutePaths } from '../../../utils/global-state';

interface IResult {
  projectAnalyseNotFound: {
    hasNotFound: boolean;
  };
}

pri.project.whiteFileRules.add(file => {
  return transferToAllAbsolutePaths(path.format(notFoundPath)).some(notFoundAbsolutePath => {
    return path.format(file) === notFoundAbsolutePath;
  });
});

pri.project.onAnalyseProject(files => {
  const notFoundFiles = files.filter(file => {
    if (path.format(file) !== path.join(pri.sourceRoot, path.format(notFoundPath))) {
      return false;
    }

    return true;
  });

  return {
    projectAnalyseNotFound: { hasNotFound: notFoundFiles.length === 1 },
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
          path.relative(
            path.join(pri.projectRootPath, tempPath.dir),
            path.join(pri.sourceRoot, path.join(notFoundPath.dir, notFoundPath.name)),
          ),
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
