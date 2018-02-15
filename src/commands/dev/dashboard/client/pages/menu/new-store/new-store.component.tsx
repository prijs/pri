import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './new-store.type'
import * as S from '../menu.style'
import { PureComponent } from '../../../utils/react-helper'
import { Modal } from 'antd'

import FormComponent from './form'

@Connect
export class NewStoreComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  public render() {
    return (
      <S.Container>
        <S.Button onClick={this.showModal}>
          <S.MenuIcon type="plus" />
          New Store
          </S.Button>

        <Modal
          title="New Store"
          visible={this.state.visible}
          footer={null}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
        >
          <FormComponent onSuccess={this.handleCancel} />
        </Modal>
      </S.Container>
    )
  }

  private showModal = () => {
    this.setState({
      visible: true,
    });
  }
  private handleOk = () => {
    this.setState({
      visible: false,
    });
  }
  private handleCancel = () => {
    this.setState({
      visible: false,
    });
  }
}
