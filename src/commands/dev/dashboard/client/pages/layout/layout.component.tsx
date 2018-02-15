import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './layout.type'
import * as S from './layout.style'

import { StructComponent } from '../struct/struct.component'
import { MenuComponent } from '../menu/menu.component'
import { NavComponent } from '../nav/nav.component'
import { MainComponent } from '../main/main.component'
import { PureComponent } from '../../utils/react-helper'

@Connect
export class LayoutComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  public componentDidMount() {
    this.props.ApplicationAction.initSocket()
  }

  render() {
    return (
      <S.Container>
        <S.ContainerLeft>
          <S.TopContainer>
            <NavComponent />
          </S.TopContainer>

          <S.BottomContainer>
            <StructComponent />
          </S.BottomContainer>
        </S.ContainerLeft>

        <S.ContainerRight>
          <S.TopContainer>
            <MenuComponent />
          </S.TopContainer>

          <S.BottomContainer>
            <MainComponent />
          </S.BottomContainer>
        </S.ContainerRight>
      </S.Container>
    )
  }
}
