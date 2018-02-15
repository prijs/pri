import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './project-root.type'
import * as S from './project-root.style'
import { PureComponent } from '../../../utils/react-helper'

@Connect
export class ProjectRootComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    return (
      <S.Container>

      </S.Container>
    )
  }
}
