import { Modal } from 'antd';
import { Connect } from 'dob-react';
import * as React from 'react';
import { PureComponent } from '../../../utils/react-helper';
import * as S from '../menu.style';
import { Props, State } from './new-page.type';

import FormComponent from './form';

@Connect
export class NewPageComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props();
  public state = new State();

  public render() {
    return (
      <S.Container>
        <S.Button onClick={this.showModal}>
          <S.MenuIcon type="file-add" />
          New Page
        </S.Button>

        <Modal
          title="New Page"
          visible={this.state.visible}
          footer={null}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <FormComponent onSuccess={this.handleCancel} />
        </Modal>
      </S.Container>
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
