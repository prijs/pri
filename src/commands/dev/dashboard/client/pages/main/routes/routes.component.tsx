import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './routes.type'
import * as S from './routes.style'
import { PureComponent } from '../../../utils/react-helper'
import { Table } from 'antd'

const handleJumpPage = (pathStr: string) => {
  window.parent.postMessage({
    type: 'changeRoute',
    path: pathStr
  }, "*")
}

const columns: any = [{
  title: 'Path',
  dataIndex: 'path',
  key: 'path',
  render: (pathStr: string) => {
    return (
      <S.PathLink onClick={handleJumpPage.bind(null, pathStr)}>{pathStr}</S.PathLink>
    )
  }
}, {
  title: 'IsIndex',
  dataIndex: 'isIndex',
  key: 'isIndex',
}]

@Connect
export class RoutesComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    if (this.props.ApplciationStore.status === null) {
      return null
    }

    const dataSource = this.props.ApplciationStore.status.info.routes.concat()
      .sort((left, right) => left.path.length - right.path.length)
      .map(route => {
        return {
          key: route.filePath,
          path: route.path,
          isIndex: route.isIndex
        }
      })

    return (
      <S.Container>
        <Table
          dataSource={dataSource}
          columns={columns}
          pagination={false}
        />
      </S.Container>
    )
  }
}
