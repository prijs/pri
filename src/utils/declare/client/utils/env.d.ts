export declare class GlobalEnv {
    public isLocal: boolean;
    public isProd: boolean;
    public customEnv: any;
    public get: (name: string) => any;
}
declare let env: GlobalEnv;
export { env };
export declare function setEnvLocal(): void;
export declare function setEnvProd(): void;
export declare function setCustomEnv(info: any): void;
