import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Styled from "./icon.style"
import * as typings from "./icon.type"

import add from "../assets/add"

const iconMap = new Map<string, (size: number) => React.ReactElement<any>>()
iconMap.set("add", add)

export class Icon extends React.Component<typings.Props, typings.State> {
  public static defaultProps = new typings.Props()
  public state = new typings.State()

  public render() {
    return (
      <Styled.Container className={this.props.className}>
        {iconMap.get(this.props.type)(this.props.size)}
      </Styled.Container>
    )
  }
}
