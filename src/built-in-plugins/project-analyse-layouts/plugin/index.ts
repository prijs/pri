import * as _ from 'lodash';
import * as normalizePath from 'normalize-path';
import * as path from 'path';
import { pri } from '../../../node';
import { layoutPath, tempJsEntryPath } from '../../../utils/structor-config';

const LAYOUT = 'LayoutComponent';
const LAYOUT_ROUTE = 'LayoutRoute';

interface IResult {
  projectAnalyseLayout: {
    hasLayout: boolean;
  };
}

pri.project.onAnalyseProject(files => {
  return {
    projectAnalyseLayout: {
      hasLayout: files
        .filter(file => {
          const relativePath = path.relative(pri.projectRootPath, path.join(file.dir, file.name));

          if (!relativePath.startsWith(layoutPath.dir)) {
            return false;
          }

          return true;
        })
        .some(file => file.name === 'index')
    }
  } as IResult;
});

pri.project.onCreateEntry((analyseInfo: IResult, entry) => {
  if (!analyseInfo.projectAnalyseLayout.hasLayout) {
    return;
  }

  const layoutEntryRelativePath = path.relative(tempJsEntryPath.dir, path.join(layoutPath.dir, layoutPath.name));

  entry.pipeAppHeader(async header => {
    return `
        ${header}
        import ${await entry.pipe.get('analyseLayoutImportName', LAYOUT)} from "${normalizePath(
      layoutEntryRelativePath
    )}"
      `;
  });

  entry.pipeAppBody(async body => {
    return `
        ${body}

        ${await entry.pipe.get('analyseLayoutBody', '')}

        const ${LAYOUT_ROUTE} = ({ component: Component, ...rest }: any) => {
          return (
            <Route {...rest} render={(matchProps: any) => (
              <${LAYOUT}>
                <Component {...matchProps} />
              </${LAYOUT}>
            )} />
          )
        }
      `;
  });

  entry.pipe.set('commonRoute', route => {
    return LAYOUT_ROUTE;
  });
});
