import * as path from 'path';
import { pagesPath, pri, testsPath } from '../../../node';
import { PRI_PACKAGE_NAME } from '../../../utils/constants';
import { prettierConfig } from '../../../utils/prettier-config';

export function ensureProjectFiles() {
  ensureProjectEntry();
  ensureTest();
}

function ensureProjectEntry() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.sourceRoot, pagesPath.dir, 'index.tsx'),
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');
      return prettier.format(
        `
            import { isDevelopment } from "${PRI_PACKAGE_NAME}/client"
            import * as React from "react"

            export default () => {
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
          `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}

export function ensureTest() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.sourceRoot, testsPath.dir, 'index.ts'),
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
}
