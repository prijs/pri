import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./not-found.style"
import { Props, State } from "./not-found.type"

@Connect
export class NotFoundComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return <S.Container>404 TODO</S.Container>
  }
}
