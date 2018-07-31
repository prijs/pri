export { env, setCustomEnv, setEnvLocal, setEnvProd } from '../utils/env';
export { ProjectConfig } from '../utils/project-config-interface';
import { History } from 'history';

export const history: History = (window as any).pri.history;
