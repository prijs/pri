import * as fs from 'fs-extra';
// TODO: 初始化性能损耗
import * as ts from 'typescript';

export const pipeEvent = (func: any) => {
  return (event: any) => {
    return func(event.target.value, event);
  };
};

export function ensureEndWithSlash(str: string) {
  if (str.endsWith('/')) {
    return str;
  } else {
    return str + '/';
  }
}

export function ensureStartWithSlash(str: string) {
  if (str.startsWith('/')) {
    return str;
  } else {
    return '/' + str;
  }
}

export function ensureStartWithWebpackRelativePoint(str: string) {
  if (str.startsWith('/')) {
    throw Error(`${str} is an absolute path!`);
  }

  if (!str.startsWith('./') && !str.startsWith('../')) {
    return './' + str;
  } else {
    return str;
  }
}

export function execTsByPath(filePath: string) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath).toString();
  const jsTransferContent = ts.transpile(fileContent);

  try {
    // tslint:disable-next-line:no-eval
    return eval(jsTransferContent);
  } catch (error) {
    throw Error(`Parse file ${error.toString()} in ${filePath}`);
  }
}
