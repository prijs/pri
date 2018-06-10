import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import * as ts from 'typescript';
import { pri } from '../../node';

export default async (instance: typeof pri) => {
  // mocks
  const whiteList = ['mocks'];
  instance.project.whiteFileRules.add(file => {
    return whiteList.some(whiteName => path.format(file) === path.join(instance.projectRootPath, whiteName));
  });

  // mocks/**/*.ts
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(instance.projectRootPath, file.dir);
    return relativePath === 'mocks' && file.ext === '.ts';
  });

  instance.project.onAnalyseProject(files => {
    const mockFilesPath = files
      .filter(file => {
        return file.dir === path.join(instance.projectRootPath, 'mocks');
      })
      .map(file => path.format(file));

    const mocks = compile(mockFilesPath, {
      noEmitOnError: true,
      noImplicitAny: true,
      target: ts.ScriptTarget.ES5,
      module: ts.ModuleKind.CommonJS
    });

    instance.serviceWorker.pipe(
      text => `
      ${text}
      // Get mock list start
      ${mocks.join(`\n`)}

      var allMocks = {${mockFilesPath
        .map((__, index) => {
          return `...mock${index}`;
        })
        .join(',')}}
      var mockList = []

      Object.keys(allMocks).forEach(mockKey => {
        var mock = allMocks[mockKey]
        mockList.push({ url: new URL(mockKey, location), value: mock })
      })
      // Get mock list end

      self.addEventListener("fetch", event => {
        var requestUrl = new URL(event.request.url)

        const mockInfo = mockList.find(mock => requestUrl.hostname === mock.url.hostname && requestUrl.pathname === mock.url.pathname)

        if (mockInfo) {
          var responseInit = { status: 200, statusText: "OK", headers: { "Content-Type": "application/json" } }

          if (typeof mockInfo.value === 'function') {
            event.respondWith(
              Promise.resolve(mockInfo.value()).then(responseBody => {
                return new Response(JSON.stringify(responseBody), responseInit);
              })
            );
          } else {
            var responseBody = mockInfo.value;
            var mockResponse = new Response(JSON.stringify(responseBody), responseInit);
            event.respondWith(mockResponse);
          }
        }
      })
    `
    );
  });
};

function compile(fileNames: string[], options: ts.CompilerOptions) {
  return fileNames.map((fileName, index) => {
    const fileContent = fs.readFileSync(fileName).toString();
    const result = ts.transpileModule(fileContent, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
    return `
var mock${index} = (()=>{
        var exports = {}
        ${result.outputText}
        return exports.default
      })();
`;
  });
}
