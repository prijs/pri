import * as path from "path"
import * as yargs from "yargs"

yargs.parse(yargs.argv._)

const projectRootPath = yargs.argv.projectRootPath

module.exports = {
  rootDir: path.join(projectRootPath, "built")
}
