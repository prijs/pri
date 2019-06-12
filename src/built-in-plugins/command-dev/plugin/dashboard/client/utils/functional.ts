import * as React from 'react';
import { IPlugin } from '../define';

export const pipeEvent = (func: any) => {
  return (event: any) => {
    return func(event.target.value, event);
  };
};

export const loadPluginsByPosition = (plugins: IPlugin[], position: string, props?: any): JSX.Element => {
  return plugins
    .filter(plugin => {
      return plugin.position === position;
    })
    .map((plugin, index) => {
      return React.createElement(plugin.view, { key: index, ...props });
    }) as any;
};
