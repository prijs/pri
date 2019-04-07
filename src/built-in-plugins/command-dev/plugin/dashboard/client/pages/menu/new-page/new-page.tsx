import { Icon, Modal } from 'antd';
import * as React from 'react';

import FormComponent from './form';

export const MenuIcon = (props: any) => <Icon style={{ fontSize: 15, marginRight: 10 }} {...props} />;

const buttonStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 14,
  color: '#666',
  borderRight: '1px solid #eee',
  padding: '0 10px',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

export const NewPageComponent = React.memo(() => {
  const [visible, setVisible] = React.useState(false);

  const showModal = React.useCallback(() => {
    setVisible(() => true);
  }, []);

  const handleOk = React.useCallback(() => {
    setVisible(() => false);
  }, []);

  const handleCancel = React.useCallback(() => {
    setVisible(() => false);
  }, []);

  return (
    <div style={{ display: 'flex' }}>
      <div onClick={showModal} style={buttonStyle}>
        <MenuIcon style={buttonStyle} type="file-add" />
        New Page
      </div>

      <Modal title="New Page" visible={visible} footer={null} onOk={handleOk} onCancel={handleCancel}>
        <FormComponent onSuccess={handleCancel} />
      </Modal>
    </div>
  );
});
