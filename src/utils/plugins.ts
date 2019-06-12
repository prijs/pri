import * as fs from 'fs-extra';
import * as _ from 'lodash';
import * as path from 'path';
import { globalState } from './global-state';
import { logFatal } from './log';
import {
  IAfterProdBuild,
  IAnalyseProject,
  IBuildConfigPipe,
  ICreateEntry,
  IEnsureProjectFilesQueue,
  ILintFilter,
  ILoaderExcludePipe,
  ILoaderIncludePipe,
  ILoaderOptionsPipe,
  IPluginModule,
  IWhiteFile,
  CommandRegister,
  ProjectType
} from './define';

import * as pluginClientSsr from '../built-in-plugins/client-ssr';
import * as pluginCommandAnalyse from '../built-in-plugins/command-analyse';
import * as pluginCommandBuild from '../built-in-plugins/command-build';
import * as pluginCommandBundle from '../built-in-plugins/command-bundle';
import * as pluginCommandDev from '../built-in-plugins/command-dev';
import * as pluginCommandDocs from '../built-in-plugins/command-docs';
import * as pluginCommandInit from '../built-in-plugins/command-init';
import * as pluginCommandPreview from '../built-in-plugins/command-preview';
import * as pluginCommandTest from '../built-in-plugins/command-test';
import * as pluginEnsureProjectFiles from '../built-in-plugins/ensure-project-files';
import * as pluginMocks from '../built-in-plugins/mocks';
import * as pluginProjectAnalyseConfig from '../built-in-plugins/project-analyse-config';
import * as pluginProjectAnalyseLayouts from '../built-in-plugins/project-analyse-layouts';
import * as pluginProjectAnalyseNotFound from '../built-in-plugins/project-analyse-not-found';
import * as pluginProjectAnalysePages from '../built-in-plugins/project-analyse-pages';
import * as pluginServiceWorker from '../built-in-plugins/service-worker';
import * as whiteFiles from '../built-in-plugins/white-files';

export const loadedPlugins = new Set<IPluginModule>();

export class IPluginConfig {
  public analyseInfo?: any = {};

  public commands?: CommandRegister[] = [];

  public buildConfigPipes: IBuildConfigPipe[] = [];

  public bundleConfigPipes: IBuildConfigPipe[] = [];

  public buildConfigStyleLoaderOptionsPipes: ILoaderOptionsPipe[] = [];

  public buildConfigCssLoaderOptionsPipes: ILoaderOptionsPipe[] = [];

  public buildConfigSassLoaderOptionsPipes: ILoaderOptionsPipe[] = [];

  public buildConfigLessLoaderOptionsPipes: ILoaderOptionsPipe[] = [];

  public buildConfigBabelLoaderOptionsPipes: ILoaderOptionsPipe[] = [];

  public buildConfigJsLoaderIncludePipes: ILoaderIncludePipe[] = [];

  public buildConfigSassLoaderIncludePipes: ILoaderIncludePipe[] = [];

  public buildConfigLessLoaderIncludePipes: ILoaderIncludePipe[] = [];

  public buildConfigJsLoaderExcludePipes: ILoaderExcludePipe[] = [];

  public buildConfigSassLoaderExcludePipes: ILoaderExcludePipe[] = [];

  public buildConfigLessLoaderExcludePipes: ILoaderExcludePipe[] = [];

  public buildAfterProdBuild: IAfterProdBuild[] = [];

  public projectAnalyses: IAnalyseProject[] = [];

  public projectCreateEntrys: ICreateEntry[] = [];

  public whiteFileRules: IWhiteFile[] = [];

  public ensureProjectFilesQueue: IEnsureProjectFilesQueue[] = [];

  public devServices: { socketListeners: { name: string; callback: () => void }[] } = { socketListeners: [] };

  public lintFilters: ILintFilter[] = [];

  // Lock init type
  public initType: ProjectType = null;
}

export const plugin: IPluginConfig = new IPluginConfig();

let hasInitPlugins = false;

export const loadPlugins = async (pluginIncludeRoots: string[] = []) => {
  if (hasInitPlugins) {
    return;
  }
  hasInitPlugins = true;

  const builtInPlugins: IPluginModule[] = [
    pluginClientSsr,
    pluginCommandAnalyse,
    pluginCommandBuild,
    pluginCommandBundle,
    pluginCommandDev,
    pluginCommandDocs,
    pluginCommandInit,
    pluginCommandPreview,
    pluginCommandTest,
    pluginEnsureProjectFiles,
    pluginMocks,
    whiteFiles,
    pluginProjectAnalyseConfig,
    pluginProjectAnalyseLayouts,
    pluginProjectAnalyseNotFound,
    pluginProjectAnalysePages,
    pluginServiceWorker
  ];
  builtInPlugins.forEach(eachPlugin => {
    loadedPlugins.add(eachPlugin);
  });

  if (globalState.projectConfig.type !== 'plugin') {
    getPriPlugins(
      globalState.projectRootPath,
      pluginIncludeRoots.concat(globalState.projectRootPath).map(pluginIncludeRoot => {
        return path.join(pluginIncludeRoot, 'package.json');
      })
    );
  }

  if (loadedPlugins.size > 1) {
    for (const eachPlugin of getPluginsByOrder()) {
      const pluginInstance = await eachPlugin.getPlugin();
      // If plugin has export main, await it.
      if (pluginInstance.main) {
        await pluginInstance.main();
      }
    }
  }
};

function getPriPlugins(pluginRootPath: string, packageJsonPaths: string[]) {
  // Do not load plugins when type is 'plugin'.
  // Load plugin even when type is undefined.
  if (globalState.sourceConfig.type === 'plugin') {
    return;
  }

  const deps = packageJsonPaths.map(packageJsonPath => {
    return getDependencesByPackageJsonPath(packageJsonPath);
  });
  const allDependencies = deps.reduce((obj, next) => {
    Object.assign(obj, next);
    return obj;
  }, {});

  Object.keys(allDependencies)
    .filter(subPackageName => {
      return subPackageName.startsWith('pri-plugin') || subPackageName.startsWith('@ali/pri-plugin');
    })
    .map(subPackageName => {
      // Can't allowed same name plugins
      if (
        Array.from(loadedPlugins).some(loadedPlugin => {
          return loadedPlugin.getConfig().name === subPackageName;
        })
      ) {
        logFatal(`There are two plugins named ${subPackageName}!`);
      }

      const subPackageVersion = allDependencies[subPackageName];
      const subPackageRealEntry = subPackageVersion.startsWith('file:')
        ? path.join(pluginRootPath, subPackageVersion.replace(/^file:/g, ''))
        : subPackageName;

      const subPackageRealEntryFilePath = require.resolve(subPackageRealEntry, {
        paths: [__dirname, pluginRootPath]
      });

      const subPackageAbsolutePath = !subPackageVersion.startsWith('file:')
        ? getPackageJsonPathByPathOrNpmName(subPackageName, pluginRootPath)
        : path.resolve(pluginRootPath, subPackageVersion.replace(/^file:/g, ''), 'package.json');

      // eslint-disable-next-line global-require,@typescript-eslint/no-var-requires,import/no-dynamic-require
      const instance: IPluginModule = require(subPackageRealEntryFilePath);

      if (!instance.getConfig) {
        logFatal('Plugin must impletement getConfig method!');
      }

      if (!instance.getPlugin) {
        logFatal('Plugin must impletement getPlugin method!');
      }

      if (!instance.getConfig().name) {
        logFatal('Plugin must have name!');
      }

      loadedPlugins.add(instance);

      if (subPackageAbsolutePath) {
        getPriPlugins(path.resolve(subPackageAbsolutePath, '..'), [subPackageAbsolutePath]);
      }
    });
}

export function getPluginsByOrder() {
  const instantiatedPluginNames = new Set<string>();
  const outputPlugins: IPluginModule[] = [];

  // Check deps has been loaded
  loadedPlugins.forEach(loadedPlugin => {
    if (loadedPlugin.getConfig().dependencies) {
      loadedPlugin.getConfig().dependencies.forEach(depPluginName => {
        if (
          !Array.from(loadedPlugins).some(eachLoadedPlugin => {
            return eachLoadedPlugin.getConfig().name === depPluginName;
          })
        ) {
          logFatal(
            `${loadedPlugin.getConfig().name}: No dependent "${depPluginName}"\nTry: npm install ${depPluginName}.`
          );
        }
      });
    }
  });

  // Push to plugin quene.
  while (instantiatedPluginNames.size !== loadedPlugins.size) {
    const currentInstantiatedPlugins = getPluginWithPreloadDependences(Array.from(instantiatedPluginNames));
    currentInstantiatedPlugins.forEach(eachPlugin => {
      return outputPlugins.push(eachPlugin);
    });

    if (currentInstantiatedPlugins.length === 0) {
      throw Error('Plugin loop dependency.');
    }

    currentInstantiatedPlugins.forEach(eachPlugin => {
      return instantiatedPluginNames.add(eachPlugin.getConfig().name);
    });
  }

  return outputPlugins;
}

function getPluginWithPreloadDependences(preInstantiatedDependences: string[]) {
  return (
    Array.from(loadedPlugins)
      // Filter plugins who are not instantiated.
      .filter(loadedPlugin => {
        if (preInstantiatedDependences.length === 0) {
          return true;
        }

        return (
          preInstantiatedDependences.findIndex(pluginName => {
            return loadedPlugin.getConfig().name === pluginName;
          }) === -1
        );
      })
      // Filter plugins who satisfied the dependence condition.
      .filter(loadedPlugin => {
        // No dependences obvious can pass.
        if (!loadedPlugin.getConfig().dependencies) {
          return true;
        }
        if (
          loadedPlugin.getConfig().dependencies.every(depPluginName => {
            return preInstantiatedDependences.indexOf(depPluginName) > -1;
          })
        ) {
          return true;
        }
        return false;
      })
      .map(loadedPlugin => {
        return loadedPlugin;
      })
  );
}

function getPackageJsonPathByPathOrNpmName(pathOrNpmName: string, currentRootPath: string) {
  try {
    return require.resolve(path.join(pathOrNpmName, 'package.json'), { paths: [__dirname, currentRootPath] });
  } catch (error) {
    return null;
  }
}

function getDependencesByPackageJsonPath(packageJsonPath: string) {
  const packageJsonExist = fs.existsSync(packageJsonPath);
  const packageJson = packageJsonExist ? fs.readJsonSync(packageJsonPath) : null;

  return {
    ..._.get(packageJson, 'dependencies', {}),
    ..._.get(packageJson, 'devDependencies', {})
  };
}
