import * as React from "react"
import * as ReactDOM from "react-dom"
import * as Loadable from "react-loadable"
import { env, setCustomEnv, setEnvLocal, setEnvProd } from "./env"
import { IConfig as ProjectConfig } from "./utils/project-config-interface"

export { React, ReactDOM, Loadable, ProjectConfig }

export * from "react-router-dom"

export { env, setEnvLocal, setEnvProd, setCustomEnv }
