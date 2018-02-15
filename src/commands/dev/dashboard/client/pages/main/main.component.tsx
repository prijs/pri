import { Connect } from "dob-react"
import * as React from "react"
import { Props, State } from './main.type'
import * as S from './main.style'
import { PureComponent } from '../../utils/react-helper'

import { ProjectRootComponent } from './project-root/project-root.component'
import { RoutesComponent } from './routes/routes.component'
import { LayoutComponent } from './layout/layout.component'
import { NotFoundComponent } from './not-found/not-found.component'
import { ConfigComponent } from './config/config.component'
import { StoresComponent } from './stores/stores.component'

@Connect
export class MainComponent extends PureComponent<Props, State> {
  static defaultProps = new Props()
  state = new State()

  render() {
    switch (this.props.ApplciationStore.selectedTreeKey) {
      case 'project-root':
        return <ProjectRootComponent />
      case 'routes':
        return <RoutesComponent />
      case 'layout':
        return <LayoutComponent />
      case '404':
        return <NotFoundComponent />
      case 'config':
        return <ConfigComponent />
      case 'stores':
        return <StoresComponent />
      default:
        return null
    }
  }
}
