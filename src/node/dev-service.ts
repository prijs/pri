import { plugin } from '../utils/plugins';
import { IDevServerConfigPipe } from '../utils/define';

export const on = (name: string, callback: (data?: any, resolve?: any, reject?: any) => void) => {
  plugin.devServices.socketListeners.push({
    name,
    callback,
  });
};

/**
 * It is better not to change the host、port and https here when use DLL
 * Because of the dllScript'src，is read host、devPort、useHttps from priconfig.json
 */
export const pipeConfig = (pipe: IDevServerConfigPipe) => {
  plugin.devServerConfigPipes.push(pipe);
};
