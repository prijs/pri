import { Icon, message } from 'antd';
import { Action, inject, observable } from 'dob';
import * as React from 'react';
import * as io from 'socket.io-client';
import { IProjectStatus } from '../../server/project-status-interface';
import { Event } from '../utils/event';

const TreeIcon = (props: any) =>
  React.createElement(Icon, {
    ...props,
    style: {
      marginRight: 5
    }
  });

const {serverPort} = window as any;

interface ITreeNode {
  children?: ITreeNode[];
  key: string;
  title: string;
  icon?: React.ReactElement<any>;
  disabled?: boolean;
}

interface IPlugin {
  position: string;
  view: any;
  init?: (applicationAction: ApplicationAction) => void;
}

@observable
export class ApplciationStore {
  /**
   * Project status
   */
  public status: IProjectStatus;

  /**
   * Selected key in left tree
   */
  public selectedTreeKey: string = 'project-root';

  /**
   * Plugins
   */
  public plugins: IPlugin[] = [];

  /**
   * Project tree data
   */
  public treeData: ITreeNode[] = [];
}

export class ApplicationAction {
  public event = new Event();

  @inject(ApplciationStore) public applicationStore: ApplciationStore;

  private socket = io(`//localhost:${serverPort}`);

  @Action
  public initSocket() {
    this.socket.on('freshProjectStatus', (data: IProjectStatus) => {
      Action(() => {
        this.applicationStore.status = data;
        this.clearTreeData();
        this.event.emit('freshProjectStatus');
      });
    });

    this.socket.on('changeFile', (data: { path: string; fileContent: string }) => {
      //
    });
  }

  @Action
  public fetch<T = {}>(name: string, data?: T) {
    return new Promise((resolve, reject) => {
      this.socket.emit(name, data, (res: any) => {
        if (res.success) {
          resolve(res.data);
        } else {
          reject();
          message.error(res.data);
        }
      });
    });
  }

  @Action
  public async addPage(options: { path: string }) {
    await this.fetch<typeof options>('addPage', options);
  }

  @Action
  public async addStore(options: { name: string; withDemo: boolean }) {
    await this.fetch<typeof options>('addStore', options);
  }

  @Action
  public async createConfig() {
    await this.fetch('createConfig');
  }

  @Action
  public async create404() {
    await this.fetch('create404');
  }

  @Action
  public async createLayout() {
    await this.fetch('createLayout');
  }

  @Action
  public setSelectedTreeKey(key: string) {
    this.applicationStore.selectedTreeKey = key;
  }

  @Action
  public pipeTreeNode(callback: (treeData: ITreeNode[]) => ITreeNode[]) {
    this.applicationStore.treeData = callback(this.applicationStore.treeData);
  }

  @Action
  public loadUiPlugins(plugins: IPlugin[]) {
    if (!plugins) {
      return;
    }

    // Run plugins init function.
    plugins.forEach(plugin => {
      if (plugin.init) {
        plugin.init(this);
      }
    });

    plugins.forEach(plugin => this.applicationStore.plugins.push(plugin));
  }

  @Action
  public loadPluginsByPosition(position: string, props?: any) {
    return this.applicationStore.plugins
      .filter(plugin => plugin.position === position)
      .map((plugin, index) => {
        return React.createElement(plugin.view, { key: index, ...props });
      });
  }

  @Action
  private clearTreeData() {
    this.applicationStore.treeData = [
      {
        title: 'Project',
        key: 'project-root',
        icon: React.createElement(TreeIcon, {
          type: 'chrome'
        }),
        children: []
      }
    ];
  }
}
