import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import * as url from 'url';
import { pri } from '../../node';
import { md5 } from '../../utils/md5';
import { markdownTempPath, pagesPath, tempPath } from '../../utils/structor-config';

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

export default async (instance: typeof pri) => {
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return (
      relativePath.startsWith(`src${path.sep}pages`) &&
      file.name === 'index' &&
      (file.ext === '.tsx' || file.ext === '.css' || file.ext === '.scss' || file.ext === '.less')
    );
  });

  instance.project.onAnalyseProject(files => {
    if (instance.projectConfig.routes.length === 0) {
      return {
        projectAnalysePages: {
          pages: files
            .filter(file => {
              const relativePath = path.relative(instance.projectRootPath, path.join(file.dir, file.name));

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
              const relativePathWithoutIndex = path.relative(instance.projectRootPath, file.dir);
              const routerPath = normalizePath('/' + path.relative(pagesPath.dir, relativePathWithoutIndex));
              const chunkName = _.camelCase(routerPath) || 'index';

              const relativePageFilePath = path.relative(instance.projectRootPath, file.dir + '/' + file.name);
              const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5);

              return { routerPath, file, chunkName, componentName };
            })
        }
      } as IResult;
    } else {
      return {
        projectAnalysePages: {
          pages: instance.projectConfig.routes
            .map((route, index) => {
              const componentFile = files.find(file => {
                const relativePath = path.relative(instance.projectRootPath, path.join(file.dir, file.name));
                return route.component === relativePath || path.join(route.component, 'index') === relativePath;
              });

              if (!componentFile) {
                return null;
              }

              const routerPath = route.path;
              const chunkName = _.camelCase(routerPath) || 'index';

              const relativePageFilePath = path.relative(
                instance.projectRootPath,
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

  instance.project.onCreateEntry((analyseInfo: IResult, entry) => {
    if (analyseInfo.projectAnalysePages.pages.length === 0) {
      return;
    }

    entry.pipeAppComponent(entryComponent => {
      return `
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            const pageRequirePath = normalizePath(
              path.relative(tempPath.dir, path.join(page.file.dir, page.file.name))
            );

            const importCode = `import(/* webpackChunkName: "${page.chunkName}" */ "${pageRequirePath}").then(code => {
                ${entry.pipe.get('afterPageLoad', '')}
                return code.default
              })`;

            return `
              const ${page.componentName} = Loadable({
                loader: () => ${importCode},
                loading: (): any => null
              })\n
            `;
          })
          .join('\n')}
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

    entry.pipeAppRoutes(renderRoutes => {
      return `
        ${analyseInfo.projectAnalysePages.pages
          .map(page => {
            return `
              <${entry.pipe.get('commonRoute', 'Route')} exact path="${page.routerPath}" component={${
              page.componentName
            }} />\n
            `;
          })
          .join('\n')}
        ${renderRoutes}
      `;
    });
  });
};
