import * as path from "path"

export const srcPath = {
  dir: "src"
}

export const tempPath = {
  dir: ".temp"
}

export const pagesPath = {
  dir: path.join(srcPath.dir, `pages`)
}

export const notFoundPath = {
  dir: pagesPath.dir,
  name: "404",
  ext: ".tsx"
}

export const tempJsEntryPath = {
  dir: tempPath.dir,
  name: "entry",
  ext: ".tsx"
}

export const utilPath = {
  dir: path.join(srcPath.dir, "utils")
}

export const helperPath = {
  dir: utilPath.dir,
  name: "helper",
  ext: ".tsx"
}

export const declarePath = {
  dir: path.join(utilPath.dir, "declare")
}

export const layoutPath = {
  dir: path.join(srcPath.dir, `layouts`),
  name: "index",
  ext: ".tsx"
}

export const markdownLayoutPath = {
  dir: layoutPath.dir,
  name: "markdown",
  ext: ".tsx"
}

export const storesPath = {
  dir: path.join(srcPath.dir, `stores`)
}

export const configPath = {
  dir: path.join(srcPath.dir, `config`)
}

export const configPaths = {
  default: {
    dir: configPath.dir,
    name: "config.default",
    ext: ".ts"
  },
  local: {
    dir: configPath.dir,
    name: "config.local",
    ext: ".ts"
  },
  prod: {
    dir: configPath.dir,
    name: "config.prod",
    ext: ".ts"
  }
}

export const markdownTempPath = {
  dir: path.join(tempPath.dir, "markdowns")
}
