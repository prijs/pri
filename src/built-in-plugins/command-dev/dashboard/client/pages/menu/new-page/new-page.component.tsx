import { Icon, Modal } from 'antd';
import { Connect } from 'dob-react';
import * as React from 'react';
import { PureComponent } from '../../../utils/react-helper';
import { Props, State } from './new-page.type';

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

@Connect
export class NewPageComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props();
  public state = new State();

  public render() {
    return (
      <div style={{ display: 'flex' }}>
        <div onClick={this.showModal} style={buttonStyle}>
          <MenuIcon style={buttonStyle} type="file-add" />
          New Page
        </div>

        <Modal
          title="New Page"
          visible={this.state.visible}
          footer={null}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <FormComponent onSuccess={this.handleCancel} />
        </Modal>
      </div>
    );
  }

  private showModal = () => {
    this.setState({
      visible: true
    });
  };
  private handleOk = () => {
    this.setState({
      visible: false
    });
  };
  private handleCancel = () => {
    this.setState({
      visible: false
    });
  };
}
