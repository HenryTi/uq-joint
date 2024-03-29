import { TuidMain, Tuid } from "./tuid";
import { Field, ArrFields } from "./field";
import { UqApi } from "../tool/uqApi";
import { Uqs } from "./uqs";
import { centerApi } from "../tool/centerApi";
import { host } from "../tool/host";
import { Sheet } from "./sheet";
import { Action } from "./action";
import { Query } from "./query";
import { Map } from "./map";

function createIgnoreCaseProxy<T>(): { [name: string]: T } {
    return new Proxy({}, {
        get: function (target, key, receiver) {
            if (typeof key === 'string') {
                let lk = (key as string).toLowerCase();
                let ret = target[lk];
                return ret;
            }
            else {
                return target[key];
            }
        },
        set: function (target, p, value: any, receiver): boolean {
            if (typeof p === 'string') {
                target[p.toLowerCase()] = value;
            }
            else {
                target[p] = value;
            }
            return true;
        }
    });
}

export abstract class Uq {
    private readonly uqs: Uqs;
    private readonly uqFullName: string;
    private readonly tuids: { [name: string]: TuidMain } = createIgnoreCaseProxy<TuidMain>();
    private readonly tuidArr: TuidMain[] = [];
    private readonly sheets: { [name: string]: Sheet } = createIgnoreCaseProxy<Sheet>();
    private readonly sheetArr: Sheet[] = [];
    private readonly actions: { [name: string]: Action } = createIgnoreCaseProxy<Action>();
    private readonly actionArr: Action[] = [];
    private readonly queries: { [name: string]: Query } = createIgnoreCaseProxy<Query>();
    private readonly queryArr: Query[] = [];
    private readonly maps: { [name: string]: Map } = createIgnoreCaseProxy<Map>();
    private readonly mapArr: Map[] = [];

    uqApi: UqApi;
    id: number;
    uqVersion: number;

    constructor(uqs: Uqs, uqFullName: string) {
        this.uqs = uqs;
        this.uqFullName = uqFullName;
        this.uqVersion = 0;
    }

    async init(userName: string, password: string) {
        await this.initUqApi(userName, password);
        await this.loadEntities();
    }

    async buildData(data: any, props: { [name: string]: UqProp }) {
        if (data === undefined) return;
        let ret: any = {};
        let names: string[] = [];
        let promises: Promise<any>[] = [];
        for (let i in data) {
            let v = data[i];
            if (v === undefined) continue;
            let prop = props[i];
            if (prop === undefined) {
                ret[i] = v;
                continue;
            }
            let { uq: uqFullName, tuid: tuidName, tuidOwnerProp } = prop;
            let tuid: Tuid = await this.getTuidFromUq(uqFullName, tuidName);
            if (tuid === undefined) continue;
            names.push(i);
            let ownerId = tuidOwnerProp && data[tuidOwnerProp];
            promises.push(this.buildTuidValue(tuid, prop, v, ownerId));
        }
        let len = names.length;
        if (len > 0) {
            let values = await Promise.all(promises);
            for (let i = 0; i < len; i++) {
                ret[names[i]] = values[i];
            }
        }
        return ret;
    }

    private async buildTuidValue(tuid: Tuid, prop: Prop, id: number, ownerId: number): Promise<any> {
        let tuidFrom: Tuid = await tuid.getTuidFrom();
        let all: boolean;
        let props: { [name: string]: Prop | boolean };
        if (prop === undefined) {
            all = false;
        }
        else {
            all = prop.all;
            props = prop.props;
        }
        let ret = await tuidFrom.loadValue(id, ownerId, all);
        if (props === undefined) return ret;

        let names: string[] = [];
        let promises: Promise<any>[] = [];
        for (let f of tuidFrom.fields) {
            let { _tuid, _ownerField } = f;
            if (_tuid === undefined) continue;
            let { name } = f;
            let prp = props[name];
            if (prp === undefined) continue;
            let v = ret[name];
            if (v === undefined) continue;
            let vType = typeof v;
            if (vType === 'object') continue;
            let p: Prop;
            if (typeof prp === 'boolean') p = undefined;
            else p = prp as Prop;
            names.push(name);
            let ownerId = _ownerField && ret[_ownerField.name];
            promises.push(this.buildTuidValue(_tuid, p, v, ownerId));
        }
        let len = names.length;
        if (len > 0) {
            let values = await Promise.all(promises);
            for (let i = 0; i < len; i++) {
                ret[names[i]] = values[i];
            }
        }
        return ret;
    }

    async getFromUq(uqFullName: string): Promise<Uq> {
        let uq = await this.uqs.getUq(uqFullName);
        return uq;
    }

    async getTuidFromUq(uqFullName: string, tuidName: string): Promise<Tuid> {
        //tuidName = tuidName.toLowerCase();
        if (uqFullName === undefined) return this.getTuidFromName(tuidName);
        let uq = await this.uqs.getUq(uqFullName);
        if (uq === undefined) return;
        let tuid = uq.getTuidFromName(tuidName);
        if (tuid.from !== undefined) {
            let { owner, uq: uqName } = tuid.from;
            let fromUq = await this.uqs.getUq(owner + '/' + uqName);
            if (fromUq === undefined) return;
            tuid = fromUq.getTuidFromName(tuidName);
        }
        return tuid;
    }

    getTuidFromName(tuidName: string) {
        let parts = tuidName.split('.');
        return this.getTuid(parts[0], parts[1]);
    }

    async schema(entityName: string): Promise<any> {
        return await this.uqApi.schema(entityName);
    }

    async getIDNew(ID: string, keys: { [key: string]: any }): Promise<number> {
        return await this.uqApi.getIDNew(ID, keys);
    }

    async saveID(ID: string, body: any): Promise<{ id: number, inId: number }> {
        return await this.uqApi.saveID(ID, body);
    }

    async saveTuid(tuid: string, body: any): Promise<{ id: number, inId: number }> {
        return await this.uqApi.saveTuid(tuid, body);
    }

    async saveTuidArr(tuid: string, tuidArr: string, ownerId: number, body: any): Promise<{ id: number, inId: number }> {
        return await this.uqApi.saveTuidArr(tuid, tuidArr, ownerId, body);
    }

    async getTuidVId(ownerEntity: string): Promise<number> {
        return await this.uqApi.getTuidVId(ownerEntity);
    }

    async loadTuidMainValue(tuidName: string, id: number, allProps: boolean): Promise<any> {
        return await this.uqApi.loadTuidMainValue(tuidName, id, allProps);
    }

    async loadTuidDivValue(tuidName: string, divName: string, id: number, ownerId: number, allProps: boolean): Promise<any> {
        return await this.uqApi.loadTuidDivValue(tuidName, divName, id, ownerId, allProps);
    }

    async setMap(map: string, body: any) {
        await this.uqApi.setMap(map, body);
    }

    async delMap(map: string, body: any) {
        await this.uqApi.delMap(map, body);
    }

    /**
     * 初始化本uq的 uqApi(用于执行后台调用) 
     * @param userName 
     * @param password 
     */
    private async initUqApi(userName: string, password: string): Promise<void> {
        let { unit } = this.uqs;
        let realUrl = await this.unitUrl(unit);
        let loginResult = await centerApi.login({ user: userName, pwd: password });

        let uqToken: any;
        if (loginResult !== undefined) {
            let parts = this.uqFullName.split('/');
            uqToken = await centerApi.uqToken(unit, parts[0], parts[1]);
        }

        this.uqApi = new UqApi(realUrl, unit, uqToken && uqToken.token);
    }

    protected abstract getReadUrl(uqUrl: { url: string, urlTest: string }): string;

    /**
     * 获取本uq的根url地址 
     * @param unit 
     * @returns 
     */
    protected async unitUrl(unit: number): Promise<string> {
        let uqUrl = await centerApi.urlFromUq(unit, this.uqFullName);
        let { db } = uqUrl;
        let url = this.getReadUrl(uqUrl);
        //let { db, url, urlTest } = uqUrl;
        let realUrl = host.getUqUrl(db, url);
        return realUrl;
    }

    private buildTuids(tuids: any) {
        for (let i in tuids) {
            let schema = tuids[i];
            let { name, typeId } = schema;
            let tuid = this.newTuid(i, typeId);
            tuid.sys = true;
        }
        for (let i in tuids) {
            let schema = tuids[i];
            let { name } = schema;
            let tuid = this.getTuid(i);
            //tuid.sys = true;
            tuid.setSchema(schema);
        }
    }

    private buildAccess(access: any) {
        for (let a in access) {
            let v = access[a];
            switch (typeof v) {
                case 'string': this.fromType(a, v); break;
                case 'object': this.fromObj(a, v); break;
            }
        }
    }

    private fromType(name: string, type: string) {
        let parts = type.split('|');
        type = parts[0];
        let id = Number(parts[1]);
        switch (type) {
            case 'uq': this.id = id; break;
            case 'tuid':
                let tuid = this.newTuid(name, id);
                tuid.sys = false;
                break;
            case 'sheet': this.newSheet(name, id); break;
            case 'action': this.newAction(name, id); break;
            case 'query': this.newQuery(name, id); break;
            case 'map': this.newMap(name, id); break;
            //case 'book': this.newBook(name, id); break;
            //case 'history': this.newHistory(name, id); break;
            //case 'pending': this.newPending(name, id); break;
        }
    }

    private fromObj(name: string, obj: any) {
        switch (obj['$']) {
            case 'sheet': this.buildSheet(name, obj); break;
        }
    }
    private buildSheet(name: string, obj: any) {
        let sheet = this.sheets[name];
        if (sheet === undefined) sheet = this.newSheet(name, obj.id);
        sheet.build(obj);
    }

    /**
     * 加载本uq的所有实体定义
     */
    protected async loadEntities() {
        let entities = await this.uqApi.loadEntities();
        this.buildEntities(entities);
    }

    buildEntities(entities: any) {
        let { access, tuids, version } = entities;
        this.uqVersion = version;
        this.buildTuids(tuids);
        this.buildAccess(access);
    }

    getTuid(name: string, div?: string, tuidUrl?: string): Tuid {
        let tuid = this.tuids[name];
        if (tuid === undefined) return;
        if (div === undefined) return tuid;
        return tuid.divs[div];
    }

    private newTuid(name: string, entityId: number): TuidMain {
        let tuid = this.tuids[name];
        if (tuid !== undefined) return tuid;
        tuid = this.tuids[name] = new TuidMain(this, name, entityId);
        this.tuidArr.push(tuid);
        return tuid;
    }
    buildFieldTuid(fields: Field[], mainFields?: Field[]) {
        if (fields === undefined) return;
        for (let f of fields) {
            let { tuid, arr, url } = f;
            if (tuid === undefined) continue;
            f._tuid = this.getTuid(tuid, arr, url);
        }
        for (let f of fields) {
            let { owner } = f;
            if (owner === undefined) continue;
            let ownerField = fields.find(v => v.name === owner);
            if (ownerField === undefined) {
                if (mainFields !== undefined) {
                    ownerField = mainFields.find(v => v.name === owner);
                }
                if (ownerField === undefined) {
                    throw `owner field ${owner} is undefined`;
                }
            }
            f._ownerField = ownerField;
            let { arr, url } = f;
            f._tuid = this.getTuid(ownerField._tuid.name, arr, url);
            if (f._tuid === undefined) throw 'owner field ${owner} is not tuid';
        }
    }
    buildArrFieldsTuid(arrFields: ArrFields[], mainFields: Field[]) {
        if (arrFields === undefined) return;
        for (let af of arrFields) {
            let { fields } = af;
            if (fields === undefined) continue;
            this.buildFieldTuid(fields, mainFields);
        }
    }

    private newSheet(name: string, entityId: number): Sheet {
        let sheet = this.sheets[name];
        if (sheet !== undefined) return sheet;
        sheet = this.sheets[name] = new Sheet(this, name, entityId);
        this.sheetArr.push(sheet);
        return sheet;
    }

    newAction(name: string, id: number): Action {
        let action = this.actions[name];
        if (action !== undefined) return action;
        action = this.actions[name] = new Action(this, name, id)
        this.actionArr.push(action);
        return action;
    }
    newQuery(name: string, id: number): Query {
        let query = this.queries[name];
        if (query !== undefined) return query;
        query = this.queries[name] = new Query(this, name, id)
        this.queryArr.push(query);
        return query;
    }

    tuid(name: string): Tuid { return this.tuids[name] }
    /*
    tuidDiv(name:string, div:string):TuidDiv {
        let tuid = this.tuids[name.toLowerCase()]
        return tuid && tuid.div(div.toLowerCase());
    }
    */
    action(name: string): Action { return this.actions[name] }
    sheet(name: string): Sheet { return this.sheets[name] }
    query(name: string): Query { return this.queries[name] }
    map(name: string): Map { return this.maps[name] }
    //book(name:string):Book {return this.books[name.toLowerCase()]}
    //history(name:string):History {return this.histories[name.toLowerCase()]}
    //pending(name:string):Pending {return this.pendings[name.toLowerCase()]}

    private newMap(name: string, id: number): Map {
        let map = this.maps[name];
        if (map !== undefined) return map;
        map = this.maps[name] = new Map(this, name, id)
        this.mapArr.push(map);
        return map;
    }

    /*
    private newBook(name:string, id:number):Book {
        let book = this.books[name];
        if (book !== undefined) return book;
        book = this.books[name] = new Book(this, name, id);
        this.bookArr.push(book);
        return book;
    }
    private newHistory(name:string, id:number):History {
        let history = this.histories[name];
        if (history !== undefined) return;
        history = this.histories[name] = new History(this, name, id)
        this.historyArr.push(history);
        return history;
    }
    private newPending(name:string, id:number):Pending {
        let pending = this.pendings[name];
        if (pending !== undefined) return;
        pending = this.pendings[name] = new Pending(this, name, id)
        this.pendingArr.push(pending);
        return pending;
    }
    */
}

export class UqProd extends Uq {
    protected getReadUrl(uqUrl: { url: string, urlTest: string }): string {
        return uqUrl.url;
    }
}

export class UqTest extends Uq {
    protected getReadUrl(uqUrl: { url: string, urlTest: string }): string {
        return uqUrl.urlTest;
    }
}

export interface Prop {
    all?: boolean;      // 获取tuid的时候，all=true则取全部属性，all=false or undeinfed则取主要属性
    props?: { [name: string]: Prop | boolean }
}

export interface UqProp extends Prop {
    uq?: string;
    tuid: string;
    tuidOwnerProp?: string;
}

interface BusMessage {
    id: number;
    face: string;
    from: string;
    body: string;
}
