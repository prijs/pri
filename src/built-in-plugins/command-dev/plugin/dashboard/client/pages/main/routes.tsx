import { Table, TableHead, TableRow, TableBody, TableCell } from '@material-ui/core';
import * as React from 'react';
import { ApplicationContext } from '../../stores';

const handleJumpPage = (pathStr: string) => {
  window.parent.postMessage(
    {
      type: 'changeRoute',
      path: pathStr,
    },
    '*',
  );
};

export const Routes = React.memo(() => {
  const [state] = React.useContext(ApplicationContext);

  if (state.status === null) {
    return null;
  }

  const pages = state.status.analyseInfo.projectAnalysePages ? state.status.analyseInfo.projectAnalysePages.pages : [];
  const allPages = [...pages];

  const dataSource = allPages.concat().sort((left, right) => {
    return left.routerPath.length - right.routerPath.length;
  });

  return (
    <div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Path</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {dataSource.map((eachDataSource, index) => (
            <TableRow key={index}>
              <TableCell align="left">
                <span
                  style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={handleJumpPage.bind(null, eachDataSource.routerPath)}
                >
                  {eachDataSource.routerPath}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
});
