import { Arguments } from 'yargs';

export type IOpts = Arguments<{
  skipLint?: boolean;
  updateSnapshot?: boolean;
  watch?: boolean;
  watchAll?: boolean;
}>;
