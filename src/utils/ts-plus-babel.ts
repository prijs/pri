import * as gulp from 'gulp';
import * as gulpBabel from 'gulp-babel';
import * as gulpSass from 'gulp-sass';
import * as gulpWatch from 'gulp-watch';
import * as gulpStripCssComments from 'gulp-strip-css-comments';
import * as gulpConcatCss from 'gulp-concat-css';
import * as gulpIf from 'gulp-if';
import * as gulpSourcemaps from 'gulp-sourcemaps';
import * as path from 'path';
import { pri, srcPath } from '../node';
import { plugin } from './plugins';
import { getBabelOptions } from './babel-options';
import { globalState } from './global-state';
import { babelPluginTransformImport } from './babel-plugin-transfer-import';
import { PackageInfo } from './define';

function getGulpByWatch(watch: boolean, filesPath: string) {
  if (watch) {
    return gulpWatch(filesPath);
  }
  return gulp.src(filesPath);
}

const buildTs = (watch: boolean, outdir: string, babelOptions: any, wholeProject: boolean, sourcePath: string) => {
  const targetPath = wholeProject
    ? path.join(pri.projectRootPath, '{src,packages}/**/*.{ts,tsx}')
    : path.join(sourcePath || pri.sourceRoot, srcPath.dir, '**/*.{ts,tsx}');

  return new Promise((resolve, reject) => {
    if (globalState.isDevelopment) {
      getGulpByWatch(watch, targetPath)
        .pipe(gulpSourcemaps.init())
        .pipe(gulpBabel(babelOptions))
        .pipe(gulpSourcemaps.write())
        .on('error', reject)
        .pipe(gulp.dest(outdir))
        .on('end', resolve);
    } else {
      getGulpByWatch(watch, targetPath)
        .pipe(gulpBabel(babelOptions))
        .on('error', reject)
        .pipe(gulp.dest(outdir))
        .on('end', resolve);
    }
  });
};

const buildSass = (watch: boolean, outdir: string, wholeProject: boolean, sourcePath: string) => {
  const targetPath =
    wholeProject || (pri.selectedSourceType === 'root' && pri.sourceConfig.cssExtract)
      ? path.join(pri.projectRootPath, '{src,packages}/**/*.scss')
      : path.join(sourcePath || pri.sourceRoot, srcPath.dir, '**/*.scss');

  return new Promise((resolve, reject) => {
    getGulpByWatch(watch, targetPath)
      .pipe(
        gulpSass({
          includePaths: path.join(pri.projectRootPath, 'node_modules'),
        }),
      )
      .pipe(gulpIf(pri.sourceConfig.cssExtract, gulpConcatCss(pri.sourceConfig.outCssFileName)))
      .pipe(gulpStripCssComments())
      .on('error', reject)
      .pipe(gulp.dest(outdir))
      .on('end', resolve);
  });
};

const mvResources = (watch: boolean, outdir: string, wholeProject: boolean, sourcePath: string, sourceType: string) => {
  const selectedSourceType = sourceType || pri.selectedSourceType;
  const targetPath =
    wholeProject || (selectedSourceType === 'root' && pri.sourceConfig.cssExtract)
      ? path.join(pri.projectRootPath, '{src,packages}/**/*.{js,png,jpg,jpeg,gif,woff,woff2,eot,ttf,svg}')
      : path.join(sourcePath || pri.sourceRoot, srcPath.dir, '**/*.{js,png,jpg,jpeg,gif,woff,woff2,eot,ttf,svg}');

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

export const tsPlusBabel = async (watch = false, wholeProject = false, packageInfo: PackageInfo = null) => {
  const packagePath = packageInfo ? packageInfo.name : '';
  const rootDistPath = path.join(globalState.projectRootPath, pri.sourceConfig.distDir, packagePath);
  const mainDistPath = path.join(rootDistPath, 'main');
  const moduleDistPath = path.join(rootDistPath, 'module');

  const sourcePath = packageInfo ? packageInfo.rootPath : null;
  const sourceType = packageInfo ? packageInfo.name : null;

  return Promise.all([
    buildSass(watch, mainDistPath, wholeProject, sourcePath),
    buildSass(watch, moduleDistPath, wholeProject, sourcePath),

    buildTs(
      watch,
      mainDistPath,
      plugin.buildConfigBabelLoaderOptionsPipes.reduce(
        (options, fn) => {
          return fn(options);
        },
        getBabelOptions({
          plugins: [importRename(wholeProject)],
        }),
      ),
      wholeProject,
      sourcePath,
    ),
    buildTs(
      watch,
      moduleDistPath,
      plugin.buildConfigBabelLoaderOptionsPipes.reduce(
        (options, fn) => {
          return fn(options);
        },
        getBabelOptions({
          modules: false,
          plugins: [importRename(wholeProject)],
        }),
      ),
      wholeProject,
      sourcePath,
    ),

    mvResources(watch, mainDistPath, wholeProject, sourcePath, sourceType),
    mvResources(watch, moduleDistPath, wholeProject, sourcePath, sourceType),
  ]);
};
