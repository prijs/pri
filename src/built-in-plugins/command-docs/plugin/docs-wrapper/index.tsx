import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Props, State } from './type';

export default class Docs extends React.PureComponent<Props, State> {
  public state = new State();

  private editorRef: React.ReactInstance;

  private monacoEditor: any;

  public componentDidMount() {
    if (this.props.docs.length === 0) {
      return;
    }

    const currentDoc = this.props.docs[this.state.currentDocIndex];

    const vsRequire: any = (window as any).require;
    vsRequire.config({ paths: { vs: 'https://g.alicdn.com/dt/fbi/0.0.292/monaco-editor/vs' } });
    vsRequire(['vs/editor/editor.main'], (info: any) => {
      const monaco: any = (window as any).monaco;
      const editorDOM = ReactDOM.findDOMNode(this.editorRef);
      this.monacoEditor = monaco.editor.create(editorDOM, {
        value: currentDoc.text,
        language: 'typescript'
      });
    });
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
          backgroundColor: 'whitesmokesmoke',
          width: '100vw',
          height: '100vh',
          display: 'flex',
          padding: 10,
          boxSizing: 'border-box'
        }}
      >
        {this.props.docs.length > 1 && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 300,
              minWidth: 300,
              boxSizing: 'border-box',
              paddingRight: 10
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
              border: '1px solid #ddd',
              borderRadius: 3,
              flexGrow: 1,
              flexBasis: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              boxSizing: 'border-box'
            }}
          >
            <DocInstance />
          </div>

          <div
            style={{
              display: this.state.showDocInfo ? 'block' : 'none',
              height: 200,
              backgroundColor: 'white',
              minHeight: 200,
              width: '100%',
              border: '1px solid #ddd',
              borderRadius: 3,
              marginTop: 10,
              boxSizing: 'border-box'
            }}
          >
            <div style={{ width: '100%', height: 180 }} ref={(ref: any) => (this.editorRef = ref)} />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 30,
              backgroundColor: 'white',
              marginTop: 10,
              border: '1px solid #ddd',
              fontSize: 14,
              cursor: 'pointer'
            }}
            onClick={this.handleToggleSHowDocInfo}
          >
            Show code
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
            borderRadius: 5,
            paddingLeft: 10,
            boxSizing: 'border-box',
            backgroundColor: this.state.currentDocIndex === index ? 'white' : null
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
    this.setState(
      {
        currentDocIndex: index
      },
      () => {
        const currentDoc = this.props.docs[this.state.currentDocIndex];
        this.monacoEditor.setValue(currentDoc.text);
      }
    );
  };

  private handleToggleSHowDocInfo = () => {
    this.setState(
      {
        showDocInfo: !this.state.showDocInfo
      },
      () => {
        if (this.state.showDocInfo) {
          this.monacoEditor.layout();
        }
      }
    );
  };
}
