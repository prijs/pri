import transformRuntime from "@babel/plugin-transform-runtime"
import babelEnv from "@babel/preset-env"
import stage2 from "@babel/preset-stage-2"
import * as fs from "fs-extra"
import * as gulp from "gulp"
import * as gulpBabel from "gulp-babel"
import * as ts from "gulp-typescript"
import * as _ from "lodash"
import * as path from "path"
import { log } from "../../utils/log"
import { tsBuiltPath } from "../../utils/structor-config"

function build(projectRootPath: string, sourceBlob: string) {
  const tsConfigPath = path.join(projectRootPath, "tsconfig.json")
  const hasTsConfig = fs.existsSync(tsConfigPath)
  const tsConfig = fs.readJsonSync(tsConfigPath)

  const compilerOptions = hasTsConfig ? _.get(tsConfig, "compilerOptions") : {}

  // Fix babel's bug.
  // Babel couldn't handle esnext module, so in typescript:
  //  import * as normalizePath from "normalize-path"
  //  normalizePath()
  // Will transfer to:
  //  const normalizePath = wrapperDefault(require("normalize-path"))
  //  normalizePath()
  // So, babel can only handle require and import.
  // But couldn't handle import * as.
  compilerOptions.module = "commonjs"

  gulp
    .src(sourceBlob)
    .pipe(ts(compilerOptions))
    .pipe(gulpBabel({ presets: [[babelEnv], [stage2]], plugins: [[transformRuntime]] }))
    .pipe(gulp.dest(path.join(projectRootPath, tsBuiltPath.dir)))
}

export const CommandPluginWatch = (projectRootPath: string) => {
  log("Watching plugin's files")

  const sourceBlob = path.join(projectRootPath, "src/**/*.{tsx,ts}")

  const watcher = gulp.watch(sourceBlob, build(projectRootPath, sourceBlob))

  // TODO: On create delete?
  watcher.on("change", () => {
    build(projectRootPath, sourceBlob)
  })
}
