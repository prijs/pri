/* eslint-disable no-param-reassign */
function getReplacements(state: any) {
  if (state.opts instanceof Array) {
    return state.opts;
  }
  if (state.opts && state.opts.replacements instanceof Array) {
    return state.opts.replacements;
  }
  return [state.opts];
}

export function babelPluginTransformImport({ types: t }: any) {
  const source = (value: any, state: any, pipeImport: any) => t.stringLiteral(pipeImport(value, state.filename));

  return {
    visitor: {
      ImportDeclaration(path: any, state: any) {
        const replacements = getReplacements(state);
        replacements.forEach(({ pipeImport, removeCssImport }: any) => {
          const { value } = path.node.source;

          if (removeCssImport) {
            const cssRegex = '^(.+?)\\.(css|sass|scss|less)$';
            const cssPattern = new RegExp(`^(${cssRegex}|${cssRegex}/.*)$`);

            if (cssPattern.test(value)) {
              path.remove();
            }
          } else {
            path.node.source = source(value, state, pipeImport);
          }
        });
      },

      ExportDeclaration(path: any, state: any) {
        const replacements = getReplacements(state);
        replacements.forEach(({ pipeImport }: any) => {
          if (path.node.source) {
            const { value } = path.node.source;
            path.node.source = source(value, state, pipeImport);
          }
        });
      },

      CallExpression(path: any, state: any) {
        const replacements = getReplacements(state);
        replacements.forEach(({ pipeImport }: any) => {
          const { node } = path;
          if (
            node.callee.name === 'require' &&
            node.arguments &&
            node.arguments.length === 1 &&
            t.isStringLiteral(node.arguments[0])
          ) {
            path.node.arguments = [source(node.arguments[0].value, state, pipeImport)];
          }
        });
      },
    },
  };
}
