import { Router } from "express";
import { Settings, UqIn, UqOut, UqInTuid, UqInMap, UqInTuidArr, UqInID } from "./defines";
import { Uq } from "./uq/uq";
export type ProdOrTest = 'prod' | 'test';
export declare class Joint {
    private readonly scanInterval;
    private readonly notifierScheduler;
    private readonly queueOutPCache;
    private readonly settings;
    private readonly uqs;
    private readonly unitx;
    private readonly workTime;
    private tickCount;
    constructor(settings: Settings, prodOrTest?: ProdOrTest);
    private uqInDict;
    getUqIn(uqFullName: string): UqIn;
    readonly unit: number;
    createRouter(): Router;
    getUq(uqFullName: string): Promise<Uq>;
    init(): Promise<void>;
    start(): Promise<void>;
    private tick;
    /**
     * 从外部系统同步数据到Tonva
     */
    private scanIn;
    uqIn(uqIn: UqIn, data: any): Promise<void>;
    protected uqInID(uqIn: UqInID, data: any): Promise<number>;
    protected uqInIX(uqIn: UqInID, data: any): Promise<void>;
    protected uqInTuid(uqIn: UqInTuid, data: any): Promise<number>;
    protected uqInTuidArr(uqIn: UqInTuidArr, data: any): Promise<number>;
    /**
     * 在tuidDiv中，根据其owner的no获取id，若owner尚未生成id，则生成之
     * @param uqIn
     * @param ownerVal
     */
    private mapOwner;
    protected uqInMap(uqIn: UqInMap, data: any): Promise<void>;
    private writeQueueOutP;
    /**
     *
     */
    private scanOut;
    uqOut(uqOut: UqOut, queue: number): Promise<{
        queue: number;
        data: any;
    }>;
    /**
     * 通过bus做双向数据同步（bus out和bus in)
     */
    protected scanBus(): Promise<void>;
    protected userOut(face: string, queue: number): Promise<any>;
}
