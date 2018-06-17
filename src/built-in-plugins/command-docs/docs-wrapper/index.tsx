import * as React from 'react';
import * as S from './style';
import { Props, State } from './type';

export default class Docs extends React.PureComponent<Props, State> {
  public state = new State();

  public render() {
    const DocInstance = this.props.docs[this.state.currentDocIndex].element.default;
    return (
      <S.Container>
        <S.LeftContainer>{this.renderLeftMenus()}</S.LeftContainer>

        <S.RightContainer>
          <S.DocInstanceContainer>
            <DocInstance />
          </S.DocInstanceContainer>
          <S.DocInfoContainer>TODO</S.DocInfoContainer>
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
    this.setState({
      currentDocIndex: index
    });
  };
}
