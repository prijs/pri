import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './store.type'
import * as S from './store.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class StoreComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>
        Stores TODO
      </S.Container>
    )
  }
}
