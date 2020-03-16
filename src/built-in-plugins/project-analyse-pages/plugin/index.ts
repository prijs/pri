import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../../node';
import { md5 } from '../../../utils/md5';
import { pagesPath, tempPath } from '../../../utils/structor-config';
import { transferToAllAbsolutePaths } from '../../../utils/global-state';
import { matchStructor } from '../../../utils/functional';
import { logFatal } from '../../../utils/log';

interface IResult {
  projectAnalysePages: {
    pages: {
      routerPath: string;
      file?: path.ParsedPath;
      chunkName?: string;
      componentName?: string;
      redirect?: string;
    }[];
  };
}

const safeName = (str: string) => {
  return _.upperFirst(_.camelCase(str));
};

pri.project.whiteFileRules.add(file => {
  return transferToAllAbsolutePaths(pagesPath.dir).some(pagePath => {
    return path.format(file).startsWith(pagePath);
  });
});

pri.project.onAnalyseProject(files => {
  if (pri.sourceConfig.routes.length === 0) {
    return {
      projectAnalysePages: {
        pages: files
          .filter(file => {
            if (!matchStructor(file, pagesPath, pri.sourceRoot)) {
              return false;
            }

            if (file.name !== 'index') {
              return false;
            }

            if (['.tsx', '.md', '.mdx'].indexOf(file.ext) === -1) {
              return false;
            }

            return true;
          })
          .map(file => {
            const relativePathWithoutIndex = path.relative(pri.sourceRoot, file.dir);
            const routerPath = normalizePath(
              `/${path.relative(path.join(pri.sourceRoot, pagesPath.dir), relativePathWithoutIndex)}`,
            );
            const chunkName = _.camelCase(routerPath) || 'index';

            const relativePageFilePath = path.relative(pri.sourceRoot, `${file.dir}/${file.name}`);
            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5);

            return {
              routerPath,
              file,
              chunkName,
              componentName,
            };
          }),
      },
    };
  }

  return {
    projectAnalysePages: {
      pages: pri.sourceConfig.routes
        .filter(route => {
          if (route.redirect && route.component) {
            logFatal('route "redirect" and "component" are mutually exclusive.');
          }

          if (route.path && route.component) {
            return true;
          }

          if (route.path && route.redirect) {
            return true;
          }
          return false;
        })
        .map((route, index) => {
          if (route.component) {
            const componentFile = files.find(file => {
              const relativePath = path.relative(pri.sourceRoot, path.join(file.dir, file.name));
              return (
                (route.component === relativePath && !file.isDir && ['.tsx', '.md', '.mdx'].indexOf(file.ext) > -1) ||
                (path.join(route.component, 'index') === relativePath &&
                  !file.isDir &&
                  ['.tsx', '.md', '.mdx'].indexOf(file.ext) > -1)
              );
            });

            if (!componentFile) {
              return null;
            }

            const routerPath = route.path;
            const chunkName = _.camelCase(routerPath) || 'index';

            const relativePageFilePath = path.relative(pri.sourceRoot, `${componentFile.dir}/${componentFile.name}`);
            const componentName = safeName(relativePageFilePath) + md5(relativePageFilePath).slice(0, 5);

            return {
              routerPath,
              file: componentFile,
              chunkName: chunkName + index,
              componentName: componentName + index,
              redirect: route.redirect,
            };
          }
          return {
            routerPath: route.path,
            redirect: route.redirect,
          };
        })
        .filter(route => {
          return route !== null;
        }),
    },
  };
});

pri.project.onCreateEntry((analyseInfo: IResult, entry) => {
  if (analyseInfo.projectAnalysePages.pages.length === 0) {
    return;
  }

  entry.pipeAppComponent(async entryComponent => {
    return `
        ${(await Promise.all(
          analyseInfo.projectAnalysePages.pages
            .filter(page => !!page.file)
            .map(async page => {
              const pageRequirePath = normalizePath(
                path.relative(path.join(pri.projectRootPath, tempPath.dir), path.join(page.file.dir, page.file.name)),
              );

              const importCode = `import(/* webpackChunkName: "${
                page.componentName
              }" */ "${pageRequirePath}").then(code => {
                const filePath = "${path.format(page.file)}"

                ${await entry.pipe.get('afterPageLoad', '')}
                ${await entry.pipe.get('returnPageInstance', 'return code')}
              }),`;

              return `
              const ${page.componentName}Lazy: any = React.lazy(() => ${importCode});
              const ${page.componentName}: React.FC = props => (
                <React.Suspense fallback={<PageLazyFallback />}>
                  <${page.componentName}Lazy {...props} />
                </React.Suspense>
              );
            `;
            }),
        )).join('\n')}
          ${entryComponent}
      `;
  });

  entry.pipeAppComponent(str => {
    return `
      ${str}
      ${analyseInfo.projectAnalysePages.pages
        .map(page => {
          return `
            pageLoadableMap.set("${page.routerPath}", ${page.componentName})
          `;
        })
        .join('\n')}
    `;
  });

  entry.pipeAppRoutes(async renderRoutes => {
    return `
        ${(await Promise.all(
          analyseInfo.projectAnalysePages.pages.map(async page => {
            if (page.file) {
              return `
              <${await entry.pipe.get('commonRoute', 'Route')} exact path="${page.routerPath}" component={${
                page.componentName
              }} />\n
            `;
            }
            if (page.redirect) {
              return `
              <Redirect from="${page.routerPath}" to="${page.redirect}" />\n
            `;
            }
          }),
        )).join('\n')}
        ${renderRoutes}
      `;
  });
});
