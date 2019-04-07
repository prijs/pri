import { Table } from 'antd';
import * as React from 'react';
import { ApplicationContext } from '../../stores';

const handleJumpPage = (pathStr: string) => {
  window.parent.postMessage(
    {
      type: 'changeRoute',
      path: pathStr
    },
    '*'
  );
};

const columns: any = [
  {
    title: 'Path',
    dataIndex: 'path',
    key: 'path',
    render: (pathStr: string) => {
      return (
        <span style={{ color: '#1890ff', cursor: 'pointer' }} onClick={handleJumpPage.bind(null, pathStr)}>
          {pathStr}
        </span>
      );
    }
  }
];

export const Routes = React.memo(() => {
  const [state] = React.useContext(ApplicationContext);

  if (state.status === null) {
    return null;
  }

  const pages = state.status.analyseInfo.projectAnalysePages ? state.status.analyseInfo.projectAnalysePages.pages : [];
  const allPages = [...pages];

  const dataSource = allPages
    .concat()
    .sort((left, right) => left.routerPath.length - right.routerPath.length)
    .map(route => {
      return { key: route.routerPath, path: route.routerPath };
    });

  return (
    <div>
      <Table dataSource={dataSource} columns={columns} pagination={false} />
    </div>
  );
});
