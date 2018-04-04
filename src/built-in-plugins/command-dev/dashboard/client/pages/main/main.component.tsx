import { Connect } from "dob-react"
import * as React from "react"
import { PureComponent } from "../../utils/react-helper"
import * as S from "./main.style"
import { Props, State } from "./main.type"

import { ConfigComponent } from "./config/config.component"
import { LayoutComponent } from "./layout/layout.component"
import { NotFoundComponent } from "./not-found/not-found.component"
import { ProjectRootComponent } from "./project-root/project-root.component"
import { RoutesComponent } from "./routes/routes.component"
import { StoresComponent } from "./stores/stores.component"

@Connect
export class MainComponent extends PureComponent<Props, State> {
  public static defaultProps = new Props()
  public state = new State()

  public render() {
    return this.props.ApplicationAction.loadPluginsByPosition("tree-" + this.props.ApplciationStore.selectedTreeKey)
    // switch (this.props.ApplciationStore.selectedTreeKey) {
    //   case "project-root":
    //     return <ProjectRootComponent />
    //   case "routes":
    //     return <RoutesComponent />
    //   case "layout":
    //     return <LayoutComponent />
    //   case "404":
    //     return <NotFoundComponent />
    //   case "config":
    //     return <ConfigComponent />
    //   case "stores":
    //     return <StoresComponent />
    //   default:
    //     return null
    // }
  }
}
