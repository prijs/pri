import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../node';
import { md5 } from '../../utils/md5';
import { layoutPath, markdownLayoutPath, tempJsEntryPath } from '../../utils/structor-config';

const MARKDOWN_LAYOUT = 'MarkdownLayoutComponent';
const MARKDOWN_LAYOUT_ROUTE = 'MarkdownLayoutRoute';

interface IResult {
  projectAnalyseMarkdownLayout: {
    hasMarkdownLayout: boolean;
  };
}

export default async (instance: typeof pri) => {
  // src/layouts/markdown.tsx
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath === `src${path.sep}layouts` && file.name === 'markdown' && file.ext === '.tsx';
  });

  // src/layouts/markdown.style.tsx
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath === `src${path.sep}layouts` && file.name === 'markdown.style' && file.ext === '.ts';
  });

  // src/layouts/markdown.css
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath === `src${path.sep}layouts` && file.name === 'markdown' && file.ext === '.css';
  });

  instance.project.onAnalyseProject(files => {
    return {
      projectAnalyseMarkdownLayout: {
        hasMarkdownLayout: files
          .filter(file => {
            const relativePath = path.relative(instance.projectRootPath, path.join(file.dir, file.name));

            if (!relativePath.startsWith(layoutPath.dir)) {
              return false;
            }

            return true;
          })
          .some(file => file.name === 'markdown')
      }
    } as IResult;
  });

  instance.project.onCreateEntry((analyseInfo: IResult, entry) => {
    if (!analyseInfo.projectAnalyseMarkdownLayout.hasMarkdownLayout) {
      return;
    }

    const markdownLayoutEntryRelativePath = path.relative(
      tempJsEntryPath.dir,
      path.join(markdownLayoutPath.dir, markdownLayoutPath.name)
    );

    entry.pipeAppHeader(header => {
      return `
        ${header}
        import ${entry.pipe.get('analyseMarkdownLayoutImportName', MARKDOWN_LAYOUT)} from "${normalizePath(
        markdownLayoutEntryRelativePath
      )}"
      `;
    });

    entry.pipeAppBody(body => {
      return `
        ${body}

        ${entry.pipe.get('analyseMarkdownLayoutBody', '')}

        const ${MARKDOWN_LAYOUT_ROUTE} = ({ component: Component, ...rest }: any) => {
          return (
            <Route {...rest} render={matchProps => (
              <${MARKDOWN_LAYOUT}>
                <Component {...matchProps} />
              </${MARKDOWN_LAYOUT}>
            )} />
          )
        }
      `;
    });

    entry.pipe.set('markdownRoute', route => {
      return MARKDOWN_LAYOUT_ROUTE;
    });
  });
};
