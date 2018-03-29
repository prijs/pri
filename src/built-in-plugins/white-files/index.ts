import * as fs from "fs-extra"
import * as path from "path"
import { pri } from "../../node"

const whiteList = ["readme.md", "src", "src/pages", "src/utils", "src/utils/declare"]

export default (instance: typeof pri) => {
  const projectRootPath = instance.project.getProjectRootPath()

  instance.project.whiteFileRules.add({
    judgeFile: file => {
      return whiteList.some(whiteName => path.format(file) === path.join(projectRootPath, whiteName))
    }
  })

  // src/utils/declare/**
  instance.project.whiteFileRules.add({
    judgeFile: file => {
      const relativePath = path.relative(projectRootPath, file.dir)
      return relativePath.startsWith("src/utils/declare")
    }
  })

  // src/pages/[folder]
  instance.project.whiteFileRules.add({
    judgeFile: file => {
      const relativePath = path.relative(projectRootPath, file.dir)
      return relativePath.startsWith("src/pages") && file.isDir
    }
  })
}
