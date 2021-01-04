import * as fs from 'fs-extra';
import * as ts from 'typescript';
import { pri } from '../../../node';

function compile(fileNames: string[]) {
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

export function onAnalyseProject(mockFilesPath: string[]) {
  const mocks = compile(mockFilesPath);

  pri.serviceWorker.pipe(text => {
    return `
      ${text}
      ${mocks.join('\n')}

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

      self.addEventListener("fetch", event => {
        var requestUrl = new URL(event.request.url)

        const mockInfo = mockList.find(mock => requestUrl.hostname === mock.url.hostname &&
           requestUrl.pathname === mock.url.pathname)

        if (mockInfo) {
          var responseInit = { status: 200, statusText: "OK", 
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }

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
    `;
  });
}
