import { Provider } from "dob-react"
import { useStrict } from 'dob'
import * as React from "react"
import * as ReactDOM from "react-dom"
import stores from "./stores"
import { LayoutComponent } from './pages/layout/layout.component'

import 'antd/dist/antd.css';

useStrict()

const Root = () => (
  <Provider {...stores}>
    <LayoutComponent />
  </Provider>
)

ReactDOM.render(<Root />, document.getElementById("root"))
