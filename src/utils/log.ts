import * as colors from 'colors';
import * as ora from 'ora';

export function log(...message: string[]) {
  // tslint:disable-next-line:no-console
  console.log.apply(null, message);
}

export async function spinner<T>(message: string, fn: (originSpinner: any) => T): Promise<T> {
  const oraSpinner = ora(colors.green(message)).start();

  try {
    const result = await fn(oraSpinner);
    oraSpinner.succeed(colors.green(message));
    return result;
  } catch (error) {
    oraSpinner.fail(colors.red(error.toString()));
    return process.exit(0);
  }
}
