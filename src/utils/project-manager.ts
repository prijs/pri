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
          <p>
            New page for ${options.path}
          </p>
        )
      }
    }
  `, {
      semi: false,
      parser: "typescript"
    }))
}