import babelPluginProposalDecorators from '@babel/plugin-proposal-decorators';
import babelPluginProposalExportNamespace from '@babel/plugin-proposal-export-namespace-from';
import babelPluginProposalFunctionSent from '@babel/plugin-proposal-function-sent';
import babelPluginProposalNumericSeparator from '@babel/plugin-proposal-numeric-separator';
import babelPluginProposalThrowExpressions from '@babel/plugin-proposal-throw-expressions';
import transformRuntime from '@babel/plugin-transform-runtime';
import babelEnv from '@babel/preset-env';

export const babelOptions = {
  babelrc: false,
  comments: true,
  presets: [[babelEnv]],
  plugins: [
    [transformRuntime],
    [babelPluginProposalDecorators, { legacy: true }],
    [babelPluginProposalExportNamespace],
    [babelPluginProposalFunctionSent],
    [babelPluginProposalNumericSeparator],
    [babelPluginProposalThrowExpressions]
  ]
};
