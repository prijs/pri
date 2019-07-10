import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { LayoutComponent } from './pages/layout';
import { ApplicationContext, ApplicationReducer } from './stores';
import { IPlugin } from './define';

export default (plugins?: IPlugin[]) => {
  ReactDOM.render(<Root plugins={plugins} />, document.getElementById('root'));
};

const Root = React.memo((props: { plugins: IPlugin[] }) => {
  const [state, dispatch] = React.useReducer(ApplicationReducer, {
    plugins: [],
    status: null,
    selectedTreeKey: null
  });

  React.useEffect(() => {
    dispatch({
      type: 'loadUiPlugins',
      plugins: props.plugins
    });
  }, [props.plugins]);

  return (
    <ApplicationContext.Provider value={[state, dispatch]}>
      <LayoutComponent />
    </ApplicationContext.Provider>
  );
});
