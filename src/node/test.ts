import { plugin } from '../utils/plugins';
import { IJestConfigPipe, IAfterTestRun } from '../utils/define';

export const pipeJestConfig = (pipe: IJestConfigPipe) => {
  plugin.jestConfigPipes.push(pipe);
};

export const afterTestRun = (callback: IAfterTestRun) => {
  plugin.afterTestRunCallbacks.push(callback);
};
