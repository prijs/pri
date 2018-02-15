import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './layout.type'
import * as S from './layout.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class LayoutComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>
        Layout TODO
      </S.Container>
    )
  }
}
