import { useStrict } from "dob"
import { Provider } from "dob-react"
import * as React from "react"
import * as ReactDOM from "react-dom"
import { LayoutComponent } from "./pages/layout/layout.component"
import stores from "./stores"

// tslint:disable-next-line:no-submodule-imports
import "antd/dist/antd.css";

useStrict()

const Root = () => (
  <Provider {...stores}>
    <LayoutComponent />
  </Provider>
)

ReactDOM.render(<Root />, document.getElementById("root"))
