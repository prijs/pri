import * as fs from 'fs-extra'
import * as path from 'path'
import * as prettier from "prettier"
import { analyseProject } from './analyse-project'
import * as _ from 'lodash'

export async function addPage(projectRootPath: string, options: {
  path: string
}) {
  const projectInfo = await analyseProject(projectRootPath)
  const fileFullPath = path.join(projectRootPath, 'src/pages', options.path) + '.tsx'

  if (fs.existsSync(fileFullPath)) {
    throw Error(`${options.path} already exist!`)
  }

  if (projectInfo.stores.length === 0) {
    fs.outputFileSync(fileFullPath, prettier.format(`
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
              New page for ${options.path}
            </div>
          )
        }
      }
    `, {
        semi: false,
        parser: "typescript"
      }))
  } else {
    const helperAbsolutePath = path.join(projectRootPath, 'src/helper')
    const fileAbsoluteDirPath = path.parse(fileFullPath).dir
    const relativeToHelperPath = path.relative(fileAbsoluteDirPath, helperAbsolutePath)
    fs.outputFileSync(fileFullPath, prettier.format(`
      import * as React from "react"
      import { stores } from "${relativeToHelperPath}"

      class Props {

      }

      class State {

      }

      export default class Page extends React.PureComponent<Props & typeof stores, State> {
        public static defaultProps = new Props()
        public state = new State()

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

export async function addStore(projectRootPath: string, options: {
  name: string
  withDemo: boolean
}) {
  const camelName = _.camelCase(options.name)
  const camelUpperFirstName = _.upperFirst(camelName)
  const kebabName = _.kebabCase(options.name)
  const fileFullPath = path.join(projectRootPath, 'src/stores', kebabName) + '.tsx'

  if (fs.existsSync(fileFullPath)) {
    throw Error(`${kebabName} already exist!`)
  }

  fs.outputFileSync(fileFullPath, prettier.format(`
    import { observable, inject, Action } from "dob"

    @observable
    export class ${camelUpperFirstName}Store {
      ${options.withDemo ? `public testValue = 1` : ''}
    }

    export class ${camelUpperFirstName}Action {
      @inject(${camelUpperFirstName}Store) ${camelName}Store: ${camelUpperFirstName}Store

      ${options.withDemo ? `
        @Action public async test() {
          this.${camelName}Store.testValue++
        }
      ` : ''}
    }
  `, {
      semi: false,
      parser: "typescript"
    }))
}
