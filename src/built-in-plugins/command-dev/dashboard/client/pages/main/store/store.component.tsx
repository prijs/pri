import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./store.style"
import { Props, State } from "./store.type"

@Connect
export class StoreComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return (
      <S.Container>
        Stores TODO
      </S.Container>
    )
  }
}
