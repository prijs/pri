import * as React from 'react';
import { Config } from './config';
import { Layout } from './layout';
import { NotFound } from './not-found';
import { ProjectRoot } from './project-root';
import { Routes } from './routes';
import { ApplicationContext } from '../../stores';
import { loadPluginsByPosition } from '../../utils/functional';

export const MainComponent = React.memo(() => {
  const [state] = React.useContext(ApplicationContext);

  switch (state.selectedTreeKey) {
    case 'project-root':
      return <ProjectRoot />;
    case 'routes':
      return <Routes />;
    case 'layout':
      return <Layout />;
    case '404':
      return <NotFound />;
    case 'config':
      return <Config />;
    default:
      return loadPluginsByPosition(state.plugins, `tree-${state.selectedTreeKey}`);
  }
});
