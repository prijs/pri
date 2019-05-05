import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as path from 'path';
import { pri } from '../../../node';
import { globalState } from '../../../utils/global-state';
import { logFatal, logText } from '../../../utils/log';
import { plugin } from '../../../utils/plugins';
import text from '../../../utils/text';
import { addWhiteFilesByProjectType } from '../../../utils/white-file-helper';
import { ProjectType } from '../../../utils/define';

export const runInit = async () => {
  if (!fs.existsSync(path.join(pri.projectRootPath, 'package.json'))) {
    logFatal(`No package.json! please run "npm init" first.`);
  }

  if (!globalState.sourceConfig.type) {
    let userSelectType: ProjectType = null;

    if (!plugin.initType) {
      const inquirerInfo = await inquirer.prompt([
        {
          message: `Choose project type`,
          name: 'projectType',
          type: 'list',
          choices: ['Project', 'Component', 'Pri Plugin']
        }
      ]);

      switch (inquirerInfo.projectType) {
        case 'Project':
          userSelectType = 'project';
          break;
        case 'Component':
          userSelectType = 'component';
          break;
        case 'Pri Plugin':
          userSelectType = 'plugin';
          break;
        default:
      }
    } else {
      userSelectType = plugin.initType;
    }

    switch (userSelectType) {
      case 'project':
        globalState.sourceConfig.type = 'project';
        break;
      case 'component':
        globalState.sourceConfig.type = 'component';
        break;
      case 'plugin':
        globalState.sourceConfig.type = 'plugin';
        break;
      default:
    }
  }

  // Add white files by projectType because we might change project type above.
  addWhiteFilesByProjectType();

  await pri.project.ensureProjectFiles();
  await pri.project.checkProjectFiles();

  logText(`\n Success init your ${globalState.sourceConfig.type}, you can run serval commands:\n`);

  switch (globalState.sourceConfig.type) {
    case 'project':
    case 'plugin':
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

  switch (globalState.sourceConfig.type) {
    case 'project':
      logText(colors.blue('  npm run preview'));
      logText(`    ${text.commander.dev.description}\n`);
      break;
    case 'component':
    case 'plugin':
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
