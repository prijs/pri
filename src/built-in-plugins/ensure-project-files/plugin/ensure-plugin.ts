import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { pluginEntry, pri, srcPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { safeJsonParse } from '../../../utils/functional';
import { globalState } from '../../../utils/global-state';
import { logSuccess } from '../../../utils/log';
import { prettierConfig } from '../../../utils/prettier-config';

export function ensurePluginFiles() {
  ensurePackageJson();
  ensureEntry();
  ensureTest();
}

function ensureEntry() {
  pri.project.addProjectFiles({
    fileName: path.format(pluginEntry),
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');

      return prettier.format(`
        export const getPlugin = () => import("./plugin");

        export const getConfig = () => ({
          name: "pri-plugin-${pri.projectPackageJson.name}"
        });
      `);
    }
  });

  pri.project.addProjectFiles({
    fileName: path.join(path.format(srcPath), 'plugin/index.ts'),
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');

      return prettier.format(
        `
        import * as path from "path"
        import { pri } from "${PRI_PACKAGE_NAME}"

        interface IResult {
          customPlugin: {
            hasComponents: boolean
          }
        }

        pri.commands.registerCommand({
          name: ["deploy"],
          action: async () => {
            //
          }
        })

        pri.commands.expandCommand({
          name: ["init"],
          beforeAction: async (...args: any[]) => {
            //
          }
        })

        pri.project.onAnalyseProject(files => {
          const result: IResult = { customPlugin: { hasComponents: judgeHasComponents(pri.projectRootPath, files) } };
          return result;
        })

        pri.project.onCreateEntry((analyseInfo: IResult, entry) => {
          if (!analyseInfo.customPlugin.hasComponents) {
            return
          }

          entry.pipeAppHeader(header => {
            return \`
              \${header}
              import "src/components/xxx"
            \`
          })
        })

        export function judgeHasComponents(projectRootPath: string, files: path.ParsedPath[]) {
          return files.some(file => {
            const relativePath = path.relative(projectRootPath, path.join(file.dir, file.name))
            if (relativePath.startsWith("src/components")) {
              return true
            }
            return false
          })
        }
      `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}

function ensureTest() {
  const fileName = 'tests/index.ts';
  const filePath = path.join(globalState.projectRootPath, fileName);

  if (fs.existsSync(filePath)) {
    logSuccess(`Test file already exist.`);
    return;
  }

  pri.project.addProjectFiles({
    fileName,
    pipeContent: async () => {
      const prettier = await import('prettier');
      return prettier.format(
        `
          test('test', () => {
            expect(true).toBe(true);
          });
          `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}

export function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: prev => {
      const prevJson = safeJsonParse(prev);
      const projectPriVersion =
        _.get(prevJson, 'devDependencies.pri') || _.get(prevJson, 'dependencies.pri') || pkg.version;

      _.unset(prevJson, 'dependencies.pri');
      _.set(prevJson, `devDependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

      return `${JSON.stringify(
        _.merge({}, prevJson, {
          main: `${pri.projectConfig.distDir}/${pri.projectConfig.outFileName}`,
          scripts: { prepublishOnly: 'npm run build' },
          types: path.format(pluginEntry),
          dependencies: {
            '@babel/runtime': '^7.0.0'
          }
        }),
        null,
        2
      )}\n`;
    }
  });
}
