import * as colors from 'colors';
import * as ora from 'ora';

export function log(...message: string[]) {
  // tslint:disable-next-line:no-console
  console.log.apply(null, message);
}

export function logError(message: string) {
  log(colors.red(message));
  process.exit(0);
}

export async function spinner<T>(message: string, fn: (error: (message?: string) => void) => T): Promise<T> {
  const oraSpinner = ora(colors.green(message)).start();

  let errorMessage: string = null;

  function runError(customMessage: string) {
    errorMessage = customMessage;
  }

  try {
    const result = await fn(runError);

    if (errorMessage) {
      oraSpinner.fail(colors.red(errorMessage));
      return null;
    } else {
      oraSpinner.succeed(colors.green(message));
      return result;
    }
  } catch (error) {
    oraSpinner.fail(colors.red(error));
    return process.exit(0);
  }
}
