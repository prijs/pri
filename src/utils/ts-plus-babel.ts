import transformRuntime from '@babel/plugin-transform-runtime';
import babelEnv from '@babel/preset-env';
import stage2 from '@babel/preset-stage-2';
import * as fs from 'fs-extra';
import * as gulp from 'gulp';
import * as gulpBabel from 'gulp-babel';
// import * as gulpSourcemaps from "gulp-sourcemaps"
import * as tsGulp from 'gulp-typescript';
import * as _ from 'lodash';
import * as path from 'path';
import { CompilerOptions } from 'typescript';
import { globalState } from './global-state';

export const tsPlusBabel = (outDir: string, tsCompileOptions: CompilerOptions = {}) => {
  const tsConfigPath = path.join(globalState.projectRootPath, 'tsconfig.json');

  // Fix babel's bug.
  // Babel couldn't handle esnext module, so in typescript:
  //  import * as normalizePath from "normalize-path"
  //  normalizePath()
  // Will transfer to:
  //  const normalizePath = wrapperDefault(require("normalize-path"))
  //  normalizePath()
  // So, babel can only handle require and import.
  // But couldn't handle import * as.
  const tsProject = tsGulp.createProject(tsConfigPath, {
    module: 'commonjs',
    ...tsCompileOptions
  });

  return new Promise((resolve, reject) => {
    tsProject
      .src()
      // .pipe(gulpSourcemaps.init())
      .pipe(tsProject())
      .pipe(gulpBabel({ presets: [[babelEnv], [stage2, { decoratorsLegacy: true }]], plugins: [[transformRuntime]] }))
      // .pipe(
      //   gulpSourcemaps.mapSources((sourcePath: string) => {
      //     return path.join("..", sourcePath)
      //   })
      // )
      // .pipe(
      //   gulpSourcemaps.write(".", {
      //     includeContent: false
      //   })
      // )
      .pipe(gulp.dest(path.join(globalState.projectRootPath, outDir)))
      .on('end', resolve)
      .on('error', reject);
  });
};
