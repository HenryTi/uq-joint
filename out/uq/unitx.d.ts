import { CenterUnitxUrls, UnitxUrlServer } from "../tool/centerApi";
export interface BusMessage {
    id: number;
    face: string;
    from: string;
    body: string;
}
/**
 * 封装UnitX上的接口（如读写bus）
 */
export declare abstract class Unitx {
    private unit;
    private prevUnitxApi;
    private currentUnitxApi;
    private currentCreateTick;
    constructor(unit: number);
    /**
     * 初始化this.currentCreateTick / this.prevUnitxApi / this.currentUnitxApi(这3个是干什么的？)
     */
    init(): Promise<void>;
    private createUnitxApi;
    readBus(face: string, queue: number, defer: number): Promise<any>;
    writeBus(face: string, source: string, newQueue: string | number, busVersion: number, body: any, defer: number, stamp?: number): Promise<void>;
    protected abstract toTvCurrent(unitxUrls: CenterUnitxUrls): {
        tv: UnitxUrlServer;
        current: UnitxUrlServer;
    };
    protected abstract unitxUrl(url: string): string;
}
export declare class UqUnitxProd extends Unitx {
    protected toTvCurrent(unitxUrls: CenterUnitxUrls): {
        tv: UnitxUrlServer;
        current: UnitxUrlServer;
    };
    protected unitxUrl(url: string): string;
}
export declare class UqUnitxTest extends Unitx {
    protected toTvCurrent(unitxUrls: CenterUnitxUrls): {
        tv: UnitxUrlServer;
        current: UnitxUrlServer;
    };
    protected unitxUrl(url: string): string;
}
