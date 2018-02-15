import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './menu.type'
import * as S from './menu.style'
import { StructComponent } from '../struct/struct.component'
import { PureComponent } from '../../utils/react-helper'

import { NewPageComponent } from './new-page/new-page.component'

@Connect
export class MenuComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  public componentDidMount() {
    this.props.ApplicationAction.initSocket()
  }

  render() {
    return (
      <S.Container>
        <NewPageComponent />
      </S.Container>
    )
  }
}
