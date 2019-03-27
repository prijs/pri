import * as colors from 'colors';
import * as ora from 'ora';
import * as signale from 'signale';

export function logText(...message: string[]) {
  // eslint-disable-next-line no-console
  console.log(...message);
}

export function logWarn(message: string) {
  signale.warn(message);
}

export function logFatal(message: string) {
  signale.fatal(new Error(message));
  process.exit(1);
}

export function logInfo(message: string) {
  signale.info(message);
}

export function logAwait(message: string) {
  signale.await(message);
}

export function logComplete(message: string) {
  signale.complete(message);
}

export function logSuccess(message: string) {
  signale.success(message);
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
    }
    oraSpinner.succeed(colors.green(message));
    return result;
  } catch (error) {
    signale.fatal(error);
    return process.exit(0);
  }
}
