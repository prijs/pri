import * as _ from 'lodash';
import { plugin } from '../utils/plugins';

interface CommandOpt {
  name: string[];
  action: (options?: any) => Promise<void>;
  alias?: string | string[];
  description?: string;
  options?: {
    [optionName: string]: {
      alias?: string;
      description?: string;
      required?: boolean;
    };
  };
}

export const registerCommand = (opts: CommandOpt) => {
  const existCommand = plugin.commands.find(eachCommand => _.isEqual(eachCommand.name, opts.name));

  if (!existCommand) {
    plugin.commands.push({
      ...opts,
      actions: opts.action ? [opts.action] : [],
    });
  } else {
    existCommand.actions.push(opts.action);
    existCommand.options = {
      ...(existCommand.options || {}),
      ...(opts.options || {}),
    };
  }
};
