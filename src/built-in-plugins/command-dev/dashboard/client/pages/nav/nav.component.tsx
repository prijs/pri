import { Connect } from 'dob-react';
import * as React from 'react';
import { PureComponent } from '../../utils/react-helper';
import * as S from './nav.style';
import { Props, State } from './nav.type';

@Connect
export class NavComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props();
  public state = new State();

  public render() {
    return (
      <S.Container>
        <span>Pri dashboard</span>
        <S.Link href="https://github.com/ascoders/pri" target="_blank">
          Docs
        </S.Link>
      </S.Container>
    );
  }
}
