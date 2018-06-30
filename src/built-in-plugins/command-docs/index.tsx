import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as portfinder from 'portfinder';
import * as prettier from 'prettier';
import * as urlJoin from 'url-join';
import * as webpack from 'webpack';
import * as yargs from 'yargs';
import { pri } from '../../node';
import { analyseProject } from '../../utils/analyse-project';
import { spinner } from '../../utils/log';
import { prettierConfig } from '../../utils/prettier-config';
import { docsPath, tempPath } from '../../utils/structor-config';
import text from '../../utils/text';
import { runWebpackDevServer } from '../../utils/webpack-dev-server';
import { WrapContent } from '../../utils/webpack-plugin-wrap-content';
import { bundleDlls, dllMainfestName, dllOutPath, libraryStaticPath } from '../command-dev/dll';

interface IResult {
  projectAnalyseDocs: {
    docs: Array<{
      file: path.ParsedPath;
    }>;
  };
}

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: 'docs',
    description: text.commander.docs.description,
    action: async () => {
      await devDocs(instance, docsPath.dir);
    }
  });
};

export async function devDocs(instance: typeof pri, realDocsPath: string) {
  const docsEntryPath = path.join(instance.projectRootPath, tempPath.dir, 'docs-entry.tsx');

  prepare(instance, realDocsPath, docsEntryPath);

  await instance.project.lint(false);
  await instance.project.ensureProjectFiles();
  await instance.project.checkProjectFiles();

  // Anaylse project for init.
  await spinner('Analyse project', async () => {
    return analyseProject();
  });

  await bundleDlls();

  chokidar
    .watch(path.join(instance.projectRootPath, realDocsPath, '/**'), {
      ignored: /(^|[\/\\])\../,
      ignoreInitial: true
    })
    .on('add', async filePath => {
      await analyseProject();
    })
    .on('unlink', async filePath => {
      await analyseProject();
    })
    .on('unlinkDir', async filePath => {
      await analyseProject();
    });

  // Serve docs
  const freePort = await portfinder.getPortPromise();
  await runWebpackDevServer({
    publicPath: '/',
    entryPath: docsEntryPath,
    devServerPort: freePort,
    htmlTemplatePath: path.join(__dirname, '../../../template-project.ejs'),
    htmlTemplateArgs: {
      appendBody: `
            <script src="https://unpkg.com/monaco-editor@0.13.1/min/vs/loader.js"></script>
          `
    },
    pipeConfig: config => {
      const dllHttpPath = urlJoin(
        `${instance.projectConfig.useHttps ? 'https' : 'http'}://127.0.0.1:${freePort}`,
        libraryStaticPath
      );

      config.plugins.push(
        new WrapContent(
          `
          var dllScript = document.createElement("script");
          dllScript.src = "${dllHttpPath}";
          dllScript.onload = runEntry;
          document.body.appendChild(dllScript);

          function runEntry() {
        `,
          `}`
        )
      );
      return config;
    }
  });
}

function prepare(instance: typeof pri, realDocsPath: string, docsEntryPath: string) {
  instance.build.pipeTsInclude(paths => {
    paths.push(path.join(instance.projectRootPath, realDocsPath));
    return paths;
  });
  instance.build.pipeLessInclude(paths => {
    paths.push(path.join(instance.projectRootPath, realDocsPath));
    return paths;
  });
  instance.build.pipeSassInclude(paths => {
    paths.push(path.join(instance.projectRootPath, realDocsPath));
    return paths;
  });

  instance.build.pipeConfig(config => {
    if (!instance.isDevelopment) {
      return config;
    }

    config.plugins.push(
      new webpack.DllReferencePlugin({
        context: '.',
        manifest: require(path.join(dllOutPath, dllMainfestName))
      })
    );

    return config;
  });

  instance.project.onAnalyseProject(files => {
    const result = {
      projectAnalyseDocs: {
        docs: files
          .filter(file => {
            const relativePath = path.relative(instance.projectRootPath, path.join(file.dir, file.name));

            if (!relativePath.startsWith(realDocsPath)) {
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
          })
      }
    } as IResult;

    // Create entry file for docs
    const docList: string[] = [];

    const docsEntryContent = prettier.format(
      `
      import * as React from "react"
      import * as ReactDOM from 'react-dom'
      import { hot } from 'react-hot-loader'
      
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

      class Docs extends React.PureComponent {
        public render() {
          return (
            <DocsWrapper docs={DocComponents}/>
          )
        }
      }

      const ROOT_ID = 'root';

      const HotDocs = hot(module)(Docs);

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
        parser: 'typescript'
      }
    );

    fs.outputFileSync(docsEntryPath, docsEntryContent);

    return result;
  });
}
