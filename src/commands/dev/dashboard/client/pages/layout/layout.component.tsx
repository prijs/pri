import { Connect } from "dob-react"
import * as React from "react"
import * as S from "./layout.style"
import { Props, State } from "./layout.type"

import { PureComponent } from "../../utils/react-helper"
import { MainComponent } from "../main/main.component"
import { MenuComponent } from "../menu/menu.component"
import { NavComponent } from "../nav/nav.component"
import { StructComponent } from "../struct/struct.component"

@Connect
export class LayoutComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public componentDidMount() {
    this.props.ApplicationAction.initSocket()
  }

  public render() {
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
