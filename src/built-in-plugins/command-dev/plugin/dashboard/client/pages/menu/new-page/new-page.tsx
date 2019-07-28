import * as React from 'react';
import { Dialog, DialogTitle, DialogContent } from '@material-ui/core';
import FormComponent from './form';

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  color: '#666',
  borderRight: '1px solid #eee',
  padding: '0 10px',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
};

export const NewPageComponent = React.memo(() => {
  const [visible, setVisible] = React.useState(false);

  const showModal = React.useCallback(() => {
    setVisible(() => {
      return true;
    });
  }, []);

  const handleCancel = React.useCallback(() => {
    setVisible(() => {
      return false;
    });
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <div onClick={showModal} style={buttonStyle}>
        New Page
      </div>

      <Dialog open={visible} onClose={handleCancel}>
        <DialogTitle>New Page</DialogTitle>
        <DialogContent>
          <FormComponent onSuccess={handleCancel} />
        </DialogContent>
      </Dialog>
    </div>
  );
});
