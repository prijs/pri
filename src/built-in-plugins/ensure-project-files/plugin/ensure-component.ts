import * as path from 'path';
import * as fs from 'fs-extra';
import { componentEntry, docsPath, pri, srcPath } from '../../../node';
import { prettierConfig } from '../../../utils/prettier-config';
import { ensureTest } from './ensure-project';

export function ensureComponentFiles() {
  ensureEntryFile();
  ensureDocs();
  ensureTest();
}

function ensureEntryFile() {
  pri.project.addProjectFiles({
    fileName: path.join(pri.sourceRoot, path.format(componentEntry)),
    pipeContent: async text => {
      if (text) {
        return text;
      }

      const prettier = await import('prettier');
      return prettier.format(
        `
          import * as React from 'react'
          
          export default () => {
            return (
              <div>My Component</div>
            )
          }
        `,
        { ...prettierConfig, parser: 'typescript' },
      );
    },
  });
}

function ensureDocs() {
  const docsAbsolutePath = path.join(pri.sourceRoot, docsPath.dir);

  if (!fs.existsSync(docsAbsolutePath)) {
    const basicDocsPath = path.join(pri.sourceRoot, docsPath.dir, 'basic.tsx');

    const relativeToEntryPath = path.relative(
      path.parse(basicDocsPath).dir,
      path.join(pri.sourceRoot, srcPath.dir, 'index'),
    );

    pri.project.addProjectFiles({
      fileName: basicDocsPath,
      pipeContent: async text => {
        if (text) {
          return text;
        }

        const prettier = await import('prettier');
        return prettier.format(
          `
            import * as React from "react"
            import Component from "${relativeToEntryPath}"
  
            export default () => <Component />
          `,
          { ...prettierConfig, parser: 'typescript' },
        );
      },
    });
  }
}
