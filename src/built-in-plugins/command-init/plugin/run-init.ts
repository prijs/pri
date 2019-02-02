import * as colors from 'colors';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import { pri } from '../../../node';
import { globalState } from '../../../utils/global-state';
import { logText } from '../../../utils/log';
import text from '../../../utils/text';
import { addWhiteFilesByProjectType } from '../../../utils/white-file-helper';

export const runInit = async () => {
  if (!globalState.projectPackageJson.pri.type) {
    const inquirerInfo = await inquirer.prompt([
      {
        message: `Choose project type`,
        name: 'projectType',
        type: 'list',
        choices: ['Project', 'Component', 'Pri Plugin', 'Cli']
      }
    ]);

    switch (inquirerInfo.projectType) {
      case 'Project':
        globalState.projectPackageJson.pri.type = 'project';
        break;
      case 'Component':
        globalState.projectPackageJson.pri.type = 'component';
        break;
      case 'Pri Plugin':
        globalState.projectPackageJson.pri.type = 'plugin';
        break;
      case 'Cli':
        globalState.projectPackageJson.pri.type = 'cli';
        break;
    }
  }

  // Add white files by projectType because we might change project type above.
  addWhiteFilesByProjectType();

  await pri.project.ensureProjectFiles();
  await pri.project.checkProjectFiles();

  logText(`\n Success init your ${globalState.projectPackageJson.pri.type}, you can run serval commands:\n`);

  switch (globalState.projectPackageJson.pri.type) {
    case 'project':
    case 'plugin':
    case 'cli':
      logText(colors.blue('  npm start'));
      logText(`    ${text.commander.dev.description}\n`);
      break;
    case 'component':
      logText(colors.blue('  npm run docs'));
      logText(`    ${text.commander.docs.description}\n`);
      break;
    default:
  }

  logText(colors.blue('  npm run build'));
  logText(`    ${text.commander.build.description}\n`);

  switch (globalState.projectPackageJson.pri.type) {
    case 'project':
      logText(colors.blue('  npm run preview'));
      logText(`    ${text.commander.dev.description}\n`);
      break;
    case 'component':
    case 'plugin':
    case 'cli':
      logText(colors.blue('  npm publish'));
      logText(`    Publish this component to npm package.\n`);
      break;
    default:
  }

  logText(colors.blue('  npm test'));
  logText('    Run tests.\n');

  logText('\n Happy hacking!');

  // For async register commander, process will be exit automatic.
  process.exit(0);
};
