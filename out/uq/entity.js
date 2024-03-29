"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entity = void 0;
const objPropIgnoreCase_1 = require("../tool/objPropIgnoreCase");
const tab = '\t';
const ln = '\n';
class Entity {
    get sName() { return this.jName || this.name; }
    constructor(entities, name, typeId) {
        //protected get tvApi() {return this.uq.uqApi;}
        //async getApiFrom() {return this.uq.uqApi;}
        this.fieldMaps = {};
        this.uq = entities;
        this.name = name;
        this.typeId = typeId;
        this.sys = this.name.indexOf('$') >= 0;
        this.ver = 0;
    }
    fieldMap(arr) {
        if (arr === undefined)
            arr = '$';
        let ret = this.fieldMaps[arr];
        if (ret === undefined) {
            let fields;
            if (arr === '$')
                fields = this.fields;
            else if (this.arrFields !== undefined) {
                let arrFields = this.arrFields.find(v => v.name === arr);
                if (arrFields !== undefined)
                    fields = arrFields.fields;
            }
            else if (this.returns !== undefined) {
                let arrFields = this.returns.find(v => v.name === arr);
                if (arrFields !== undefined)
                    fields = arrFields.fields;
            }
            if (fields === undefined)
                return {};
            ret = {};
            for (let f of fields)
                ret[f.name] = f;
            this.fieldMaps[arr] = ret;
        }
        return ret;
    }
    async loadSchema() {
        if (this.schema !== undefined)
            return;
        let schema = await this.uq.schema(this.name);
        this.setSchema(schema);
    }
    setSchema(schema) {
        if (schema === undefined)
            return;
        if (this.schema !== undefined)
            return;
        let { call } = schema;
        if (call !== undefined)
            schema = call;
        this.schema = schema;
        let { name, fields, arrs, returns, version } = schema;
        this.ver = version || 0;
        if (name !== this.name)
            this.jName = name;
        this.uq.buildFieldTuid(this.fields = fields);
        this.uq.buildArrFieldsTuid(this.arrFields = arrs, fields);
        this.uq.buildArrFieldsTuid(this.returns = returns, fields);
        //this.newMain = this.buildCreater(fields);
        //this.newArr = this.buildArrCreater(arrs);
        //this.newRet = this.buildArrCreater(returns);
    }
    /*
    buildFieldsTuid() {
        let {name, fields, arrs, returns, version} = this.schema;
        this.uq.buildFieldTuid(this.fields = fields);
        this.uq.buildArrFieldsTuid(this.arrFields = arrs, fields);
        this.uq.buildArrFieldsTuid(this.returns = returns, fields);
    }
    */
    schemaStringify() {
        return JSON.stringify(this.schema, (key, value) => {
            if (key === '_tuid')
                return undefined;
            return value;
        }, 4);
    }
    tuidFromField(field) {
        let { _tuid, tuid } = field;
        if (tuid === undefined)
            return;
        if (_tuid !== undefined)
            return _tuid;
        return field._tuid = this.uq.getTuid(tuid, undefined);
    }
    tuidFromName(fieldName, arrName) {
        if (this.schema === undefined)
            return;
        let { fields, arrs } = this.schema;
        let entities = this.uq;
        function getTuid(fn, fieldArr) {
            if (fieldArr === undefined)
                return;
            let f = fieldArr.find(v => v.name === fn);
            if (f === undefined)
                return;
            return entities.getTuid(f.tuid, undefined);
        }
        let fn = fieldName.toLowerCase();
        if (arrName === undefined)
            return getTuid(fn, fields);
        if (arrs === undefined)
            return;
        let an = arrName.toLowerCase();
        let arr = arrs.find(v => v.name === an);
        if (arr === undefined)
            return;
        return getTuid(fn, arr.fields);
    }
    buildParams(params) {
        let result = {};
        let fields = this.fields;
        if (fields !== undefined)
            this.buildFieldsParams(result, fields, params);
        let arrs = this.arrFields;
        if (arrs !== undefined) {
            for (let arr of arrs) {
                let { name, fields } = arr;
                let paramsArr = params[name];
                if (paramsArr === undefined)
                    continue;
                let arrResult = [];
                result[name] = arrResult;
                for (let pa of params) {
                    let rowResult = {};
                    this.buildFieldsParams(rowResult, fields, pa);
                    arrResult.push(rowResult);
                }
            }
        }
        return result;
    }
    buildFieldsParams(result, fields, params) {
        for (let field of fields) {
            let { name } = field;
            let d = params[name];
            let val;
            switch (typeof d) {
                default:
                    val = d;
                    break;
                case 'object':
                    let tuid = field._tuid;
                    if (tuid === undefined)
                        val = d.id;
                    else
                        val = tuid.getIdFromObj(d);
                    break;
            }
            result[name] = val;
        }
    }
    buildDateTimeParam(val) {
        let dt;
        switch (typeof val) {
            default:
                debugger;
                throw new Error('escape datetime field in pack data error: value=' + val);
            case 'undefined': return undefined;
            case 'object':
                dt = val;
                break;
            case 'string':
            case 'number':
                dt = new Date(val);
                break;
        }
        return Math.floor(dt.getTime() / 1000);
    }
    buildDateParam(val) {
        let dt;
        switch (typeof val) {
            default:
                debugger;
                throw new Error('escape datetime field in pack data error: value=' + val);
            case 'undefined': return undefined;
            case 'string': return val;
            case 'object':
                dt = val;
                break;
            case 'number':
                dt = new Date(val);
                break;
        }
        let ret = dt.toISOString();
        let p = ret.indexOf('T');
        return p > 0 ? ret.substr(0, p) : ret;
    }
    pack(data) {
        let ret = [];
        let fields = this.fields;
        if (fields !== undefined)
            this.packRow(ret, fields, data);
        let arrs = this.arrFields; //schema['arrs'];
        if (arrs !== undefined) {
            for (let arr of arrs) {
                let arrObj = (0, objPropIgnoreCase_1.getObjPropIgnoreCase)(data, arr.name);
                this.packArr(ret, arr.fields, arrObj);
            }
        }
        return ret.join('');
    }
    escape(row, field) {
        let d = row[field.name];
        switch (typeof d) {
            default: return d;
            case 'object':
                let tuid = field._tuid;
                if (tuid === undefined)
                    return d.id;
                return tuid.getIdFromObj(d);
            case 'string':
                let len = d.length;
                let r = '', p = 0;
                for (let i = 0; i < len; i++) {
                    let c = d.charCodeAt(i);
                    switch (c) {
                        case 9:
                            r += d.substring(p, i) + '\\t';
                            p = i + 1;
                            break;
                        case 10:
                            r += d.substring(p, i) + '\\n';
                            p = i + 1;
                            break;
                    }
                }
                return r + d.substring(p);
            case 'undefined': return '';
        }
    }
    packRow(result, fields, data) {
        let len = fields.length;
        if (len === 0)
            return;
        let ret = '';
        ret += this.escape(data, fields[0]);
        for (let i = 1; i < len; i++) {
            let f = fields[i];
            ret += tab + this.escape(data, f);
        }
        result.push(ret + ln);
    }
    packArr(result, fields, data) {
        if (data !== undefined) {
            if (data.length === 0) {
                result.push(ln);
            }
            else {
                for (let row of data) {
                    this.packRow(result, fields, row);
                }
            }
        }
        else {
            result.push(ln);
        }
        result.push(ln);
    }
    unpackSheet(data) {
        let ret = {}; //new this.newMain();
        //if (schema === undefined || data === undefined) return;
        let fields = this.fields;
        let p = 0;
        if (fields !== undefined)
            p = this.unpackRow(ret, fields, data, p);
        let arrs = this.arrFields; //schema['arrs'];
        if (arrs !== undefined) {
            for (let arr of arrs) {
                p = this.unpackArr(ret, arr, data, p);
            }
        }
        return ret;
    }
    unpackReturns(data) {
        let ret = {};
        //if (schema === undefined || data === undefined) return;
        //let fields = schema.fields;
        let p = 0;
        //if (fields !== undefined) p = unpackRow(ret, schema.fields, data, p);
        let arrs = this.returns; //schema['returns'];
        if (arrs !== undefined) {
            for (let arr of arrs) {
                //let creater = this.newRet[arr.name];
                p = this.unpackArr(ret, arr, data, p);
            }
        }
        return ret;
    }
    unpackRow(ret, fields, data, p) {
        let ch0 = 0, ch = 0, c = p, i = 0, len = data.length, fLen = fields.length;
        for (; p < len; p++) {
            ch0 = ch;
            ch = data.charCodeAt(p);
            if (ch === 9) {
                let f = fields[i];
                if (ch0 !== 8) {
                    if (p > c) {
                        let v = data.substring(c, p);
                        ret[f.name] = this.to(ret, v, f);
                    }
                }
                else {
                    ret[f.name] = null;
                }
                c = p + 1;
                ++i;
                if (i >= fLen)
                    break;
            }
            else if (ch === 10) {
                let f = fields[i];
                if (ch0 !== 8) {
                    if (p > c) {
                        let v = data.substring(c, p);
                        ret[f.name] = this.to(ret, v, f);
                    }
                }
                else {
                    ret[f.name] = null;
                }
                ++p;
                ++i;
                break;
            }
        }
        return p;
    }
    to(ret, v, f) {
        switch (f.type) {
            default: return v;
            case 'datetime':
            case 'date':
            case 'time':
                let date = new Date(Number(v));
                return date;
            case 'tinyint':
            case 'smallint':
            case 'int':
            case 'dec': return Number(v);
            case 'bigint':
                let id = Number(v);
                let { _tuid } = f;
                if (_tuid === undefined)
                    return id;
                console.log(this.name, 'bigint', v, 'tuid', _tuid.name);
                //_tuid.useId(id, true);
                //let val = _tuid.valueFromId(id);
                //return val.obj || val;
                //return _tuid.boxId(id);
                return { id: id };
            /*
            if (tuidKey !== undefined) {
                let tuid = f._tuid;
                if (tuid === undefined) {
                    // 在jsonStringify中间不会出现
                    Object.defineProperty(f, '_tuid', {value:'_tuid', writable: true});
                    f._tuid = tuid = this.getTuid(tuidKey, tuidUrl);
                }
                tuid.useId(Number(v), true);
            }*/
            //return Number(v);
        }
    }
    unpackArr(ret, arr, data, p) {
        let p0 = p;
        let vals = [], len = data.length;
        let { name, fields } = arr;
        while (p < len) {
            let ch = data.charCodeAt(p);
            if (ch === 10) {
                if (p === p0) {
                    ch = data.charCodeAt(p);
                    if (ch !== 10) {
                        throw new Error('upackArr: arr第一个字符是10，则必须紧跟一个10，表示整个arr的结束');
                    }
                    ++p;
                }
                ++p;
                break;
            }
            let val = {}; //new creater();
            vals.push(val);
            p = this.unpackRow(val, fields, data, p);
        }
        ret[name] = vals;
        return p;
    }
}
exports.Entity = Entity;
//# sourceMappingURL=entity.js.map