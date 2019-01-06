import { ICommandRegister, plugin } from '../utils/plugins';

export const registerCommand = (opts: ICommandRegister) => {
  plugin.commands.push(opts);
};

export const expandCommand = (opts: ICommandRegister) => {
  plugin.commands.push(opts);
};
