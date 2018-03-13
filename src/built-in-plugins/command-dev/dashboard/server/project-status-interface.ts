import { IProjectInfo } from "../../../../utils/analyse-project-interface"
import { IProjectConfig } from "../../../../utils/project-config-interface"

export interface IProjectStatus {
  projectConfig: IProjectConfig
  projectInfo: IProjectInfo
}
