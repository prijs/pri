import * as React from 'react';
import { Props, State } from './type';

const urlSearchParams = new URLSearchParams(location.search);

export default class Docs extends React.PureComponent<Props, State> {
  public state = new State();

  public componentWillMount() {
    if (urlSearchParams.has('index')) {
      this.setState({
        currentDocIndex: Number(urlSearchParams.get('index'))
      });
    }
  }

  public render() {
    if (this.props.docs.length === 0) {
      return null;
    }

    const currentDoc = this.props.docs[this.state.currentDocIndex];
    const DocInstance = currentDoc.element.default;

    return (
      <div
        style={{
          backgroundColor: 'whitesmoke',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          boxSizing: 'border-box'
        }}
      >
        {this.props.docs.length > 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 200,
              minWidth: 200,
              borderRight: '1px solid #eee',
              boxSizing: 'border-box'
            }}
          >
            {this.renderLeftMenus()}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, boxSizing: 'border-box' }}>
          <div
            style={{
              width: '100%',
              backgroundColor: 'white',
              flexGrow: 1,
              flexBasis: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            <DocInstance />
          </div>
        </div>
      </div>
    );
  }

  private renderLeftMenus = () => {
    return this.props.docs.map((doc, index) => {
      return (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 30,
            cursor: 'pointer',
            paddingLeft: 10,
            boxSizing: 'border-box',
            backgroundColor: this.state.currentDocIndex === index ? 'white' : null,
            fontSize: 14,
            color: '#333',
            borderBottom: '1px solid #eee'
          }}
          onClick={this.selectDoc.bind(this, index)}
          key={index}
        >
          {doc.name}
        </div>
      );
    });
  };

  private selectDoc = (index: number) => {
    urlSearchParams.set('index', index.toString());
    const newurl =
      window.location.protocol +
      '//' +
      window.location.host +
      window.location.pathname +
      '?' +
      urlSearchParams.toString();
    window.history.pushState({ path: newurl }, '', newurl);

    this.setState({
      currentDocIndex: index
    });
  };
}
