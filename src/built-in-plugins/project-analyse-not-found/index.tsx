import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../node';
import { md5 } from '../../utils/md5';
import { notFoundPath, tempPath } from '../../utils/structor-config';

interface IResult {
  projectAnalyseNotFound: {
    hasNotFound: boolean;
  };
}

export default async (instance: typeof pri) => {
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath === `src${path.sep}pages` && file.name === '404' && file.ext === '.tsx';
  });

  instance.project.onAnalyseProject(files => {
    const notFoundFiles = files.filter(file => {
      if (path.format(file) !== path.join(instance.projectRootPath, path.format(notFoundPath))) {
        return false;
      }

      return true;
    });

    return {
      projectAnalyseNotFound: { hasNotFound: notFoundFiles.length === 1 }
    } as IResult;
  });

  instance.project.onCreateEntry((analyseInfo: IResult, entry) => {
    if (!analyseInfo.projectAnalyseNotFound.hasNotFound) {
      return;
    }

    entry.pipeAppHeader(header => {
      return `
        ${header}
        import NotFoundComponent from "${normalizePath(
          path.relative(
            tempPath.dir,
            path.join(instance.projectRootPath, path.join(notFoundPath.dir, notFoundPath.name))
          )
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
};
