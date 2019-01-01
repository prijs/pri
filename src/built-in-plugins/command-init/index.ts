import * as colors from 'colors';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import { pri } from '../../node';
import { globalState } from '../../utils/global-state';
import { log } from '../../utils/log';
import text from '../../utils/text';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: ['init'],
    description: text.commander.init.description,
    action: async () => {
      if (!globalState.projectType) {
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
            globalState.projectType = 'project';
            break;
          case 'Component':
            globalState.projectType = 'component';
            break;
          case 'Pri Plugin':
            globalState.projectType = 'plugin';
            break;
          case 'Cli':
            globalState.projectType = 'cli';
            break;
        }
      }

      await instance.project.ensureProjectFiles();
      await instance.project.checkProjectFiles();

      log(`\n Success init your ${globalState.projectType}, you can run serval commands:\n`);

      switch (globalState.projectType) {
        case 'project':
        case 'plugin':
        case 'cli':
          log(colors.blue('  npm start'));
          log(`    ${text.commander.dev.description}\n`);
          break;
        case 'component':
          log(colors.blue('  npm run docs'));
          log(`    ${text.commander.docs.description}\n`);
          break;
        default:
      }

      log(colors.blue('  npm run build'));
      log(`    ${text.commander.build.description}\n`);

      switch (globalState.projectType) {
        case 'project':
          log(colors.blue('  npm run preview'));
          log(`    ${text.commander.dev.description}\n`);
          break;
        case 'component':
        case 'plugin':
        case 'cli':
          log(colors.blue('  npm publish'));
          log(`    Publish this component to npm package.\n`);
          break;
        default:
      }

      log(colors.blue('  npm test'));
      log('    Run tests.\n');

      log('\n Happy hacking!');

      // For async register commander, process will be exit automatic.
      process.exit(0);
    }
  });
};
