import 'antd/dist/antd.css';
import { useStrict } from 'dob';
import { Provider } from 'dob-react';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { LayoutComponent } from './pages/layout/layout.component';
import stores from './stores';

useStrict();

export default (plugins?: any[]) => {
  stores.ApplicationAction.loadUiPlugins(plugins);

  const Root = () => (
    <Provider {...stores}>
      <LayoutComponent />
    </Provider>
  );

  ReactDOM.render(<Root />, document.getElementById('root'));
};
