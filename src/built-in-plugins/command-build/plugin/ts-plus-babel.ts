import * as gulp from 'gulp';
import * as gulpBabel from 'gulp-babel';
import * as sassGulp from 'gulp-sass';
import * as _ from 'lodash';
import * as path from 'path';
import * as babelPluginTransformRenameImport from 'babel-plugin-transform-rename-import';
import { pri } from '../../../node';
import { getBabelOptions } from '../../../utils/babel-options';
import { globalState } from '../../../utils/global-state';

const buildTs = async (outdir: string, babelOptions: any) => {
  return gulp
    .src(path.join(pri.sourceRoot, 'src/**/*.{ts,tsx}'))
    .pipe(gulpBabel(babelOptions))
    .pipe(gulp.dest(outdir));
};

const buildSass = async (outdir: string) => {
  return gulp
    .src(path.join(pri.sourceRoot, 'src/**/*.scss'))
    .pipe(sassGulp())
    .pipe(gulp.dest(outdir));
};

export const tsPlusBabel = async () => {
  await buildSass(path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'main'));
  await buildTs(
    path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'main'),
    getBabelOptions({
      plugins: [[babelPluginTransformRenameImport, { original: '^(.+?)\\.scss$', replacement: '$1.css' }]]
    })
  );

  await buildSass(path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'module'));
  await buildTs(
    path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'module'),
    getBabelOptions({
      modules: false,
      plugins: [[babelPluginTransformRenameImport, { original: '^(.+?)\\.scss$', replacement: '$1.css' }]]
    })
  );
};
