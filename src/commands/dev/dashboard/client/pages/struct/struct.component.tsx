import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './struct.type'
import * as S from './struct.style'
import { PureComponent } from '../../utils/react-helper'
import { Tree, Input, Icon } from 'antd'
import { pipeEvent } from '../../../../../../utils/functional'

interface ITreeNode {
  children?: ITreeNode[]
  key: string
  title: string
  icon?: string
  disabled?: boolean
}

const TreeNode = Tree.TreeNode
const Search = Input.Search

const getParentKey = (key: string, tree: ITreeNode[]): string => {
  let parentKey: string
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]
    if (node.children) {
      if (node.children.some((item: any) => item.key === key)) {
        parentKey = node.key
      } else if (getParentKey(key, node.children)) {
        parentKey = getParentKey(key, node.children)
      }
    }
  }
  return parentKey
}

@Connect
export class StructComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  public render() {
    if (this.props.ApplciationStore.status === null) {
      return null
    }

    const treeData = this.getTreeData()

    return (
      <S.Container>
        <S.SearchContainer>
          <Search
            placeholder="Search.."
            onChange={pipeEvent(this.onChange)}
          />
        </S.SearchContainer>

        <S.TreeContainer>
          <Tree
            onExpand={this.onExpand}
            expandedKeys={this.state.expandedKeys}
            autoExpandParent={this.state.autoExpandParent}
          >
            {this.loop(treeData)}
          </Tree>
        </S.TreeContainer>
      </S.Container>
    )
  }

  private getTreeData = () => {
    const treeData: ITreeNode[] = [{
      title: 'Project',
      key: 'project-root',
      icon: 'chrome',
      children: []
    }]

    // Pages
    if (this.props.ApplciationStore.status.info.routes) {
      treeData[0].children.push({
        key: 'routes',
        title: `Routes (${this.props.ApplciationStore.status.info.routes.length})`,
        icon: 'share-alt',
        disabled: this.props.ApplciationStore.status.info.routes.length === 0
      })
    }

    // Stores
    if (this.props.ApplciationStore.status.info.routes) {
      treeData[0].children.push({
        key: 'stores',
        title: `Stores`,
        icon: 'database',
        disabled: true
      })
    }

    // Components
    if (this.props.ApplciationStore.status.info.routes) {
      treeData[0].children.push({
        key: 'components',
        title: `Components`,
        icon: 'appstore-o',
        disabled: true
      })
    }

    // Layout
    treeData[0].children.push({
      key: 'layout',
      title: `Layout`,
      icon: 'layout',
      disabled: !this.props.ApplciationStore.status.info.hasLayoutFile
    })

    // 404
    treeData[0].children.push({
      key: '404',
      title: `404`,
      icon: 'file-unknown',
      disabled: !this.props.ApplciationStore.status.info.has404File
    })

    // Config
    treeData[0].children.push({
      key: 'config',
      title: `Config`,
      icon: 'setting',
      disabled: !this.props.ApplciationStore.status.info.hasConfigFile
    })

    return treeData
  }

  private getFlatData = () => {
    const dataList: Array<{
      key: string
      title: string
    }> = []

    const treeData = this.getTreeData()

    function setFlatData(eachTreeData: ITreeNode[]) {
      eachTreeData.forEach(each => {
        dataList.push({ key: each.key, title: each.title })
        if (each.children) {
          setFlatData(each.children)
        }
      })
    }

    setFlatData(treeData)
    return dataList
  }

  private onExpand = (expandedKeys: string[]) => {
    this.setState({
      expandedKeys,
      autoExpandParent: false,
    })
  }

  private onChange = (value: string) => {
    const treeData = this.getTreeData()

    const expandedKeys = this.getFlatData().map(item => {
      if (item.title.indexOf(value) > -1) {
        return getParentKey(item.key, treeData)
      }
      return null
    })

    this.setState({
      expandedKeys,
      searchValue: value,
      autoExpandParent: true,
    })
  }

  private loop = (data: ITreeNode[]): React.ReactElement<any>[] => data.map(item => {
    const index = item.title.indexOf(this.state.searchValue)
    const beforeStr = item.title.substr(0, index)
    const afterStr = item.title.substr(index + this.state.searchValue.length)
    const icon = item.icon && <Icon style={{ marginRight: 5 }} type={item.icon} />

    const title = index > -1 ? (
      <span>
        {icon}
        {beforeStr}
        <span style={{ color: '#f50' }}>{this.state.searchValue}</span>
        {afterStr}
      </span>
    ) : (
        <span>{icon}{item.title}</span>
      )

    const treeProps = {
      key: item.key,
      title,
      disabled: item.disabled === undefined ? false : item.disabled
    }

    if (item.children) {
      return (
        <TreeNode
          {...treeProps}
        >
          {this.loop(item.children)}
        </TreeNode>
      )
    }
    return (
      <TreeNode
        {...treeProps}
      />
    )
  })
}
