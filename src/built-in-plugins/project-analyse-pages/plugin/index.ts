import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../../node';
import { md5 } from '../../../utils/md5';
import { pagesPath, tempPath } from '../../../utils/structor-config';

interface IResult {
  projectAnalysePages: {
    pages: Array<{
      routerPath: string;
      file: path.ParsedPath;
      chunkName: string;
      componentName: string;
    }>;
  };
}

const safeName = (str: string) => _.upperFirst(_.camelCase(str));

pri.project.whiteFileRules.add(file => {
  const relativePath = path.relative(pri.projectRootPath, file.dir);
  return (
    relativePath.startsWith(pagesPath.dir) &&
    file.name === 'index' &&
    (file.ext === '.tsx' || file.ext === '.css' || file.ext === '.scss' || file.ext === '.less')
  );
});

pri.project.onAnalyseProject(files => {
  if (pri.projectConfig.routes.length === 0) {
    return {
      projectAnalysePages: {
        pages: files
          .filter(file => {
            const relativePath = path.relative(pri.projectRootPath, path.join(file.dir, file.name));

            if (!relativePath.startsWith(pagesPath.dir)) {
              return false;
            }

            if (file.name !== 'index') {
              return false;
            }

            if (['.tsx'].indexOf(file.ext) === -1) {
              return false;
            }

            return true;
          })
          .map(file => {
            const relativePathWithoutIndex = path.relative(pri.projectRootPath, file.dir);
            const routerPath = normalizePath('/' + path.relative(pagesPath.dir, relativePathWithoutIndex));
            const chunkName = _.camelCase(routerPath) || 'index';

            const relativePageFilePath = path.relative(pri.projectRootPath, file.dir + '/' + file.name);
            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5);

            return { routerPath, file, chunkName, componentName };
          })
      }
    } as IResult;
  } else {
    return {
      projectAnalysePages: {
        pages: pri.projectConfig.routes
          .filter(route => route.component && route.path)
          .map((route, index) => {
            const componentFile = files.find(file => {
              const relativePath = path.relative(pri.projectRootPath, path.join(file.dir, file.name));
              return (
                (route.component === relativePath && !file.isDir && file.ext === '.tsx') ||
                (path.join(route.component, 'index') === relativePath && !file.isDir && file.ext === '.tsx')
              );
            });

            if (!componentFile) {
              return null;
            }

            const routerPath = route.path;
            const chunkName = _.camelCase(routerPath) || 'index';

            const relativePageFilePath = path.relative(
              pri.projectRootPath,
              componentFile.dir + '/' + componentFile.name
            );
            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5);

            return {
              routerPath,
              file: componentFile,
              chunkName: chunkName + index,
              componentName: componentName + index
            };
          })
          .filter(route => route !== null)
      }
    };
  }
});

pri.project.onCreateEntry((analyseInfo: IResult, entry) => {
  if (analyseInfo.projectAnalysePages.pages.length === 0) {
    return;
  }

  entry.pipeAppComponent(async entryComponent => {
    return `
        ${(await Promise.all(
          analyseInfo.projectAnalysePages.pages.map(async page => {
            const pageRequirePath = normalizePath(
              path.relative(tempPath.dir, path.join(page.file.dir, page.file.name))
            );

            const importCode = `import(/* webpackChunkName: "${page.chunkName}" */ "${pageRequirePath}").then(code => {
                const filePath = "${path.format(page.file)}"

                ${await entry.pipe.get('afterPageLoad', '')}
                ${await entry.pipe.get('returnPageInstance', 'return code.default')}
              })`;

            return `
              const ${page.componentName} = Loadable({
                loader: () => ${importCode},
                loading: (): any => null
              })\n
            `;
          })
        )).join('\n')}
          ${entryComponent}
      `;
  });

  entry.pipeAppComponent(
    str => `
      ${str}
      ${analyseInfo.projectAnalysePages.pages
        .map(page => {
          return `
            pageLoadableMap.set("${page.routerPath}", ${page.componentName})
          `;
        })
        .join('\n')}
    `
  );

  entry.pipeAppRoutes(async renderRoutes => {
    return `
        ${(await Promise.all(
          analyseInfo.projectAnalysePages.pages.map(async page => {
            return `
              <${await entry.pipe.get('commonRoute', 'Route')} exact path="${page.routerPath}" component={${
              page.componentName
            }} />\n
            `;
          })
        )).join('\n')}
        ${renderRoutes}
      `;
  });
});
