import { IProjectStatus } from '../server/project-status-interface';

export interface ITreeNode {
  children?: ITreeNode[];
  key: string;
  title: string;
  icon?: React.ReactElement<any>;
  disabled?: boolean;
}

export interface IPlugin {
  position: string;
  view: any;
  // init?: (applicationAction: ApplicationAction) => void;
  // TODO:
  init?: any;
}

export type Action =
  | {
      type: 'loadUiPlugins';
      plugins: any[];
    }
  | {
      type: 'setSelectedTreeKey';
      selectedTreeKey: string;
    }
  | {
      type: 'freshProjectStatus';
      status: IProjectStatus;
    };

export interface State {
  plugins: any[];
  status: any;
  selectedTreeKey: string;
}
