import { IProjectInfo } from '../../../../utils/analyse-project-interface'
import { IConfig } from '../../../../utils/project-config-interface'

export interface IProjectStatus {
  config: IConfig
  info: IProjectInfo
}