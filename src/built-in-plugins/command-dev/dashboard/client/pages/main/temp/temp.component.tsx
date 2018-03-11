import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./temp.style"
import { Props, State } from "./temp.type"

@Connect
export class TempComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return (
      <S.Container>

      </S.Container>
    )
  }
}
