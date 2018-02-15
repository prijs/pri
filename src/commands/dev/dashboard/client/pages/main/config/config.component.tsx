import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './config.type'
import * as S from './config.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class ConfigComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>
        Config TODO
      </S.Container>
    )
  }
}
