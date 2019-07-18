import * as gulp from 'gulp';
import * as gulpBabel from 'gulp-babel';
import * as gulpSass from 'gulp-sass';
import * as gulpWatch from 'gulp-watch';
import * as path from 'path';
import * as glob from 'glob';
import * as fs from 'fs-extra';
import * as babelPluginTransformRenameImport from 'babel-plugin-transform-rename-import';
import { pri, srcPath } from '../node';
import { getBabelOptions } from './babel-options';
import { globalState } from './global-state';

function getGulpByWatch(watch: boolean, filesPath: string) {
  if (watch) {
    return gulpWatch(filesPath);
  }
  return gulp.src(filesPath);
}

const buildTs = (watch: boolean, outdir: string, babelOptions: any) => {
  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, path.join(pri.sourceRoot, srcPath.dir, '**/*.{ts,tsx}'))
      .pipe(gulpBabel(babelOptions))
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

const buildSass = (watch: boolean, outdir: string) => {
  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, path.join(pri.sourceRoot, srcPath.dir, '**/*.scss'))
      .pipe(gulpSass())
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

const mvResources = (watch: boolean, outdir: string) => {
  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, path.join(pri.sourceRoot, srcPath.dir, '**/*.{js,png,jpg,jpeg,gif,woff,woff2,eot,ttf,svg}'))
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

export const tsPlusBabel = async (watch = false) => {
  const mainDistPath = path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'main');
  const moduleDistPath = path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'module');

  return Promise.all([
    buildSass(watch, mainDistPath),
    mvResources(watch, mainDistPath),
    buildTs(
      watch,
      mainDistPath,
      getBabelOptions({
        plugins: [[babelPluginTransformRenameImport, { original: '^(.+?)\\.scss$', replacement: '' }]]
      })
    ),
    buildSass(watch, moduleDistPath),
    mvResources(watch, moduleDistPath),
    buildTs(
      watch,
      moduleDistPath,
      getBabelOptions({
        modules: false,
        plugins: [[babelPluginTransformRenameImport, { original: '^(.+?)\\.scss$', replacement: '$1.css' }]]
      })
    )
  ]);
};
