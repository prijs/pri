/**
 * @author 紫益
 * @description 组件异常 Catch
 */

import * as React from 'react';

interface State {
  error: Error;
}

export class ErrorBoundary extends React.PureComponent<any, State> {
  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  public state: State = { error: undefined };

  render() {
    if (this.state.error) {
      return <div>{this.state.error.message}</div>;
    }

    return this.props.children;
  }
}

export function withErrorBoundary(Elem: React.ComponentType): React.ComponentType {
  return props => (
    <ErrorBoundary>
      <Elem {...props} />
    </ErrorBoundary>
  );
}
