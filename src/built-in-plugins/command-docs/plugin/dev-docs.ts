import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as prettier from 'prettier';
import { pri } from '../../../node';
import { analyseProject } from '../../../utils/analyse-project';
import { spinner } from '../../../utils/log';
import { prettierConfig } from '../../../utils/prettier-config';
import { tempPath, docsPath } from '../../../utils/structor-config';
import { runWebpackDevServer } from '../../../utils/webpack-dev-server';

interface IResult {
  projectAnalyseDocs: {
    docs: {
      file: path.ParsedPath;
    }[];
  };
}

export async function devDocs() {
  const docsEntryPath = path.join(pri.projectRootPath, tempPath.dir, 'docs-entry.tsx');
  prepare(docsEntryPath);

  await pri.project.ensureProjectFiles();
  await pri.project.checkProjectFiles();

  // Anaylse project for init.
  await spinner('Analyse project', async () => {
    return analyseProject();
  });

  chokidar
    .watch(path.join(pri.sourceRoot, docsPath.dir, '/**'), {
      ignored: /(^|[/\\])\../,
      ignoreInitial: true,
    })
    .on('add', async () => {
      await analyseProject();
    })
    .on('unlink', async () => {
      await analyseProject();
    })
    .on('unlinkDir', async () => {
      await analyseProject();
    });

  // Serve docs
  const freePort = await portfinder.getPortPromise();

  await runWebpackDevServer({
    mode: 'development',
    publicPath: '/',
    autoOpenBrowser: true,
    hot: true,
    devUrl: 'localhost',
    entryPath: docsEntryPath,
    devServerPort: freePort,
    htmlTemplatePath: path.join(__dirname, '../../../../template-project.ejs'),
    htmlTemplateArgs: {
      appendHead: `
        <style>
          html, body {
            padding: 0;
            margin: 0;
          }
        </style>
      `,
      appendBody: `
          `,
    },
  });
}

function prepare(docsEntryPath: string) {
  pri.build.pipeJsInclude(paths => {
    paths.push(path.join(pri.sourceRoot, docsPath.dir));
    return paths;
  });
  pri.build.pipeLessInclude(paths => {
    paths.push(path.join(pri.sourceRoot, docsPath.dir));
    return paths;
  });
  pri.build.pipeSassInclude(paths => {
    paths.push(path.join(pri.sourceRoot, docsPath.dir));
    return paths;
  });

  pri.project.onAnalyseProject(files => {
    const result = {
      projectAnalyseDocs: {
        docs: files
          .filter(file => {
            if (!path.format(file).startsWith(path.join(pri.sourceRoot, docsPath.dir))) {
              return false;
            }

            if (file.isDir) {
              return false;
            }

            if (['.tsx'].indexOf(file.ext) === -1) {
              return false;
            }

            return true;
          })
          .map(file => {
            return { file };
          }),
      },
    };

    // Create entry file for docs
    const docList: string[] = [];

    const docsEntryContent = prettier.format(
      `
      import * as React from "react"
      import * as ReactDOM from 'react-dom'
      import { hot } from "react-hot-loader/root"
      import { setConfig } from "react-hot-loader"

      setConfig({
        ignoreSFC: true, // RHL will be __completely__ disabled for SFC
        pureRender: true, // RHL will not change render method
      })
      
      const DocsWrapper = require("${path.join(__dirname, 'docs-wrapper')}").default

      ${(() => {
        const docFiles = result.projectAnalyseDocs.docs;
        return docFiles
          .map((docFile, index) => {
            const docFilePathWithoutPrefix = path.join(docFile.file.dir, docFile.file.name);
            const docImportPath = path.relative(path.parse(docsEntryPath).dir, docFilePathWithoutPrefix);
            const fileName = `Doc${index}`;
            docList.push(`
            {
              name: "${docFile.file.name}",
              element: ${fileName},
              text: ${fileName}Text
            }
          `);
            return `
            import * as ${fileName} from '${docImportPath}'
            const ${fileName}Text = require('-!raw-loader!${docImportPath}')
          `;
          })
          .join('\n');
      })()}

      const DocComponents: any[] = [${docList.join(',')}]

      const Docs = () => <DocsWrapper docs={DocComponents}/>

      const ROOT_ID = 'root';

      setConfig({ pureSFC: true, pureRender: true })

      const HotDocs = hot(Docs);

      // Create entry div if not exist.
      if (!document.getElementById(ROOT_ID)) {
        const rootDiv = document.createElement('div');
        rootDiv.id = ROOT_ID;
        document.body.appendChild(rootDiv);
      }

      ReactDOM.render(<HotDocs />, document.getElementById(ROOT_ID));
    `,
      {
        ...prettierConfig,
        parser: 'typescript',
      },
    );

    fs.outputFileSync(docsEntryPath, docsEntryContent);

    return result;
  });
}
