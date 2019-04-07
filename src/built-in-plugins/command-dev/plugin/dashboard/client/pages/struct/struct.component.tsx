import { Icon, Tooltip, Tree } from 'antd';
import * as React from 'react';
import * as _ from 'lodash';
import { ApplicationContext } from '../../stores';
import { SocketContext } from '../../utils/context';

interface ITreeNode {
  children?: ITreeNode[];
  key: string;
  title: string;
  icon?: React.ReactElement<any>;
  disabled?: boolean;
}

const { TreeNode } = Tree;

const TreeIcon = (props: any) => <Icon style={{ marginRight: 5 }} {...props} />;

const PlusIcon = (props: any) => (
  <span style={{ transition: 'all 0.2s', marginRight: 5 }}>
    <Icon
      style={{
        color: '#369',
        cursor: 'pointer',
        fontWeight: 'bold'
      }}
      type="plus"
      {...props}
    />
  </span>
);

export const StructComponent = React.memo(() => {
  const socket = React.useContext(SocketContext);
  const [state, dispatch] = React.useContext(ApplicationContext);

  if (!state.status) {
    return null;
  }

  const createLayout = () => {
    socket.emit('createLayout');
  };

  const create404 = () => {
    socket.emit('create404');
  };

  const createConfig = () => {
    socket.emit('createConfig');
  };

  const treeData: ITreeNode[] = [
    {
      title: 'Project',
      key: 'project-root',
      icon: React.createElement(TreeIcon, {
        type: 'chrome'
      }),
      children: []
    }
  ];

  // Pages
  const pages = _.get(state.status, 'analyseInfo.projectAnalysePages.pages', []);
  treeData[0].children.push({
    key: 'routes',
    title: `Routes (${pages.length})`,
    icon: <TreeIcon type="share-alt" />,
    disabled: pages.length === 0
  });

  // Layout
  const hasLayout = _.get(state.status, 'analyseInfo.projectAnalyseLayout.hasLayout', false);
  treeData[0].children.push({
    key: 'layout',
    title: `Layout`,
    icon: hasLayout ? (
      <TreeIcon type="layout" />
    ) : (
      <Tooltip title="Auto create layout files." placement="right">
        <PlusIcon onClick={createLayout} />
      </Tooltip>
    ),
    disabled: !hasLayout
  });

  // 404
  const hasNotFound = _.get(state.status, 'analyseInfo.projectAnalyseNotFound.hasNotFound', false);
  treeData[0].children.push({
    key: '404',
    title: `404`,
    icon: hasNotFound ? (
      <TreeIcon type="file-unknown" />
    ) : (
      <Tooltip title="Auto create 404 page." placement="right">
        <PlusIcon onClick={create404} />
      </Tooltip>
    ),
    disabled: !hasNotFound
  });

  // Config
  const hasConfig = _.get(state.status, 'analyseInfo.projectAnalyseConfig.hasConfig', false);
  treeData[0].children.push({
    key: 'config',
    title: `Config`,
    icon: hasConfig ? (
      <TreeIcon type="setting" />
    ) : (
      <Tooltip title="Auto create config files." placement="right">
        <PlusIcon onClick={createConfig} />
      </Tooltip>
    ),
    disabled: !hasConfig
  });

  const loop = (data: ITreeNode[]): React.ReactElement<any>[] =>
    data.map((item, eachIndex) => {
      const title = (
        <span>
          {item.icon}
          {item.title}
        </span>
      );

      const treeProps = {
        key: item.key,
        title,
        disabled: item.disabled === undefined ? false : item.disabled
      };

      if (item.children) {
        return <TreeNode {...treeProps}>{loop(item.children)}</TreeNode>;
      }
      return <TreeNode key={eachIndex} {...treeProps} />;
    });

  const handleSelectTreeNode = (selectedKeys: string[]) => {
    dispatch({
      type: 'setSelectedTreeKey',
      selectedTreeKey: selectedKeys[0]
    });
  };

  if (state.status === null || state.status === undefined) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 10 }}>
      <div style={{ overflowY: 'auto' }}>
        <Tree defaultExpandAll={true} onSelect={handleSelectTreeNode} selectedKeys={[state.selectedTreeKey]}>
          {loop(treeData)}
        </Tree>
      </div>
    </div>
  );
});
