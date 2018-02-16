import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./stores.style"
import { Props, State } from "./stores.type"

@Connect
export class StoresComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return (
      <S.Container>
        Store TODO
      </S.Container>
    )
  }
}
