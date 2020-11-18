import { plugin } from '../utils/plugins';
import { IJestConfigPipe } from '../utils/define';

export const pipeJestConfig = (pipe: IJestConfigPipe) => {
  plugin.jestConfigPipes.push(pipe);
};
