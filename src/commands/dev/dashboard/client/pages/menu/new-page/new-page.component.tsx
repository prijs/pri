import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './new-page.type'
import * as S from '../menu.style'
import { PureComponent } from '../../../utils/react-helper'
import { Modal } from 'antd'

import FormComponent from './form'

@Connect
export class NewPageComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

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
