import transformRuntime from "@babel/plugin-transform-runtime"
import babelEnv from "@babel/preset-env"
import stage2 from "@babel/preset-stage-2"
import * as fs from "fs-extra"
import * as gulp from "gulp"
import * as gulpBabel from "gulp-babel"
import * as ts from "gulp-typescript"
import * as _ from "lodash"
import * as path from "path"

export const tsPlusBabel = (projectRootPath: string, glob: string, outDir: string) => {
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

  return new Promise((resolve, reject) => {
    gulp
      .src([path.join(projectRootPath, glob), "!node_modules", "!node_modules/**"])
      .pipe(ts(compilerOptions))
      .pipe(gulpBabel({ presets: [[babelEnv], [stage2]], plugins: [[transformRuntime]] }))
      .pipe(gulp.dest(path.join(projectRootPath, outDir)))
      .on("end", resolve)
      .on("error", reject)
  })
}
