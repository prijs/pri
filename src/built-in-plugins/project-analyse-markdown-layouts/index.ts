import * as fs from "fs-extra"
import * as _ from "lodash"
import * as normalizePath from "normalize-path"
import * as path from "path"
import { pri } from "../../node"
import { md5 } from "../../utils/md5"
import {
  layoutPath,
  markdownLayoutPath,
  tempJsEntryPath
} from "../../utils/structor-config"

const MARKDOWN_LAYOUT = "MarkdownLayoutComponent"
const MARKDOWN_LAYOUT_ROUTE = "MarkdownLayoutRoute"

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.onAnalyseProject((files, entry) => {
    let hasMarkdownLayout = false

    files
      .filter(file => {
        const relativePath = path.relative(
          projectRootPath,
          path.join(file.dir, file.name)
        )

        if (!relativePath.startsWith(layoutPath.dir)) {
          return false
        }

        return true
      })
      .forEach(file => {
        if (file.name === "markdown") {
          hasMarkdownLayout = true
        }
      })

    if (hasMarkdownLayout) {
      const markdownLayoutEntryRelativePath = path.relative(
        tempJsEntryPath.dir,
        path.join(markdownLayoutPath.dir, markdownLayoutPath.name)
      )

      entry.pipeHeader(header => {
        return `
        ${header}
        import ${MARKDOWN_LAYOUT} from "${normalizePath(
          markdownLayoutEntryRelativePath
        )}"
      `
      })

      entry.pipeBody(body => {
        return `
        ${body}

        const ${MARKDOWN_LAYOUT_ROUTE} = ({ component: Component, ...rest }: any) => {
          return (
            <Route {...rest} render={matchProps => (
              <${MARKDOWN_LAYOUT}>
                <Component {...matchProps} />
              </${MARKDOWN_LAYOUT}>
            )} />
          )
        }
      `
      })

      instance.pipe.set("markdownRoute", route => {
        return MARKDOWN_LAYOUT_ROUTE
      })
    }
  })
}
