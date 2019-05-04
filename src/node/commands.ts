import { plugin } from '../utils/plugins';
import { ICommandRegister } from '../utils/define';

export const registerCommand = (opts: ICommandRegister) => {
  plugin.commands.push(opts);
};

export const expandCommand = (opts: ICommandRegister) => {
  plugin.commands.push(opts);
};
