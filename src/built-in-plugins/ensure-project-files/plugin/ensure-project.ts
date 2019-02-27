import * as fs from 'fs';
import * as _ from 'lodash';
import * as path from 'path';
import * as pkg from '../../../../package.json';
import { pagesPath, pri, testsPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { safeJsonParse } from '../../../utils/functional.js';
import { prettierConfig } from '../../../utils/prettier-config';

export function ensureProjectFiles() {
  ensureProjectEntry();
  ensureTest();
  ensurePackageJson();
}

const ensureProjectEntry = () => {
  const homePagePath = path.join(pagesPath.dir, 'index.tsx');
  const homePageAbsolutePath = path.join(pri.projectRootPath, homePagePath);

  if (!fs.existsSync(homePageAbsolutePath)) {
    pri.project.addProjectFiles({
      fileName: homePagePath,
      pipeContent: async () => {
        const prettier = await import('prettier');
        return prettier.format(
          `
            import { isDevelopment } from "${PRI_PACKAGE_NAME}/client"
            import * as React from "react"

            class Props {

            }

            class State {

            }

            export default class Page extends React.PureComponent<Props, State> {
              public static defaultProps = new Props()
              public state = new State()

              public render() {
                return (
                  <div>
                    <h1 style={{ display: "flex", alignItems: "center", justifyContent: "center"}}>
                      Welcome to pri!
                    </h1>
                    <p style={{ padding: "10 50px" }}>
                      Current env: {isDevelopment ? "local" : "prod"}
                    </p>
                  </div>
                )
              }
            }
          `,
          { ...prettierConfig, parser: 'typescript' }
        );
      }
    });
  }
};

export const ensureTest = () =>
  pri.project.addProjectFiles({
    fileName: path.join(testsPath.dir, 'index.ts'),
    pipeContent: async (prev: string) => {
      if (prev) {
        return prev;
      }

      const prettier = await import('prettier');
      return prettier.format(
        `
          test("Example", () => {
            expect(true).toBe(true)
          })
        `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });

export function ensurePackageJson() {
  pri.project.addProjectFiles({
    fileName: 'package.json',
    pipeContent: prev => {
      const prevJson = safeJsonParse(prev);
      const projectPriVersion =
        _.get(prevJson, 'devDependencies.pri') || _.get(prevJson, 'dependencies.pri') || pkg.version;

      _.unset(prevJson, 'devDependencies.pri');
      _.set(prevJson, `dependencies.${PRI_PACKAGE_NAME}`, projectPriVersion);

      return JSON.stringify(prevJson, null, 2) + '\n';
    }
  });
}
