import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./project-root.style"
import { Props, State } from "./project-root.type"

@Connect
export class ProjectRootComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return (
      <S.Container>

      </S.Container>
    )
  }
}
