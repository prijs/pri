import { plugin } from '../../utils/plugins';
import { IWhiteFile } from '../../utils/define';

export function add(opts: IWhiteFile) {
  plugin.whiteFileRules.push(opts);
}
