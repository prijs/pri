import { plugin } from '../utils/plugins';
import { CommandRegister } from '../utils/define';

export const registerCommand = (opts: CommandRegister) => {
  plugin.commands.push(opts);
};

export const expandCommand = (opts: CommandRegister) => {
  plugin.commands.push(opts);
};
