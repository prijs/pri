import { message } from "antd"
import { Action, inject, observable } from "dob"
import * as io from "socket.io-client"
import { IProjectStatus } from "../../server/project-status-interface"

const serverPort = (window as any)["serverPort"]

@observable
export class ApplciationStore {
  /**
   * Project status
   */
  public status: IProjectStatus
  /**
   * Selected key in left tree
   */
  public selectedTreeKey: string = "project-root"
}

export class ApplicationAction {
  @inject(ApplciationStore) public applicationStore: ApplciationStore

  private socket = io(`https://localhost:${serverPort}`)

  @Action
  public initSocket() {
    this.socket.on("freshProjectStatus", (data: IProjectStatus) => {
      Action(() => {
        this.applicationStore.status = data
      })
    })

    this.socket.on(
      "changeFile",
      (data: { path: string; fileContent: string }) => {
        //
      }
    )
  }

  @Action
  public fetch<T = {}>(name: string, data?: T) {
    return new Promise((resolve, reject) => {
      this.socket.emit(name, data, (res: any) => {
        if (res.success) {
          resolve(res.data)
        } else {
          reject()
          message.error(res.data)
        }
      })
    })
  }

  @Action
  public async addPage(options: { path: string }) {
    await this.fetch<typeof options>("addPage", options)
  }

  @Action
  public async addStore(options: { name: string; withDemo: boolean }) {
    await this.fetch<typeof options>("addStore", options)
  }

  @Action
  public async createConfig() {
    await this.fetch("createConfig")
  }

  @Action
  public async create404() {
    await this.fetch("create404")
  }

  @Action
  public async createLayout() {
    await this.fetch("createLayout")
  }

  @Action
  public setSelectedTreeKey(key: string) {
    this.applicationStore.selectedTreeKey = key
  }
}
