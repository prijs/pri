import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './temp.type'
import * as S from './temp.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class TempComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>

      </S.Container>
    )
  }
}
