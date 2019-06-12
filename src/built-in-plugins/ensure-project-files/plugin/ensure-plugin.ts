import * as fs from 'fs-extra';
import * as path from 'path';
import { pluginEntry, pri, srcPath, testsPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { globalState } from '../../../utils/global-state';
import { logSuccess } from '../../../utils/log';
import { prettierConfig } from '../../../utils/prettier-config';

export function ensurePluginFiles() {
  ensureEntry();
  ensureTest();
}

function ensureEntry() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.sourceRoot, path.format(pluginEntry)),
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
    fileName: path.join(pri.sourceRoot, srcPath.dir, 'plugin/index.ts'),
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
  const filePath = path.join(globalState.projectRootPath, testsPath.dir, 'index.ts');

  if (fs.existsSync(filePath)) {
    logSuccess('Test file already exist.');
    return;
  }

  pri.project.addProjectFiles({
    fileName: filePath,
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
