import { plugin } from '../../utils/plugins';
import { IWhiteFile } from '../../utils/plugins-interface';

export function add(opts: IWhiteFile) {
  plugin.whiteFileRules.push(opts);
}
