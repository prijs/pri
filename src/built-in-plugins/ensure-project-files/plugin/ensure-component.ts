import * as path from 'path';
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
          export default () => <div>My Component</div>
        `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}

function ensureDocs() {
  const basicDocsPath = path.join(pri.sourceRoot, docsPath.dir, 'basic.tsx');
  const relativeToEntryPath = path.relative(
    path.parse(path.join(pri.sourceRoot, basicDocsPath)).dir,
    path.join(pri.sourceRoot, srcPath.dir, 'index')
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
          import Component from "${relativeToEntryPath}"
          import * as React from "react"

          export default () => <Component />
        `,
        { ...prettierConfig, parser: 'typescript' }
      );
    }
  });
}
