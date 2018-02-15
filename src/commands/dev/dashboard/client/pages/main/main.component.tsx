import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './main.type'
import * as S from './main.style'
import { PureComponent } from '../../utils/react-helper'

@Connect
export class MainComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  public componentDidMount() {

  }

  render() {
    return (
      <S.Container>

      </S.Container>
    )
  }
}
