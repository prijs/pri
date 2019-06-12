import * as fs from 'fs-extra';
import * as path from 'path';
import { pri } from '../../../node';
import { ensureEndWithSlash, ensureStartWithSlash } from '../../../utils/functional';
import { tempPath } from '../../../utils/structor-config';

pri.project.onCreateEntry(async (analyseInfo, entry) => {
  entry.pipeEntryRender(text => {
    return `
      ${
        pri.projectConfig.useServiceWorker
          ? `
        if (navigator.serviceWorker) {
          navigator.serviceWorker.register('/sw.js', {scope: "${ensureStartWithSlash(
            ensureEndWithSlash(pri.projectConfig.baseHref)
          )}"})
        }
      `
          : ''
      }

      ${text}
    `;
  });

  if (pri.projectConfig.useServiceWorker) {
    const prettier = await import('prettier');

    fs.outputFileSync(
      path.join(pri.projectRootPath, tempPath.dir, 'static', 'sw.js'),
      prettier.format(
        await entry.pipe.get(
          'serviceWorker',
          `
            self.addEventListener("install", event => {
              self.skipWaiting()
            })
  
            self.addEventListener("activate", event => {
              self.clients.claim()
            });
          `
        ),
        { semi: true, singleQuote: true, parser: 'babylon' }
      )
    );
  }
});
