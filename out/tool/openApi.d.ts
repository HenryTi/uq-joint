import { Headers } from "node-fetch";
import { Fetch } from "./fetch";
export interface BusMessage {
    id: number;
    face: string;
    from: string;
    body: string;
}
/**
 * 这个OpenApi好像是没有用
 */
export declare class OpenApi extends Fetch {
    protected unit: number;
    constructor(baseUrl: string, unit: number);
    protected appendHeaders(headers: Headers): void;
    bus(faces: string, faceUnitMessages: string): Promise<any>;
    readBus(face: string, queue: number): Promise<BusMessage>;
    writeBus(face: string, from: string, queue: number | string, busVersion: number, body: string): Promise<BusMessage>;
    tuid(unit: number, id: number, tuid: string, maps: string[]): Promise<any>;
    saveTuid(tuid: string, data: any): Promise<any>;
    saveTuidArr(tuid: string, arr: string, owner: number, data: any): Promise<any>;
    getTuidVId(tuid: string): Promise<number>;
    scanSheet(sheet: string, scanStartId: number): Promise<any>;
    action(action: string, data: any): Promise<void>;
    setMap(map: string, data: any): Promise<void>;
    delMap(map: string, data: any): Promise<void>;
    loadTuidMainValue(tuidName: string, id: number, allProps: boolean): Promise<any>;
    loadTuidDivValue(tuidName: string, divName: string, id: number, ownerId: number, allProps: boolean): Promise<any>;
    loadEntities(): Promise<any>;
    schema(entityName: string): Promise<any>;
}
