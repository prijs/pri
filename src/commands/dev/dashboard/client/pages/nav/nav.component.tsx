import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './nav.type'
import * as S from './nav.style'
import { PureComponent } from '../../utils/react-helper'

@Connect
export class NavComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>
        <span>
          Pri dashboard
        </span>
        <S.Link href="https://github.com/ascoders/pri" target="_blank">Docs</S.Link>
      </S.Container>
    )
  }
}
