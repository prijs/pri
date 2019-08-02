import babelPluginProposalClassProperties from '@babel/plugin-proposal-class-properties';
import babelPluginProposalDecorators from '@babel/plugin-proposal-decorators';
import babelPluginProposalExportNamespace from '@babel/plugin-proposal-export-namespace-from';
import babelPluginProposalFunctionSent from '@babel/plugin-proposal-function-sent';
import babelPluginProposalJsonStrings from '@babel/plugin-proposal-json-strings';
import babelPluginProposalNumericSeparator from '@babel/plugin-proposal-numeric-separator';
import babelPluginProposalOptionalCatchBinding from '@babel/plugin-proposal-optional-catch-binding';
import babelPluginProposalThrowExpressions from '@babel/plugin-proposal-throw-expressions';
import babelPluginSyntaxDynamicImport from '@babel/plugin-syntax-dynamic-import';
import babelPluginSyntaxImportMeta from '@babel/plugin-syntax-import-meta';
import transformRuntime from '@babel/plugin-transform-runtime';
import babelPresetEnv from '@babel/preset-env';
import babelPresetReact from '@babel/preset-react';
import babelPresetTypescript from '@babel/preset-typescript';
import babelPluginReactCssModules from 'babel-plugin-react-css-modules';
import * as babelPluginReactHotLoader from 'react-hot-loader/babel';
import * as _ from 'lodash';
import { globalState } from './global-state';

class DefaultOptions {
  modules: boolean | string = 'auto';

  plugins: any[][] = [];
}

export function getBabelOptions(options?: Partial<DefaultOptions>) {
  const mergedOptions = _.defaults(options || {}, new DefaultOptions());

  return {
    babelrc: false,
    comments: globalState.isDevelopment,
    presets: [[babelPresetEnv, { modules: mergedOptions.modules }], [babelPresetReact], [babelPresetTypescript]],
    plugins: [
      [transformRuntime],
      ...(globalState.isDevelopment ? [[babelPluginReactHotLoader]] : []),
      [babelPluginProposalDecorators, { legacy: true }],
      [babelPluginProposalExportNamespace],
      [babelPluginProposalFunctionSent],
      [babelPluginProposalNumericSeparator],
      [babelPluginProposalThrowExpressions],
      [babelPluginSyntaxDynamicImport],
      [babelPluginSyntaxImportMeta],
      [babelPluginProposalClassProperties, { loose: true }],
      [babelPluginProposalJsonStrings],
      [babelPluginProposalOptionalCatchBinding],
      // TODO: gulp don't support css module
      ...(globalState.sourceConfig.type === 'project'
        ? [
            [
              babelPluginReactCssModules,
              {
                filetypes: {
                  '.scss': {
                    syntax: 'postcss-scss',
                  },
                  '.less': {
                    syntax: 'postcss-less',
                  },
                },
              },
            ],
          ]
        : []),
      ...mergedOptions.plugins,
    ],
  };
}
