import { Table } from "antd"
import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../../utils/react-helper"
import * as S from "./routes.style"
import { Props, State } from "./routes.type"

const handleJumpPage = (pathStr: string) => {
  window.parent.postMessage(
    {
      type: "changeRoute",
      path: pathStr
    },
    "*"
  )
}

const columns: any = [
  {
    title: "Path",
    dataIndex: "path",
    key: "path",
    render: (pathStr: string) => {
      return (
        <S.PathLink onClick={handleJumpPage.bind(null, pathStr)}>
          {pathStr}
        </S.PathLink>
      )
    }
  }
]

@Connect
export class RoutesComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    if (this.props.ApplciationStore.status === null) {
      return null
    }

    const pages = this.props.ApplciationStore.status.analyseInfo
      .projectAnalysePages
      ? this.props.ApplciationStore.status.analyseInfo.projectAnalysePages.pages
      : []
    const markdownPages = this.props.ApplciationStore.status.analyseInfo
      .projectAnalyseMarkdownPages
      ? this.props.ApplciationStore.status.analyseInfo
          .projectAnalyseMarkdownPages.pages
      : []
    const allPages = [...pages, ...markdownPages]

    const dataSource = allPages
      .concat()
      .sort((left, right) => left.routerPath.length - right.routerPath.length)
      .map(route => {
        return { key: route.routerPath, path: route.routerPath }
      })

    return (
      <S.Container>
        <Table dataSource={dataSource} columns={columns} pagination={false} />
      </S.Container>
    )
  }
}
