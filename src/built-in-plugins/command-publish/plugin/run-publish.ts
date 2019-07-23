import { PublishOption } from './interface';
import { exec } from '../../../utils/exec';
import { pri } from '../../../node';

export const publish = async (options: PublishOption) => {
  // await exec(`${pri.sourceConfig.npmClient} publish --ignore-scripts ${options.tag ? `--tag ${options.tag}` : ''}`, {
  //   cwd: pri.projectRootPath
  // });
};
