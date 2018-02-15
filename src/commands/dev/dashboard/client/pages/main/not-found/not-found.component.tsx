import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './not-found.type'
import * as S from './not-found.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class NotFoundComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>
        404 TODO
      </S.Container>
    )
  }
}
