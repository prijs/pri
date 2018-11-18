import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as S from './style';
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
      <S.Container>
        <S.GlobalStyles />

        {this.props.docs.length > 1 && <S.LeftContainer>{this.renderLeftMenus()}</S.LeftContainer>}

        <S.RightContainer>
          <S.DocInstanceContainer>
            <DocInstance />
          </S.DocInstanceContainer>

          <S.DocInfoContainer style={{ display: this.state.showDocInfo ? 'block' : 'none' }}>
            <S.DocEditorInstance ref={(ref: any) => (this.editorRef = ref)} />
          </S.DocInfoContainer>

          <S.ToggleDocInfoContainer onClick={this.handleToggleSHowDocInfo}>Show code</S.ToggleDocInfoContainer>
        </S.RightContainer>
      </S.Container>
    );
  }

  private renderLeftMenus = () => {
    return this.props.docs.map((doc, index) => {
      return (
        <S.DocMenuItem
          onClick={this.selectDoc.bind(this, index)}
          key={index}
          theme={{ active: this.state.currentDocIndex === index }}
        >
          {doc.name}
        </S.DocMenuItem>
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
