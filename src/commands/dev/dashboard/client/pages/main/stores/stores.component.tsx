import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './stores.type'
import * as S from './stores.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class StoresComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>
        Store TODO
      </S.Container>
    )
  }
}
