import { Action, inject, observable } from "dob"
import * as io from 'socket.io-client'
import { IProjectStatus } from '../../server/project-status-interface'
import { message } from 'antd'

@observable
export class ApplciationStore {
  status: IProjectStatus = null
}

export class ApplicationAction {
  @inject(ApplciationStore) public applicationStore: ApplciationStore = null as any

  private socket = io('https://localhost:8001')

  @Action public initSocket() {
    this.socket.on('freshProjectStatus', (data: IProjectStatus) => {
      Action(() => {
        this.applicationStore.status = data
      })
    })

    this.socket.on('changeFile', (data: {
      path: string
      fileContent: string
    }) => {

    })
  }

  @Action public fetch<T>(name: string, data: T) {
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

  @Action public async addPage(options: {
    path: string
  }) {
    await this.fetch<typeof options>('addPage', options)
  }
}
