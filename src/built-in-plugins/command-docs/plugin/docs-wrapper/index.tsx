import * as React from 'react';
import { HashRouter, Switch, Route, Link, withRouter, RouteComponentProps, Redirect } from 'react-router-dom';
import { withErrorBoundary } from './errorBoundary';

export class Props {
  public docs?: { name: string; element: any; text: string }[] = [];
}

const NotFound: React.FC = () => <div>Not found</div>;

const Docs: React.FC<Props & RouteComponentProps> = React.memo(({ docs = [], location }) => {
  const pathname = location.pathname;
  if (docs.length === 0) {
    return null;
  }
  const [firstDoc] = docs;

  return (
    <div
      style={{
        backgroundColor: 'whitesmoke',
        width: '100vw',
        height: '100vh',
        display: 'flex',
        boxSizing: 'border-box',
      }}
    >
      {docs.length > 1 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 200,
            minWidth: 200,
            borderRight: '1px solid #eee',
            boxSizing: 'border-box',
            overflowY: 'auto',
          }}
        >
          {docs.map(doc => (
            <Link
              to={`/${doc.name}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                minHeight: 30,
                cursor: 'pointer',
                paddingLeft: 10,
                boxSizing: 'border-box',
                backgroundColor: pathname === `/${doc.name}` ? 'white' : null,
                fontSize: 14,
                color: '#333',
                borderBottom: '1px solid #eee',
              }}
              key={doc.name}
            >
              {doc.name}
            </Link>
          ))}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: '100%',
            backgroundColor: 'white',
            flexGrow: 1,
            flexBasis: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            boxSizing: 'border-box',
          }}
        >
          <Switch>
            <Route exact path="/">
              <Redirect to={`/${firstDoc.name}`} />
            </Route>
            {docs.map(doc => (
              <Route path={`/${doc.name}`} key={doc.name} component={withErrorBoundary(doc.element.default)} />
            ))}
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
});

const DocsWithRouter = withRouter(Docs);

const App: React.FC = props => {
  return (
    <HashRouter>
      <DocsWithRouter {...props} />
    </HashRouter>
  );
};

export default App;
