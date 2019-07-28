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
          if (!path.format(file).startsWith(path.join(pri.sourceRoot, layoutPath.dir))) {
            return false;
          }

          return true;
        })
        .some(file => {
          return file.name === 'index';
        }),
    },
  };
});

pri.project.onCreateEntry((analyseInfo: IResult, entry) => {
  if (!analyseInfo.projectAnalyseLayout.hasLayout) {
    return;
  }

  const layoutEntryRelativePath = path.relative(
    path.join(pri.projectRootPath, tempJsEntryPath.dir),
    path.join(pri.sourceRoot, layoutPath.dir, layoutPath.name),
  );

  entry.pipeAppHeader(async header => {
    return `
        ${header}
        import ${await entry.pipe.get('analyseLayoutImportName', LAYOUT)} from "${normalizePath(
      layoutEntryRelativePath,
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

  entry.pipe.set('commonRoute', () => {
    return LAYOUT_ROUTE;
  });
});
