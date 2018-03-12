import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./layout.style"
import { Props, State } from "./layout.type"

@Connect
export class LayoutComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return <S.Container>Layout TODO</S.Container>
  }
}
