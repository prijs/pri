import * as fs from 'fs-extra';
import * as highlight from 'highlight.js';
import * as _ from 'lodash';
import * as markdownIt from 'markdown-it';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import * as prettier from 'prettier';
import * as url from 'url';
import { pri } from '../../node';
import { ensureStartWithWebpackRelativePoint } from '../../utils/functional';
import { md5 } from '../../utils/md5';
import { markdownTempPath, pagesPath, tempPath } from '../../utils/structor-config';

interface IResult {
  projectAnalyseMarkdownPages: {
    pages: Array<{
      routerPath: string;
      file: path.ParsedPath;
      chunkName: string;
      componentName: string;
    }>;
  };
}

const safeName = (str: string) => _.upperFirst(_.camelCase(str));

const markdown = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: (str: string, lang: string) => {
    if (lang === 'tsx') {
      lang = 'jsx';
    }

    if (lang === 'typescript') {
      lang = 'javascript';
    }

    if (lang && highlight.getLanguage(lang)) {
      try {
        return highlight.highlight(lang, str).value;
      } catch (__) {
        //
      }
    }

    return '';
  }
});

export default async (instance: typeof pri) => {
  const markdownCaches = new Map<string, { originContent: string; pipeAppContent: string }>();

  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return (
      relativePath.startsWith(pagesPath.dir) &&
      file.name === 'index' &&
      (file.ext === '.md' || file.ext === '.css' || file.ext === '.scss' || file.ext === '.less')
    );
  });

  instance.project.onAnalyseProject((files, setPipe) => {
    if (instance.projectConfig.routes.length === 0) {
      return {
        projectAnalyseMarkdownPages: {
          pages: files
            .filter(file => {
              const relativePath = path.relative(instance.projectRootPath, path.join(file.dir, file.name));

              if (!relativePath.startsWith(pagesPath.dir)) {
                return false;
              }

              if (file.name !== 'index') {
                return false;
              }

              if (['.md'].indexOf(file.ext) === -1) {
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
        projectAnalyseMarkdownPages: {
          pages: instance.projectConfig.routes
            .map((route, index) => {
              const componentFile = files.find(file => {
                const relativePath = path.relative(instance.projectRootPath, path.join(file.dir, file.name));
                return (
                  (route.component === relativePath && !file.isDir && file.ext === '.md') ||
                  (path.join(route.component, 'index') === relativePath && !file.isDir && file.ext === '.md')
                );
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

              return { routerPath, file: componentFile, chunkName, componentName };
            })
            .filter(route => route !== null)
        }
      };
    }
  });

  instance.project.onCreateEntry((analyseInfo: IResult, entry) => {
    if (analyseInfo.projectAnalyseMarkdownPages.pages.length === 0) {
      return;
    }

    entry.pipeAppHeader(header => {
      return `
          ${header}
          import "highlight.js/styles/github.css"
        `;
    });

    entry.pipeAppComponent(entryComponent => {
      return `
        ${analyseInfo.projectAnalyseMarkdownPages.pages
          .map(page => {
            // Create esmodule file for markdown
            const markdownFilePath = path.format(page.file);
            const fileContent = fs.readFileSync(markdownFilePath).toString();

            const markdownTsAbsolutePath = path.join(
              instance.projectRootPath,
              markdownTempPath.dir,
              page.componentName + '.html'
            );

            if (
              markdownCaches.has(markdownFilePath) &&
              markdownCaches.get(markdownFilePath).originContent === fileContent
            ) {
              return markdownCaches.get(markdownFilePath).pipeAppContent;
            } else {
              const markedHTML = markdown.render(fileContent);

              fs.outputFileSync(
                markdownTsAbsolutePath,
                `
                  <div class="markdown-body">
                    ${markedHTML}
                  </div>
              `
              );
            }

            // Add it's importer to app component.
            const markdownImportCode = `
                import(/* webpackChunkName: "${
                  page.chunkName
                }" */ "-!raw-loader!${markdownTsAbsolutePath}").then(code => {
                  const filePath = "${path.format(page.file)}"

                  ${entry.pipe.get('afterPageLoad', '')}
                  return () => <div dangerouslySetInnerHTML={{__html: code.default}}/>
                })
              `;

            const pipeAppContent = `
                const ${page.componentName} = Loadable({
                  loader: () => ${markdownImportCode},
                  loading: (): any => null
                })\n
              `;

            const markdownCache = {
              originContent: fileContent,
              pipeAppContent
            };
            markdownCaches.set(markdownFilePath, markdownCache);

            return pipeAppContent;
          })
          .join('\n')}
          ${entryComponent}
      `;
    });

    entry.pipeAppComponent(
      str => `
      ${str}
      ${analyseInfo.projectAnalyseMarkdownPages.pages
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
        ${analyseInfo.projectAnalyseMarkdownPages.pages
          .map(page => {
            return `
              <${entry.pipe.get('markdownRoute', 'Route')} exact path="${page.routerPath}" component={${
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
