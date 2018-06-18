import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as S from './style';
import { Props, State } from './type';

export default class Docs extends React.PureComponent<Props, State> {
  public state = new State();

  private editorRef: React.ReactInstance;

  private monacoEditor: any;

  public componentDidMount() {
    const currentDoc = this.props.docs[this.state.currentDocIndex];

    const vsRequire: any = (window as any).require;
    vsRequire.config({ paths: { vs: 'https://unpkg.com/monaco-editor@0.13.1/min/vs' } });
    vsRequire(['vs/editor/editor.main'], (info: any) => {
      const monaco: any = (window as any).monaco;
      const editorDOM = ReactDOM.findDOMNode(this.editorRef);
      this.monacoEditor = monaco.editor.create(editorDOM, { value: currentDoc.text, language: 'typescript' });
    });
  }

  public render() {
    const currentDoc = this.props.docs[this.state.currentDocIndex];
    const DocInstance = currentDoc.element.default;
    return (
      <S.Container>
        <S.LeftContainer>{this.renderLeftMenus()}</S.LeftContainer>

        <S.RightContainer>
          <S.DocInstanceContainer>
            <DocInstance />
          </S.DocInstanceContainer>
          <S.DocInfoContainer>
            <S.DocEditorInstance ref={(ref: any) => (this.editorRef = ref)} />
          </S.DocInfoContainer>
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
}
