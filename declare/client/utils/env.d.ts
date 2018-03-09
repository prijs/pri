export declare class GlobalEnv {
    isLocal: boolean;
    isProd: boolean;
    customEnv: any;
    get: (name: string) => any;
}
declare let env: GlobalEnv;
export { env };
export declare function setEnvLocal(): void;
export declare function setEnvProd(): void;
export declare function setCustomEnv(info: any): void;
