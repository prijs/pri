import * as React from 'react';
import { NewPageComponent } from './new-page/new-page';

export const MenuComponent = React.memo(() => {
  return (
    <div style={{ display: 'flex' }}>
      <NewPageComponent />
    </div>
  );
});
