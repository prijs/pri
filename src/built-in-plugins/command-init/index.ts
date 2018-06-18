import * as colors from 'colors';
import * as fs from 'fs-extra';
import * as inquirer from 'inquirer';
import * as _ from 'lodash';
import * as open from 'opn';
import * as path from 'path';
import * as portfinder from 'portfinder';
import { pri } from '../../node';
import initPlugin from '../../pri-plugin-commanders/init';
import { globalState } from '../../utils/global-state';
import { log, spinner } from '../../utils/log';
import text from '../../utils/text';

export default async (instance: typeof pri) => {
  instance.commands.registerCommand({
    name: 'init',
    description: text.commander.init.description,
    action: async () => {
      if (!globalState.projectType) {
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
            overrideProjectPackageJson(instance.projectRootPath, {
              pri: { type: 'project' }
            });
            globalState.projectType = 'project';
            break;
          case 'Component':
            overrideProjectPackageJson(instance.projectRootPath, {
              pri: { type: 'component' }
            });
            globalState.projectType = 'component';
            break;
          case 'Pri Plugin':
            overrideProjectPackageJson(instance.projectRootPath, {
              pri: { type: 'plugin' }
            });
            globalState.projectType = 'plugin';
            await initPlugin();
            break;
        }
      }

      await instance.project.ensureProjectFiles();
      await instance.project.checkProjectFiles();

      log(`\n Success init your ${globalState.projectType}, you can run serval commands:\n`);

      switch (globalState.projectType) {
        case 'project':
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

function overrideProjectPackageJson(projectRootPath: string, data: any) {
  const packageJsonPath = path.join(projectRootPath, 'package.json');
  const packageJson = fs.readJsonSync(packageJsonPath, { throws: false });

  fs.writeFileSync(packageJsonPath, JSON.stringify(_.merge({}, packageJson, data), null, 2) + '\n');
}
