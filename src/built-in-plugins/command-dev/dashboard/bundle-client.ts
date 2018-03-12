import { execSync } from "child_process"
import * as path from "path"
import { findNearestNodemodulesFile } from "../../../utils/npm-finder"

const env = "prod"

// Run webpack
execSync(
  [
    `${findNearestNodemodulesFile("/.bin/webpack")}`,
    `--progress`,
    `--mode production`,
    `--config ${path.join(__dirname, "../../../utils/webpack-config.js")}`,
    `--env.projectRootPath ${__dirname}`,
    `--env.env ${env}`,
    `--env.publicPath /bundle/`,
    `--env.entryPath ${path.join(__dirname, "client/index.js")}`,
    `--env.distDir ${path.join(__dirname, "../../../bundle")}`,
    `--env.distFileName main`
  ].join(" "),
  {
    stdio: "inherit"
  }
)
