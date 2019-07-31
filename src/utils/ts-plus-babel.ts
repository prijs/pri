import * as gulp from 'gulp';
import * as gulpBabel from 'gulp-babel';
import * as gulpSass from 'gulp-sass';
import * as gulpWatch from 'gulp-watch';
import * as gulpCleanCss from 'gulp-clean-css';
import * as gulpConcat from 'gulp-concat';
import * as gulpIf from 'gulp-if';
import * as gulpSourcemaps from 'gulp-sourcemaps';
import * as path from 'path';
import { pri, srcPath } from '../node';
import { getBabelOptions } from './babel-options';
import { globalState } from './global-state';
import { babelPluginTransformImport } from './babel-plugin-transfer-import';

function getGulpByWatch(watch: boolean, filesPath: string) {
  if (watch) {
    return gulpWatch(filesPath);
  }
  return gulp.src(filesPath);
}

const buildTs = (watch: boolean, outdir: string, babelOptions: any, wholeProject: boolean) => {
  const targetPath = wholeProject
    ? path.join(pri.projectRootPath, '{src,packages}/**/*.{ts,tsx}')
    : path.join(pri.sourceRoot, srcPath.dir, '**/*.{ts,tsx}');

  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, targetPath)
      .pipe(gulpSourcemaps.init())
      .pipe(gulpBabel(babelOptions))
      .pipe(gulpSourcemaps.write())
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

const buildSass = (watch: boolean, outdir: string, wholeProject: boolean) => {
  const targetPath = wholeProject
    ? path.join(pri.projectRootPath, '{src,packages}/**/*.scss')
    : path.join(pri.sourceRoot, srcPath.dir, '**/*.scss');

  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, targetPath)
      .pipe(gulpSass())
      .pipe(gulpCleanCss())
      .pipe(gulpIf(pri.sourceConfig.cssExtract, gulpConcat(pri.sourceConfig.outCssFileName)))
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

const mvResources = (watch: boolean, outdir: string, wholeProject: boolean) => {
  const targetPath = wholeProject
    ? path.join(pri.projectRootPath, '{src,packages}/**/*.{js,png,jpg,jpeg,gif,woff,woff2,eot,ttf,svg}')
    : path.join(pri.sourceRoot, srcPath.dir, '**/*.{js,png,jpg,jpeg,gif,woff,woff2,eot,ttf,svg}');

  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, targetPath)
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

function importRename(packageAbsoluteToRelative = false) {
  return [
    babelPluginTransformImport,
    {
      removeCssImport: pri.sourceConfig.cssExtract,
      pipeImport: (text: string, filename: string) => {
        const scssRegex = '^(.+?)\\.scss$';
        const scssPattern = new RegExp(`^(${scssRegex}|${scssRegex}/.*)$`);

        if (scssPattern.test(text)) {
          const scssReplacePattern = new RegExp(scssRegex);
          return text.replace(scssReplacePattern, '$1.css');
        }

        if (packageAbsoluteToRelative) {
          // resolve absolute packages to relative path
          for (const eachPackage of globalState.packages) {
            if (eachPackage.packageJson && eachPackage.packageJson.name) {
              if (eachPackage.packageJson.name === text) {
                return path.relative(path.parse(filename).dir, path.join(eachPackage.rootPath, srcPath.dir));
              }
            }
          }
        }

        return text;
      },
    },
  ];
}

export const tsPlusBabel = async (watch = false, wholeProject = false) => {
  const mainDistPath = path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'main');
  const moduleDistPath = path.join(globalState.projectRootPath, pri.sourceConfig.distDir, 'module');

  return Promise.all([
    buildSass(watch, mainDistPath, wholeProject),
    mvResources(watch, mainDistPath, wholeProject),
    buildTs(
      watch,
      mainDistPath,
      getBabelOptions({
        plugins: [importRename(wholeProject)],
      }),
      wholeProject,
    ),
    buildSass(watch, moduleDistPath, wholeProject),
    mvResources(watch, moduleDistPath, wholeProject),
    buildTs(
      watch,
      moduleDistPath,
      getBabelOptions({
        modules: false,
        plugins: [importRename(wholeProject)],
      }),
      wholeProject,
    ),
  ]);
};
