import * as fs from "fs-extra"
import * as _ from "lodash"
import * as path from "path"
import { pri } from "../../node"
import { getGitignores, getNpmignores } from "../../utils/structor-config"

const whiteList = ["readme.md", "src", `src${path.sep}pages`, `src${path.sep}utils`, ".git"]

export default async (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()
  const projectConfig = instance.project.getProjectConfig("local")
  const gitIgnores = getGitignores(projectConfig)
  const npmIgnores = getNpmignores(projectConfig)

  const allIgnores = _.union(gitIgnores, npmIgnores)

  instance.project.whiteFileRules.add(file => {
    return whiteList.concat(allIgnores).some(whiteName => path.format(file) === path.join(projectRootPath, whiteName))
  })

  // src/utils/declare/**
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath.startsWith(`src${path.sep}utils${path.sep}declare`)
  })

  // src/pages/[folder]
  instance.project.whiteFileRules.add(file => {
    const relativePath = path.relative(projectRootPath, file.dir)
    return relativePath.startsWith(`src${path.sep}pages`) && file.isDir
  })
}
