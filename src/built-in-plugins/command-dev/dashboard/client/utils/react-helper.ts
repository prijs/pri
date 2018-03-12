import * as React from "react"
import { RouteComponentProps } from "react-router-dom"
import store from "../stores"

type Partial<T> = { [P in keyof T]?: T[P] }

export class PureComponent<T, P> extends React.PureComponent<
  typeof store & Partial<RouteComponentProps<any>> & T,
  P
> {}
