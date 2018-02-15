import * as fs from 'fs-extra'
import * as path from 'path'
import * as prettier from "prettier"

export async function addPage(projectRootPath: string, options: {
  path: string
}) {
  const pathFullPath = path.join(projectRootPath, 'src/pages', options.path) + '.tsx'

  if (fs.existsSync(pathFullPath)) {
    throw Error(`${options.path} already exist!`)
  }

  fs.outputFileSync(pathFullPath, prettier.format(`
    import * as React from "react"

    export default class Page extends React.PureComponent<any, any> {
      public render() {
        return (
          <div>
            New page for ${options.path}
          </div>
        )
      }
    }
  `, {
      semi: false,
      parser: "typescript"
    }))
}

export async function createLayout(projectRootPath: string) {
  const pathFullPath = path.join(projectRootPath, 'src/layouts/index.tsx')

  if (fs.existsSync(pathFullPath)) {
    throw Error(`layout already exist!`)
  }

  fs.outputFileSync(pathFullPath, prettier.format(`
    import * as React from "react"

    class Props {

    }

    class State {

    }

    export default class Page extends React.PureComponent<Props, State> {
      public static defaultProps = new Props()
      public state = new State()

      public render() {
        return (
          <div>
            {this.props.children}
          </div>
        )
      }
    }
  `, {
      semi: false,
      parser: "typescript"
    }))
}

export async function create404(projectRootPath: string) {
  const pathFullPath = path.join(projectRootPath, 'src/404.tsx')

  if (fs.existsSync(pathFullPath)) {
    throw Error(`404 page already exist!`)
  }

  fs.outputFileSync(pathFullPath, prettier.format(`
    import * as React from "react"

    export default class Page extends React.PureComponent<any, any> {
      public render() {
        return (
          <div>
            Page not found
          </div>
        )
      }
    }
  `, {
      semi: false,
      parser: "typescript"
    }))
}

export async function createConfig(projectRootPath: string) {
  const defaultFullPath = path.join(projectRootPath, 'src/config/config.default.ts')
  const localFullPath = path.join(projectRootPath, 'src/config/config.local.ts')
  const prodFullPath = path.join(projectRootPath, 'src/config/config.prod.ts')

  if (fs.existsSync(defaultFullPath)) {
    throw Error(`layout already exist!`)
  }

  const fileContent = prettier.format(`
    import { ProjectConfig } from "pri"

    export default {
      
    } as ProjectConfig
  `, {
      semi: false,
      parser: "typescript"
    })

  fs.outputFileSync(defaultFullPath, fileContent)
  fs.outputFileSync(localFullPath, fileContent)
  fs.outputFileSync(prodFullPath, fileContent)
}