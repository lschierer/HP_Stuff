import fs from 'node:fs/promises';
import minpath from 'node:path';
import minproc from 'node:process';
import { fileURLToPath } from 'node:url';

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

var util;
(function (util) {
    util.assertEqual = (val) => val;
    function assertIs(_arg) { }
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array
            .map((val) => (typeof val === "string" ? `'${val}'` : val))
            .join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
})(util || (util = {}));
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return ZodParsedType.undefined;
        case "string":
            return ZodParsedType.string;
        case "number":
            return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
            return ZodParsedType.boolean;
        case "function":
            return ZodParsedType.function;
        case "bigint":
            return ZodParsedType.bigint;
        case "symbol":
            return ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return ZodParsedType.array;
            }
            if (data === null) {
                return ZodParsedType.null;
            }
            if (data.then &&
                typeof data.then === "function" &&
                data.catch &&
                typeof data.catch === "function") {
                return ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return ZodParsedType.date;
            }
            return ZodParsedType.object;
        default:
            return ZodParsedType.unknown;
    }
};

const ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
class ZodError extends Error {
    get errors() {
        return this.issues;
    }
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                }
                else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                }
                else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                }
                else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    static assert(value) {
        if (!(value instanceof ZodError)) {
            throw new Error(`Not a ZodError: ${value}`);
        }
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
                fieldErrors[sub.path[0]].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};

const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodIssueCode.invalid_type:
            if (issue.received === ZodParsedType.undefined) {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
            break;
        case ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
            break;
        case ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
            break;
        case ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                }
                else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                }
                else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                }
                else {
                    util.assertNever(issue.validation);
                }
            }
            else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            }
            else {
                message = "Invalid";
            }
            break;
        case ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${issue.minimum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact
                    ? `exactly equal to `
                    : issue.inclusive
                        ? `greater than or equal to `
                        : `greater than `}${new Date(Number(issue.minimum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint")
                message = `BigInt must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `less than or equal to`
                        : `less than`} ${issue.maximum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact
                    ? `exactly`
                    : issue.inclusive
                        ? `smaller than or equal to`
                        : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else
                message = "Invalid input";
            break;
        case ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util.assertNever(issue);
    }
    return { message };
};

let overrideErrorMap = errorMap;
function setErrorMap(map) {
    overrideErrorMap = map;
}
function getErrorMap() {
    return overrideErrorMap;
}

const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    if (issueData.message !== undefined) {
        return {
            ...issueData,
            path: fullPath,
            message: issueData.message,
        };
    }
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: errorMessage,
    };
};
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap, // contextual error map is first priority
            ctx.schemaErrorMap, // then schema-bound map if available
            overrideMap, // then global override map
            overrideMap === errorMap ? undefined : errorMap, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
                key,
                value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return INVALID;
            if (value.status === "aborted")
                return INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (key.value !== "__proto__" &&
                (typeof value.value !== "undefined" || pair.alwaysSet)) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
const INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __classPrivateFieldGet(receiver, state, kind, f) {
    if (typeof state === "function" ? receiver !== state || true : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
    if (typeof state === "function" ? receiver !== state || true : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (state.set(receiver, value)), value;
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));

var _ZodEnum_cache, _ZodNativeEnum_cache;
class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (this._key instanceof Array) {
                this._cachedPath.push(...this._path, ...this._key);
            }
            else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result) => {
    if (isValid(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error() {
                if (this._error)
                    return this._error;
                const error = new ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            },
        };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        var _a, _b;
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
            return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
            return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: getParsedType(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        var _a;
        const ctx = {
            common: {
                issues: [],
                async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    "~validate"(data) {
        var _a, _b;
        const ctx = {
            common: {
                issues: [],
                async: !!this["~standard"].async,
            },
            path: [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        if (!this["~standard"].async) {
            try {
                const result = this._parseSync({ data, path: [], parent: ctx });
                return isValid(result)
                    ? {
                        value: result.value,
                    }
                    : {
                        issues: ctx.common.issues,
                    };
            }
            catch (err) {
                if ((_b = (_a = err === null || err === void 0 ? void 0 : err.message) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === null || _b === void 0 ? void 0 : _b.includes("encountered")) {
                    this["~standard"].async = true;
                }
                ctx.common = {
                    issues: [],
                    async: true,
                };
            }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result)
            ? {
                value: result.value,
            }
            : {
                issues: ctx.common.issues,
            });
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
                async: true,
            },
            path: (params === null || params === void 0 ? void 0 : params.path) || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: getParsedType(data),
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult)
            ? maybeAsyncResult
            : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function"
                    ? refinementData(val, ctx)
                    : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
            version: 1,
            vendor: "zod",
            validate: (data) => this["~validate"](data),
        };
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def),
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    readonly() {
        return ZodReadonly.create(this);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
// const uuidRegex =
//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
//old email regex
// const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
// eslint-disable-next-line
// const emailRegex =
//   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
// const emailRegex =
//   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// const emailRegex =
//   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
// const emailRegex =
//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
// faster, simpler, safer
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
// const ipv6Regex =
// /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
// https://base64.guru/standards/base64url
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
// simple
// const dateRegexSource = `\\d{4}-\\d{2}-\\d{2}`;
// no leap year validation
// const dateRegexSource = `\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\d|2\\d))`;
// with leap year validation
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
    // let regex = `\\d{2}:\\d{2}:\\d{2}`;
    let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
    if (args.precision) {
        regex = `${regex}\\.\\d{${args.precision}}`;
    }
    else if (args.precision == null) {
        regex = `${regex}(\\.\\d+)?`;
    }
    return regex;
}
function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
        return false;
    try {
        const [header] = jwt.split(".");
        // Convert base64url to base64
        const base64 = header
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
            return false;
        if (!decoded.typ || !decoded.alg)
            return false;
        if (alg && decoded.alg !== alg)
            return false;
        return true;
    }
    catch (_a) {
        return false;
    }
}
function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.string,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    else if (tooSmall) {
                        addIssueToContext(ctx, {
                            code: ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "email",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "emoji") {
                if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                }
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "emoji",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "uuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "nanoid") {
                if (!nanoidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "nanoid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cuid2",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ulid",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch (_a) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "regex",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "trim") {
                input.data = input.data.trim();
            }
            else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { includes: check.value, position: check.position },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            }
            else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            }
            else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { startsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: { endsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "date") {
                const regex = dateRegex;
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "date",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "time") {
                const regex = timeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_string,
                        validation: "time",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "duration") {
                if (!durationRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "duration",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "ip",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "jwt") {
                if (!isValidJWT(input.data, check.alg)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "jwt",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cidr") {
                if (!isValidCidr(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "cidr",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64") {
                if (!base64Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64url") {
                if (!base64urlRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        validation: "base64url",
                        code: ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
            validation,
            code: ZodIssueCode.invalid_string,
            ...errorUtil.errToObj(message),
        });
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return this._addCheck({
            kind: "base64url",
            ...errorUtil.errToObj(message),
        });
    }
    jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
        var _a, _b;
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                local: false,
                message: options,
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
            offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
            local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    date(message) {
        return this._addCheck({ kind: "date", message });
    }
    time(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "time",
                precision: null,
                message: options,
            });
        }
        return this._addCheck({
            kind: "time",
            precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil.errToObj(message),
        });
    }
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options === null || options === void 0 ? void 0 : options.position,
            ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message),
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
            ...errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil.errToObj(message),
        });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "trim" }],
        });
    }
    toLowerCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toLowerCase" }],
        });
    }
    toUpperCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toUpperCase" }],
        });
    }
    get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodString.create = (params) => {
    var _a;
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.number,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_finite,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil.toString(message),
        });
    }
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil.toString(message),
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil.toString(message),
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" ||
            (ch.kind === "multipleOf" && util.isInteger(ch.value)));
    }
    get isFinite() {
        let max = null, min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "finite" ||
                ch.kind === "int" ||
                ch.kind === "multipleOf") {
                return true;
            }
            else if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
            else if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
    }
    _parse(input) {
        if (this._def.coerce) {
            try {
                input.data = BigInt(input.data);
            }
            catch (_a) {
                return this._getInvalidInput(input);
            }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
            return this._getInvalidInput(input);
        }
        let ctx = undefined;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                const tooSmall = check.inclusive
                    ? input.data < check.value
                    : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive
                    ? input.data > check.value
                    : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.bigint,
            received: ctx.parsedType,
        });
        return INVALID;
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
            message: errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
ZodBigInt.create = (params) => {
    var _a;
    return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.date,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_date,
            });
            return INVALID;
        }
        const status = new ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else {
                util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime()),
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil.toString(message),
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
}
ZodDate.create = (params) => {
    return new ZodDate({
        checks: [],
        coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.symbol,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodSymbol.create = (params) => {
    return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.null,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return OK(input.data);
    }
}
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.never,
            received: ctx.parsedType,
        });
        return INVALID;
    }
}
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.void,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return OK(input.data);
    }
}
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                addIssueToContext(ctx, {
                    code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
                    minimum: (tooSmall ? def.exactLength.value : undefined),
                    maximum: (tooBig ? def.exactLength.value : undefined),
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([...ctx.data].map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return ParseStatus.mergeArray(status, result);
            });
        }
        const result = [...ctx.data].map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: { value: len, message: errorUtil.toString(message) },
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element),
        });
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        // extend<
        //   Augmentation extends ZodRawShape,
        //   NewOutput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   }>,
        //   NewInput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }>
        // >(
        //   augmentation: Augmentation
        // ): ZodObject<
        //   extendShape<T, Augmentation>,
        //   UnknownKeys,
        //   Catchall,
        //   NewOutput,
        //   NewInput
        // > {
        //   return new ZodObject({
        //     ...this._def,
        //     shape: () => ({
        //       ...this._def.shape(),
        //       ...augmentation,
        //     }),
        //   }) as any;
        // }
        /**
         * @deprecated Use `.extend` instead
         *  */
        this.augment = this.extend;
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        return (this._cached = { shape, keys });
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever &&
            this._def.unknownKeys === "strip")) {
            for (const key in ctx.data) {
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    addIssueToContext(ctx, {
                        code: ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") ;
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    syncPairs.push({
                        key,
                        value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        var _a, _b, _c, _d;
                        const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: () => ({
                ...this._def.shape(),
                ...augmentation,
            }),
        });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => ({
                ...this._def.shape(),
                ...merging._def.shape(),
            }),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        util.objectKeys(mask).forEach((key) => {
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        util.objectKeys(this.shape).forEach((key) => {
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    /**
     * @deprecated
     */
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            }
            else {
                newShape[key] = fieldSchema.optional();
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required(mask) {
        const newShape = {};
        util.objectKeys(this.shape).forEach((key) => {
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            }
            else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        });
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    keyof() {
        return createZodEnum(util.objectKeys(this.shape));
    }
}
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError(issues));
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union,
                unionErrors,
            });
            return INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//////////                                 //////////
//////////      ZodDiscriminatedUnion      //////////
//////////                                 //////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    }
    else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    }
    else if (type instanceof ZodLiteral) {
        return [type.value];
    }
    else if (type instanceof ZodEnum) {
        return type.options;
    }
    else if (type instanceof ZodNativeEnum) {
        // eslint-disable-next-line ban/ban
        return util.objectValues(type.enum);
    }
    else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    }
    else if (type instanceof ZodUndefined) {
        return [undefined];
    }
    else if (type instanceof ZodNull) {
        return [null];
    }
    else if (type instanceof ZodOptional) {
        return [undefined, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
    }
    else {
        return [];
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [discriminator],
            });
            return INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
        // Get all the valid discriminator values
        const optionsMap = new Map();
        // try {
        for (const type of options) {
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues.length) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value of discriminatorValues) {
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params),
        });
    }
}
function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
        const bKeys = util.objectKeys(b);
        const sharedKeys = util
            .objectKeys(a)
            .filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === ZodParsedType.date &&
        bType === ZodParsedType.date &&
        +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if (isAborted(parsedLeft) || isAborted(parsedRight)) {
                return INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.invalid_intersection_types,
                });
                return INVALID;
            }
            if (isDirty(parsedLeft) || isDirty(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.array,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            status.dirty();
        }
        const items = [...ctx.data]
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.object,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (ctx.common.async) {
            return ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
class ZodMap extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.map,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.set,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                addIssueToContext(ctx, {
                    code: ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodFunction extends ZodType {
    constructor() {
        super(...arguments);
        this.validate = this.implement;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.function,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        function makeArgsIssue(args, error) {
            return makeIssue({
                data: args,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                },
            });
        }
        function makeReturnsIssue(returns, error) {
            return makeIssue({
                data: returns,
                path: ctx.path,
                errorMaps: [
                    ctx.common.contextualErrorMap,
                    ctx.schemaErrorMap,
                    getErrorMap(),
                    errorMap,
                ].filter((x) => !!x),
                issueData: {
                    code: ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                },
            });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(async function (...args) {
                const error = new ZodError([]);
                const parsedArgs = await me._def.args
                    .parseAsync(args, params)
                    .catch((e) => {
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await Reflect.apply(fn, this, parsedArgs);
                const parsedReturns = await me._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        }
        else {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return OK(function (...args) {
                const parsedArgs = me._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
                }
                const result = Reflect.apply(fn, this, parsedArgs.data);
                const parsedReturns = me._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create()),
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType,
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    static create(args, returns, params) {
        return new ZodFunction({
            args: (args
                ? args
                : ZodTuple.create([]).rest(ZodUnknown.create())),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params),
        });
    }
}
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_literal,
                expected: this._def.value,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values, params) {
    return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params),
    });
}
class ZodEnum extends ZodType {
    constructor() {
        super(...arguments);
        _ZodEnum_cache.set(this, void 0);
    }
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache)) {
            __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values));
        }
        if (!__classPrivateFieldGet(this, _ZodEnum_cache).has(input.data)) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
            ...this._def,
            ...newDef,
        });
    }
    exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
            ...this._def,
            ...newDef,
        });
    }
}
_ZodEnum_cache = new WeakMap();
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    constructor() {
        super(...arguments);
        _ZodNativeEnum_cache.set(this, void 0);
    }
    _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string &&
            ctx.parsedType !== ZodParsedType.number) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                expected: util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodIssueCode.invalid_type,
            });
            return INVALID;
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache)) {
            __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)));
        }
        if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache).has(input.data)) {
            const expectedValues = util.objectValues(nativeEnumValues);
            addIssueToContext(ctx, {
                received: ctx.data,
                code: ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return INVALID;
        }
        return OK(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
_ZodNativeEnum_cache = new WeakMap();
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise &&
            ctx.common.async === false) {
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise
            ? ctx.data
            : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
            ? this._def.schema.sourceType()
            : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
            addIssue: (arg) => {
                addIssueToContext(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                }
                else {
                    status.dirty();
                }
            },
            get path() {
                return ctx.path;
            },
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data, checkCtx);
            if (ctx.common.async) {
                return Promise.resolve(processed).then(async (processed) => {
                    if (status.value === "aborted")
                        return INVALID;
                    const result = await this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (result.status === "aborted")
                        return INVALID;
                    if (result.status === "dirty")
                        return DIRTY(result.value);
                    if (status.value === "dirty")
                        return DIRTY(result.value);
                    return result;
                });
            }
            else {
                if (status.value === "aborted")
                    return INVALID;
                const result = this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
                if (result.status === "aborted")
                    return INVALID;
                if (result.status === "dirty")
                    return DIRTY(result.value);
                if (status.value === "dirty")
                    return DIRTY(result.value);
                return result;
            }
        }
        if (effect.type === "refinement") {
            const executeRefinement = (acc) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((inner) => {
                    if (inner.status === "aborted")
                        return INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (!isValid(base))
                    return base;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return { status: status.value, value: result };
            }
            else {
                return this._def.schema
                    ._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx })
                    .then((base) => {
                    if (!isValid(base))
                        return base;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
                });
            }
        }
        util.assertNever(effect);
    }
}
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
            return OK(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
            return OK(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
ZodDefault.create = (type, params) => {
    return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function"
            ? params.default
            : () => params.default,
        ...processCreateParams(params),
    });
};
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        // newCtx is used to not collect issues from inner types in ctx
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: [],
            },
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx,
            },
        });
        if (isAsync(result)) {
            return result.then((result) => {
                return {
                    status: "valid",
                    value: result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                                return new ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                        }),
                };
            });
        }
        else {
            return {
                status: "valid",
                value: result.status === "valid"
                    ? result.value
                    : this._def.catchValue({
                        get error() {
                            return new ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data,
                    }),
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
}
ZodCatch.create = (type, params) => {
    return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
const BRAND = Symbol("zod_brand");
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async () => {
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return DIRTY(inResult.value);
                }
                else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            };
            return handleAsync();
        }
        else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (inResult.status === "aborted")
                return INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value,
                };
            }
            else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline,
        });
    }
}
class ZodReadonly extends ZodType {
    _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
            if (isValid(data)) {
                data.value = Object.freeze(data.value);
            }
            return data;
        };
        return isAsync(result)
            ? result.then((data) => freeze(data))
            : freeze(result);
    }
    unwrap() {
        return this._def.innerType;
    }
}
ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params),
    });
};
////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      z.custom      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////
function cleanParams(params, data) {
    const p = typeof params === "function"
        ? params(data)
        : typeof params === "string"
            ? { message: params }
            : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
}
function custom(check, _params = {}, 
/**
 * @deprecated
 *
 * Pass `fatal` into the params object instead:
 *
 * ```ts
 * z.string().custom((val) => val.length > 5, { fatal: false })
 * ```
 *
 */
fatal) {
    if (check)
        return ZodAny.create().superRefine((data, ctx) => {
            var _a, _b;
            const r = check(data);
            if (r instanceof Promise) {
                return r.then((r) => {
                    var _a, _b;
                    if (!r) {
                        const params = cleanParams(_params, data);
                        const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
                        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
                    }
                });
            }
            if (!r) {
                const params = cleanParams(_params, data);
                const _fatal = (_b = (_a = params.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
                ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
            return;
        });
    return ZodAny.create();
}
const late = {
    object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (
// const instanceOfType = <T extends new (...args: any[]) => any>(
cls, params = {
    message: `Input not instance of ${cls.name}`,
}) => custom((data) => data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();
const coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true,
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true })),
};
const NEVER = INVALID;

var z = /*#__PURE__*/Object.freeze({
    __proto__: null,
    defaultErrorMap: errorMap,
    setErrorMap: setErrorMap,
    getErrorMap: getErrorMap,
    makeIssue: makeIssue,
    EMPTY_PATH: EMPTY_PATH,
    addIssueToContext: addIssueToContext,
    ParseStatus: ParseStatus,
    INVALID: INVALID,
    DIRTY: DIRTY,
    OK: OK,
    isAborted: isAborted,
    isDirty: isDirty,
    isValid: isValid,
    isAsync: isAsync,
    get util () { return util; },
    get objectUtil () { return objectUtil; },
    ZodParsedType: ZodParsedType,
    getParsedType: getParsedType,
    ZodType: ZodType,
    datetimeRegex: datetimeRegex,
    ZodString: ZodString,
    ZodNumber: ZodNumber,
    ZodBigInt: ZodBigInt,
    ZodBoolean: ZodBoolean,
    ZodDate: ZodDate,
    ZodSymbol: ZodSymbol,
    ZodUndefined: ZodUndefined,
    ZodNull: ZodNull,
    ZodAny: ZodAny,
    ZodUnknown: ZodUnknown,
    ZodNever: ZodNever,
    ZodVoid: ZodVoid,
    ZodArray: ZodArray,
    ZodObject: ZodObject,
    ZodUnion: ZodUnion,
    ZodDiscriminatedUnion: ZodDiscriminatedUnion,
    ZodIntersection: ZodIntersection,
    ZodTuple: ZodTuple,
    ZodRecord: ZodRecord,
    ZodMap: ZodMap,
    ZodSet: ZodSet,
    ZodFunction: ZodFunction,
    ZodLazy: ZodLazy,
    ZodLiteral: ZodLiteral,
    ZodEnum: ZodEnum,
    ZodNativeEnum: ZodNativeEnum,
    ZodPromise: ZodPromise,
    ZodEffects: ZodEffects,
    ZodTransformer: ZodEffects,
    ZodOptional: ZodOptional,
    ZodNullable: ZodNullable,
    ZodDefault: ZodDefault,
    ZodCatch: ZodCatch,
    ZodNaN: ZodNaN,
    BRAND: BRAND,
    ZodBranded: ZodBranded,
    ZodPipeline: ZodPipeline,
    ZodReadonly: ZodReadonly,
    custom: custom,
    Schema: ZodType,
    ZodSchema: ZodType,
    late: late,
    get ZodFirstPartyTypeKind () { return ZodFirstPartyTypeKind; },
    coerce: coerce,
    any: anyType,
    array: arrayType,
    bigint: bigIntType,
    boolean: booleanType,
    date: dateType,
    discriminatedUnion: discriminatedUnionType,
    effect: effectsType,
    'enum': enumType,
    'function': functionType,
    'instanceof': instanceOfType,
    intersection: intersectionType,
    lazy: lazyType,
    literal: literalType,
    map: mapType,
    nan: nanType,
    nativeEnum: nativeEnumType,
    never: neverType,
    'null': nullType,
    nullable: nullableType,
    number: numberType,
    object: objectType,
    oboolean: oboolean,
    onumber: onumber,
    optional: optionalType,
    ostring: ostring,
    pipeline: pipelineType,
    preprocess: preprocessType,
    promise: promiseType,
    record: recordType,
    set: setType,
    strictObject: strictObjectType,
    string: stringType,
    symbol: symbolType,
    transformer: effectsType,
    tuple: tupleType,
    'undefined': undefinedType,
    union: unionType,
    unknown: unknownType,
    'void': voidType,
    NEVER: NEVER,
    ZodIssueCode: ZodIssueCode,
    quotelessJson: quotelessJson,
    ZodError: ZodError
});

const Bookmark = z.object({
    title: z.object({
        name: z.string(),
        link: z.string().url().optional(),
    }),
    author: z.object({
        name: z.string(),
        link: z.string().url().optional(),
    }),
    dates: z.object({
        series_start: z.string().date().optional(),
        published: z.string().date().optional(),
        updated: z.string().date().optional(),
        completed: z.union([z.string().date(), z.boolean()]).optional(),
    }),
    comments: z.string(),
});

const fileDebug = {
    "/components/FanFiction/Harry_Potter_-_Nephilim/Appendices/PowerLevelTable.ts": false,
    "/components/GlobalFooter.ts": false,
    "/components/SiteTitle.ts": false,
    "/components/ThemeSelector.ts": false,
    "/components/TopHeader.ts": false,
    "/components/grampsParser/AncestorsTreeChart/AncestorsTree.ts": false,
    "/components/grampsParser/AncestorsTreeChart/DotChart.ts": false,
    "/components/grampsParser/AncestorsTreeChart/TreeChart.ts": false,
    "/components/grampsParser/AncestorsTreeChart/TreePerson.ts": false,
    "/components/grampsParser/Family.ts": false,
    "/components/grampsParser/FamilyListing.ts": false,
    "/components/grampsParser/FamilyPageSection.ts": false,
    "/components/grampsParser/GeneologicalStats.ts": false,
    "/components/grampsParser/Individual.ts": false,
    "/components/grampsParser/IndividualName.ts": false,
    "/components/grampsParser/PersonPageSection.ts": false,
    "/components/grampsParser/event.ts": false,
    "/components/grampsParser/genealogical-data.ts": false,
    "/components/grampsParser/state.ts": false,
    "/components/side-nav.ts": false,
    "/components/theme.ts": false,
    "/components/v-timeline.ts": false,
    "/layouts/Bookmarks.ts": false,
    "/layouts/standard.ts": true,
    "/lib/BookmarksList.ts": false,
    "/lib/GedcomConstants.ts": false,
    "/lib/Spectrum/SplitView.ts": false,
    "/lib/TimelineTypes.ts": false,
    "/lib/customMarkdownProcessing.ts": false,
    "/lib/debug.ts": false,
    "/lib/greenwoodPages.ts": false,
    "/lib/NPNOFPtemplate.ts": false,
    "/lib/topLevelSections.ts": false,
    "/pages/Bookmarks/Anti-Hermione.ts": false,
    "/pages/Bookmarks/Dealing With Snape/After He Dies.ts": false,
    "/pages/Bookmarks/Dealing With Snape/His Relationship With Lily.ts": false,
    "/pages/Bookmarks/Featuring Hermione.ts": false,
    "/pages/Bookmarks/Featuring Ron.ts": false,
    "/pages/Bookmarks/Fred and George.ts": false,
    "/pages/Bookmarks/Harry Leaves.ts": false,
    "/pages/Bookmarks/Luna.ts": false,
    "/pages/Bookmarks/Prequels.ts": false,
    "/pages/Bookmarks/Problems After the War.ts": false,
    "/pages/Bookmarks/Problems Exposed.ts": false,
    "/pages/Bookmarks/Responsible Adults.ts": false,
    "/pages/Bookmarks/The Missed Birthday.ts": false,
    "/pages/Bookmarks/Time Travel.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Astoria.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Daphne.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Gabrielle.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Ginny.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Hannah.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Sally-Anne.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Su Li.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Susan.ts": false,
    "/pages/Bookmarks/pairing/Harry/With Wednesday.ts": false,
    "/pages/Harrypedia/History.ts": false,
    "/pages/api/gedcom/event.ts": false,
    "/pages/api/gedcom/events.ts": false,
    "/pages/api/gedcom/families.ts": false,
    "/pages/api/gedcom/family.ts": false,
    "/pages/api/gedcom/people.ts": false,
    "/pages/api/gedcom/person.ts": false,
    "/plugins/DirectoryIndex.ts": false,
    "/plugins/gramps/families.ts": false,
    "/plugins/gramps/people.ts": false,
    "/schemas/bookmarks.ts": false,
    "/schemas/event.ts": false,
    "/schemas/gedcom/event.ts": false,
    "/schemas/gedcom/family.ts": false,
    "/schemas/gedcom/index.ts": false,
    "/schemas/gedcom/person.ts": false,
    "/schemas/gedcom/tags.ts": false,
    "/schemas/history.ts": false,
    "/schemas/index.ts": false,
};
function isAbsolutePath(path) {
    // Check for Unix-style absolute paths (starts with `/`)
    if (path.startsWith("/"))
        return true;
    // Check for Windows-style absolute paths (e.g., `C:\Users\Example`)
    if (/^[a-zA-Z]:[\\/]/.test(path))
        return true;
    // Check for absolute URLs
    try {
        new URL(path);
        return true;
    }
    catch {
        return false;
    }
}
const debugFunction = (myName) => {
    if (isAbsolutePath(myName)) {
        let root = "";
        const rootStack = new URL(import.meta.url).pathname.split("/");
        root = rootStack.slice(0, -2).join("/");
        myName = myName.replace(root, "");
    }
    return fileDebug[myName];
};

/**
 * List of HTML void tag names.
 *
 * @type {Array<string>}
 */
const htmlVoidElements = [
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'command',
  'embed',
  'frame',
  'hr',
  'image',
  'img',
  'input',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
];

/**
 * @import {Schema as SchemaType, Space} from 'property-information'
 */

/** @type {SchemaType} */
class Schema {
  /**
   * @param {SchemaType['property']} property
   *   Property.
   * @param {SchemaType['normal']} normal
   *   Normal.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Schema.
   */
  constructor(property, normal, space) {
    this.normal = normal;
    this.property = property;

    if (space) {
      this.space = space;
    }
  }
}

Schema.prototype.normal = {};
Schema.prototype.property = {};
Schema.prototype.space = undefined;

/**
 * @import {Info, Space} from 'property-information'
 */


/**
 * @param {ReadonlyArray<Schema>} definitions
 *   Definitions.
 * @param {Space | undefined} [space]
 *   Space.
 * @returns {Schema}
 *   Schema.
 */
function merge(definitions, space) {
  /** @type {Record<string, Info>} */
  const property = {};
  /** @type {Record<string, string>} */
  const normal = {};

  for (const definition of definitions) {
    Object.assign(property, definition.property);
    Object.assign(normal, definition.normal);
  }

  return new Schema(property, normal, space)
}

/**
 * Get the cleaned case insensitive form of an attribute or property.
 *
 * @param {string} value
 *   An attribute-like or property-like name.
 * @returns {string}
 *   Value that can be used to look up the properly cased property on a
 *   `Schema`.
 */
function normalize(value) {
  return value.toLowerCase()
}

/**
 * @import {Info as InfoType} from 'property-information'
 */

/** @type {InfoType} */
class Info {
  /**
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @returns
   *   Info.
   */
  constructor(property, attribute) {
    this.attribute = attribute;
    this.property = property;
  }
}

Info.prototype.attribute = '';
Info.prototype.booleanish = false;
Info.prototype.boolean = false;
Info.prototype.commaOrSpaceSeparated = false;
Info.prototype.commaSeparated = false;
Info.prototype.defined = false;
Info.prototype.mustUseProperty = false;
Info.prototype.number = false;
Info.prototype.overloadedBoolean = false;
Info.prototype.property = '';
Info.prototype.spaceSeparated = false;
Info.prototype.space = undefined;

let powers = 0;

const boolean = increment();
const booleanish = increment();
const overloadedBoolean = increment();
const number = increment();
const spaceSeparated = increment();
const commaSeparated = increment();
const commaOrSpaceSeparated = increment();

function increment() {
  return 2 ** ++powers
}

var types = /*#__PURE__*/Object.freeze({
	__proto__: null,
	boolean: boolean,
	booleanish: booleanish,
	commaOrSpaceSeparated: commaOrSpaceSeparated,
	commaSeparated: commaSeparated,
	number: number,
	overloadedBoolean: overloadedBoolean,
	spaceSeparated: spaceSeparated
});

/**
 * @import {Space} from 'property-information'
 */


const checks = /** @type {ReadonlyArray<keyof typeof types>} */ (
  Object.keys(types)
);

class DefinedInfo extends Info {
  /**
   * @constructor
   * @param {string} property
   *   Property.
   * @param {string} attribute
   *   Attribute.
   * @param {number | null | undefined} [mask]
   *   Mask.
   * @param {Space | undefined} [space]
   *   Space.
   * @returns
   *   Info.
   */
  constructor(property, attribute, mask, space) {
    let index = -1;

    super(property, attribute);

    mark(this, 'space', space);

    if (typeof mask === 'number') {
      while (++index < checks.length) {
        const check = checks[index];
        mark(this, checks[index], (mask & types[check]) === types[check]);
      }
    }
  }
}

DefinedInfo.prototype.defined = true;

/**
 * @template {keyof DefinedInfo} Key
 *   Key type.
 * @param {DefinedInfo} values
 *   Info.
 * @param {Key} key
 *   Key.
 * @param {DefinedInfo[Key]} value
 *   Value.
 * @returns {undefined}
 *   Nothing.
 */
function mark(values, key, value) {
  if (value) {
    values[key] = value;
  }
}

/**
 * @import {Info, Space} from 'property-information'
 */


/**
 * @param {Definition} definition
 *   Definition.
 * @returns {Schema}
 *   Schema.
 */
function create(definition) {
  /** @type {Record<string, Info>} */
  const properties = {};
  /** @type {Record<string, string>} */
  const normals = {};

  for (const [property, value] of Object.entries(definition.properties)) {
    const info = new DefinedInfo(
      property,
      definition.transform(definition.attributes || {}, property),
      value,
      definition.space
    );

    if (
      definition.mustUseProperty &&
      definition.mustUseProperty.includes(property)
    ) {
      info.mustUseProperty = true;
    }

    properties[property] = info;

    normals[normalize(property)] = property;
    normals[normalize(info.attribute)] = property;
  }

  return new Schema(properties, normals, definition.space)
}

const aria = create({
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: booleanish,
    ariaAutoComplete: null,
    ariaBusy: booleanish,
    ariaChecked: booleanish,
    ariaColCount: number,
    ariaColIndex: number,
    ariaColSpan: number,
    ariaControls: spaceSeparated,
    ariaCurrent: null,
    ariaDescribedBy: spaceSeparated,
    ariaDetails: null,
    ariaDisabled: booleanish,
    ariaDropEffect: spaceSeparated,
    ariaErrorMessage: null,
    ariaExpanded: booleanish,
    ariaFlowTo: spaceSeparated,
    ariaGrabbed: booleanish,
    ariaHasPopup: null,
    ariaHidden: booleanish,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: spaceSeparated,
    ariaLevel: number,
    ariaLive: null,
    ariaModal: booleanish,
    ariaMultiLine: booleanish,
    ariaMultiSelectable: booleanish,
    ariaOrientation: null,
    ariaOwns: spaceSeparated,
    ariaPlaceholder: null,
    ariaPosInSet: number,
    ariaPressed: booleanish,
    ariaReadOnly: booleanish,
    ariaRelevant: null,
    ariaRequired: booleanish,
    ariaRoleDescription: spaceSeparated,
    ariaRowCount: number,
    ariaRowIndex: number,
    ariaRowSpan: number,
    ariaSelected: booleanish,
    ariaSetSize: number,
    ariaSort: null,
    ariaValueMax: number,
    ariaValueMin: number,
    ariaValueNow: number,
    ariaValueText: null,
    role: null
  },
  transform(_, property) {
    return property === 'role'
      ? property
      : 'aria-' + property.slice(4).toLowerCase()
  }
});

/**
 * @param {Record<string, string>} attributes
 *   Attributes.
 * @param {string} attribute
 *   Attribute.
 * @returns {string}
 *   Transformed attribute.
 */
function caseSensitiveTransform(attributes, attribute) {
  return attribute in attributes ? attributes[attribute] : attribute
}

/**
 * @param {Record<string, string>} attributes
 *   Attributes.
 * @param {string} property
 *   Property.
 * @returns {string}
 *   Transformed property.
 */
function caseInsensitiveTransform(attributes, property) {
  return caseSensitiveTransform(attributes, property.toLowerCase())
}

const html$5 = create({
  attributes: {
    acceptcharset: 'accept-charset',
    classname: 'class',
    htmlfor: 'for',
    httpequiv: 'http-equiv'
  },
  mustUseProperty: ['checked', 'multiple', 'muted', 'selected'],
  properties: {
    // Standard Properties.
    abbr: null,
    accept: commaSeparated,
    acceptCharset: spaceSeparated,
    accessKey: spaceSeparated,
    action: null,
    allow: null,
    allowFullScreen: boolean,
    allowPaymentRequest: boolean,
    allowUserMedia: boolean,
    alt: null,
    as: null,
    async: boolean,
    autoCapitalize: null,
    autoComplete: spaceSeparated,
    autoFocus: boolean,
    autoPlay: boolean,
    blocking: spaceSeparated,
    capture: null,
    charSet: null,
    checked: boolean,
    cite: null,
    className: spaceSeparated,
    cols: number,
    colSpan: null,
    content: null,
    contentEditable: booleanish,
    controls: boolean,
    controlsList: spaceSeparated,
    coords: number | commaSeparated,
    crossOrigin: null,
    data: null,
    dateTime: null,
    decoding: null,
    default: boolean,
    defer: boolean,
    dir: null,
    dirName: null,
    disabled: boolean,
    download: overloadedBoolean,
    draggable: booleanish,
    encType: null,
    enterKeyHint: null,
    fetchPriority: null,
    form: null,
    formAction: null,
    formEncType: null,
    formMethod: null,
    formNoValidate: boolean,
    formTarget: null,
    headers: spaceSeparated,
    height: number,
    hidden: boolean,
    high: number,
    href: null,
    hrefLang: null,
    htmlFor: spaceSeparated,
    httpEquiv: spaceSeparated,
    id: null,
    imageSizes: null,
    imageSrcSet: null,
    inert: boolean,
    inputMode: null,
    integrity: null,
    is: null,
    isMap: boolean,
    itemId: null,
    itemProp: spaceSeparated,
    itemRef: spaceSeparated,
    itemScope: boolean,
    itemType: spaceSeparated,
    kind: null,
    label: null,
    lang: null,
    language: null,
    list: null,
    loading: null,
    loop: boolean,
    low: number,
    manifest: null,
    max: null,
    maxLength: number,
    media: null,
    method: null,
    min: null,
    minLength: number,
    multiple: boolean,
    muted: boolean,
    name: null,
    nonce: null,
    noModule: boolean,
    noValidate: boolean,
    onAbort: null,
    onAfterPrint: null,
    onAuxClick: null,
    onBeforeMatch: null,
    onBeforePrint: null,
    onBeforeToggle: null,
    onBeforeUnload: null,
    onBlur: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onContextLost: null,
    onContextMenu: null,
    onContextRestored: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFormData: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLanguageChange: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadEnd: null,
    onLoadStart: null,
    onMessage: null,
    onMessageError: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRejectionHandled: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onScrollEnd: null,
    onSecurityPolicyViolation: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onSlotChange: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnhandledRejection: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onWheel: null,
    open: boolean,
    optimum: number,
    pattern: null,
    ping: spaceSeparated,
    placeholder: null,
    playsInline: boolean,
    popover: null,
    popoverTarget: null,
    popoverTargetAction: null,
    poster: null,
    preload: null,
    readOnly: boolean,
    referrerPolicy: null,
    rel: spaceSeparated,
    required: boolean,
    reversed: boolean,
    rows: number,
    rowSpan: number,
    sandbox: spaceSeparated,
    scope: null,
    scoped: boolean,
    seamless: boolean,
    selected: boolean,
    shadowRootClonable: boolean,
    shadowRootDelegatesFocus: boolean,
    shadowRootMode: null,
    shape: null,
    size: number,
    sizes: null,
    slot: null,
    span: number,
    spellCheck: booleanish,
    src: null,
    srcDoc: null,
    srcLang: null,
    srcSet: null,
    start: number,
    step: null,
    style: null,
    tabIndex: number,
    target: null,
    title: null,
    translate: null,
    type: null,
    typeMustMatch: boolean,
    useMap: null,
    value: booleanish,
    width: number,
    wrap: null,
    writingSuggestions: null,

    // Legacy.
    // See: https://html.spec.whatwg.org/#other-elements,-attributes-and-apis
    align: null, // Several. Use CSS `text-align` instead,
    aLink: null, // `<body>`. Use CSS `a:active {color}` instead
    archive: spaceSeparated, // `<object>`. List of URIs to archives
    axis: null, // `<td>` and `<th>`. Use `scope` on `<th>`
    background: null, // `<body>`. Use CSS `background-image` instead
    bgColor: null, // `<body>` and table elements. Use CSS `background-color` instead
    border: number, // `<table>`. Use CSS `border-width` instead,
    borderColor: null, // `<table>`. Use CSS `border-color` instead,
    bottomMargin: number, // `<body>`
    cellPadding: null, // `<table>`
    cellSpacing: null, // `<table>`
    char: null, // Several table elements. When `align=char`, sets the character to align on
    charOff: null, // Several table elements. When `char`, offsets the alignment
    classId: null, // `<object>`
    clear: null, // `<br>`. Use CSS `clear` instead
    code: null, // `<object>`
    codeBase: null, // `<object>`
    codeType: null, // `<object>`
    color: null, // `<font>` and `<hr>`. Use CSS instead
    compact: boolean, // Lists. Use CSS to reduce space between items instead
    declare: boolean, // `<object>`
    event: null, // `<script>`
    face: null, // `<font>`. Use CSS instead
    frame: null, // `<table>`
    frameBorder: null, // `<iframe>`. Use CSS `border` instead
    hSpace: number, // `<img>` and `<object>`
    leftMargin: number, // `<body>`
    link: null, // `<body>`. Use CSS `a:link {color: *}` instead
    longDesc: null, // `<frame>`, `<iframe>`, and `<img>`. Use an `<a>`
    lowSrc: null, // `<img>`. Use a `<picture>`
    marginHeight: number, // `<body>`
    marginWidth: number, // `<body>`
    noResize: boolean, // `<frame>`
    noHref: boolean, // `<area>`. Use no href instead of an explicit `nohref`
    noShade: boolean, // `<hr>`. Use background-color and height instead of borders
    noWrap: boolean, // `<td>` and `<th>`
    object: null, // `<applet>`
    profile: null, // `<head>`
    prompt: null, // `<isindex>`
    rev: null, // `<link>`
    rightMargin: number, // `<body>`
    rules: null, // `<table>`
    scheme: null, // `<meta>`
    scrolling: booleanish, // `<frame>`. Use overflow in the child context
    standby: null, // `<object>`
    summary: null, // `<table>`
    text: null, // `<body>`. Use CSS `color` instead
    topMargin: number, // `<body>`
    valueType: null, // `<param>`
    version: null, // `<html>`. Use a doctype.
    vAlign: null, // Several. Use CSS `vertical-align` instead
    vLink: null, // `<body>`. Use CSS `a:visited {color}` instead
    vSpace: number, // `<img>` and `<object>`

    // Non-standard Properties.
    allowTransparency: null,
    autoCorrect: null,
    autoSave: null,
    disablePictureInPicture: boolean,
    disableRemotePlayback: boolean,
    prefix: null,
    property: null,
    results: number,
    security: null,
    unselectable: null
  },
  space: 'html',
  transform: caseInsensitiveTransform
});

const svg$1 = create({
  attributes: {
    accentHeight: 'accent-height',
    alignmentBaseline: 'alignment-baseline',
    arabicForm: 'arabic-form',
    baselineShift: 'baseline-shift',
    capHeight: 'cap-height',
    className: 'class',
    clipPath: 'clip-path',
    clipRule: 'clip-rule',
    colorInterpolation: 'color-interpolation',
    colorInterpolationFilters: 'color-interpolation-filters',
    colorProfile: 'color-profile',
    colorRendering: 'color-rendering',
    crossOrigin: 'crossorigin',
    dataType: 'datatype',
    dominantBaseline: 'dominant-baseline',
    enableBackground: 'enable-background',
    fillOpacity: 'fill-opacity',
    fillRule: 'fill-rule',
    floodColor: 'flood-color',
    floodOpacity: 'flood-opacity',
    fontFamily: 'font-family',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontVariant: 'font-variant',
    fontWeight: 'font-weight',
    glyphName: 'glyph-name',
    glyphOrientationHorizontal: 'glyph-orientation-horizontal',
    glyphOrientationVertical: 'glyph-orientation-vertical',
    hrefLang: 'hreflang',
    horizAdvX: 'horiz-adv-x',
    horizOriginX: 'horiz-origin-x',
    horizOriginY: 'horiz-origin-y',
    imageRendering: 'image-rendering',
    letterSpacing: 'letter-spacing',
    lightingColor: 'lighting-color',
    markerEnd: 'marker-end',
    markerMid: 'marker-mid',
    markerStart: 'marker-start',
    navDown: 'nav-down',
    navDownLeft: 'nav-down-left',
    navDownRight: 'nav-down-right',
    navLeft: 'nav-left',
    navNext: 'nav-next',
    navPrev: 'nav-prev',
    navRight: 'nav-right',
    navUp: 'nav-up',
    navUpLeft: 'nav-up-left',
    navUpRight: 'nav-up-right',
    onAbort: 'onabort',
    onActivate: 'onactivate',
    onAfterPrint: 'onafterprint',
    onBeforePrint: 'onbeforeprint',
    onBegin: 'onbegin',
    onCancel: 'oncancel',
    onCanPlay: 'oncanplay',
    onCanPlayThrough: 'oncanplaythrough',
    onChange: 'onchange',
    onClick: 'onclick',
    onClose: 'onclose',
    onCopy: 'oncopy',
    onCueChange: 'oncuechange',
    onCut: 'oncut',
    onDblClick: 'ondblclick',
    onDrag: 'ondrag',
    onDragEnd: 'ondragend',
    onDragEnter: 'ondragenter',
    onDragExit: 'ondragexit',
    onDragLeave: 'ondragleave',
    onDragOver: 'ondragover',
    onDragStart: 'ondragstart',
    onDrop: 'ondrop',
    onDurationChange: 'ondurationchange',
    onEmptied: 'onemptied',
    onEnd: 'onend',
    onEnded: 'onended',
    onError: 'onerror',
    onFocus: 'onfocus',
    onFocusIn: 'onfocusin',
    onFocusOut: 'onfocusout',
    onHashChange: 'onhashchange',
    onInput: 'oninput',
    onInvalid: 'oninvalid',
    onKeyDown: 'onkeydown',
    onKeyPress: 'onkeypress',
    onKeyUp: 'onkeyup',
    onLoad: 'onload',
    onLoadedData: 'onloadeddata',
    onLoadedMetadata: 'onloadedmetadata',
    onLoadStart: 'onloadstart',
    onMessage: 'onmessage',
    onMouseDown: 'onmousedown',
    onMouseEnter: 'onmouseenter',
    onMouseLeave: 'onmouseleave',
    onMouseMove: 'onmousemove',
    onMouseOut: 'onmouseout',
    onMouseOver: 'onmouseover',
    onMouseUp: 'onmouseup',
    onMouseWheel: 'onmousewheel',
    onOffline: 'onoffline',
    onOnline: 'ononline',
    onPageHide: 'onpagehide',
    onPageShow: 'onpageshow',
    onPaste: 'onpaste',
    onPause: 'onpause',
    onPlay: 'onplay',
    onPlaying: 'onplaying',
    onPopState: 'onpopstate',
    onProgress: 'onprogress',
    onRateChange: 'onratechange',
    onRepeat: 'onrepeat',
    onReset: 'onreset',
    onResize: 'onresize',
    onScroll: 'onscroll',
    onSeeked: 'onseeked',
    onSeeking: 'onseeking',
    onSelect: 'onselect',
    onShow: 'onshow',
    onStalled: 'onstalled',
    onStorage: 'onstorage',
    onSubmit: 'onsubmit',
    onSuspend: 'onsuspend',
    onTimeUpdate: 'ontimeupdate',
    onToggle: 'ontoggle',
    onUnload: 'onunload',
    onVolumeChange: 'onvolumechange',
    onWaiting: 'onwaiting',
    onZoom: 'onzoom',
    overlinePosition: 'overline-position',
    overlineThickness: 'overline-thickness',
    paintOrder: 'paint-order',
    panose1: 'panose-1',
    pointerEvents: 'pointer-events',
    referrerPolicy: 'referrerpolicy',
    renderingIntent: 'rendering-intent',
    shapeRendering: 'shape-rendering',
    stopColor: 'stop-color',
    stopOpacity: 'stop-opacity',
    strikethroughPosition: 'strikethrough-position',
    strikethroughThickness: 'strikethrough-thickness',
    strokeDashArray: 'stroke-dasharray',
    strokeDashOffset: 'stroke-dashoffset',
    strokeLineCap: 'stroke-linecap',
    strokeLineJoin: 'stroke-linejoin',
    strokeMiterLimit: 'stroke-miterlimit',
    strokeOpacity: 'stroke-opacity',
    strokeWidth: 'stroke-width',
    tabIndex: 'tabindex',
    textAnchor: 'text-anchor',
    textDecoration: 'text-decoration',
    textRendering: 'text-rendering',
    transformOrigin: 'transform-origin',
    typeOf: 'typeof',
    underlinePosition: 'underline-position',
    underlineThickness: 'underline-thickness',
    unicodeBidi: 'unicode-bidi',
    unicodeRange: 'unicode-range',
    unitsPerEm: 'units-per-em',
    vAlphabetic: 'v-alphabetic',
    vHanging: 'v-hanging',
    vIdeographic: 'v-ideographic',
    vMathematical: 'v-mathematical',
    vectorEffect: 'vector-effect',
    vertAdvY: 'vert-adv-y',
    vertOriginX: 'vert-origin-x',
    vertOriginY: 'vert-origin-y',
    wordSpacing: 'word-spacing',
    writingMode: 'writing-mode',
    xHeight: 'x-height',
    // These were camelcased in Tiny. Now lowercased in SVG 2
    playbackOrder: 'playbackorder',
    timelineBegin: 'timelinebegin'
  },
  properties: {
    about: commaOrSpaceSeparated,
    accentHeight: number,
    accumulate: null,
    additive: null,
    alignmentBaseline: null,
    alphabetic: number,
    amplitude: number,
    arabicForm: null,
    ascent: number,
    attributeName: null,
    attributeType: null,
    azimuth: number,
    bandwidth: null,
    baselineShift: null,
    baseFrequency: null,
    baseProfile: null,
    bbox: null,
    begin: null,
    bias: number,
    by: null,
    calcMode: null,
    capHeight: number,
    className: spaceSeparated,
    clip: null,
    clipPath: null,
    clipPathUnits: null,
    clipRule: null,
    color: null,
    colorInterpolation: null,
    colorInterpolationFilters: null,
    colorProfile: null,
    colorRendering: null,
    content: null,
    contentScriptType: null,
    contentStyleType: null,
    crossOrigin: null,
    cursor: null,
    cx: null,
    cy: null,
    d: null,
    dataType: null,
    defaultAction: null,
    descent: number,
    diffuseConstant: number,
    direction: null,
    display: null,
    dur: null,
    divisor: number,
    dominantBaseline: null,
    download: boolean,
    dx: null,
    dy: null,
    edgeMode: null,
    editable: null,
    elevation: number,
    enableBackground: null,
    end: null,
    event: null,
    exponent: number,
    externalResourcesRequired: null,
    fill: null,
    fillOpacity: number,
    fillRule: null,
    filter: null,
    filterRes: null,
    filterUnits: null,
    floodColor: null,
    floodOpacity: null,
    focusable: null,
    focusHighlight: null,
    fontFamily: null,
    fontSize: null,
    fontSizeAdjust: null,
    fontStretch: null,
    fontStyle: null,
    fontVariant: null,
    fontWeight: null,
    format: null,
    fr: null,
    from: null,
    fx: null,
    fy: null,
    g1: commaSeparated,
    g2: commaSeparated,
    glyphName: commaSeparated,
    glyphOrientationHorizontal: null,
    glyphOrientationVertical: null,
    glyphRef: null,
    gradientTransform: null,
    gradientUnits: null,
    handler: null,
    hanging: number,
    hatchContentUnits: null,
    hatchUnits: null,
    height: null,
    href: null,
    hrefLang: null,
    horizAdvX: number,
    horizOriginX: number,
    horizOriginY: number,
    id: null,
    ideographic: number,
    imageRendering: null,
    initialVisibility: null,
    in: null,
    in2: null,
    intercept: number,
    k: number,
    k1: number,
    k2: number,
    k3: number,
    k4: number,
    kernelMatrix: commaOrSpaceSeparated,
    kernelUnitLength: null,
    keyPoints: null, // SEMI_COLON_SEPARATED
    keySplines: null, // SEMI_COLON_SEPARATED
    keyTimes: null, // SEMI_COLON_SEPARATED
    kerning: null,
    lang: null,
    lengthAdjust: null,
    letterSpacing: null,
    lightingColor: null,
    limitingConeAngle: number,
    local: null,
    markerEnd: null,
    markerMid: null,
    markerStart: null,
    markerHeight: null,
    markerUnits: null,
    markerWidth: null,
    mask: null,
    maskContentUnits: null,
    maskUnits: null,
    mathematical: null,
    max: null,
    media: null,
    mediaCharacterEncoding: null,
    mediaContentEncodings: null,
    mediaSize: number,
    mediaTime: null,
    method: null,
    min: null,
    mode: null,
    name: null,
    navDown: null,
    navDownLeft: null,
    navDownRight: null,
    navLeft: null,
    navNext: null,
    navPrev: null,
    navRight: null,
    navUp: null,
    navUpLeft: null,
    navUpRight: null,
    numOctaves: null,
    observer: null,
    offset: null,
    onAbort: null,
    onActivate: null,
    onAfterPrint: null,
    onBeforePrint: null,
    onBegin: null,
    onCancel: null,
    onCanPlay: null,
    onCanPlayThrough: null,
    onChange: null,
    onClick: null,
    onClose: null,
    onCopy: null,
    onCueChange: null,
    onCut: null,
    onDblClick: null,
    onDrag: null,
    onDragEnd: null,
    onDragEnter: null,
    onDragExit: null,
    onDragLeave: null,
    onDragOver: null,
    onDragStart: null,
    onDrop: null,
    onDurationChange: null,
    onEmptied: null,
    onEnd: null,
    onEnded: null,
    onError: null,
    onFocus: null,
    onFocusIn: null,
    onFocusOut: null,
    onHashChange: null,
    onInput: null,
    onInvalid: null,
    onKeyDown: null,
    onKeyPress: null,
    onKeyUp: null,
    onLoad: null,
    onLoadedData: null,
    onLoadedMetadata: null,
    onLoadStart: null,
    onMessage: null,
    onMouseDown: null,
    onMouseEnter: null,
    onMouseLeave: null,
    onMouseMove: null,
    onMouseOut: null,
    onMouseOver: null,
    onMouseUp: null,
    onMouseWheel: null,
    onOffline: null,
    onOnline: null,
    onPageHide: null,
    onPageShow: null,
    onPaste: null,
    onPause: null,
    onPlay: null,
    onPlaying: null,
    onPopState: null,
    onProgress: null,
    onRateChange: null,
    onRepeat: null,
    onReset: null,
    onResize: null,
    onScroll: null,
    onSeeked: null,
    onSeeking: null,
    onSelect: null,
    onShow: null,
    onStalled: null,
    onStorage: null,
    onSubmit: null,
    onSuspend: null,
    onTimeUpdate: null,
    onToggle: null,
    onUnload: null,
    onVolumeChange: null,
    onWaiting: null,
    onZoom: null,
    opacity: null,
    operator: null,
    order: null,
    orient: null,
    orientation: null,
    origin: null,
    overflow: null,
    overlay: null,
    overlinePosition: number,
    overlineThickness: number,
    paintOrder: null,
    panose1: null,
    path: null,
    pathLength: number,
    patternContentUnits: null,
    patternTransform: null,
    patternUnits: null,
    phase: null,
    ping: spaceSeparated,
    pitch: null,
    playbackOrder: null,
    pointerEvents: null,
    points: null,
    pointsAtX: number,
    pointsAtY: number,
    pointsAtZ: number,
    preserveAlpha: null,
    preserveAspectRatio: null,
    primitiveUnits: null,
    propagate: null,
    property: commaOrSpaceSeparated,
    r: null,
    radius: null,
    referrerPolicy: null,
    refX: null,
    refY: null,
    rel: commaOrSpaceSeparated,
    rev: commaOrSpaceSeparated,
    renderingIntent: null,
    repeatCount: null,
    repeatDur: null,
    requiredExtensions: commaOrSpaceSeparated,
    requiredFeatures: commaOrSpaceSeparated,
    requiredFonts: commaOrSpaceSeparated,
    requiredFormats: commaOrSpaceSeparated,
    resource: null,
    restart: null,
    result: null,
    rotate: null,
    rx: null,
    ry: null,
    scale: null,
    seed: null,
    shapeRendering: null,
    side: null,
    slope: null,
    snapshotTime: null,
    specularConstant: number,
    specularExponent: number,
    spreadMethod: null,
    spacing: null,
    startOffset: null,
    stdDeviation: null,
    stemh: null,
    stemv: null,
    stitchTiles: null,
    stopColor: null,
    stopOpacity: null,
    strikethroughPosition: number,
    strikethroughThickness: number,
    string: null,
    stroke: null,
    strokeDashArray: commaOrSpaceSeparated,
    strokeDashOffset: null,
    strokeLineCap: null,
    strokeLineJoin: null,
    strokeMiterLimit: number,
    strokeOpacity: number,
    strokeWidth: null,
    style: null,
    surfaceScale: number,
    syncBehavior: null,
    syncBehaviorDefault: null,
    syncMaster: null,
    syncTolerance: null,
    syncToleranceDefault: null,
    systemLanguage: commaOrSpaceSeparated,
    tabIndex: number,
    tableValues: null,
    target: null,
    targetX: number,
    targetY: number,
    textAnchor: null,
    textDecoration: null,
    textRendering: null,
    textLength: null,
    timelineBegin: null,
    title: null,
    transformBehavior: null,
    type: null,
    typeOf: commaOrSpaceSeparated,
    to: null,
    transform: null,
    transformOrigin: null,
    u1: null,
    u2: null,
    underlinePosition: number,
    underlineThickness: number,
    unicode: null,
    unicodeBidi: null,
    unicodeRange: null,
    unitsPerEm: number,
    values: null,
    vAlphabetic: number,
    vMathematical: number,
    vectorEffect: null,
    vHanging: number,
    vIdeographic: number,
    version: null,
    vertAdvY: number,
    vertOriginX: number,
    vertOriginY: number,
    viewBox: null,
    viewTarget: null,
    visibility: null,
    width: null,
    widths: null,
    wordSpacing: null,
    writingMode: null,
    x: null,
    x1: null,
    x2: null,
    xChannelSelector: null,
    xHeight: number,
    y: null,
    y1: null,
    y2: null,
    yChannelSelector: null,
    z: null,
    zoomAndPan: null
  },
  space: 'svg',
  transform: caseSensitiveTransform
});

const xlink = create({
  properties: {
    xLinkActuate: null,
    xLinkArcRole: null,
    xLinkHref: null,
    xLinkRole: null,
    xLinkShow: null,
    xLinkTitle: null,
    xLinkType: null
  },
  space: 'xlink',
  transform(_, property) {
    return 'xlink:' + property.slice(5).toLowerCase()
  }
});

const xmlns = create({
  attributes: {xmlnsxlink: 'xmlns:xlink'},
  properties: {xmlnsXLink: null, xmlns: null},
  space: 'xmlns',
  transform: caseInsensitiveTransform
});

const xml = create({
  properties: {xmlBase: null, xmlLang: null, xmlSpace: null},
  space: 'xml',
  transform(_, property) {
    return 'xml:' + property.slice(3).toLowerCase()
  }
});

/**
 * @import {Schema} from 'property-information'
 */


const cap = /[A-Z]/g;
const dash = /-[a-z]/g;
const valid = /^data[-\w.:]+$/i;

/**
 * Look up info on a property.
 *
 * In most cases the given `schema` contains info on the property.
 * All standard,
 * most legacy,
 * and some non-standard properties are supported.
 * For these cases,
 * the returned `Info` has hints about the value of the property.
 *
 * `name` can also be a valid data attribute or property,
 * in which case an `Info` object with the correctly cased `attribute` and
 * `property` is returned.
 *
 * `name` can be an unknown attribute,
 * in which case an `Info` object with `attribute` and `property` set to the
 * given name is returned.
 * It is not recommended to provide unsupported legacy or recently specced
 * properties.
 *
 *
 * @param {Schema} schema
 *   Schema;
 *   either the `html` or `svg` export.
 * @param {string} value
 *   An attribute-like or property-like name;
 *   it will be passed through `normalize` to hopefully find the correct info.
 * @returns {Info}
 *   Info.
 */
function find(schema, value) {
  const normal = normalize(value);
  let property = value;
  let Type = Info;

  if (normal in schema.normal) {
    return schema.property[schema.normal[normal]]
  }

  if (normal.length > 4 && normal.slice(0, 4) === 'data' && valid.test(value)) {
    // Attribute or property.
    if (value.charAt(4) === '-') {
      // Turn it into a property.
      const rest = value.slice(5).replace(dash, camelcase);
      property = 'data' + rest.charAt(0).toUpperCase() + rest.slice(1);
    } else {
      // Turn it into an attribute.
      const rest = value.slice(4);

      if (!dash.test(rest)) {
        let dashes = rest.replace(cap, kebab);

        if (dashes.charAt(0) !== '-') {
          dashes = '-' + dashes;
        }

        value = 'data' + dashes;
      }
    }

    Type = DefinedInfo;
  }

  return new Type(property, value)
}

/**
 * @param {string} $0
 *   Value.
 * @returns {string}
 *   Kebab.
 */
function kebab($0) {
  return '-' + $0.toLowerCase()
}

/**
 * @param {string} $0
 *   Value.
 * @returns {string}
 *   Camel.
 */
function camelcase($0) {
  return $0.charAt(1).toUpperCase()
}

// Note: types exposed from `index.d.ts`.

const html$4 = merge([aria, html$5, xlink, xmlns, xml], 'html');

const svg = merge([aria, svg$1, xlink, xmlns, xml], 'svg');

/**
 * @callback Handler
 *   Handle a value, with a certain ID field set to a certain value.
 *   The ID field is passed to `zwitch`, and it’s value is this function’s
 *   place on the `handlers` record.
 * @param {...any} parameters
 *   Arbitrary parameters passed to the zwitch.
 *   The first will be an object with a certain ID field set to a certain value.
 * @returns {any}
 *   Anything!
 */

/**
 * @callback UnknownHandler
 *   Handle values that do have a certain ID field, but it’s set to a value
 *   that is not listed in the `handlers` record.
 * @param {unknown} value
 *   An object with a certain ID field set to an unknown value.
 * @param {...any} rest
 *   Arbitrary parameters passed to the zwitch.
 * @returns {any}
 *   Anything!
 */

/**
 * @callback InvalidHandler
 *   Handle values that do not have a certain ID field.
 * @param {unknown} value
 *   Any unknown value.
 * @param {...any} rest
 *   Arbitrary parameters passed to the zwitch.
 * @returns {void|null|undefined|never}
 *   This should crash or return nothing.
 */

/**
 * @template {InvalidHandler} [Invalid=InvalidHandler]
 * @template {UnknownHandler} [Unknown=UnknownHandler]
 * @template {Record<string, Handler>} [Handlers=Record<string, Handler>]
 * @typedef Options
 *   Configuration (required).
 * @property {Invalid} [invalid]
 *   Handler to use for invalid values.
 * @property {Unknown} [unknown]
 *   Handler to use for unknown values.
 * @property {Handlers} [handlers]
 *   Handlers to use.
 */

const own$8 = {}.hasOwnProperty;

/**
 * Handle values based on a field.
 *
 * @template {InvalidHandler} [Invalid=InvalidHandler]
 * @template {UnknownHandler} [Unknown=UnknownHandler]
 * @template {Record<string, Handler>} [Handlers=Record<string, Handler>]
 * @param {string} key
 *   Field to switch on.
 * @param {Options<Invalid, Unknown, Handlers>} [options]
 *   Configuration (required).
 * @returns {{unknown: Unknown, invalid: Invalid, handlers: Handlers, (...parameters: Parameters<Handlers[keyof Handlers]>): ReturnType<Handlers[keyof Handlers]>, (...parameters: Parameters<Unknown>): ReturnType<Unknown>}}
 */
function zwitch(key, options) {
  const settings = options || {};

  /**
   * Handle one value.
   *
   * Based on the bound `key`, a respective handler will be called.
   * If `value` is not an object, or doesn’t have a `key` property, the special
   * “invalid” handler will be called.
   * If `value` has an unknown `key`, the special “unknown” handler will be
   * called.
   *
   * All arguments, and the context object, are passed through to the handler,
   * and it’s result is returned.
   *
   * @this {unknown}
   *   Any context object.
   * @param {unknown} [value]
   *   Any value.
   * @param {...unknown} parameters
   *   Arbitrary parameters passed to the zwitch.
   * @property {Handler} invalid
   *   Handle for values that do not have a certain ID field.
   * @property {Handler} unknown
   *   Handle values that do have a certain ID field, but it’s set to a value
   *   that is not listed in the `handlers` record.
   * @property {Handlers} handlers
   *   Record of handlers.
   * @returns {unknown}
   *   Anything.
   */
  function one(value, ...parameters) {
    /** @type {Handler|undefined} */
    let fn = one.invalid;
    const handlers = one.handlers;

    if (value && own$8.call(value, key)) {
      // @ts-expect-error Indexable.
      const id = String(value[key]);
      // @ts-expect-error Indexable.
      fn = own$8.call(handlers, id) ? handlers[id] : one.unknown;
    }

    if (fn) {
      return fn.call(this, value, ...parameters)
    }
  }

  one.handlers = settings.handlers || {};
  one.invalid = settings.invalid;
  one.unknown = settings.unknown;

  // @ts-expect-error: matches!
  return one
}

/**
 * @typedef CoreOptions
 * @property {ReadonlyArray<string>} [subset=[]]
 *   Whether to only escape the given subset of characters.
 * @property {boolean} [escapeOnly=false]
 *   Whether to only escape possibly dangerous characters.
 *   Those characters are `"`, `&`, `'`, `<`, `>`, and `` ` ``.
 *
 * @typedef FormatOptions
 * @property {(code: number, next: number, options: CoreWithFormatOptions) => string} format
 *   Format strategy.
 *
 * @typedef {CoreOptions & FormatOptions & import('./util/format-smart.js').FormatSmartOptions} CoreWithFormatOptions
 */

const defaultSubsetRegex = /["&'<>`]/g;
const surrogatePairsRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
const controlCharactersRegex =
  // eslint-disable-next-line no-control-regex, unicorn/no-hex-escape
  /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g;
const regexEscapeRegex = /[|\\{}()[\]^$+*?.]/g;

/** @type {WeakMap<ReadonlyArray<string>, RegExp>} */
const subsetToRegexCache = new WeakMap();

/**
 * Encode certain characters in `value`.
 *
 * @param {string} value
 * @param {CoreWithFormatOptions} options
 * @returns {string}
 */
function core(value, options) {
  value = value.replace(
    options.subset
      ? charactersToExpressionCached(options.subset)
      : defaultSubsetRegex,
    basic
  );

  if (options.subset || options.escapeOnly) {
    return value
  }

  return (
    value
      // Surrogate pairs.
      .replace(surrogatePairsRegex, surrogate)
      // BMP control characters (C0 except for LF, CR, SP; DEL; and some more
      // non-ASCII ones).
      .replace(controlCharactersRegex, basic)
  )

  /**
   * @param {string} pair
   * @param {number} index
   * @param {string} all
   */
  function surrogate(pair, index, all) {
    return options.format(
      (pair.charCodeAt(0) - 0xd800) * 0x400 +
        pair.charCodeAt(1) -
        0xdc00 +
        0x10000,
      all.charCodeAt(index + 2),
      options
    )
  }

  /**
   * @param {string} character
   * @param {number} index
   * @param {string} all
   */
  function basic(character, index, all) {
    return options.format(
      character.charCodeAt(0),
      all.charCodeAt(index + 1),
      options
    )
  }
}

/**
 * A wrapper function that caches the result of `charactersToExpression` with a WeakMap.
 * This can improve performance when tooling calls `charactersToExpression` repeatedly
 * with the same subset.
 *
 * @param {ReadonlyArray<string>} subset
 * @returns {RegExp}
 */
function charactersToExpressionCached(subset) {
  let cached = subsetToRegexCache.get(subset);

  if (!cached) {
    cached = charactersToExpression(subset);
    subsetToRegexCache.set(subset, cached);
  }

  return cached
}

/**
 * @param {ReadonlyArray<string>} subset
 * @returns {RegExp}
 */
function charactersToExpression(subset) {
  /** @type {Array<string>} */
  const groups = [];
  let index = -1;

  while (++index < subset.length) {
    groups.push(subset[index].replace(regexEscapeRegex, '\\$&'));
  }

  return new RegExp('(?:' + groups.join('|') + ')', 'g')
}

const hexadecimalRegex = /[\dA-Fa-f]/;

/**
 * Configurable ways to encode characters as hexadecimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toHexadecimal(code, next, omit) {
  const value = '&#x' + code.toString(16).toUpperCase();
  return omit && next && !hexadecimalRegex.test(String.fromCharCode(next))
    ? value
    : value + ';'
}

const decimalRegex = /\d/;

/**
 * Configurable ways to encode characters as decimal references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @returns {string}
 */
function toDecimal(code, next, omit) {
  const value = '&#' + String(code);
  return omit && next && !decimalRegex.test(String.fromCharCode(next))
    ? value
    : value + ';'
}

/**
 * List of legacy HTML named character references that don’t need a trailing semicolon.
 *
 * @type {Array<string>}
 */
const characterEntitiesLegacy = [
  'AElig',
  'AMP',
  'Aacute',
  'Acirc',
  'Agrave',
  'Aring',
  'Atilde',
  'Auml',
  'COPY',
  'Ccedil',
  'ETH',
  'Eacute',
  'Ecirc',
  'Egrave',
  'Euml',
  'GT',
  'Iacute',
  'Icirc',
  'Igrave',
  'Iuml',
  'LT',
  'Ntilde',
  'Oacute',
  'Ocirc',
  'Ograve',
  'Oslash',
  'Otilde',
  'Ouml',
  'QUOT',
  'REG',
  'THORN',
  'Uacute',
  'Ucirc',
  'Ugrave',
  'Uuml',
  'Yacute',
  'aacute',
  'acirc',
  'acute',
  'aelig',
  'agrave',
  'amp',
  'aring',
  'atilde',
  'auml',
  'brvbar',
  'ccedil',
  'cedil',
  'cent',
  'copy',
  'curren',
  'deg',
  'divide',
  'eacute',
  'ecirc',
  'egrave',
  'eth',
  'euml',
  'frac12',
  'frac14',
  'frac34',
  'gt',
  'iacute',
  'icirc',
  'iexcl',
  'igrave',
  'iquest',
  'iuml',
  'laquo',
  'lt',
  'macr',
  'micro',
  'middot',
  'nbsp',
  'not',
  'ntilde',
  'oacute',
  'ocirc',
  'ograve',
  'ordf',
  'ordm',
  'oslash',
  'otilde',
  'ouml',
  'para',
  'plusmn',
  'pound',
  'quot',
  'raquo',
  'reg',
  'sect',
  'shy',
  'sup1',
  'sup2',
  'sup3',
  'szlig',
  'thorn',
  'times',
  'uacute',
  'ucirc',
  'ugrave',
  'uml',
  'uuml',
  'yacute',
  'yen',
  'yuml'
];

/**
 * Map of named character references from HTML 4.
 *
 * @type {Record<string, string>}
 */
const characterEntitiesHtml4 = {
  nbsp: ' ',
  iexcl: '¡',
  cent: '¢',
  pound: '£',
  curren: '¤',
  yen: '¥',
  brvbar: '¦',
  sect: '§',
  uml: '¨',
  copy: '©',
  ordf: 'ª',
  laquo: '«',
  not: '¬',
  shy: '­',
  reg: '®',
  macr: '¯',
  deg: '°',
  plusmn: '±',
  sup2: '²',
  sup3: '³',
  acute: '´',
  micro: 'µ',
  para: '¶',
  middot: '·',
  cedil: '¸',
  sup1: '¹',
  ordm: 'º',
  raquo: '»',
  frac14: '¼',
  frac12: '½',
  frac34: '¾',
  iquest: '¿',
  Agrave: 'À',
  Aacute: 'Á',
  Acirc: 'Â',
  Atilde: 'Ã',
  Auml: 'Ä',
  Aring: 'Å',
  AElig: 'Æ',
  Ccedil: 'Ç',
  Egrave: 'È',
  Eacute: 'É',
  Ecirc: 'Ê',
  Euml: 'Ë',
  Igrave: 'Ì',
  Iacute: 'Í',
  Icirc: 'Î',
  Iuml: 'Ï',
  ETH: 'Ð',
  Ntilde: 'Ñ',
  Ograve: 'Ò',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Otilde: 'Õ',
  Ouml: 'Ö',
  times: '×',
  Oslash: 'Ø',
  Ugrave: 'Ù',
  Uacute: 'Ú',
  Ucirc: 'Û',
  Uuml: 'Ü',
  Yacute: 'Ý',
  THORN: 'Þ',
  szlig: 'ß',
  agrave: 'à',
  aacute: 'á',
  acirc: 'â',
  atilde: 'ã',
  auml: 'ä',
  aring: 'å',
  aelig: 'æ',
  ccedil: 'ç',
  egrave: 'è',
  eacute: 'é',
  ecirc: 'ê',
  euml: 'ë',
  igrave: 'ì',
  iacute: 'í',
  icirc: 'î',
  iuml: 'ï',
  eth: 'ð',
  ntilde: 'ñ',
  ograve: 'ò',
  oacute: 'ó',
  ocirc: 'ô',
  otilde: 'õ',
  ouml: 'ö',
  divide: '÷',
  oslash: 'ø',
  ugrave: 'ù',
  uacute: 'ú',
  ucirc: 'û',
  uuml: 'ü',
  yacute: 'ý',
  thorn: 'þ',
  yuml: 'ÿ',
  fnof: 'ƒ',
  Alpha: 'Α',
  Beta: 'Β',
  Gamma: 'Γ',
  Delta: 'Δ',
  Epsilon: 'Ε',
  Zeta: 'Ζ',
  Eta: 'Η',
  Theta: 'Θ',
  Iota: 'Ι',
  Kappa: 'Κ',
  Lambda: 'Λ',
  Mu: 'Μ',
  Nu: 'Ν',
  Xi: 'Ξ',
  Omicron: 'Ο',
  Pi: 'Π',
  Rho: 'Ρ',
  Sigma: 'Σ',
  Tau: 'Τ',
  Upsilon: 'Υ',
  Phi: 'Φ',
  Chi: 'Χ',
  Psi: 'Ψ',
  Omega: 'Ω',
  alpha: 'α',
  beta: 'β',
  gamma: 'γ',
  delta: 'δ',
  epsilon: 'ε',
  zeta: 'ζ',
  eta: 'η',
  theta: 'θ',
  iota: 'ι',
  kappa: 'κ',
  lambda: 'λ',
  mu: 'μ',
  nu: 'ν',
  xi: 'ξ',
  omicron: 'ο',
  pi: 'π',
  rho: 'ρ',
  sigmaf: 'ς',
  sigma: 'σ',
  tau: 'τ',
  upsilon: 'υ',
  phi: 'φ',
  chi: 'χ',
  psi: 'ψ',
  omega: 'ω',
  thetasym: 'ϑ',
  upsih: 'ϒ',
  piv: 'ϖ',
  bull: '•',
  hellip: '…',
  prime: '′',
  Prime: '″',
  oline: '‾',
  frasl: '⁄',
  weierp: '℘',
  image: 'ℑ',
  real: 'ℜ',
  trade: '™',
  alefsym: 'ℵ',
  larr: '←',
  uarr: '↑',
  rarr: '→',
  darr: '↓',
  harr: '↔',
  crarr: '↵',
  lArr: '⇐',
  uArr: '⇑',
  rArr: '⇒',
  dArr: '⇓',
  hArr: '⇔',
  forall: '∀',
  part: '∂',
  exist: '∃',
  empty: '∅',
  nabla: '∇',
  isin: '∈',
  notin: '∉',
  ni: '∋',
  prod: '∏',
  sum: '∑',
  minus: '−',
  lowast: '∗',
  radic: '√',
  prop: '∝',
  infin: '∞',
  ang: '∠',
  and: '∧',
  or: '∨',
  cap: '∩',
  cup: '∪',
  int: '∫',
  there4: '∴',
  sim: '∼',
  cong: '≅',
  asymp: '≈',
  ne: '≠',
  equiv: '≡',
  le: '≤',
  ge: '≥',
  sub: '⊂',
  sup: '⊃',
  nsub: '⊄',
  sube: '⊆',
  supe: '⊇',
  oplus: '⊕',
  otimes: '⊗',
  perp: '⊥',
  sdot: '⋅',
  lceil: '⌈',
  rceil: '⌉',
  lfloor: '⌊',
  rfloor: '⌋',
  lang: '〈',
  rang: '〉',
  loz: '◊',
  spades: '♠',
  clubs: '♣',
  hearts: '♥',
  diams: '♦',
  quot: '"',
  amp: '&',
  lt: '<',
  gt: '>',
  OElig: 'Œ',
  oelig: 'œ',
  Scaron: 'Š',
  scaron: 'š',
  Yuml: 'Ÿ',
  circ: 'ˆ',
  tilde: '˜',
  ensp: ' ',
  emsp: ' ',
  thinsp: ' ',
  zwnj: '‌',
  zwj: '‍',
  lrm: '‎',
  rlm: '‏',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  ldquo: '“',
  rdquo: '”',
  bdquo: '„',
  dagger: '†',
  Dagger: '‡',
  permil: '‰',
  lsaquo: '‹',
  rsaquo: '›',
  euro: '€'
};

/**
 * List of legacy (that don’t need a trailing `;`) named references which could,
 * depending on what follows them, turn into a different meaning
 *
 * @type {Array<string>}
 */
const dangerous = [
  'cent',
  'copy',
  'divide',
  'gt',
  'lt',
  'not',
  'para',
  'times'
];

const own$7 = {}.hasOwnProperty;

/**
 * `characterEntitiesHtml4` but inverted.
 *
 * @type {Record<string, string>}
 */
const characters = {};

/** @type {string} */
let key;

for (key in characterEntitiesHtml4) {
  if (own$7.call(characterEntitiesHtml4, key)) {
    characters[characterEntitiesHtml4[key]] = key;
  }
}

const notAlphanumericRegex = /[^\dA-Za-z]/;

/**
 * Configurable ways to encode characters as named references.
 *
 * @param {number} code
 * @param {number} next
 * @param {boolean|undefined} omit
 * @param {boolean|undefined} attribute
 * @returns {string}
 */
function toNamed(code, next, omit, attribute) {
  const character = String.fromCharCode(code);

  if (own$7.call(characters, character)) {
    const name = characters[character];
    const value = '&' + name;

    if (
      omit &&
      characterEntitiesLegacy.includes(name) &&
      !dangerous.includes(name) &&
      (!attribute ||
        (next &&
          next !== 61 /* `=` */ &&
          notAlphanumericRegex.test(String.fromCharCode(next))))
    ) {
      return value
    }

    return value + ';'
  }

  return ''
}

/**
 * @typedef FormatSmartOptions
 * @property {boolean} [useNamedReferences=false]
 *   Prefer named character references (`&amp;`) where possible.
 * @property {boolean} [useShortestReferences=false]
 *   Prefer the shortest possible reference, if that results in less bytes.
 *   **Note**: `useNamedReferences` can be omitted when using `useShortestReferences`.
 * @property {boolean} [omitOptionalSemicolons=false]
 *   Whether to omit semicolons when possible.
 *   **Note**: This creates what HTML calls “parse errors” but is otherwise still valid HTML — don’t use this except when building a minifier.
 *   Omitting semicolons is possible for certain named and numeric references in some cases.
 * @property {boolean} [attribute=false]
 *   Create character references which don’t fail in attributes.
 *   **Note**: `attribute` only applies when operating dangerously with
 *   `omitOptionalSemicolons: true`.
 */


/**
 * Configurable ways to encode a character yielding pretty or small results.
 *
 * @param {number} code
 * @param {number} next
 * @param {FormatSmartOptions} options
 * @returns {string}
 */
function formatSmart(code, next, options) {
  let numeric = toHexadecimal(code, next, options.omitOptionalSemicolons);
  /** @type {string|undefined} */
  let named;

  if (options.useNamedReferences || options.useShortestReferences) {
    named = toNamed(
      code,
      next,
      options.omitOptionalSemicolons,
      options.attribute
    );
  }

  // Use the shortest numeric reference when requested.
  // A simple algorithm would use decimal for all code points under 100, as
  // those are shorter than hexadecimal:
  //
  // * `&#99;` vs `&#x63;` (decimal shorter)
  // * `&#100;` vs `&#x64;` (equal)
  //
  // However, because we take `next` into consideration when `omit` is used,
  // And it would be possible that decimals are shorter on bigger values as
  // well if `next` is hexadecimal but not decimal, we instead compare both.
  if (
    (options.useShortestReferences || !named) &&
    options.useShortestReferences
  ) {
    const decimal = toDecimal(code, next, options.omitOptionalSemicolons);

    if (decimal.length < numeric.length) {
      numeric = decimal;
    }
  }

  return named &&
    (!options.useShortestReferences || named.length < numeric.length)
    ? named
    : numeric
}

/**
 * @typedef {import('./core.js').CoreOptions & import('./util/format-smart.js').FormatSmartOptions} Options
 * @typedef {import('./core.js').CoreOptions} LightOptions
 */


/**
 * Encode special characters in `value`.
 *
 * @param {string} value
 *   Value to encode.
 * @param {Options} [options]
 *   Configuration.
 * @returns {string}
 *   Encoded value.
 */
function stringifyEntities(value, options) {
  return core(value, Object.assign({format: formatSmart}, options))
}

/**
 * @import {Comment, Parents} from 'hast'
 * @import {State} from '../index.js'
 */


const htmlCommentRegex = /^>|^->|<!--|-->|--!>|<!-$/g;

// Declare arrays as variables so it can be cached by `stringifyEntities`
const bogusCommentEntitySubset = ['>'];
const commentEntitySubset = ['<', '>'];

/**
 * Serialize a comment.
 *
 * @param {Comment} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function comment(node, _1, _2, state) {
  // See: <https://html.spec.whatwg.org/multipage/syntax.html#comments>
  return state.settings.bogusComments
    ? '<?' +
        stringifyEntities(
          node.value,
          Object.assign({}, state.settings.characterReferences, {
            subset: bogusCommentEntitySubset
          })
        ) +
        '>'
    : '<!--' + node.value.replace(htmlCommentRegex, encode) + '-->'

  /**
   * @param {string} $0
   */
  function encode($0) {
    return stringifyEntities(
      $0,
      Object.assign({}, state.settings.characterReferences, {
        subset: commentEntitySubset
      })
    )
  }
}

/**
 * @import {Doctype, Parents} from 'hast'
 * @import {State} from '../index.js'
 */

/**
 * Serialize a doctype.
 *
 * @param {Doctype} _1
 *   Node to handle.
 * @param {number | undefined} _2
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _3
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function doctype(_1, _2, _3, state) {
  return (
    '<!' +
    (state.settings.upperDoctype ? 'DOCTYPE' : 'doctype') +
    (state.settings.tightDoctype ? '' : ' ') +
    'html>'
  )
}

/**
 * Count how often a character (or substring) is used in a string.
 *
 * @param {string} value
 *   Value to search in.
 * @param {string} character
 *   Character (or substring) to look for.
 * @return {number}
 *   Number of times `character` occurred in `value`.
 */
function ccount(value, character) {
  const source = String(value);

  if (typeof character !== 'string') {
    throw new TypeError('Expected character')
  }

  let count = 0;
  let index = source.indexOf(character);

  while (index !== -1) {
    count++;
    index = source.indexOf(character, index + character.length);
  }

  return count
}

/**
 * @typedef Options
 *   Configuration for `stringify`.
 * @property {boolean} [padLeft=true]
 *   Whether to pad a space before a token.
 * @property {boolean} [padRight=false]
 *   Whether to pad a space after a token.
 */

/**
 * @typedef {Options} StringifyOptions
 *   Please use `StringifyOptions` instead.
 */

/**
 * Parse comma-separated tokens to an array.
 *
 * @param {string} value
 *   Comma-separated tokens.
 * @returns {Array<string>}
 *   List of tokens.
 */
function parse$4(value) {
  /** @type {Array<string>} */
  const tokens = [];
  const input = String(value || '');
  let index = input.indexOf(',');
  let start = 0;
  /** @type {boolean} */
  let end = false;

  while (!end) {
    if (index === -1) {
      index = input.length;
      end = true;
    }

    const token = input.slice(start, index).trim();

    if (token || !end) {
      tokens.push(token);
    }

    start = index + 1;
    index = input.indexOf(',', start);
  }

  return tokens
}

/**
 * Serialize an array of strings or numbers to comma-separated tokens.
 *
 * @param {Array<string|number>} values
 *   List of tokens.
 * @param {Options} [options]
 *   Configuration for `stringify` (optional).
 * @returns {string}
 *   Comma-separated tokens.
 */
function stringify$1(values, options) {
  const settings = options || {};

  // Ensure the last empty entry is seen.
  const input = values[values.length - 1] === '' ? [...values, ''] : values;

  return input
    .join(
      (settings.padRight ? ' ' : '') +
        ',' +
        (settings.padLeft === false ? '' : ' ')
    )
    .trim()
}

/**
 * Parse space-separated tokens to an array of strings.
 *
 * @param {string} value
 *   Space-separated tokens.
 * @returns {Array<string>}
 *   List of tokens.
 */
function parse$3(value) {
  const input = String(value || '').trim();
  return input ? input.split(/[ \t\n\r\f]+/g) : []
}

/**
 * Serialize an array of strings as space separated-tokens.
 *
 * @param {Array<string|number>} values
 *   List of tokens.
 * @returns {string}
 *   Space-separated tokens.
 */
function stringify(values) {
  return values.join(' ').trim()
}

/**
 * @typedef {import('hast').Nodes} Nodes
 */

// HTML whitespace expression.
// See <https://infra.spec.whatwg.org/#ascii-whitespace>.
const re = /[ \t\n\f\r]/g;

/**
 * Check if the given value is *inter-element whitespace*.
 *
 * @param {Nodes | string} thing
 *   Thing to check (`Node` or `string`).
 * @returns {boolean}
 *   Whether the `value` is inter-element whitespace (`boolean`): consisting of
 *   zero or more of space, tab (`\t`), line feed (`\n`), carriage return
 *   (`\r`), or form feed (`\f`); if a node is passed it must be a `Text` node,
 *   whose `value` field is checked.
 */
function whitespace$1(thing) {
  return typeof thing === 'object'
    ? thing.type === 'text'
      ? empty$3(thing.value)
      : false
    : empty$3(thing)
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function empty$3(value) {
  return value.replace(re, '') === ''
}

/**
 * @import {Parents, RootContent} from 'hast'
 */


const siblingAfter = siblings(1);
const siblingBefore = siblings(-1);

/** @type {Array<RootContent>} */
const emptyChildren$1 = [];

/**
 * Factory to check siblings in a direction.
 *
 * @param {number} increment
 */
function siblings(increment) {
  return sibling

  /**
   * Find applicable siblings in a direction.
   *
   * @template {Parents} Parent
   *   Parent type.
   * @param {Parent | undefined} parent
   *   Parent.
   * @param {number | undefined} index
   *   Index of child in `parent`.
   * @param {boolean | undefined} [includeWhitespace=false]
   *   Whether to include whitespace (default: `false`).
   * @returns {Parent extends {children: Array<infer Child>} ? Child | undefined : never}
   *   Child of parent.
   */
  function sibling(parent, index, includeWhitespace) {
    const siblings = parent ? parent.children : emptyChildren$1;
    let offset = (index || 0) + increment;
    let next = siblings[offset];

    if (!includeWhitespace) {
      while (next && whitespace$1(next)) {
        offset += increment;
        next = siblings[offset];
      }
    }

    // @ts-expect-error: it’s a correct child.
    return next
  }
}

/**
 * @import {Element, Parents} from 'hast'
 */

/**
 * @callback OmitHandle
 *   Check if a tag can be omitted.
 * @param {Element} element
 *   Element to check.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether to omit a tag.
 *
 */

const own$6 = {}.hasOwnProperty;

/**
 * Factory to check if a given node can have a tag omitted.
 *
 * @param {Record<string, OmitHandle>} handlers
 *   Omission handlers, where each key is a tag name, and each value is the
 *   corresponding handler.
 * @returns {OmitHandle}
 *   Whether to omit a tag of an element.
 */
function omission(handlers) {
  return omit

  /**
   * Check if a given node can have a tag omitted.
   *
   * @type {OmitHandle}
   */
  function omit(node, index, parent) {
    return (
      own$6.call(handlers, node.tagName) &&
      handlers[node.tagName](node, index, parent)
    )
  }
}

/**
 * @import {Element, Parents} from 'hast'
 */


const closing = omission({
  body: body$1,
  caption: headOrColgroupOrCaption,
  colgroup: headOrColgroupOrCaption,
  dd,
  dt,
  head: headOrColgroupOrCaption,
  html: html$3,
  li,
  optgroup,
  option,
  p,
  rp: rubyElement,
  rt: rubyElement,
  tbody: tbody$1,
  td: cells,
  tfoot,
  th: cells,
  thead,
  tr
});

/**
 * Macro for `</head>`, `</colgroup>`, and `</caption>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function headOrColgroupOrCaption(_, index, parent) {
  const next = siblingAfter(parent, index, true);
  return (
    !next ||
    (next.type !== 'comment' &&
      !(next.type === 'text' && whitespace$1(next.value.charAt(0))))
  )
}

/**
 * Whether to omit `</html>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function html$3(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || next.type !== 'comment'
}

/**
 * Whether to omit `</body>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function body$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || next.type !== 'comment'
}

/**
 * Whether to omit `</p>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function p(_, index, parent) {
  const next = siblingAfter(parent, index);
  return next
    ? next.type === 'element' &&
        (next.tagName === 'address' ||
          next.tagName === 'article' ||
          next.tagName === 'aside' ||
          next.tagName === 'blockquote' ||
          next.tagName === 'details' ||
          next.tagName === 'div' ||
          next.tagName === 'dl' ||
          next.tagName === 'fieldset' ||
          next.tagName === 'figcaption' ||
          next.tagName === 'figure' ||
          next.tagName === 'footer' ||
          next.tagName === 'form' ||
          next.tagName === 'h1' ||
          next.tagName === 'h2' ||
          next.tagName === 'h3' ||
          next.tagName === 'h4' ||
          next.tagName === 'h5' ||
          next.tagName === 'h6' ||
          next.tagName === 'header' ||
          next.tagName === 'hgroup' ||
          next.tagName === 'hr' ||
          next.tagName === 'main' ||
          next.tagName === 'menu' ||
          next.tagName === 'nav' ||
          next.tagName === 'ol' ||
          next.tagName === 'p' ||
          next.tagName === 'pre' ||
          next.tagName === 'section' ||
          next.tagName === 'table' ||
          next.tagName === 'ul')
    : !parent ||
        // Confusing parent.
        !(
          parent.type === 'element' &&
          (parent.tagName === 'a' ||
            parent.tagName === 'audio' ||
            parent.tagName === 'del' ||
            parent.tagName === 'ins' ||
            parent.tagName === 'map' ||
            parent.tagName === 'noscript' ||
            parent.tagName === 'video')
        )
}

/**
 * Whether to omit `</li>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function li(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'li')
}

/**
 * Whether to omit `</dt>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function dt(_, index, parent) {
  const next = siblingAfter(parent, index);
  return Boolean(
    next &&
      next.type === 'element' &&
      (next.tagName === 'dt' || next.tagName === 'dd')
  )
}

/**
 * Whether to omit `</dd>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function dd(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'dt' || next.tagName === 'dd'))
  )
}

/**
 * Whether to omit `</rt>` or `</rp>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function rubyElement(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'rp' || next.tagName === 'rt'))
  )
}

/**
 * Whether to omit `</optgroup>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function optgroup(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'optgroup')
}

/**
 * Whether to omit `</option>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function option(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'option' || next.tagName === 'optgroup'))
  )
}

/**
 * Whether to omit `</thead>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function thead(_, index, parent) {
  const next = siblingAfter(parent, index);
  return Boolean(
    next &&
      next.type === 'element' &&
      (next.tagName === 'tbody' || next.tagName === 'tfoot')
  )
}

/**
 * Whether to omit `</tbody>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tbody$1(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'tbody' || next.tagName === 'tfoot'))
  )
}

/**
 * Whether to omit `</tfoot>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tfoot(_, index, parent) {
  return !siblingAfter(parent, index)
}

/**
 * Whether to omit `</tr>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function tr(_, index, parent) {
  const next = siblingAfter(parent, index);
  return !next || (next.type === 'element' && next.tagName === 'tr')
}

/**
 * Whether to omit `</td>` or `</th>`.
 *
 * @param {Element} _
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the closing tag can be omitted.
 */
function cells(_, index, parent) {
  const next = siblingAfter(parent, index);
  return (
    !next ||
    (next.type === 'element' &&
      (next.tagName === 'td' || next.tagName === 'th'))
  )
}

/**
 * @import {Element, Parents} from 'hast'
 */


const opening = omission({
  body,
  colgroup,
  head,
  html: html$2,
  tbody
});

/**
 * Whether to omit `<html>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function html$2(node) {
  const head = siblingAfter(node, -1);
  return !head || head.type !== 'comment'
}

/**
 * Whether to omit `<head>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function head(node) {
  /** @type {Set<string>} */
  const seen = new Set();

  // Whether `srcdoc` or not,
  // make sure the content model at least doesn’t have too many `base`s/`title`s.
  for (const child of node.children) {
    if (
      child.type === 'element' &&
      (child.tagName === 'base' || child.tagName === 'title')
    ) {
      if (seen.has(child.tagName)) return false
      seen.add(child.tagName);
    }
  }

  // “May be omitted if the element is empty,
  // or if the first thing inside the head element is an element.”
  const child = node.children[0];
  return !child || child.type === 'element'
}

/**
 * Whether to omit `<body>`.
 *
 * @param {Element} node
 *   Element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function body(node) {
  const head = siblingAfter(node, -1, true);

  return (
    !head ||
    (head.type !== 'comment' &&
      !(head.type === 'text' && whitespace$1(head.value.charAt(0))) &&
      !(
        head.type === 'element' &&
        (head.tagName === 'meta' ||
          head.tagName === 'link' ||
          head.tagName === 'script' ||
          head.tagName === 'style' ||
          head.tagName === 'template')
      ))
  )
}

/**
 * Whether to omit `<colgroup>`.
 * The spec describes some logic for the opening tag, but it’s easier to
 * implement in the closing tag, to the same effect, so we handle it there
 * instead.
 *
 * @param {Element} node
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function colgroup(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1, true);

  // Previous colgroup was already omitted.
  if (
    parent &&
    previous &&
    previous.type === 'element' &&
    previous.tagName === 'colgroup' &&
    closing(previous, parent.children.indexOf(previous), parent)
  ) {
    return false
  }

  return Boolean(head && head.type === 'element' && head.tagName === 'col')
}

/**
 * Whether to omit `<tbody>`.
 *
 * @param {Element} node
 *   Element.
 * @param {number | undefined} index
 *   Index of element in parent.
 * @param {Parents | undefined} parent
 *   Parent of element.
 * @returns {boolean}
 *   Whether the opening tag can be omitted.
 */
function tbody(node, index, parent) {
  const previous = siblingBefore(parent, index);
  const head = siblingAfter(node, -1);

  // Previous table section was already omitted.
  if (
    parent &&
    previous &&
    previous.type === 'element' &&
    (previous.tagName === 'thead' || previous.tagName === 'tbody') &&
    closing(previous, parent.children.indexOf(previous), parent)
  ) {
    return false
  }

  return Boolean(head && head.type === 'element' && head.tagName === 'tr')
}

/**
 * @import {Element, Parents, Properties} from 'hast'
 * @import {State} from '../index.js'
 */


/**
 * Maps of subsets.
 *
 * Each value is a matrix of tuples.
 * The value at `0` causes parse errors, the value at `1` is valid.
 * Of both, the value at `0` is unsafe, and the value at `1` is safe.
 *
 * @type {Record<'double' | 'name' | 'single' | 'unquoted', Array<[Array<string>, Array<string>]>>}
 */
const constants = {
  // See: <https://html.spec.whatwg.org/#attribute-name-state>.
  name: [
    ['\t\n\f\r &/=>'.split(''), '\t\n\f\r "&\'/=>`'.split('')],
    ['\0\t\n\f\r "&\'/<=>'.split(''), '\0\t\n\f\r "&\'/<=>`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(unquoted)-state>.
  unquoted: [
    ['\t\n\f\r &>'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')],
    ['\0\t\n\f\r "&\'<=>`'.split(''), '\0\t\n\f\r "&\'<=>`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(single-quoted)-state>.
  single: [
    ["&'".split(''), '"&\'`'.split('')],
    ["\0&'".split(''), '\0"&\'`'.split('')]
  ],
  // See: <https://html.spec.whatwg.org/#attribute-value-(double-quoted)-state>.
  double: [
    ['"&'.split(''), '"&\'`'.split('')],
    ['\0"&'.split(''), '\0"&\'`'.split('')]
  ]
};

/**
 * Serialize an element node.
 *
 * @param {Element} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function element(node, index, parent, state) {
  const schema = state.schema;
  const omit = schema.space === 'svg' ? false : state.settings.omitOptionalTags;
  let selfClosing =
    schema.space === 'svg'
      ? state.settings.closeEmptyElements
      : state.settings.voids.includes(node.tagName.toLowerCase());
  /** @type {Array<string>} */
  const parts = [];
  /** @type {string} */
  let last;

  if (schema.space === 'html' && node.tagName === 'svg') {
    state.schema = svg;
  }

  const attributes = serializeAttributes(state, node.properties);

  const content = state.all(
    schema.space === 'html' && node.tagName === 'template' ? node.content : node
  );

  state.schema = schema;

  // If the node is categorised as void, but it has children, remove the
  // categorisation.
  // This enables for example `menuitem`s, which are void in W3C HTML but not
  // void in WHATWG HTML, to be stringified properly.
  // Note: `menuitem` has since been removed from the HTML spec, and so is no
  // longer void.
  if (content) selfClosing = false;

  if (attributes || !omit || !opening(node, index, parent)) {
    parts.push('<', node.tagName, attributes ? ' ' + attributes : '');

    if (
      selfClosing &&
      (schema.space === 'svg' || state.settings.closeSelfClosing)
    ) {
      last = attributes.charAt(attributes.length - 1);
      if (
        !state.settings.tightSelfClosing ||
        last === '/' ||
        (last && last !== '"' && last !== "'")
      ) {
        parts.push(' ');
      }

      parts.push('/');
    }

    parts.push('>');
  }

  parts.push(content);

  if (!selfClosing && (!omit || !closing(node, index, parent))) {
    parts.push('</' + node.tagName + '>');
  }

  return parts.join('')
}

/**
 * @param {State} state
 * @param {Properties | null | undefined} properties
 * @returns {string}
 */
function serializeAttributes(state, properties) {
  /** @type {Array<string>} */
  const values = [];
  let index = -1;
  /** @type {string} */
  let key;

  if (properties) {
    for (key in properties) {
      if (properties[key] !== null && properties[key] !== undefined) {
        const value = serializeAttribute(state, key, properties[key]);
        if (value) values.push(value);
      }
    }
  }

  while (++index < values.length) {
    const last = state.settings.tightAttributes
      ? values[index].charAt(values[index].length - 1)
      : undefined;

    // In tight mode, don’t add a space after quoted attributes.
    if (index !== values.length - 1 && last !== '"' && last !== "'") {
      values[index] += ' ';
    }
  }

  return values.join('')
}

/**
 * @param {State} state
 * @param {string} key
 * @param {Properties[keyof Properties]} value
 * @returns {string}
 */
function serializeAttribute(state, key, value) {
  const info = find(state.schema, key);
  const x =
    state.settings.allowParseErrors && state.schema.space === 'html' ? 0 : 1;
  const y = state.settings.allowDangerousCharacters ? 0 : 1;
  let quote = state.quote;
  /** @type {string | undefined} */
  let result;

  if (info.overloadedBoolean && (value === info.attribute || value === '')) {
    value = true;
  } else if (
    (info.boolean || info.overloadedBoolean) &&
    (typeof value !== 'string' || value === info.attribute || value === '')
  ) {
    value = Boolean(value);
  }

  if (
    value === null ||
    value === undefined ||
    value === false ||
    (typeof value === 'number' && Number.isNaN(value))
  ) {
    return ''
  }

  const name = stringifyEntities(
    info.attribute,
    Object.assign({}, state.settings.characterReferences, {
      // Always encode without parse errors in non-HTML.
      subset: constants.name[x][y]
    })
  );

  // No value.
  // There is currently only one boolean property in SVG: `[download]` on
  // `<a>`.
  // This property does not seem to work in browsers (Firefox, Safari, Chrome),
  // so I can’t test if dropping the value works.
  // But I assume that it should:
  //
  // ```html
  // <!doctype html>
  // <svg viewBox="0 0 100 100">
  //   <a href=https://example.com download>
  //     <circle cx=50 cy=40 r=35 />
  //   </a>
  // </svg>
  // ```
  //
  // See: <https://github.com/wooorm/property-information/blob/main/lib/svg.js>
  if (value === true) return name

  // `spaces` doesn’t accept a second argument, but it’s given here just to
  // keep the code cleaner.
  value = Array.isArray(value)
    ? (info.commaSeparated ? stringify$1 : stringify)(value, {
        padLeft: !state.settings.tightCommaSeparatedLists
      })
    : String(value);

  if (state.settings.collapseEmptyAttributes && !value) return name

  // Check unquoted value.
  if (state.settings.preferUnquoted) {
    result = stringifyEntities(
      value,
      Object.assign({}, state.settings.characterReferences, {
        attribute: true,
        subset: constants.unquoted[x][y]
      })
    );
  }

  // If we don’t want unquoted, or if `value` contains character references when
  // unquoted…
  if (result !== value) {
    // If the alternative is less common than `quote`, switch.
    if (
      state.settings.quoteSmart &&
      ccount(value, quote) > ccount(value, state.alternative)
    ) {
      quote = state.alternative;
    }

    result =
      quote +
      stringifyEntities(
        value,
        Object.assign({}, state.settings.characterReferences, {
          // Always encode without parse errors in non-HTML.
          subset: (quote === "'" ? constants.single : constants.double)[x][y],
          attribute: true
        })
      ) +
      quote;
  }

  // Don’t add a `=` for unquoted empties.
  return name + (result ? '=' + result : result)
}

/**
 * @import {Parents, Text} from 'hast'
 * @import {Raw} from 'mdast-util-to-hast'
 * @import {State} from '../index.js'
 */


// Declare array as variable so it can be cached by `stringifyEntities`
const textEntitySubset = ['<', '&'];

/**
 * Serialize a text node.
 *
 * @param {Raw | Text} node
 *   Node to handle.
 * @param {number | undefined} _
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function text$5(node, _, parent, state) {
  // Check if content of `node` should be escaped.
  return parent &&
    parent.type === 'element' &&
    (parent.tagName === 'script' || parent.tagName === 'style')
    ? node.value
    : stringifyEntities(
        node.value,
        Object.assign({}, state.settings.characterReferences, {
          subset: textEntitySubset
        })
      )
}

/**
 * @import {Parents} from 'hast'
 * @import {Raw} from 'mdast-util-to-hast'
 * @import {State} from '../index.js'
 */


/**
 * Serialize a raw node.
 *
 * @param {Raw} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function raw(node, index, parent, state) {
  return state.settings.allowDangerousHtml
    ? node.value
    : text$5(node, index, parent, state)
}

/**
 * @import {Parents, Root} from 'hast'
 * @import {State} from '../index.js'
 */

/**
 * Serialize a root.
 *
 * @param {Root} node
 *   Node to handle.
 * @param {number | undefined} _1
 *   Index of `node` in `parent.
 * @param {Parents | undefined} _2
 *   Parent of `node`.
 * @param {State} state
 *   Info passed around about the current state.
 * @returns {string}
 *   Serialized node.
 */
function root$3(node, _1, _2, state) {
  return state.all(node)
}

/**
 * @import {Nodes, Parents} from 'hast'
 * @import {State} from '../index.js'
 */


/**
 * @type {(node: Nodes, index: number | undefined, parent: Parents | undefined, state: State) => string}
 */
const handle$1 = zwitch('type', {
  invalid,
  unknown,
  handlers: {comment, doctype, element, raw, root: root$3, text: text$5}
});

/**
 * Fail when a non-node is found in the tree.
 *
 * @param {unknown} node
 *   Unknown value.
 * @returns {never}
 *   Never.
 */
function invalid(node) {
  throw new Error('Expected node, not `' + node + '`')
}

/**
 * Fail when a node with an unknown type is found in the tree.
 *
 * @param {unknown} node_
 *  Unknown node.
 * @returns {never}
 *   Never.
 */
function unknown(node_) {
  // `type` is guaranteed by runtime JS.
  const node = /** @type {Nodes} */ (node_);
  throw new Error('Cannot compile unknown node `' + node.type + '`')
}

/**
 * @import {Nodes, Parents, RootContent} from 'hast'
 * @import {Schema} from 'property-information'
 * @import {Options as StringifyEntitiesOptions} from 'stringify-entities'
 */


/** @type {Options} */
const emptyOptions$3 = {};

/** @type {CharacterReferences} */
const emptyCharacterReferences = {};

/** @type {Array<never>} */
const emptyChildren = [];

/**
 * Serialize hast as HTML.
 *
 * @param {Array<RootContent> | Nodes} tree
 *   Tree to serialize.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Serialized HTML.
 */
function toHtml(tree, options) {
  const options_ = options || emptyOptions$3;
  const quote = options_.quote || '"';
  const alternative = quote === '"' ? "'" : '"';

  if (quote !== '"' && quote !== "'") {
    throw new Error('Invalid quote `' + quote + '`, expected `\'` or `"`')
  }

  /** @type {State} */
  const state = {
    one: one$3,
    all: all$3,
    settings: {
      omitOptionalTags: options_.omitOptionalTags || false,
      allowParseErrors: options_.allowParseErrors || false,
      allowDangerousCharacters: options_.allowDangerousCharacters || false,
      quoteSmart: options_.quoteSmart || false,
      preferUnquoted: options_.preferUnquoted || false,
      tightAttributes: options_.tightAttributes || false,
      upperDoctype: options_.upperDoctype || false,
      tightDoctype: options_.tightDoctype || false,
      bogusComments: options_.bogusComments || false,
      tightCommaSeparatedLists: options_.tightCommaSeparatedLists || false,
      tightSelfClosing: options_.tightSelfClosing || false,
      collapseEmptyAttributes: options_.collapseEmptyAttributes || false,
      allowDangerousHtml: options_.allowDangerousHtml || false,
      voids: options_.voids || htmlVoidElements,
      characterReferences:
        options_.characterReferences || emptyCharacterReferences,
      closeSelfClosing: options_.closeSelfClosing || false,
      closeEmptyElements: options_.closeEmptyElements || false
    },
    schema: options_.space === 'svg' ? svg : html$4,
    quote,
    alternative
  };

  return state.one(
    Array.isArray(tree) ? {type: 'root', children: tree} : tree,
    undefined,
    undefined
  )
}

/**
 * Serialize a node.
 *
 * @this {State}
 *   Info passed around about the current state.
 * @param {Nodes} node
 *   Node to handle.
 * @param {number | undefined} index
 *   Index of `node` in `parent.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {string}
 *   Serialized node.
 */
function one$3(node, index, parent) {
  return handle$1(node, index, parent, this)
}

/**
 * Serialize all children of `parent`.
 *
 * @this {State}
 *   Info passed around about the current state.
 * @param {Parents | undefined} parent
 *   Parent whose children to serialize.
 * @returns {string}
 */
function all$3(parent) {
  /** @type {Array<string>} */
  const results = [];
  const children = (parent && parent.children) || emptyChildren;
  let index = -1;

  while (++index < children.length) {
    results[index] = this.one(children[index], index, parent);
  }

  return results.join('')
}

/**
 * @import {Root} from 'hast'
 * @import {Options} from 'hast-util-to-html'
 * @import {Compiler, Processor} from 'unified'
 */


/**
 * Plugin to add support for serializing as HTML.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
function rehypeStringify(options) {
  /** @type {Processor<undefined, undefined, undefined, Root, string>} */
  // @ts-expect-error: TS in JSDoc generates wrong types if `this` is typed regularly.
  const self = this;
  const settings = {...self.data('settings'), ...options};

  self.compiler = compiler;

  /**
   * @type {Compiler<Root, string>}
   */
  function compiler(tree) {
    return toHtml(tree, settings)
  }
}

function ok$1() {}

/**
 * @import {Code} from 'micromark-util-types'
 */

/**
 * Check whether the character code represents an ASCII alpha (`a` through `z`,
 * case insensitive).
 *
 * An **ASCII alpha** is an ASCII upper alpha or ASCII lower alpha.
 *
 * An **ASCII upper alpha** is a character in the inclusive range U+0041 (`A`)
 * to U+005A (`Z`).
 *
 * An **ASCII lower alpha** is a character in the inclusive range U+0061 (`a`)
 * to U+007A (`z`).
 *
 * @param code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
const asciiAlpha = regexCheck(/[A-Za-z]/);

/**
 * Check whether the character code represents an ASCII alphanumeric (`a`
 * through `z`, case insensitive, or `0` through `9`).
 *
 * An **ASCII alphanumeric** is an ASCII digit (see `asciiDigit`) or ASCII alpha
 * (see `asciiAlpha`).
 *
 * @param code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
const asciiAlphanumeric = regexCheck(/[\dA-Za-z]/);

/**
 * Check whether the character code represents an ASCII atext.
 *
 * atext is an ASCII alphanumeric (see `asciiAlphanumeric`), or a character in
 * the inclusive ranges U+0023 NUMBER SIGN (`#`) to U+0027 APOSTROPHE (`'`),
 * U+002A ASTERISK (`*`), U+002B PLUS SIGN (`+`), U+002D DASH (`-`), U+002F
 * SLASH (`/`), U+003D EQUALS TO (`=`), U+003F QUESTION MARK (`?`), U+005E
 * CARET (`^`) to U+0060 GRAVE ACCENT (`` ` ``), or U+007B LEFT CURLY BRACE
 * (`{`) to U+007E TILDE (`~`).
 *
 * See:
 * **\[RFC5322]**:
 * [Internet Message Format](https://tools.ietf.org/html/rfc5322).
 * P. Resnick.
 * IETF.
 *
 * @param code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
const asciiAtext = regexCheck(/[#-'*+\--9=?A-Z^-~]/);

/**
 * Check whether a character code is an ASCII control character.
 *
 * An **ASCII control** is a character in the inclusive range U+0000 NULL (NUL)
 * to U+001F (US), or U+007F (DEL).
 *
 * @param {Code} code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
function asciiControl(code) {
  return (
    // Special whitespace codes (which have negative values), C0 and Control
    // character DEL
    code !== null && (code < 32 || code === 127)
  );
}

/**
 * Check whether the character code represents an ASCII digit (`0` through `9`).
 *
 * An **ASCII digit** is a character in the inclusive range U+0030 (`0`) to
 * U+0039 (`9`).
 *
 * @param code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
const asciiDigit = regexCheck(/\d/);

/**
 * Check whether the character code represents an ASCII hex digit (`a` through
 * `f`, case insensitive, or `0` through `9`).
 *
 * An **ASCII hex digit** is an ASCII digit (see `asciiDigit`), ASCII upper hex
 * digit, or an ASCII lower hex digit.
 *
 * An **ASCII upper hex digit** is a character in the inclusive range U+0041
 * (`A`) to U+0046 (`F`).
 *
 * An **ASCII lower hex digit** is a character in the inclusive range U+0061
 * (`a`) to U+0066 (`f`).
 *
 * @param code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
const asciiHexDigit = regexCheck(/[\dA-Fa-f]/);

/**
 * Check whether the character code represents ASCII punctuation.
 *
 * An **ASCII punctuation** is a character in the inclusive ranges U+0021
 * EXCLAMATION MARK (`!`) to U+002F SLASH (`/`), U+003A COLON (`:`) to U+0040 AT
 * SIGN (`@`), U+005B LEFT SQUARE BRACKET (`[`) to U+0060 GRAVE ACCENT
 * (`` ` ``), or U+007B LEFT CURLY BRACE (`{`) to U+007E TILDE (`~`).
 *
 * @param code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
const asciiPunctuation = regexCheck(/[!-/:-@[-`{-~]/);

/**
 * Check whether a character code is a markdown line ending.
 *
 * A **markdown line ending** is the virtual characters M-0003 CARRIAGE RETURN
 * LINE FEED (CRLF), M-0004 LINE FEED (LF) and M-0005 CARRIAGE RETURN (CR).
 *
 * In micromark, the actual character U+000A LINE FEED (LF) and U+000D CARRIAGE
 * RETURN (CR) are replaced by these virtual characters depending on whether
 * they occurred together.
 *
 * @param {Code} code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
function markdownLineEnding(code) {
  return code !== null && code < -2;
}

/**
 * Check whether a character code is a markdown line ending (see
 * `markdownLineEnding`) or markdown space (see `markdownSpace`).
 *
 * @param {Code} code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
function markdownLineEndingOrSpace(code) {
  return code !== null && (code < 0 || code === 32);
}

/**
 * Check whether a character code is a markdown space.
 *
 * A **markdown space** is the concrete character U+0020 SPACE (SP) and the
 * virtual characters M-0001 VIRTUAL SPACE (VS) and M-0002 HORIZONTAL TAB (HT).
 *
 * In micromark, the actual character U+0009 CHARACTER TABULATION (HT) is
 * replaced by one M-0002 HORIZONTAL TAB (HT) and between 0 and 3 M-0001 VIRTUAL
 * SPACE (VS) characters, depending on the column at which the tab occurred.
 *
 * @param {Code} code
 *   Code.
 * @returns {boolean}
 *   Whether it matches.
 */
function markdownSpace(code) {
  return code === -2 || code === -1 || code === 32;
}

// Size note: removing ASCII from the regex and using `asciiPunctuation` here
// In fact adds to the bundle size.
/**
 * Check whether the character code represents Unicode punctuation.
 *
 * A **Unicode punctuation** is a character in the Unicode `Pc` (Punctuation,
 * Connector), `Pd` (Punctuation, Dash), `Pe` (Punctuation, Close), `Pf`
 * (Punctuation, Final quote), `Pi` (Punctuation, Initial quote), `Po`
 * (Punctuation, Other), or `Ps` (Punctuation, Open) categories, or an ASCII
 * punctuation (see `asciiPunctuation`).
 *
 * See:
 * **\[UNICODE]**:
 * [The Unicode Standard](https://www.unicode.org/versions/).
 * Unicode Consortium.
 *
 * @param code
 *   Code.
 * @returns
 *   Whether it matches.
 */
const unicodePunctuation = regexCheck(/\p{P}|\p{S}/u);

/**
 * Check whether the character code represents Unicode whitespace.
 *
 * Note that this does handle micromark specific markdown whitespace characters.
 * See `markdownLineEndingOrSpace` to check that.
 *
 * A **Unicode whitespace** is a character in the Unicode `Zs` (Separator,
 * Space) category, or U+0009 CHARACTER TABULATION (HT), U+000A LINE FEED (LF),
 * U+000C (FF), or U+000D CARRIAGE RETURN (CR) (**\[UNICODE]**).
 *
 * See:
 * **\[UNICODE]**:
 * [The Unicode Standard](https://www.unicode.org/versions/).
 * Unicode Consortium.
 *
 * @param code
 *   Code.
 * @returns
 *   Whether it matches.
 */
const unicodeWhitespace = regexCheck(/\s/);

/**
 * Create a code check from a regex.
 *
 * @param {RegExp} regex
 *   Expression.
 * @returns {(code: Code) => boolean}
 *   Check.
 */
function regexCheck(regex) {
  return check;

  /**
   * Check whether a code matches the bound regex.
   *
   * @param {Code} code
   *   Character code.
   * @returns {boolean}
   *   Whether the character code matches the bound regex.
   */
  function check(code) {
    return code !== null && code > -1 && regex.test(String.fromCharCode(code));
  }
}

function escapeStringRegexp(string) {
	if (typeof string !== 'string') {
		throw new TypeError('Expected a string');
	}

	// Escape characters with special meaning either inside or outside character sets.
	// Use a simple backslash escape when it’s always valid, and a `\xnn` escape when the simpler form would be disallowed by Unicode patterns’ stricter grammar.
	return string
		.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
		.replace(/-/g, '\\x2d');
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 */


/**
 * Generate an assertion from a test.
 *
 * Useful if you’re going to test many nodes, for example when creating a
 * utility where something else passes a compatible test.
 *
 * The created function is a bit faster because it expects valid input only:
 * a `node`, `index`, and `parent`.
 *
 * @param {Test} test
 *   *   when nullish, checks if `node` is a `Node`.
 *   *   when `string`, works like passing `(node) => node.type === test`.
 *   *   when `function` checks if function passed the node is true.
 *   *   when `object`, checks that all keys in test are in node, and that they have (strictly) equal values.
 *   *   when `array`, checks if any one of the subtests pass.
 * @returns {Check}
 *   An assertion.
 */
const convert =
  // Note: overloads in JSDoc can’t yet use different `@template`s.
  /**
   * @type {(
   *   (<Condition extends string>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & {type: Condition}) &
   *   (<Condition extends Props>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Condition) &
   *   (<Condition extends TestFunction>(test: Condition) => (node: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node & Predicate<Condition, Node>) &
   *   ((test?: null | undefined) => (node?: unknown, index?: number | null | undefined, parent?: Parent | null | undefined, context?: unknown) => node is Node) &
   *   ((test?: Test) => Check)
   * )}
   */
  (
    /**
     * @param {Test} [test]
     * @returns {Check}
     */
    function (test) {
      if (test === null || test === undefined) {
        return ok
      }

      if (typeof test === 'function') {
        return castFactory(test)
      }

      if (typeof test === 'object') {
        return Array.isArray(test) ? anyFactory(test) : propsFactory(test)
      }

      if (typeof test === 'string') {
        return typeFactory(test)
      }

      throw new Error('Expected function, string, or object as test')
    }
  );

/**
 * @param {Array<Props | TestFunction | string>} tests
 * @returns {Check}
 */
function anyFactory(tests) {
  /** @type {Array<Check>} */
  const checks = [];
  let index = -1;

  while (++index < tests.length) {
    checks[index] = convert(tests[index]);
  }

  return castFactory(any)

  /**
   * @this {unknown}
   * @type {TestFunction}
   */
  function any(...parameters) {
    let index = -1;

    while (++index < checks.length) {
      if (checks[index].apply(this, parameters)) return true
    }

    return false
  }
}

/**
 * Turn an object into a test for a node with a certain fields.
 *
 * @param {Props} check
 * @returns {Check}
 */
function propsFactory(check) {
  const checkAsRecord = /** @type {Record<string, unknown>} */ (check);

  return castFactory(all)

  /**
   * @param {Node} node
   * @returns {boolean}
   */
  function all(node) {
    const nodeAsRecord = /** @type {Record<string, unknown>} */ (
      /** @type {unknown} */ (node)
    );

    /** @type {string} */
    let key;

    for (key in check) {
      if (nodeAsRecord[key] !== checkAsRecord[key]) return false
    }

    return true
  }
}

/**
 * Turn a string into a test for a node with a certain type.
 *
 * @param {string} check
 * @returns {Check}
 */
function typeFactory(check) {
  return castFactory(type)

  /**
   * @param {Node} node
   */
  function type(node) {
    return node && node.type === check
  }
}

/**
 * Turn a custom test into a test for a node that passes that test.
 *
 * @param {TestFunction} testFunction
 * @returns {Check}
 */
function castFactory(testFunction) {
  return check

  /**
   * @this {unknown}
   * @type {Check}
   */
  function check(value, index, parent) {
    return Boolean(
      looksLikeANode(value) &&
        testFunction.call(
          this,
          value,
          typeof index === 'number' ? index : undefined,
          parent || undefined
        )
    )
  }
}

function ok() {
  return true
}

/**
 * @param {unknown} value
 * @returns {value is Node}
 */
function looksLikeANode(value) {
  return value !== null && typeof value === 'object' && 'type' in value
}

/**
 * @param {string} d
 * @returns {string}
 */
function color(d) {
  return '\u001B[33m' + d + '\u001B[39m'
}

/**
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 */


/** @type {Readonly<ActionTuple>} */
const empty$2 = [];

/**
 * Continue traversing as normal.
 */
const CONTINUE = true;

/**
 * Stop traversing immediately.
 */
const EXIT = false;

/**
 * Do not traverse this node’s children.
 */
const SKIP = 'skip';

/**
 * Visit nodes, with ancestral information.
 *
 * This algorithm performs *depth-first* *tree traversal* in *preorder*
 * (**NLR**) or if `reverse` is given, in *reverse preorder* (**NRL**).
 *
 * You can choose for which nodes `visitor` is called by passing a `test`.
 * For complex tests, you should test yourself in `visitor`, as it will be
 * faster and will have improved type information.
 *
 * Walking the tree is an intensive task.
 * Make use of the return values of the visitor when possible.
 * Instead of walking a tree multiple times, walk it once, use `unist-util-is`
 * to check if a node matches, and then perform different operations.
 *
 * You can change the tree.
 * See `Visitor` for more info.
 *
 * @overload
 * @param {Tree} tree
 * @param {Check} check
 * @param {BuildVisitor<Tree, Check>} visitor
 * @param {boolean | null | undefined} [reverse]
 * @returns {undefined}
 *
 * @overload
 * @param {Tree} tree
 * @param {BuildVisitor<Tree>} visitor
 * @param {boolean | null | undefined} [reverse]
 * @returns {undefined}
 *
 * @param {UnistNode} tree
 *   Tree to traverse.
 * @param {Visitor | Test} test
 *   `unist-util-is`-compatible test
 * @param {Visitor | boolean | null | undefined} [visitor]
 *   Handle each node.
 * @param {boolean | null | undefined} [reverse]
 *   Traverse in reverse preorder (NRL) instead of the default preorder (NLR).
 * @returns {undefined}
 *   Nothing.
 *
 * @template {UnistNode} Tree
 *   Node type.
 * @template {Test} Check
 *   `unist-util-is`-compatible test.
 */
function visitParents(tree, test, visitor, reverse) {
  /** @type {Test} */
  let check;

  if (typeof test === 'function' && typeof visitor !== 'function') {
    reverse = visitor;
    // @ts-expect-error no visitor given, so `visitor` is test.
    visitor = test;
  } else {
    // @ts-expect-error visitor given, so `test` isn’t a visitor.
    check = test;
  }

  const is = convert(check);
  const step = reverse ? -1 : 1;

  factory(tree, undefined, [])();

  /**
   * @param {UnistNode} node
   * @param {number | undefined} index
   * @param {Array<UnistParent>} parents
   */
  function factory(node, index, parents) {
    const value = /** @type {Record<string, unknown>} */ (
      node && typeof node === 'object' ? node : {}
    );

    if (typeof value.type === 'string') {
      const name =
        // `hast`
        typeof value.tagName === 'string'
          ? value.tagName
          : // `xast`
          typeof value.name === 'string'
          ? value.name
          : undefined;

      Object.defineProperty(visit, 'name', {
        value:
          'node (' + color(node.type + (name ? '<' + name + '>' : '')) + ')'
      });
    }

    return visit

    function visit() {
      /** @type {Readonly<ActionTuple>} */
      let result = empty$2;
      /** @type {Readonly<ActionTuple>} */
      let subresult;
      /** @type {number} */
      let offset;
      /** @type {Array<UnistParent>} */
      let grandparents;

      if (!test || is(node, index, parents[parents.length - 1] || undefined)) {
        // @ts-expect-error: `visitor` is now a visitor.
        result = toResult(visitor(node, parents));

        if (result[0] === EXIT) {
          return result
        }
      }

      if ('children' in node && node.children) {
        const nodeAsParent = /** @type {UnistParent} */ (node);

        if (nodeAsParent.children && result[0] !== SKIP) {
          offset = (reverse ? nodeAsParent.children.length : -1) + step;
          grandparents = parents.concat(nodeAsParent);

          while (offset > -1 && offset < nodeAsParent.children.length) {
            const child = nodeAsParent.children[offset];

            subresult = factory(child, offset, grandparents)();

            if (subresult[0] === EXIT) {
              return subresult
            }

            offset =
              typeof subresult[1] === 'number' ? subresult[1] : offset + step;
          }
        }
      }

      return result
    }
  }
}

/**
 * Turn a return value into a clean result.
 *
 * @param {VisitorResult} value
 *   Valid return values from visitors.
 * @returns {Readonly<ActionTuple>}
 *   Clean result.
 */
function toResult(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'number') {
    return [CONTINUE, value]
  }

  return value === null || value === undefined ? empty$2 : [value]
}

/**
 * @import {Nodes, Parents, PhrasingContent, Root, Text} from 'mdast'
 * @import {BuildVisitor, Test, VisitorResult} from 'unist-util-visit-parents'
 */


/**
 * Find patterns in a tree and replace them.
 *
 * The algorithm searches the tree in *preorder* for complete values in `Text`
 * nodes.
 * Partial matches are not supported.
 *
 * @param {Nodes} tree
 *   Tree to change.
 * @param {FindAndReplaceList | FindAndReplaceTuple} list
 *   Patterns to find.
 * @param {Options | null | undefined} [options]
 *   Configuration (when `find` is not `Find`).
 * @returns {undefined}
 *   Nothing.
 */
function findAndReplace(tree, list, options) {
  const settings = options || {};
  const ignored = convert(settings.ignore || []);
  const pairs = toPairs(list);
  let pairIndex = -1;

  while (++pairIndex < pairs.length) {
    visitParents(tree, 'text', visitor);
  }

  /** @type {BuildVisitor<Root, 'text'>} */
  function visitor(node, parents) {
    let index = -1;
    /** @type {Parents | undefined} */
    let grandparent;

    while (++index < parents.length) {
      const parent = parents[index];
      /** @type {Array<Nodes> | undefined} */
      const siblings = grandparent ? grandparent.children : undefined;

      if (
        ignored(
          parent,
          siblings ? siblings.indexOf(parent) : undefined,
          grandparent
        )
      ) {
        return
      }

      grandparent = parent;
    }

    if (grandparent) {
      return handler(node, parents)
    }
  }

  /**
   * Handle a text node which is not in an ignored parent.
   *
   * @param {Text} node
   *   Text node.
   * @param {Array<Parents>} parents
   *   Parents.
   * @returns {VisitorResult}
   *   Result.
   */
  function handler(node, parents) {
    const parent = parents[parents.length - 1];
    const find = pairs[pairIndex][0];
    const replace = pairs[pairIndex][1];
    let start = 0;
    /** @type {Array<Nodes>} */
    const siblings = parent.children;
    const index = siblings.indexOf(node);
    let change = false;
    /** @type {Array<PhrasingContent>} */
    let nodes = [];

    find.lastIndex = 0;

    let match = find.exec(node.value);

    while (match) {
      const position = match.index;
      /** @type {RegExpMatchObject} */
      const matchObject = {
        index: match.index,
        input: match.input,
        stack: [...parents, node]
      };
      let value = replace(...match, matchObject);

      if (typeof value === 'string') {
        value = value.length > 0 ? {type: 'text', value} : undefined;
      }

      // It wasn’t a match after all.
      if (value === false) {
        // False acts as if there was no match.
        // So we need to reset `lastIndex`, which currently being at the end of
        // the current match, to the beginning.
        find.lastIndex = position + 1;
      } else {
        if (start !== position) {
          nodes.push({
            type: 'text',
            value: node.value.slice(start, position)
          });
        }

        if (Array.isArray(value)) {
          nodes.push(...value);
        } else if (value) {
          nodes.push(value);
        }

        start = position + match[0].length;
        change = true;
      }

      if (!find.global) {
        break
      }

      match = find.exec(node.value);
    }

    if (change) {
      if (start < node.value.length) {
        nodes.push({type: 'text', value: node.value.slice(start)});
      }

      parent.children.splice(index, 1, ...nodes);
    } else {
      nodes = [node];
    }

    return index + nodes.length
  }
}

/**
 * Turn a tuple or a list of tuples into pairs.
 *
 * @param {FindAndReplaceList | FindAndReplaceTuple} tupleOrList
 *   Schema.
 * @returns {Pairs}
 *   Clean pairs.
 */
function toPairs(tupleOrList) {
  /** @type {Pairs} */
  const result = [];

  if (!Array.isArray(tupleOrList)) {
    throw new TypeError('Expected find and replace tuple or list of tuples')
  }

  /** @type {FindAndReplaceList} */
  // @ts-expect-error: correct.
  const list =
    !tupleOrList[0] || Array.isArray(tupleOrList[0])
      ? tupleOrList
      : [tupleOrList];

  let index = -1;

  while (++index < list.length) {
    const tuple = list[index];
    result.push([toExpression(tuple[0]), toFunction(tuple[1])]);
  }

  return result
}

/**
 * Turn a find into an expression.
 *
 * @param {Find} find
 *   Find.
 * @returns {RegExp}
 *   Expression.
 */
function toExpression(find) {
  return typeof find === 'string' ? new RegExp(escapeStringRegexp(find), 'g') : find
}

/**
 * Turn a replace into a function.
 *
 * @param {Replace} replace
 *   Replace.
 * @returns {ReplaceFunction}
 *   Function.
 */
function toFunction(replace) {
  return typeof replace === 'function'
    ? replace
    : function () {
        return replace
      }
}

/**
 * @import {RegExpMatchObject, ReplaceFunction} from 'mdast-util-find-and-replace'
 * @import {CompileContext, Extension as FromMarkdownExtension, Handle as FromMarkdownHandle, Transform as FromMarkdownTransform} from 'mdast-util-from-markdown'
 * @import {ConstructName, Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
 * @import {Link, PhrasingContent} from 'mdast'
 */


/** @type {ConstructName} */
const inConstruct = 'phrasing';
/** @type {Array<ConstructName>} */
const notInConstruct = ['autolink', 'link', 'image', 'label'];

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM autolink
 * literals in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM autolink literals.
 */
function gfmAutolinkLiteralFromMarkdown() {
  return {
    transforms: [transformGfmAutolinkLiterals],
    enter: {
      literalAutolink: enterLiteralAutolink,
      literalAutolinkEmail: enterLiteralAutolinkValue,
      literalAutolinkHttp: enterLiteralAutolinkValue,
      literalAutolinkWww: enterLiteralAutolinkValue
    },
    exit: {
      literalAutolink: exitLiteralAutolink,
      literalAutolinkEmail: exitLiteralAutolinkEmail,
      literalAutolinkHttp: exitLiteralAutolinkHttp,
      literalAutolinkWww: exitLiteralAutolinkWww
    }
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM autolink
 * literals in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM autolink literals.
 */
function gfmAutolinkLiteralToMarkdown() {
  return {
    unsafe: [
      {
        character: '@',
        before: '[+\\-.\\w]',
        after: '[\\-.\\w]',
        inConstruct,
        notInConstruct
      },
      {
        character: '.',
        before: '[Ww]',
        after: '[\\-.\\w]',
        inConstruct,
        notInConstruct
      },
      {
        character: ':',
        before: '[ps]',
        after: '\\/',
        inConstruct,
        notInConstruct
      }
    ]
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolink(token) {
  this.enter({type: 'link', title: null, url: '', children: []}, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterLiteralAutolinkValue(token) {
  this.config.enter.autolinkProtocol.call(this, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkHttp(token) {
  this.config.exit.autolinkProtocol.call(this, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkWww(token) {
  this.config.exit.data.call(this, token);
  const node = this.stack[this.stack.length - 1];
  ok$1(node.type === 'link');
  node.url = 'http://' + this.sliceSerialize(token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolinkEmail(token) {
  this.config.exit.autolinkEmail.call(this, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitLiteralAutolink(token) {
  this.exit(token);
}

/** @type {FromMarkdownTransform} */
function transformGfmAutolinkLiterals(tree) {
  findAndReplace(
    tree,
    [
      [/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, findUrl],
      [/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu, findEmail]
    ],
    {ignore: ['link', 'linkReference']}
  );
}

/**
 * @type {ReplaceFunction}
 * @param {string} _
 * @param {string} protocol
 * @param {string} domain
 * @param {string} path
 * @param {RegExpMatchObject} match
 * @returns {Array<PhrasingContent> | Link | false}
 */
// eslint-disable-next-line max-params
function findUrl(_, protocol, domain, path, match) {
  let prefix = '';

  // Not an expected previous character.
  if (!previous$1(match)) {
    return false
  }

  // Treat `www` as part of the domain.
  if (/^w/i.test(protocol)) {
    domain = protocol + domain;
    protocol = '';
    prefix = 'http://';
  }

  if (!isCorrectDomain(domain)) {
    return false
  }

  const parts = splitUrl(domain + path);

  if (!parts[0]) return false

  /** @type {Link} */
  const result = {
    type: 'link',
    title: null,
    url: prefix + protocol + parts[0],
    children: [{type: 'text', value: protocol + parts[0]}]
  };

  if (parts[1]) {
    return [result, {type: 'text', value: parts[1]}]
  }

  return result
}

/**
 * @type {ReplaceFunction}
 * @param {string} _
 * @param {string} atext
 * @param {string} label
 * @param {RegExpMatchObject} match
 * @returns {Link | false}
 */
function findEmail(_, atext, label, match) {
  if (
    // Not an expected previous character.
    !previous$1(match, true) ||
    // Label ends in not allowed character.
    /[-\d_]$/.test(label)
  ) {
    return false
  }

  return {
    type: 'link',
    title: null,
    url: 'mailto:' + atext + '@' + label,
    children: [{type: 'text', value: atext + '@' + label}]
  }
}

/**
 * @param {string} domain
 * @returns {boolean}
 */
function isCorrectDomain(domain) {
  const parts = domain.split('.');

  if (
    parts.length < 2 ||
    (parts[parts.length - 1] &&
      (/_/.test(parts[parts.length - 1]) ||
        !/[a-zA-Z\d]/.test(parts[parts.length - 1]))) ||
    (parts[parts.length - 2] &&
      (/_/.test(parts[parts.length - 2]) ||
        !/[a-zA-Z\d]/.test(parts[parts.length - 2])))
  ) {
    return false
  }

  return true
}

/**
 * @param {string} url
 * @returns {[string, string | undefined]}
 */
function splitUrl(url) {
  const trailExec = /[!"&'),.:;<>?\]}]+$/.exec(url);

  if (!trailExec) {
    return [url, undefined]
  }

  url = url.slice(0, trailExec.index);

  let trail = trailExec[0];
  let closingParenIndex = trail.indexOf(')');
  const openingParens = ccount(url, '(');
  let closingParens = ccount(url, ')');

  while (closingParenIndex !== -1 && openingParens > closingParens) {
    url += trail.slice(0, closingParenIndex + 1);
    trail = trail.slice(closingParenIndex + 1);
    closingParenIndex = trail.indexOf(')');
    closingParens++;
  }

  return [url, trail]
}

/**
 * @param {RegExpMatchObject} match
 * @param {boolean | null | undefined} [email=false]
 * @returns {boolean}
 */
function previous$1(match, email) {
  const code = match.input.charCodeAt(match.index - 1);

  return (
    (match.index === 0 ||
      unicodeWhitespace(code) ||
      unicodePunctuation(code)) &&
    // If it’s an email, the previous character should not be a slash.
    (!email || code !== 47)
  )
}

/**
 * Normalize an identifier (as found in references, definitions).
 *
 * Collapses markdown whitespace, trim, and then lower- and uppercase.
 *
 * Some characters are considered “uppercase”, such as U+03F4 (`ϴ`), but if their
 * lowercase counterpart (U+03B8 (`θ`)) is uppercased will result in a different
 * uppercase character (U+0398 (`Θ`)).
 * So, to get a canonical form, we perform both lower- and uppercase.
 *
 * Using uppercase last makes sure keys will never interact with default
 * prototypal values (such as `constructor`): nothing in the prototype of
 * `Object` is uppercase.
 *
 * @param {string} value
 *   Identifier to normalize.
 * @returns {string}
 *   Normalized identifier.
 */
function normalizeIdentifier(value) {
  return value
  // Collapse markdown whitespace.
  .replace(/[\t\n\r ]+/g, " ")
  // Trim.
  .replace(/^ | $/g, '')
  // Some characters are considered “uppercase”, but if their lowercase
  // counterpart is uppercased will result in a different uppercase
  // character.
  // Hence, to get that form, we perform both lower- and uppercase.
  // Upper case makes sure keys will not interact with default prototypal
  // methods: no method is uppercase.
  .toLowerCase().toUpperCase();
}

/**
 * @import {
 *   CompileContext,
 *   Extension as FromMarkdownExtension,
 *   Handle as FromMarkdownHandle
 * } from 'mdast-util-from-markdown'
 * @import {ToMarkdownOptions} from 'mdast-util-gfm-footnote'
 * @import {
 *   Handle as ToMarkdownHandle,
 *   Map,
 *   Options as ToMarkdownExtension
 * } from 'mdast-util-to-markdown'
 * @import {FootnoteDefinition, FootnoteReference} from 'mdast'
 */


footnoteReference$1.peek = footnoteReferencePeek;

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteCallString() {
  this.buffer();
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteCall(token) {
  this.enter({type: 'footnoteReference', identifier: '', label: ''}, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteDefinitionLabelString() {
  this.buffer();
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterFootnoteDefinition(token) {
  this.enter(
    {type: 'footnoteDefinition', identifier: '', label: '', children: []},
    token
  );
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteCallString(token) {
  const label = this.resume();
  const node = this.stack[this.stack.length - 1];
  ok$1(node.type === 'footnoteReference');
  node.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node.label = label;
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteCall(token) {
  this.exit(token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteDefinitionLabelString(token) {
  const label = this.resume();
  const node = this.stack[this.stack.length - 1];
  ok$1(node.type === 'footnoteDefinition');
  node.identifier = normalizeIdentifier(
    this.sliceSerialize(token)
  ).toLowerCase();
  node.label = label;
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitFootnoteDefinition(token) {
  this.exit(token);
}

/** @type {ToMarkdownHandle} */
function footnoteReferencePeek() {
  return '['
}

/**
 * @type {ToMarkdownHandle}
 * @param {FootnoteReference} node
 */
function footnoteReference$1(node, _, state, info) {
  const tracker = state.createTracker(info);
  let value = tracker.move('[^');
  const exit = state.enter('footnoteReference');
  const subexit = state.enter('reference');
  value += tracker.move(
    state.safe(state.associationId(node), {after: ']', before: value})
  );
  subexit();
  exit();
  value += tracker.move(']');
  return value
}

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM footnotes
 * in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown`.
 */
function gfmFootnoteFromMarkdown() {
  return {
    enter: {
      gfmFootnoteCallString: enterFootnoteCallString,
      gfmFootnoteCall: enterFootnoteCall,
      gfmFootnoteDefinitionLabelString: enterFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: enterFootnoteDefinition
    },
    exit: {
      gfmFootnoteCallString: exitFootnoteCallString,
      gfmFootnoteCall: exitFootnoteCall,
      gfmFootnoteDefinitionLabelString: exitFootnoteDefinitionLabelString,
      gfmFootnoteDefinition: exitFootnoteDefinition
    }
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM footnotes
 * in markdown.
 *
 * @param {ToMarkdownOptions | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown`.
 */
function gfmFootnoteToMarkdown(options) {
  // To do: next major: change default.
  let firstLineBlank = false;

  if (options && options.firstLineBlank) {
    firstLineBlank = true;
  }

  return {
    handlers: {footnoteDefinition, footnoteReference: footnoteReference$1},
    // This is on by default already.
    unsafe: [{character: '[', inConstruct: ['label', 'phrasing', 'reference']}]
  }

  /**
   * @type {ToMarkdownHandle}
   * @param {FootnoteDefinition} node
   */
  function footnoteDefinition(node, _, state, info) {
    const tracker = state.createTracker(info);
    let value = tracker.move('[^');
    const exit = state.enter('footnoteDefinition');
    const subexit = state.enter('label');
    value += tracker.move(
      state.safe(state.associationId(node), {before: value, after: ']'})
    );
    subexit();

    value += tracker.move(']:');

    if (node.children && node.children.length > 0) {
      tracker.shift(4);

      value += tracker.move(
        (firstLineBlank ? '\n' : ' ') +
          state.indentLines(
            state.containerFlow(node, tracker.current()),
            firstLineBlank ? mapAll : mapExceptFirst
          )
      );
    }

    exit();

    return value
  }
}

/** @type {Map} */
function mapExceptFirst(line, index, blank) {
  return index === 0 ? line : mapAll(line, index, blank)
}

/** @type {Map} */
function mapAll(line, index, blank) {
  return (blank ? '' : '    ') + line
}

/**
 * @typedef {import('mdast').Delete} Delete
 *
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 *
 * @typedef {import('mdast-util-to-markdown').ConstructName} ConstructName
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 */

/**
 * List of constructs that occur in phrasing (paragraphs, headings), but cannot
 * contain strikethrough.
 * So they sort of cancel each other out.
 * Note: could use a better name.
 *
 * Note: keep in sync with: <https://github.com/syntax-tree/mdast-util-to-markdown/blob/8ce8dbf/lib/unsafe.js#L14>
 *
 * @type {Array<ConstructName>}
 */
const constructsWithoutStrikethrough = [
  'autolink',
  'destinationLiteral',
  'destinationRaw',
  'reference',
  'titleQuote',
  'titleApostrophe'
];

handleDelete.peek = peekDelete;

/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM
 * strikethrough in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable GFM strikethrough.
 */
function gfmStrikethroughFromMarkdown() {
  return {
    canContainEols: ['delete'],
    enter: {strikethrough: enterStrikethrough},
    exit: {strikethrough: exitStrikethrough}
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM
 * strikethrough in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM strikethrough.
 */
function gfmStrikethroughToMarkdown() {
  return {
    unsafe: [
      {
        character: '~',
        inConstruct: 'phrasing',
        notInConstruct: constructsWithoutStrikethrough
      }
    ],
    handlers: {delete: handleDelete}
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterStrikethrough(token) {
  this.enter({type: 'delete', children: []}, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitStrikethrough(token) {
  this.exit(token);
}

/**
 * @type {ToMarkdownHandle}
 * @param {Delete} node
 */
function handleDelete(node, _, state, info) {
  const tracker = state.createTracker(info);
  const exit = state.enter('strikethrough');
  let value = tracker.move('~~');
  value += state.containerPhrasing(node, {
    ...tracker.current(),
    before: value,
    after: '~'
  });
  value += tracker.move('~~');
  exit();
  return value
}

/** @type {ToMarkdownHandle} */
function peekDelete() {
  return '~'
}

// To do: next major: remove.
/**
 * @typedef {Options} MarkdownTableOptions
 *   Configuration.
 */

/**
 * @typedef Options
 *   Configuration.
 * @property {boolean | null | undefined} [alignDelimiters=true]
 *   Whether to align the delimiters (default: `true`);
 *   they are aligned by default:
 *
 *   ```markdown
 *   | Alpha | B     |
 *   | ----- | ----- |
 *   | C     | Delta |
 *   ```
 *
 *   Pass `false` to make them staggered:
 *
 *   ```markdown
 *   | Alpha | B |
 *   | - | - |
 *   | C | Delta |
 *   ```
 * @property {ReadonlyArray<string | null | undefined> | string | null | undefined} [align]
 *   How to align columns (default: `''`);
 *   one style for all columns or styles for their respective columns;
 *   each style is either `'l'` (left), `'r'` (right), or `'c'` (center);
 *   other values are treated as `''`, which doesn’t place the colon in the
 *   alignment row but does align left;
 *   *only the lowercased first character is used, so `Right` is fine.*
 * @property {boolean | null | undefined} [delimiterEnd=true]
 *   Whether to end each row with the delimiter (default: `true`).
 *
 *   > 👉 **Note**: please don’t use this: it could create fragile structures
 *   > that aren’t understandable to some markdown parsers.
 *
 *   When `true`, there are ending delimiters:
 *
 *   ```markdown
 *   | Alpha | B     |
 *   | ----- | ----- |
 *   | C     | Delta |
 *   ```
 *
 *   When `false`, there are no ending delimiters:
 *
 *   ```markdown
 *   | Alpha | B
 *   | ----- | -----
 *   | C     | Delta
 *   ```
 * @property {boolean | null | undefined} [delimiterStart=true]
 *   Whether to begin each row with the delimiter (default: `true`).
 *
 *   > 👉 **Note**: please don’t use this: it could create fragile structures
 *   > that aren’t understandable to some markdown parsers.
 *
 *   When `true`, there are starting delimiters:
 *
 *   ```markdown
 *   | Alpha | B     |
 *   | ----- | ----- |
 *   | C     | Delta |
 *   ```
 *
 *   When `false`, there are no starting delimiters:
 *
 *   ```markdown
 *   Alpha | B     |
 *   ----- | ----- |
 *   C     | Delta |
 *   ```
 * @property {boolean | null | undefined} [padding=true]
 *   Whether to add a space of padding between delimiters and cells
 *   (default: `true`).
 *
 *   When `true`, there is padding:
 *
 *   ```markdown
 *   | Alpha | B     |
 *   | ----- | ----- |
 *   | C     | Delta |
 *   ```
 *
 *   When `false`, there is no padding:
 *
 *   ```markdown
 *   |Alpha|B    |
 *   |-----|-----|
 *   |C    |Delta|
 *   ```
 * @property {((value: string) => number) | null | undefined} [stringLength]
 *   Function to detect the length of table cell content (optional);
 *   this is used when aligning the delimiters (`|`) between table cells;
 *   full-width characters and emoji mess up delimiter alignment when viewing
 *   the markdown source;
 *   to fix this, you can pass this function,
 *   which receives the cell content and returns its “visible” size;
 *   note that what is and isn’t visible depends on where the text is displayed.
 *
 *   Without such a function, the following:
 *
 *   ```js
 *   markdownTable([
 *     ['Alpha', 'Bravo'],
 *     ['中文', 'Charlie'],
 *     ['👩‍❤️‍👩', 'Delta']
 *   ])
 *   ```
 *
 *   Yields:
 *
 *   ```markdown
 *   | Alpha | Bravo |
 *   | - | - |
 *   | 中文 | Charlie |
 *   | 👩‍❤️‍👩 | Delta |
 *   ```
 *
 *   With [`string-width`](https://github.com/sindresorhus/string-width):
 *
 *   ```js
 *   import stringWidth from 'string-width'
 *
 *   markdownTable(
 *     [
 *       ['Alpha', 'Bravo'],
 *       ['中文', 'Charlie'],
 *       ['👩‍❤️‍👩', 'Delta']
 *     ],
 *     {stringLength: stringWidth}
 *   )
 *   ```
 *
 *   Yields:
 *
 *   ```markdown
 *   | Alpha | Bravo   |
 *   | ----- | ------- |
 *   | 中文  | Charlie |
 *   | 👩‍❤️‍👩    | Delta   |
 *   ```
 */

/**
 * @param {string} value
 *   Cell value.
 * @returns {number}
 *   Cell size.
 */
function defaultStringLength(value) {
  return value.length
}

/**
 * Generate a markdown
 * ([GFM](https://docs.github.com/en/github/writing-on-github/working-with-advanced-formatting/organizing-information-with-tables))
 * table.
 *
 * @param {ReadonlyArray<ReadonlyArray<string | null | undefined>>} table
 *   Table data (matrix of strings).
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Result.
 */
function markdownTable(table, options) {
  const settings = options || {};
  // To do: next major: change to spread.
  const align = (settings.align || []).concat();
  const stringLength = settings.stringLength || defaultStringLength;
  /** @type {Array<number>} Character codes as symbols for alignment per column. */
  const alignments = [];
  /** @type {Array<Array<string>>} Cells per row. */
  const cellMatrix = [];
  /** @type {Array<Array<number>>} Sizes of each cell per row. */
  const sizeMatrix = [];
  /** @type {Array<number>} */
  const longestCellByColumn = [];
  let mostCellsPerRow = 0;
  let rowIndex = -1;

  // This is a superfluous loop if we don’t align delimiters, but otherwise we’d
  // do superfluous work when aligning, so optimize for aligning.
  while (++rowIndex < table.length) {
    /** @type {Array<string>} */
    const row = [];
    /** @type {Array<number>} */
    const sizes = [];
    let columnIndex = -1;

    if (table[rowIndex].length > mostCellsPerRow) {
      mostCellsPerRow = table[rowIndex].length;
    }

    while (++columnIndex < table[rowIndex].length) {
      const cell = serialize$1(table[rowIndex][columnIndex]);

      if (settings.alignDelimiters !== false) {
        const size = stringLength(cell);
        sizes[columnIndex] = size;

        if (
          longestCellByColumn[columnIndex] === undefined ||
          size > longestCellByColumn[columnIndex]
        ) {
          longestCellByColumn[columnIndex] = size;
        }
      }

      row.push(cell);
    }

    cellMatrix[rowIndex] = row;
    sizeMatrix[rowIndex] = sizes;
  }

  // Figure out which alignments to use.
  let columnIndex = -1;

  if (typeof align === 'object' && 'length' in align) {
    while (++columnIndex < mostCellsPerRow) {
      alignments[columnIndex] = toAlignment(align[columnIndex]);
    }
  } else {
    const code = toAlignment(align);

    while (++columnIndex < mostCellsPerRow) {
      alignments[columnIndex] = code;
    }
  }

  // Inject the alignment row.
  columnIndex = -1;
  /** @type {Array<string>} */
  const row = [];
  /** @type {Array<number>} */
  const sizes = [];

  while (++columnIndex < mostCellsPerRow) {
    const code = alignments[columnIndex];
    let before = '';
    let after = '';

    if (code === 99 /* `c` */) {
      before = ':';
      after = ':';
    } else if (code === 108 /* `l` */) {
      before = ':';
    } else if (code === 114 /* `r` */) {
      after = ':';
    }

    // There *must* be at least one hyphen-minus in each alignment cell.
    let size =
      settings.alignDelimiters === false
        ? 1
        : Math.max(
            1,
            longestCellByColumn[columnIndex] - before.length - after.length
          );

    const cell = before + '-'.repeat(size) + after;

    if (settings.alignDelimiters !== false) {
      size = before.length + size + after.length;

      if (size > longestCellByColumn[columnIndex]) {
        longestCellByColumn[columnIndex] = size;
      }

      sizes[columnIndex] = size;
    }

    row[columnIndex] = cell;
  }

  // Inject the alignment row.
  cellMatrix.splice(1, 0, row);
  sizeMatrix.splice(1, 0, sizes);

  rowIndex = -1;
  /** @type {Array<string>} */
  const lines = [];

  while (++rowIndex < cellMatrix.length) {
    const row = cellMatrix[rowIndex];
    const sizes = sizeMatrix[rowIndex];
    columnIndex = -1;
    /** @type {Array<string>} */
    const line = [];

    while (++columnIndex < mostCellsPerRow) {
      const cell = row[columnIndex] || '';
      let before = '';
      let after = '';

      if (settings.alignDelimiters !== false) {
        const size =
          longestCellByColumn[columnIndex] - (sizes[columnIndex] || 0);
        const code = alignments[columnIndex];

        if (code === 114 /* `r` */) {
          before = ' '.repeat(size);
        } else if (code === 99 /* `c` */) {
          if (size % 2) {
            before = ' '.repeat(size / 2 + 0.5);
            after = ' '.repeat(size / 2 - 0.5);
          } else {
            before = ' '.repeat(size / 2);
            after = before;
          }
        } else {
          after = ' '.repeat(size);
        }
      }

      if (settings.delimiterStart !== false && !columnIndex) {
        line.push('|');
      }

      if (
        settings.padding !== false &&
        // Don’t add the opening space if we’re not aligning and the cell is
        // empty: there will be a closing space.
        !(settings.alignDelimiters === false && cell === '') &&
        (settings.delimiterStart !== false || columnIndex)
      ) {
        line.push(' ');
      }

      if (settings.alignDelimiters !== false) {
        line.push(before);
      }

      line.push(cell);

      if (settings.alignDelimiters !== false) {
        line.push(after);
      }

      if (settings.padding !== false) {
        line.push(' ');
      }

      if (
        settings.delimiterEnd !== false ||
        columnIndex !== mostCellsPerRow - 1
      ) {
        line.push('|');
      }
    }

    lines.push(
      settings.delimiterEnd === false
        ? line.join('').replace(/ +$/, '')
        : line.join('')
    );
  }

  return lines.join('\n')
}

/**
 * @param {string | null | undefined} [value]
 *   Value to serialize.
 * @returns {string}
 *   Result.
 */
function serialize$1(value) {
  return value === null || value === undefined ? '' : String(value)
}

/**
 * @param {string | null | undefined} value
 *   Value.
 * @returns {number}
 *   Alignment.
 */
function toAlignment(value) {
  const code = typeof value === 'string' ? value.codePointAt(0) : 0;

  return code === 67 /* `C` */ || code === 99 /* `c` */
    ? 99 /* `c` */
    : code === 76 /* `L` */ || code === 108 /* `l` */
      ? 108 /* `l` */
      : code === 82 /* `R` */ || code === 114 /* `r` */
        ? 114 /* `r` */
        : 0
}

/**
 * @import {Blockquote, Parents} from 'mdast'
 * @import {Info, Map, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {Blockquote} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function blockquote$1(node, _, state, info) {
  const exit = state.enter('blockquote');
  const tracker = state.createTracker(info);
  tracker.move('> ');
  tracker.shift(2);
  const value = state.indentLines(
    state.containerFlow(node, tracker.current()),
    map$1
  );
  exit();
  return value
}

/** @type {Map} */
function map$1(line, _, blank) {
  return '>' + (blank ? '' : ' ') + line
}

/**
 * @import {ConstructName, Unsafe} from 'mdast-util-to-markdown'
 */

/**
 * @param {Array<ConstructName>} stack
 * @param {Unsafe} pattern
 * @returns {boolean}
 */
function patternInScope(stack, pattern) {
  return (
    listInScope(stack, pattern.inConstruct, true) &&
    !listInScope(stack, pattern.notInConstruct, false)
  )
}

/**
 * @param {Array<ConstructName>} stack
 * @param {Unsafe['inConstruct']} list
 * @param {boolean} none
 * @returns {boolean}
 */
function listInScope(stack, list, none) {
  if (typeof list === 'string') {
    list = [list];
  }

  if (!list || list.length === 0) {
    return none
  }

  let index = -1;

  while (++index < list.length) {
    if (stack.includes(list[index])) {
      return true
    }
  }

  return false
}

/**
 * @import {Break, Parents} from 'mdast'
 * @import {Info, State} from 'mdast-util-to-markdown'
 */


/**
 * @param {Break} _
 * @param {Parents | undefined} _1
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function hardBreak$1(_, _1, state, info) {
  let index = -1;

  while (++index < state.unsafe.length) {
    // If we can’t put eols in this construct (setext headings, tables), use a
    // space instead.
    if (
      state.unsafe[index].character === '\n' &&
      patternInScope(state.stack, state.unsafe[index])
    ) {
      return /[ \t]/.test(info.before) ? '' : ' '
    }
  }

  return '\\\n'
}

/**
 * Get the count of the longest repeating streak of `substring` in `value`.
 *
 * @param {string} value
 *   Content to search in.
 * @param {string} substring
 *   Substring to look for, typically one character.
 * @returns {number}
 *   Count of most frequent adjacent `substring`s in `value`.
 */
function longestStreak(value, substring) {
  const source = String(value);
  let index = source.indexOf(substring);
  let expected = index;
  let count = 0;
  let max = 0;

  if (typeof substring !== 'string') {
    throw new TypeError('Expected substring')
  }

  while (index !== -1) {
    if (index === expected) {
      if (++count > max) {
        max = count;
      }
    } else {
      count = 1;
    }

    expected = index + substring.length;
    index = source.indexOf(substring, expected);
  }

  return max
}

/**
 * @import {State} from 'mdast-util-to-markdown'
 * @import {Code} from 'mdast'
 */

/**
 * @param {Code} node
 * @param {State} state
 * @returns {boolean}
 */
function formatCodeAsIndented(node, state) {
  return Boolean(
    state.options.fences === false &&
      node.value &&
      // If there’s no info…
      !node.lang &&
      // And there’s a non-whitespace character…
      /[^ \r\n]/.test(node.value) &&
      // And the value doesn’t start or end in a blank…
      !/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(node.value)
  )
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['fence'], null | undefined>}
 */
function checkFence(state) {
  const marker = state.options.fence || '`';

  if (marker !== '`' && marker !== '~') {
    throw new Error(
      'Cannot serialize code with `' +
        marker +
        '` for `options.fence`, expected `` ` `` or `~`'
    )
  }

  return marker
}

/**
 * @import {Info, Map, State} from 'mdast-util-to-markdown'
 * @import {Code, Parents} from 'mdast'
 */


/**
 * @param {Code} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function code$2(node, _, state, info) {
  const marker = checkFence(state);
  const raw = node.value || '';
  const suffix = marker === '`' ? 'GraveAccent' : 'Tilde';

  if (formatCodeAsIndented(node, state)) {
    const exit = state.enter('codeIndented');
    const value = state.indentLines(raw, map);
    exit();
    return value
  }

  const tracker = state.createTracker(info);
  const sequence = marker.repeat(Math.max(longestStreak(raw, marker) + 1, 3));
  const exit = state.enter('codeFenced');
  let value = tracker.move(sequence);

  if (node.lang) {
    const subexit = state.enter(`codeFencedLang${suffix}`);
    value += tracker.move(
      state.safe(node.lang, {
        before: value,
        after: ' ',
        encode: ['`'],
        ...tracker.current()
      })
    );
    subexit();
  }

  if (node.lang && node.meta) {
    const subexit = state.enter(`codeFencedMeta${suffix}`);
    value += tracker.move(' ');
    value += tracker.move(
      state.safe(node.meta, {
        before: value,
        after: '\n',
        encode: ['`'],
        ...tracker.current()
      })
    );
    subexit();
  }

  value += tracker.move('\n');

  if (raw) {
    value += tracker.move(raw + '\n');
  }

  value += tracker.move(sequence);
  exit();
  return value
}

/** @type {Map} */
function map(line, _, blank) {
  return (blank ? '' : '    ') + line
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['quote'], null | undefined>}
 */
function checkQuote(state) {
  const marker = state.options.quote || '"';

  if (marker !== '"' && marker !== "'") {
    throw new Error(
      'Cannot serialize title with `' +
        marker +
        '` for `options.quote`, expected `"`, or `\'`'
    )
  }

  return marker
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Definition, Parents} from 'mdast'
 */


/**
 * @param {Definition} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function definition$1(node, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? 'Quote' : 'Apostrophe';
  const exit = state.enter('definition');
  let subexit = state.enter('label');
  const tracker = state.createTracker(info);
  let value = tracker.move('[');
  value += tracker.move(
    state.safe(state.associationId(node), {
      before: value,
      after: ']',
      ...tracker.current()
    })
  );
  value += tracker.move(']: ');

  subexit();

  if (
    // If there’s no url, or…
    !node.url ||
    // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node.url)
  ) {
    subexit = state.enter('destinationLiteral');
    value += tracker.move('<');
    value += tracker.move(
      state.safe(node.url, {before: value, after: '>', ...tracker.current()})
    );
    value += tracker.move('>');
  } else {
    // No whitespace, raw is prettier.
    subexit = state.enter('destinationRaw');
    value += tracker.move(
      state.safe(node.url, {
        before: value,
        after: node.title ? ' ' : '\n',
        ...tracker.current()
      })
    );
  }

  subexit();

  if (node.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(' ' + quote);
    value += tracker.move(
      state.safe(node.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }

  exit();

  return value
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['emphasis'], null | undefined>}
 */
function checkEmphasis(state) {
  const marker = state.options.emphasis || '*';

  if (marker !== '*' && marker !== '_') {
    throw new Error(
      'Cannot serialize emphasis with `' +
        marker +
        '` for `options.emphasis`, expected `*`, or `_`'
    )
  }

  return marker
}

/**
 * Encode a code point as a character reference.
 *
 * @param {number} code
 *   Code point to encode.
 * @returns {string}
 *   Encoded character reference.
 */
function encodeCharacterReference(code) {
  return '&#x' + code.toString(16).toUpperCase() + ';'
}

/**
 * @import {Code} from 'micromark-util-types'
 */

/**
 * Classify whether a code represents whitespace, punctuation, or something
 * else.
 *
 * Used for attention (emphasis, strong), whose sequences can open or close
 * based on the class of surrounding characters.
 *
 * > 👉 **Note**: eof (`null`) is seen as whitespace.
 *
 * @param {Code} code
 *   Code.
 * @returns {typeof constants.characterGroupWhitespace | typeof constants.characterGroupPunctuation | undefined}
 *   Group.
 */
function classifyCharacter(code) {
  if (code === null || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
    return 1;
  }
  if (unicodePunctuation(code)) {
    return 2;
  }
}

/**
 * @import {EncodeSides} from '../types.js'
 */


/**
 * Check whether to encode (as a character reference) the characters
 * surrounding an attention run.
 *
 * Which characters are around an attention run influence whether it works or
 * not.
 *
 * See <https://github.com/orgs/syntax-tree/discussions/60> for more info.
 * See this markdown in a particular renderer to see what works:
 *
 * ```markdown
 * |                         | A (letter inside) | B (punctuation inside) | C (whitespace inside) | D (nothing inside) |
 * | ----------------------- | ----------------- | ---------------------- | --------------------- | ------------------ |
 * | 1 (letter outside)      | x*y*z             | x*.*z                  | x* *z                 | x**z               |
 * | 2 (punctuation outside) | .*y*.             | .*.*.                  | .* *.                 | .**.               |
 * | 3 (whitespace outside)  | x *y* z           | x *.* z                | x * * z               | x ** z             |
 * | 4 (nothing outside)     | *x*               | *.*                    | * *                   | **                 |
 * ```
 *
 * @param {number} outside
 *   Code point on the outer side of the run.
 * @param {number} inside
 *   Code point on the inner side of the run.
 * @param {'*' | '_'} marker
 *   Marker of the run.
 *   Underscores are handled more strictly (they form less often) than
 *   asterisks.
 * @returns {EncodeSides}
 *   Whether to encode characters.
 */
// Important: punctuation must never be encoded.
// Punctuation is solely used by markdown constructs.
// And by encoding itself.
// Encoding them will break constructs or double encode things.
function encodeInfo(outside, inside, marker) {
  const outsideKind = classifyCharacter(outside);
  const insideKind = classifyCharacter(inside);

  // Letter outside:
  if (outsideKind === undefined) {
    return insideKind === undefined
      ? // Letter inside:
        // we have to encode *both* letters for `_` as it is looser.
        // it already forms for `*` (and GFMs `~`).
        marker === '_'
        ? {inside: true, outside: true}
        : {inside: false, outside: false}
      : insideKind === 1
        ? // Whitespace inside: encode both (letter, whitespace).
          {inside: true, outside: true}
        : // Punctuation inside: encode outer (letter)
          {inside: false, outside: true}
  }

  // Whitespace outside:
  if (outsideKind === 1) {
    return insideKind === undefined
      ? // Letter inside: already forms.
        {inside: false, outside: false}
      : insideKind === 1
        ? // Whitespace inside: encode both (whitespace).
          {inside: true, outside: true}
        : // Punctuation inside: already forms.
          {inside: false, outside: false}
  }

  // Punctuation outside:
  return insideKind === undefined
    ? // Letter inside: already forms.
      {inside: false, outside: false}
    : insideKind === 1
      ? // Whitespace inside: encode inner (whitespace).
        {inside: true, outside: false}
      : // Punctuation inside: already forms.
        {inside: false, outside: false}
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Emphasis, Parents} from 'mdast'
 */


emphasis$1.peek = emphasisPeek;

/**
 * @param {Emphasis} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function emphasis$1(node, _, state, info) {
  const marker = checkEmphasis(state);
  const exit = state.enter('emphasis');
  const tracker = state.createTracker(info);
  const before = tracker.move(marker);

  let between = tracker.move(
    state.containerPhrasing(node, {
      after: marker,
      before,
      ...tracker.current()
    })
  );
  const betweenHead = between.charCodeAt(0);
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  );

  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1);
  }

  const betweenTail = between.charCodeAt(between.length - 1);
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);

  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
  }

  const after = tracker.move(marker);

  exit();

  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  };
  return before + between + after
}

/**
 * @param {Emphasis} _
 * @param {Parents | undefined} _1
 * @param {State} state
 * @returns {string}
 */
function emphasisPeek(_, _1, state) {
  return state.options.emphasis || '*'
}

/**
 * @typedef {import('unist').Node} UnistNode
 * @typedef {import('unist').Parent} UnistParent
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 */


/**
 * Visit nodes.
 *
 * This algorithm performs *depth-first* *tree traversal* in *preorder*
 * (**NLR**) or if `reverse` is given, in *reverse preorder* (**NRL**).
 *
 * You can choose for which nodes `visitor` is called by passing a `test`.
 * For complex tests, you should test yourself in `visitor`, as it will be
 * faster and will have improved type information.
 *
 * Walking the tree is an intensive task.
 * Make use of the return values of the visitor when possible.
 * Instead of walking a tree multiple times, walk it once, use `unist-util-is`
 * to check if a node matches, and then perform different operations.
 *
 * You can change the tree.
 * See `Visitor` for more info.
 *
 * @overload
 * @param {Tree} tree
 * @param {Check} check
 * @param {BuildVisitor<Tree, Check>} visitor
 * @param {boolean | null | undefined} [reverse]
 * @returns {undefined}
 *
 * @overload
 * @param {Tree} tree
 * @param {BuildVisitor<Tree>} visitor
 * @param {boolean | null | undefined} [reverse]
 * @returns {undefined}
 *
 * @param {UnistNode} tree
 *   Tree to traverse.
 * @param {Visitor | Test} testOrVisitor
 *   `unist-util-is`-compatible test (optional, omit to pass a visitor).
 * @param {Visitor | boolean | null | undefined} [visitorOrReverse]
 *   Handle each node (when test is omitted, pass `reverse`).
 * @param {boolean | null | undefined} [maybeReverse=false]
 *   Traverse in reverse preorder (NRL) instead of the default preorder (NLR).
 * @returns {undefined}
 *   Nothing.
 *
 * @template {UnistNode} Tree
 *   Node type.
 * @template {Test} Check
 *   `unist-util-is`-compatible test.
 */
function visit(tree, testOrVisitor, visitorOrReverse, maybeReverse) {
  /** @type {boolean | null | undefined} */
  let reverse;
  /** @type {Test} */
  let test;
  /** @type {Visitor} */
  let visitor;

  if (
    typeof testOrVisitor === 'function' &&
    "undefined" !== 'function'
  ) {
    test = undefined;
    visitor = testOrVisitor;
    reverse = visitorOrReverse;
  } else {
    // @ts-expect-error: assume the overload with test was given.
    test = testOrVisitor;
    // @ts-expect-error: assume the overload with test was given.
    visitor = visitorOrReverse;
    reverse = maybeReverse;
  }

  visitParents(tree, test, overload, reverse);

  /**
   * @param {UnistNode} node
   * @param {Array<UnistParent>} parents
   */
  function overload(node, parents) {
    const parent = parents[parents.length - 1];
    const index = parent ? parent.children.indexOf(node) : undefined;
    return visitor(node, index, parent)
  }
}

/**
 * @typedef {import('mdast').Nodes} Nodes
 *
 * @typedef Options
 *   Configuration (optional).
 * @property {boolean | null | undefined} [includeImageAlt=true]
 *   Whether to use `alt` for `image`s (default: `true`).
 * @property {boolean | null | undefined} [includeHtml=true]
 *   Whether to use `value` of HTML (default: `true`).
 */

/** @type {Options} */
const emptyOptions$2 = {};

/**
 * Get the text content of a node or list of nodes.
 *
 * Prefers the node’s plain-text fields, otherwise serializes its children,
 * and if the given value is an array, serialize the nodes in it.
 *
 * @param {unknown} [value]
 *   Thing to serialize, typically `Node`.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {string}
 *   Serialized `value`.
 */
function toString$2(value, options) {
  const settings = emptyOptions$2;
  const includeImageAlt =
    typeof settings.includeImageAlt === 'boolean'
      ? settings.includeImageAlt
      : true;
  const includeHtml =
    typeof settings.includeHtml === 'boolean' ? settings.includeHtml : true;

  return one$2(value, includeImageAlt, includeHtml)
}

/**
 * One node or several nodes.
 *
 * @param {unknown} value
 *   Thing to serialize.
 * @param {boolean} includeImageAlt
 *   Include image `alt`s.
 * @param {boolean} includeHtml
 *   Include HTML.
 * @returns {string}
 *   Serialized node.
 */
function one$2(value, includeImageAlt, includeHtml) {
  if (node(value)) {
    if ('value' in value) {
      return value.type === 'html' && !includeHtml ? '' : value.value
    }

    if (includeImageAlt && 'alt' in value && value.alt) {
      return value.alt
    }

    if ('children' in value) {
      return all$2(value.children, includeImageAlt, includeHtml)
    }
  }

  if (Array.isArray(value)) {
    return all$2(value, includeImageAlt, includeHtml)
  }

  return ''
}

/**
 * Serialize a list of nodes.
 *
 * @param {Array<unknown>} values
 *   Thing to serialize.
 * @param {boolean} includeImageAlt
 *   Include image `alt`s.
 * @param {boolean} includeHtml
 *   Include HTML.
 * @returns {string}
 *   Serialized nodes.
 */
function all$2(values, includeImageAlt, includeHtml) {
  /** @type {Array<string>} */
  const result = [];
  let index = -1;

  while (++index < values.length) {
    result[index] = one$2(values[index], includeImageAlt, includeHtml);
  }

  return result.join('')
}

/**
 * Check if `value` looks like a node.
 *
 * @param {unknown} value
 *   Thing.
 * @returns {value is Nodes}
 *   Whether `value` is a node.
 */
function node(value) {
  return Boolean(value && typeof value === 'object')
}

/**
 * @import {State} from 'mdast-util-to-markdown'
 * @import {Heading} from 'mdast'
 */


/**
 * @param {Heading} node
 * @param {State} state
 * @returns {boolean}
 */
function formatHeadingAsSetext(node, state) {
  let literalWithBreak = false;

  // Look for literals with a line break.
  // Note that this also
  visit(node, function (node) {
    if (
      ('value' in node && /\r?\n|\r/.test(node.value)) ||
      node.type === 'break'
    ) {
      literalWithBreak = true;
      return EXIT
    }
  });

  return Boolean(
    (!node.depth || node.depth < 3) &&
      toString$2(node) &&
      (state.options.setext || literalWithBreak)
  )
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Heading, Parents} from 'mdast'
 */


/**
 * @param {Heading} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function heading$1(node, _, state, info) {
  const rank = Math.max(Math.min(6, node.depth || 1), 1);
  const tracker = state.createTracker(info);

  if (formatHeadingAsSetext(node, state)) {
    const exit = state.enter('headingSetext');
    const subexit = state.enter('phrasing');
    const value = state.containerPhrasing(node, {
      ...tracker.current(),
      before: '\n',
      after: '\n'
    });
    subexit();
    exit();

    return (
      value +
      '\n' +
      (rank === 1 ? '=' : '-').repeat(
        // The whole size…
        value.length -
          // Minus the position of the character after the last EOL (or
          // 0 if there is none)…
          (Math.max(value.lastIndexOf('\r'), value.lastIndexOf('\n')) + 1)
      )
    )
  }

  const sequence = '#'.repeat(rank);
  const exit = state.enter('headingAtx');
  const subexit = state.enter('phrasing');

  // Note: for proper tracking, we should reset the output positions when there
  // is no content returned, because then the space is not output.
  // Practically, in that case, there is no content, so it doesn’t matter that
  // we’ve tracked one too many characters.
  tracker.move(sequence + ' ');

  let value = state.containerPhrasing(node, {
    before: '# ',
    after: '\n',
    ...tracker.current()
  });

  if (/^[\t ]/.test(value)) {
    // To do: what effect has the character reference on tracking?
    value = encodeCharacterReference(value.charCodeAt(0)) + value.slice(1);
  }

  value = value ? sequence + ' ' + value : sequence;

  if (state.options.closeAtx) {
    value += ' ' + sequence;
  }

  subexit();
  exit();

  return value
}

/**
 * @import {Html} from 'mdast'
 */

html$1.peek = htmlPeek;

/**
 * @param {Html} node
 * @returns {string}
 */
function html$1(node) {
  return node.value || ''
}

/**
 * @returns {string}
 */
function htmlPeek() {
  return '<'
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Image, Parents} from 'mdast'
 */


image$1.peek = imagePeek;

/**
 * @param {Image} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function image$1(node, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? 'Quote' : 'Apostrophe';
  const exit = state.enter('image');
  let subexit = state.enter('label');
  const tracker = state.createTracker(info);
  let value = tracker.move('![');
  value += tracker.move(
    state.safe(node.alt, {before: value, after: ']', ...tracker.current()})
  );
  value += tracker.move('](');

  subexit();

  if (
    // If there’s no url but there is a title…
    (!node.url && node.title) ||
    // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node.url)
  ) {
    subexit = state.enter('destinationLiteral');
    value += tracker.move('<');
    value += tracker.move(
      state.safe(node.url, {before: value, after: '>', ...tracker.current()})
    );
    value += tracker.move('>');
  } else {
    // No whitespace, raw is prettier.
    subexit = state.enter('destinationRaw');
    value += tracker.move(
      state.safe(node.url, {
        before: value,
        after: node.title ? ' ' : ')',
        ...tracker.current()
      })
    );
  }

  subexit();

  if (node.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(' ' + quote);
    value += tracker.move(
      state.safe(node.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }

  value += tracker.move(')');
  exit();

  return value
}

/**
 * @returns {string}
 */
function imagePeek() {
  return '!'
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {ImageReference, Parents} from 'mdast'
 */

imageReference$1.peek = imageReferencePeek;

/**
 * @param {ImageReference} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function imageReference$1(node, _, state, info) {
  const type = node.referenceType;
  const exit = state.enter('imageReference');
  let subexit = state.enter('label');
  const tracker = state.createTracker(info);
  let value = tracker.move('![');
  const alt = state.safe(node.alt, {
    before: value,
    after: ']',
    ...tracker.current()
  });
  value += tracker.move(alt + '][');

  subexit();
  // Hide the fact that we’re in phrasing, because escapes don’t work.
  const stack = state.stack;
  state.stack = [];
  subexit = state.enter('reference');
  // Note: for proper tracking, we should reset the output positions when we end
  // up making a `shortcut` reference, because then there is no brace output.
  // Practically, in that case, there is no content, so it doesn’t matter that
  // we’ve tracked one too many characters.
  const reference = state.safe(state.associationId(node), {
    before: value,
    after: ']',
    ...tracker.current()
  });
  subexit();
  state.stack = stack;
  exit();

  if (type === 'full' || !alt || alt !== reference) {
    value += tracker.move(reference + ']');
  } else if (type === 'shortcut') {
    // Remove the unwanted `[`.
    value = value.slice(0, -1);
  } else {
    value += tracker.move(']');
  }

  return value
}

/**
 * @returns {string}
 */
function imageReferencePeek() {
  return '!'
}

/**
 * @import {State} from 'mdast-util-to-markdown'
 * @import {InlineCode, Parents} from 'mdast'
 */

inlineCode$1.peek = inlineCodePeek;

/**
 * @param {InlineCode} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @returns {string}
 */
function inlineCode$1(node, _, state) {
  let value = node.value || '';
  let sequence = '`';
  let index = -1;

  // If there is a single grave accent on its own in the code, use a fence of
  // two.
  // If there are two in a row, use one.
  while (new RegExp('(^|[^`])' + sequence + '([^`]|$)').test(value)) {
    sequence += '`';
  }

  // If this is not just spaces or eols (tabs don’t count), and either the
  // first or last character are a space, eol, or tick, then pad with spaces.
  if (
    /[^ \r\n]/.test(value) &&
    ((/^[ \r\n]/.test(value) && /[ \r\n]$/.test(value)) || /^`|`$/.test(value))
  ) {
    value = ' ' + value + ' ';
  }

  // We have a potential problem: certain characters after eols could result in
  // blocks being seen.
  // For example, if someone injected the string `'\n# b'`, then that would
  // result in an ATX heading.
  // We can’t escape characters in `inlineCode`, but because eols are
  // transformed to spaces when going from markdown to HTML anyway, we can swap
  // them out.
  while (++index < state.unsafe.length) {
    const pattern = state.unsafe[index];
    const expression = state.compilePattern(pattern);
    /** @type {RegExpExecArray | null} */
    let match;

    // Only look for `atBreak`s.
    // Btw: note that `atBreak` patterns will always start the regex at LF or
    // CR.
    if (!pattern.atBreak) continue

    while ((match = expression.exec(value))) {
      let position = match.index;

      // Support CRLF (patterns only look for one of the characters).
      if (
        value.charCodeAt(position) === 10 /* `\n` */ &&
        value.charCodeAt(position - 1) === 13 /* `\r` */
      ) {
        position--;
      }

      value = value.slice(0, position) + ' ' + value.slice(match.index + 1);
    }
  }

  return sequence + value + sequence
}

/**
 * @returns {string}
 */
function inlineCodePeek() {
  return '`'
}

/**
 * @import {State} from 'mdast-util-to-markdown'
 * @import {Link} from 'mdast'
 */


/**
 * @param {Link} node
 * @param {State} state
 * @returns {boolean}
 */
function formatLinkAsAutolink(node, state) {
  const raw = toString$2(node);

  return Boolean(
    !state.options.resourceLink &&
      // If there’s a url…
      node.url &&
      // And there’s a no title…
      !node.title &&
      // And the content of `node` is a single text node…
      node.children &&
      node.children.length === 1 &&
      node.children[0].type === 'text' &&
      // And if the url is the same as the content…
      (raw === node.url || 'mailto:' + raw === node.url) &&
      // And that starts w/ a protocol…
      /^[a-z][a-z+.-]+:/i.test(node.url) &&
      // And that doesn’t contain ASCII control codes (character escapes and
      // references don’t work), space, or angle brackets…
      !/[\0- <>\u007F]/.test(node.url)
  )
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Link, Parents} from 'mdast'
 * @import {Exit} from '../types.js'
 */


link$1.peek = linkPeek;

/**
 * @param {Link} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function link$1(node, _, state, info) {
  const quote = checkQuote(state);
  const suffix = quote === '"' ? 'Quote' : 'Apostrophe';
  const tracker = state.createTracker(info);
  /** @type {Exit} */
  let exit;
  /** @type {Exit} */
  let subexit;

  if (formatLinkAsAutolink(node, state)) {
    // Hide the fact that we’re in phrasing, because escapes don’t work.
    const stack = state.stack;
    state.stack = [];
    exit = state.enter('autolink');
    let value = tracker.move('<');
    value += tracker.move(
      state.containerPhrasing(node, {
        before: value,
        after: '>',
        ...tracker.current()
      })
    );
    value += tracker.move('>');
    exit();
    state.stack = stack;
    return value
  }

  exit = state.enter('link');
  subexit = state.enter('label');
  let value = tracker.move('[');
  value += tracker.move(
    state.containerPhrasing(node, {
      before: value,
      after: '](',
      ...tracker.current()
    })
  );
  value += tracker.move('](');
  subexit();

  if (
    // If there’s no url but there is a title…
    (!node.url && node.title) ||
    // If there are control characters or whitespace.
    /[\0- \u007F]/.test(node.url)
  ) {
    subexit = state.enter('destinationLiteral');
    value += tracker.move('<');
    value += tracker.move(
      state.safe(node.url, {before: value, after: '>', ...tracker.current()})
    );
    value += tracker.move('>');
  } else {
    // No whitespace, raw is prettier.
    subexit = state.enter('destinationRaw');
    value += tracker.move(
      state.safe(node.url, {
        before: value,
        after: node.title ? ' ' : ')',
        ...tracker.current()
      })
    );
  }

  subexit();

  if (node.title) {
    subexit = state.enter(`title${suffix}`);
    value += tracker.move(' ' + quote);
    value += tracker.move(
      state.safe(node.title, {
        before: value,
        after: quote,
        ...tracker.current()
      })
    );
    value += tracker.move(quote);
    subexit();
  }

  value += tracker.move(')');

  exit();
  return value
}

/**
 * @param {Link} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @returns {string}
 */
function linkPeek(node, _, state) {
  return formatLinkAsAutolink(node, state) ? '<' : '['
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {LinkReference, Parents} from 'mdast'
 */

linkReference$1.peek = linkReferencePeek;

/**
 * @param {LinkReference} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function linkReference$1(node, _, state, info) {
  const type = node.referenceType;
  const exit = state.enter('linkReference');
  let subexit = state.enter('label');
  const tracker = state.createTracker(info);
  let value = tracker.move('[');
  const text = state.containerPhrasing(node, {
    before: value,
    after: ']',
    ...tracker.current()
  });
  value += tracker.move(text + '][');

  subexit();
  // Hide the fact that we’re in phrasing, because escapes don’t work.
  const stack = state.stack;
  state.stack = [];
  subexit = state.enter('reference');
  // Note: for proper tracking, we should reset the output positions when we end
  // up making a `shortcut` reference, because then there is no brace output.
  // Practically, in that case, there is no content, so it doesn’t matter that
  // we’ve tracked one too many characters.
  const reference = state.safe(state.associationId(node), {
    before: value,
    after: ']',
    ...tracker.current()
  });
  subexit();
  state.stack = stack;
  exit();

  if (type === 'full' || !text || text !== reference) {
    value += tracker.move(reference + ']');
  } else if (type === 'shortcut') {
    // Remove the unwanted `[`.
    value = value.slice(0, -1);
  } else {
    value += tracker.move(']');
  }

  return value
}

/**
 * @returns {string}
 */
function linkReferencePeek() {
  return '['
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['bullet'], null | undefined>}
 */
function checkBullet(state) {
  const marker = state.options.bullet || '*';

  if (marker !== '*' && marker !== '+' && marker !== '-') {
    throw new Error(
      'Cannot serialize items with `' +
        marker +
        '` for `options.bullet`, expected `*`, `+`, or `-`'
    )
  }

  return marker
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */


/**
 * @param {State} state
 * @returns {Exclude<Options['bullet'], null | undefined>}
 */
function checkBulletOther(state) {
  const bullet = checkBullet(state);
  const bulletOther = state.options.bulletOther;

  if (!bulletOther) {
    return bullet === '*' ? '-' : '*'
  }

  if (bulletOther !== '*' && bulletOther !== '+' && bulletOther !== '-') {
    throw new Error(
      'Cannot serialize items with `' +
        bulletOther +
        '` for `options.bulletOther`, expected `*`, `+`, or `-`'
    )
  }

  if (bulletOther === bullet) {
    throw new Error(
      'Expected `bullet` (`' +
        bullet +
        '`) and `bulletOther` (`' +
        bulletOther +
        '`) to be different'
    )
  }

  return bulletOther
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['bulletOrdered'], null | undefined>}
 */
function checkBulletOrdered(state) {
  const marker = state.options.bulletOrdered || '.';

  if (marker !== '.' && marker !== ')') {
    throw new Error(
      'Cannot serialize items with `' +
        marker +
        '` for `options.bulletOrdered`, expected `.` or `)`'
    )
  }

  return marker
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['rule'], null | undefined>}
 */
function checkRule(state) {
  const marker = state.options.rule || '*';

  if (marker !== '*' && marker !== '-' && marker !== '_') {
    throw new Error(
      'Cannot serialize rules with `' +
        marker +
        '` for `options.rule`, expected `*`, `-`, or `_`'
    )
  }

  return marker
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {List, Parents} from 'mdast'
 */


/**
 * @param {List} node
 * @param {Parents | undefined} parent
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function list$2(node, parent, state, info) {
  const exit = state.enter('list');
  const bulletCurrent = state.bulletCurrent;
  /** @type {string} */
  let bullet = node.ordered ? checkBulletOrdered(state) : checkBullet(state);
  /** @type {string} */
  const bulletOther = node.ordered
    ? bullet === '.'
      ? ')'
      : '.'
    : checkBulletOther(state);
  let useDifferentMarker =
    parent && state.bulletLastUsed ? bullet === state.bulletLastUsed : false;

  if (!node.ordered) {
    const firstListItem = node.children ? node.children[0] : undefined;

    // If there’s an empty first list item directly in two list items,
    // we have to use a different bullet:
    //
    // ```markdown
    // * - *
    // ```
    //
    // …because otherwise it would become one big thematic break.
    if (
      // Bullet could be used as a thematic break marker:
      (bullet === '*' || bullet === '-') &&
      // Empty first list item:
      firstListItem &&
      (!firstListItem.children || !firstListItem.children[0]) &&
      // Directly in two other list items:
      state.stack[state.stack.length - 1] === 'list' &&
      state.stack[state.stack.length - 2] === 'listItem' &&
      state.stack[state.stack.length - 3] === 'list' &&
      state.stack[state.stack.length - 4] === 'listItem' &&
      // That are each the first child.
      state.indexStack[state.indexStack.length - 1] === 0 &&
      state.indexStack[state.indexStack.length - 2] === 0 &&
      state.indexStack[state.indexStack.length - 3] === 0
    ) {
      useDifferentMarker = true;
    }

    // If there’s a thematic break at the start of the first list item,
    // we have to use a different bullet:
    //
    // ```markdown
    // * ---
    // ```
    //
    // …because otherwise it would become one big thematic break.
    if (checkRule(state) === bullet && firstListItem) {
      let index = -1;

      while (++index < node.children.length) {
        const item = node.children[index];

        if (
          item &&
          item.type === 'listItem' &&
          item.children &&
          item.children[0] &&
          item.children[0].type === 'thematicBreak'
        ) {
          useDifferentMarker = true;
          break
        }
      }
    }
  }

  if (useDifferentMarker) {
    bullet = bulletOther;
  }

  state.bulletCurrent = bullet;
  const value = state.containerFlow(node, info);
  state.bulletLastUsed = bullet;
  state.bulletCurrent = bulletCurrent;
  exit();
  return value
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['listItemIndent'], null | undefined>}
 */
function checkListItemIndent(state) {
  const style = state.options.listItemIndent || 'one';

  if (style !== 'tab' && style !== 'one' && style !== 'mixed') {
    throw new Error(
      'Cannot serialize items with `' +
        style +
        '` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`'
    )
  }

  return style
}

/**
 * @import {Info, Map, State} from 'mdast-util-to-markdown'
 * @import {ListItem, Parents} from 'mdast'
 */


/**
 * @param {ListItem} node
 * @param {Parents | undefined} parent
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function listItem$1(node, parent, state, info) {
  const listItemIndent = checkListItemIndent(state);
  let bullet = state.bulletCurrent || checkBullet(state);

  // Add the marker value for ordered lists.
  if (parent && parent.type === 'list' && parent.ordered) {
    bullet =
      (typeof parent.start === 'number' && parent.start > -1
        ? parent.start
        : 1) +
      (state.options.incrementListMarker === false
        ? 0
        : parent.children.indexOf(node)) +
      bullet;
  }

  let size = bullet.length + 1;

  if (
    listItemIndent === 'tab' ||
    (listItemIndent === 'mixed' &&
      ((parent && parent.type === 'list' && parent.spread) || node.spread))
  ) {
    size = Math.ceil(size / 4) * 4;
  }

  const tracker = state.createTracker(info);
  tracker.move(bullet + ' '.repeat(size - bullet.length));
  tracker.shift(size);
  const exit = state.enter('listItem');
  const value = state.indentLines(
    state.containerFlow(node, tracker.current()),
    map
  );
  exit();

  return value

  /** @type {Map} */
  function map(line, index, blank) {
    if (index) {
      return (blank ? '' : ' '.repeat(size)) + line
    }

    return (blank ? bullet : bullet + ' '.repeat(size - bullet.length)) + line
  }
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Paragraph, Parents} from 'mdast'
 */

/**
 * @param {Paragraph} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function paragraph$1(node, _, state, info) {
  const exit = state.enter('paragraph');
  const subexit = state.enter('phrasing');
  const value = state.containerPhrasing(node, info);
  subexit();
  exit();
  return value
}

/**
 * @typedef {import('mdast').Html} Html
 * @typedef {import('mdast').PhrasingContent} PhrasingContent
 */


/**
 * Check if the given value is *phrasing content*.
 *
 * > 👉 **Note**: Excludes `html`, which can be both phrasing or flow.
 *
 * @param node
 *   Thing to check, typically `Node`.
 * @returns
 *   Whether `value` is phrasing content.
 */

const phrasing =
  /** @type {(node?: unknown) => node is Exclude<PhrasingContent, Html>} */
  (
    convert([
      'break',
      'delete',
      'emphasis',
      // To do: next major: removed since footnotes were added to GFM.
      'footnote',
      'footnoteReference',
      'image',
      'imageReference',
      'inlineCode',
      // Enabled by `mdast-util-math`:
      'inlineMath',
      'link',
      'linkReference',
      // Enabled by `mdast-util-mdx`:
      'mdxJsxTextElement',
      // Enabled by `mdast-util-mdx`:
      'mdxTextExpression',
      'strong',
      'text',
      // Enabled by `mdast-util-directive`:
      'textDirective'
    ])
  );

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Parents, Root} from 'mdast'
 */


/**
 * @param {Root} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function root$2(node, _, state, info) {
  // Note: `html` nodes are ambiguous.
  const hasPhrasing = node.children.some(function (d) {
    return phrasing(d)
  });

  const container = hasPhrasing ? state.containerPhrasing : state.containerFlow;
  return container.call(state, node, info)
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['strong'], null | undefined>}
 */
function checkStrong(state) {
  const marker = state.options.strong || '*';

  if (marker !== '*' && marker !== '_') {
    throw new Error(
      'Cannot serialize strong with `' +
        marker +
        '` for `options.strong`, expected `*`, or `_`'
    )
  }

  return marker
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Parents, Strong} from 'mdast'
 */


strong$1.peek = strongPeek;

/**
 * @param {Strong} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function strong$1(node, _, state, info) {
  const marker = checkStrong(state);
  const exit = state.enter('strong');
  const tracker = state.createTracker(info);
  const before = tracker.move(marker + marker);

  let between = tracker.move(
    state.containerPhrasing(node, {
      after: marker,
      before,
      ...tracker.current()
    })
  );
  const betweenHead = between.charCodeAt(0);
  const open = encodeInfo(
    info.before.charCodeAt(info.before.length - 1),
    betweenHead,
    marker
  );

  if (open.inside) {
    between = encodeCharacterReference(betweenHead) + between.slice(1);
  }

  const betweenTail = between.charCodeAt(between.length - 1);
  const close = encodeInfo(info.after.charCodeAt(0), betweenTail, marker);

  if (close.inside) {
    between = between.slice(0, -1) + encodeCharacterReference(betweenTail);
  }

  const after = tracker.move(marker + marker);

  exit();

  state.attentionEncodeSurroundingInfo = {
    after: close.outside,
    before: open.outside
  };
  return before + between + after
}

/**
 * @param {Strong} _
 * @param {Parents | undefined} _1
 * @param {State} state
 * @returns {string}
 */
function strongPeek(_, _1, state) {
  return state.options.strong || '*'
}

/**
 * @import {Info, State} from 'mdast-util-to-markdown'
 * @import {Parents, Text} from 'mdast'
 */

/**
 * @param {Text} node
 * @param {Parents | undefined} _
 * @param {State} state
 * @param {Info} info
 * @returns {string}
 */
function text$4(node, _, state, info) {
  return state.safe(node.value, info)
}

/**
 * @import {Options, State} from 'mdast-util-to-markdown'
 */

/**
 * @param {State} state
 * @returns {Exclude<Options['ruleRepetition'], null | undefined>}
 */
function checkRuleRepetition(state) {
  const repetition = state.options.ruleRepetition || 3;

  if (repetition < 3) {
    throw new Error(
      'Cannot serialize rules with repetition `' +
        repetition +
        '` for `options.ruleRepetition`, expected `3` or more'
    )
  }

  return repetition
}

/**
 * @import {State} from 'mdast-util-to-markdown'
 * @import {Parents, ThematicBreak} from 'mdast'
 */


/**
 * @param {ThematicBreak} _
 * @param {Parents | undefined} _1
 * @param {State} state
 * @returns {string}
 */
function thematicBreak$2(_, _1, state) {
  const value = (
    checkRule(state) + (state.options.ruleSpaces ? ' ' : '')
  ).repeat(checkRuleRepetition(state));

  return state.options.ruleSpaces ? value.slice(0, -1) : value
}

/**
 * Default (CommonMark) handlers.
 */
const handle = {
  blockquote: blockquote$1,
  break: hardBreak$1,
  code: code$2,
  definition: definition$1,
  emphasis: emphasis$1,
  hardBreak: hardBreak$1,
  heading: heading$1,
  html: html$1,
  image: image$1,
  imageReference: imageReference$1,
  inlineCode: inlineCode$1,
  link: link$1,
  linkReference: linkReference$1,
  list: list$2,
  listItem: listItem$1,
  paragraph: paragraph$1,
  root: root$2,
  strong: strong$1,
  text: text$4,
  thematicBreak: thematicBreak$2
};

/**
 * Map of named character references.
 *
 * @type {Record<string, string>}
 */
const characterEntities = {
  AElig: 'Æ',
  AMP: '&',
  Aacute: 'Á',
  Abreve: 'Ă',
  Acirc: 'Â',
  Acy: 'А',
  Afr: '𝔄',
  Agrave: 'À',
  Alpha: 'Α',
  Amacr: 'Ā',
  And: '⩓',
  Aogon: 'Ą',
  Aopf: '𝔸',
  ApplyFunction: '⁡',
  Aring: 'Å',
  Ascr: '𝒜',
  Assign: '≔',
  Atilde: 'Ã',
  Auml: 'Ä',
  Backslash: '∖',
  Barv: '⫧',
  Barwed: '⌆',
  Bcy: 'Б',
  Because: '∵',
  Bernoullis: 'ℬ',
  Beta: 'Β',
  Bfr: '𝔅',
  Bopf: '𝔹',
  Breve: '˘',
  Bscr: 'ℬ',
  Bumpeq: '≎',
  CHcy: 'Ч',
  COPY: '©',
  Cacute: 'Ć',
  Cap: '⋒',
  CapitalDifferentialD: 'ⅅ',
  Cayleys: 'ℭ',
  Ccaron: 'Č',
  Ccedil: 'Ç',
  Ccirc: 'Ĉ',
  Cconint: '∰',
  Cdot: 'Ċ',
  Cedilla: '¸',
  CenterDot: '·',
  Cfr: 'ℭ',
  Chi: 'Χ',
  CircleDot: '⊙',
  CircleMinus: '⊖',
  CirclePlus: '⊕',
  CircleTimes: '⊗',
  ClockwiseContourIntegral: '∲',
  CloseCurlyDoubleQuote: '”',
  CloseCurlyQuote: '’',
  Colon: '∷',
  Colone: '⩴',
  Congruent: '≡',
  Conint: '∯',
  ContourIntegral: '∮',
  Copf: 'ℂ',
  Coproduct: '∐',
  CounterClockwiseContourIntegral: '∳',
  Cross: '⨯',
  Cscr: '𝒞',
  Cup: '⋓',
  CupCap: '≍',
  DD: 'ⅅ',
  DDotrahd: '⤑',
  DJcy: 'Ђ',
  DScy: 'Ѕ',
  DZcy: 'Џ',
  Dagger: '‡',
  Darr: '↡',
  Dashv: '⫤',
  Dcaron: 'Ď',
  Dcy: 'Д',
  Del: '∇',
  Delta: 'Δ',
  Dfr: '𝔇',
  DiacriticalAcute: '´',
  DiacriticalDot: '˙',
  DiacriticalDoubleAcute: '˝',
  DiacriticalGrave: '`',
  DiacriticalTilde: '˜',
  Diamond: '⋄',
  DifferentialD: 'ⅆ',
  Dopf: '𝔻',
  Dot: '¨',
  DotDot: '⃜',
  DotEqual: '≐',
  DoubleContourIntegral: '∯',
  DoubleDot: '¨',
  DoubleDownArrow: '⇓',
  DoubleLeftArrow: '⇐',
  DoubleLeftRightArrow: '⇔',
  DoubleLeftTee: '⫤',
  DoubleLongLeftArrow: '⟸',
  DoubleLongLeftRightArrow: '⟺',
  DoubleLongRightArrow: '⟹',
  DoubleRightArrow: '⇒',
  DoubleRightTee: '⊨',
  DoubleUpArrow: '⇑',
  DoubleUpDownArrow: '⇕',
  DoubleVerticalBar: '∥',
  DownArrow: '↓',
  DownArrowBar: '⤓',
  DownArrowUpArrow: '⇵',
  DownBreve: '̑',
  DownLeftRightVector: '⥐',
  DownLeftTeeVector: '⥞',
  DownLeftVector: '↽',
  DownLeftVectorBar: '⥖',
  DownRightTeeVector: '⥟',
  DownRightVector: '⇁',
  DownRightVectorBar: '⥗',
  DownTee: '⊤',
  DownTeeArrow: '↧',
  Downarrow: '⇓',
  Dscr: '𝒟',
  Dstrok: 'Đ',
  ENG: 'Ŋ',
  ETH: 'Ð',
  Eacute: 'É',
  Ecaron: 'Ě',
  Ecirc: 'Ê',
  Ecy: 'Э',
  Edot: 'Ė',
  Efr: '𝔈',
  Egrave: 'È',
  Element: '∈',
  Emacr: 'Ē',
  EmptySmallSquare: '◻',
  EmptyVerySmallSquare: '▫',
  Eogon: 'Ę',
  Eopf: '𝔼',
  Epsilon: 'Ε',
  Equal: '⩵',
  EqualTilde: '≂',
  Equilibrium: '⇌',
  Escr: 'ℰ',
  Esim: '⩳',
  Eta: 'Η',
  Euml: 'Ë',
  Exists: '∃',
  ExponentialE: 'ⅇ',
  Fcy: 'Ф',
  Ffr: '𝔉',
  FilledSmallSquare: '◼',
  FilledVerySmallSquare: '▪',
  Fopf: '𝔽',
  ForAll: '∀',
  Fouriertrf: 'ℱ',
  Fscr: 'ℱ',
  GJcy: 'Ѓ',
  GT: '>',
  Gamma: 'Γ',
  Gammad: 'Ϝ',
  Gbreve: 'Ğ',
  Gcedil: 'Ģ',
  Gcirc: 'Ĝ',
  Gcy: 'Г',
  Gdot: 'Ġ',
  Gfr: '𝔊',
  Gg: '⋙',
  Gopf: '𝔾',
  GreaterEqual: '≥',
  GreaterEqualLess: '⋛',
  GreaterFullEqual: '≧',
  GreaterGreater: '⪢',
  GreaterLess: '≷',
  GreaterSlantEqual: '⩾',
  GreaterTilde: '≳',
  Gscr: '𝒢',
  Gt: '≫',
  HARDcy: 'Ъ',
  Hacek: 'ˇ',
  Hat: '^',
  Hcirc: 'Ĥ',
  Hfr: 'ℌ',
  HilbertSpace: 'ℋ',
  Hopf: 'ℍ',
  HorizontalLine: '─',
  Hscr: 'ℋ',
  Hstrok: 'Ħ',
  HumpDownHump: '≎',
  HumpEqual: '≏',
  IEcy: 'Е',
  IJlig: 'Ĳ',
  IOcy: 'Ё',
  Iacute: 'Í',
  Icirc: 'Î',
  Icy: 'И',
  Idot: 'İ',
  Ifr: 'ℑ',
  Igrave: 'Ì',
  Im: 'ℑ',
  Imacr: 'Ī',
  ImaginaryI: 'ⅈ',
  Implies: '⇒',
  Int: '∬',
  Integral: '∫',
  Intersection: '⋂',
  InvisibleComma: '⁣',
  InvisibleTimes: '⁢',
  Iogon: 'Į',
  Iopf: '𝕀',
  Iota: 'Ι',
  Iscr: 'ℐ',
  Itilde: 'Ĩ',
  Iukcy: 'І',
  Iuml: 'Ï',
  Jcirc: 'Ĵ',
  Jcy: 'Й',
  Jfr: '𝔍',
  Jopf: '𝕁',
  Jscr: '𝒥',
  Jsercy: 'Ј',
  Jukcy: 'Є',
  KHcy: 'Х',
  KJcy: 'Ќ',
  Kappa: 'Κ',
  Kcedil: 'Ķ',
  Kcy: 'К',
  Kfr: '𝔎',
  Kopf: '𝕂',
  Kscr: '𝒦',
  LJcy: 'Љ',
  LT: '<',
  Lacute: 'Ĺ',
  Lambda: 'Λ',
  Lang: '⟪',
  Laplacetrf: 'ℒ',
  Larr: '↞',
  Lcaron: 'Ľ',
  Lcedil: 'Ļ',
  Lcy: 'Л',
  LeftAngleBracket: '⟨',
  LeftArrow: '←',
  LeftArrowBar: '⇤',
  LeftArrowRightArrow: '⇆',
  LeftCeiling: '⌈',
  LeftDoubleBracket: '⟦',
  LeftDownTeeVector: '⥡',
  LeftDownVector: '⇃',
  LeftDownVectorBar: '⥙',
  LeftFloor: '⌊',
  LeftRightArrow: '↔',
  LeftRightVector: '⥎',
  LeftTee: '⊣',
  LeftTeeArrow: '↤',
  LeftTeeVector: '⥚',
  LeftTriangle: '⊲',
  LeftTriangleBar: '⧏',
  LeftTriangleEqual: '⊴',
  LeftUpDownVector: '⥑',
  LeftUpTeeVector: '⥠',
  LeftUpVector: '↿',
  LeftUpVectorBar: '⥘',
  LeftVector: '↼',
  LeftVectorBar: '⥒',
  Leftarrow: '⇐',
  Leftrightarrow: '⇔',
  LessEqualGreater: '⋚',
  LessFullEqual: '≦',
  LessGreater: '≶',
  LessLess: '⪡',
  LessSlantEqual: '⩽',
  LessTilde: '≲',
  Lfr: '𝔏',
  Ll: '⋘',
  Lleftarrow: '⇚',
  Lmidot: 'Ŀ',
  LongLeftArrow: '⟵',
  LongLeftRightArrow: '⟷',
  LongRightArrow: '⟶',
  Longleftarrow: '⟸',
  Longleftrightarrow: '⟺',
  Longrightarrow: '⟹',
  Lopf: '𝕃',
  LowerLeftArrow: '↙',
  LowerRightArrow: '↘',
  Lscr: 'ℒ',
  Lsh: '↰',
  Lstrok: 'Ł',
  Lt: '≪',
  Map: '⤅',
  Mcy: 'М',
  MediumSpace: ' ',
  Mellintrf: 'ℳ',
  Mfr: '𝔐',
  MinusPlus: '∓',
  Mopf: '𝕄',
  Mscr: 'ℳ',
  Mu: 'Μ',
  NJcy: 'Њ',
  Nacute: 'Ń',
  Ncaron: 'Ň',
  Ncedil: 'Ņ',
  Ncy: 'Н',
  NegativeMediumSpace: '​',
  NegativeThickSpace: '​',
  NegativeThinSpace: '​',
  NegativeVeryThinSpace: '​',
  NestedGreaterGreater: '≫',
  NestedLessLess: '≪',
  NewLine: '\n',
  Nfr: '𝔑',
  NoBreak: '⁠',
  NonBreakingSpace: ' ',
  Nopf: 'ℕ',
  Not: '⫬',
  NotCongruent: '≢',
  NotCupCap: '≭',
  NotDoubleVerticalBar: '∦',
  NotElement: '∉',
  NotEqual: '≠',
  NotEqualTilde: '≂̸',
  NotExists: '∄',
  NotGreater: '≯',
  NotGreaterEqual: '≱',
  NotGreaterFullEqual: '≧̸',
  NotGreaterGreater: '≫̸',
  NotGreaterLess: '≹',
  NotGreaterSlantEqual: '⩾̸',
  NotGreaterTilde: '≵',
  NotHumpDownHump: '≎̸',
  NotHumpEqual: '≏̸',
  NotLeftTriangle: '⋪',
  NotLeftTriangleBar: '⧏̸',
  NotLeftTriangleEqual: '⋬',
  NotLess: '≮',
  NotLessEqual: '≰',
  NotLessGreater: '≸',
  NotLessLess: '≪̸',
  NotLessSlantEqual: '⩽̸',
  NotLessTilde: '≴',
  NotNestedGreaterGreater: '⪢̸',
  NotNestedLessLess: '⪡̸',
  NotPrecedes: '⊀',
  NotPrecedesEqual: '⪯̸',
  NotPrecedesSlantEqual: '⋠',
  NotReverseElement: '∌',
  NotRightTriangle: '⋫',
  NotRightTriangleBar: '⧐̸',
  NotRightTriangleEqual: '⋭',
  NotSquareSubset: '⊏̸',
  NotSquareSubsetEqual: '⋢',
  NotSquareSuperset: '⊐̸',
  NotSquareSupersetEqual: '⋣',
  NotSubset: '⊂⃒',
  NotSubsetEqual: '⊈',
  NotSucceeds: '⊁',
  NotSucceedsEqual: '⪰̸',
  NotSucceedsSlantEqual: '⋡',
  NotSucceedsTilde: '≿̸',
  NotSuperset: '⊃⃒',
  NotSupersetEqual: '⊉',
  NotTilde: '≁',
  NotTildeEqual: '≄',
  NotTildeFullEqual: '≇',
  NotTildeTilde: '≉',
  NotVerticalBar: '∤',
  Nscr: '𝒩',
  Ntilde: 'Ñ',
  Nu: 'Ν',
  OElig: 'Œ',
  Oacute: 'Ó',
  Ocirc: 'Ô',
  Ocy: 'О',
  Odblac: 'Ő',
  Ofr: '𝔒',
  Ograve: 'Ò',
  Omacr: 'Ō',
  Omega: 'Ω',
  Omicron: 'Ο',
  Oopf: '𝕆',
  OpenCurlyDoubleQuote: '“',
  OpenCurlyQuote: '‘',
  Or: '⩔',
  Oscr: '𝒪',
  Oslash: 'Ø',
  Otilde: 'Õ',
  Otimes: '⨷',
  Ouml: 'Ö',
  OverBar: '‾',
  OverBrace: '⏞',
  OverBracket: '⎴',
  OverParenthesis: '⏜',
  PartialD: '∂',
  Pcy: 'П',
  Pfr: '𝔓',
  Phi: 'Φ',
  Pi: 'Π',
  PlusMinus: '±',
  Poincareplane: 'ℌ',
  Popf: 'ℙ',
  Pr: '⪻',
  Precedes: '≺',
  PrecedesEqual: '⪯',
  PrecedesSlantEqual: '≼',
  PrecedesTilde: '≾',
  Prime: '″',
  Product: '∏',
  Proportion: '∷',
  Proportional: '∝',
  Pscr: '𝒫',
  Psi: 'Ψ',
  QUOT: '"',
  Qfr: '𝔔',
  Qopf: 'ℚ',
  Qscr: '𝒬',
  RBarr: '⤐',
  REG: '®',
  Racute: 'Ŕ',
  Rang: '⟫',
  Rarr: '↠',
  Rarrtl: '⤖',
  Rcaron: 'Ř',
  Rcedil: 'Ŗ',
  Rcy: 'Р',
  Re: 'ℜ',
  ReverseElement: '∋',
  ReverseEquilibrium: '⇋',
  ReverseUpEquilibrium: '⥯',
  Rfr: 'ℜ',
  Rho: 'Ρ',
  RightAngleBracket: '⟩',
  RightArrow: '→',
  RightArrowBar: '⇥',
  RightArrowLeftArrow: '⇄',
  RightCeiling: '⌉',
  RightDoubleBracket: '⟧',
  RightDownTeeVector: '⥝',
  RightDownVector: '⇂',
  RightDownVectorBar: '⥕',
  RightFloor: '⌋',
  RightTee: '⊢',
  RightTeeArrow: '↦',
  RightTeeVector: '⥛',
  RightTriangle: '⊳',
  RightTriangleBar: '⧐',
  RightTriangleEqual: '⊵',
  RightUpDownVector: '⥏',
  RightUpTeeVector: '⥜',
  RightUpVector: '↾',
  RightUpVectorBar: '⥔',
  RightVector: '⇀',
  RightVectorBar: '⥓',
  Rightarrow: '⇒',
  Ropf: 'ℝ',
  RoundImplies: '⥰',
  Rrightarrow: '⇛',
  Rscr: 'ℛ',
  Rsh: '↱',
  RuleDelayed: '⧴',
  SHCHcy: 'Щ',
  SHcy: 'Ш',
  SOFTcy: 'Ь',
  Sacute: 'Ś',
  Sc: '⪼',
  Scaron: 'Š',
  Scedil: 'Ş',
  Scirc: 'Ŝ',
  Scy: 'С',
  Sfr: '𝔖',
  ShortDownArrow: '↓',
  ShortLeftArrow: '←',
  ShortRightArrow: '→',
  ShortUpArrow: '↑',
  Sigma: 'Σ',
  SmallCircle: '∘',
  Sopf: '𝕊',
  Sqrt: '√',
  Square: '□',
  SquareIntersection: '⊓',
  SquareSubset: '⊏',
  SquareSubsetEqual: '⊑',
  SquareSuperset: '⊐',
  SquareSupersetEqual: '⊒',
  SquareUnion: '⊔',
  Sscr: '𝒮',
  Star: '⋆',
  Sub: '⋐',
  Subset: '⋐',
  SubsetEqual: '⊆',
  Succeeds: '≻',
  SucceedsEqual: '⪰',
  SucceedsSlantEqual: '≽',
  SucceedsTilde: '≿',
  SuchThat: '∋',
  Sum: '∑',
  Sup: '⋑',
  Superset: '⊃',
  SupersetEqual: '⊇',
  Supset: '⋑',
  THORN: 'Þ',
  TRADE: '™',
  TSHcy: 'Ћ',
  TScy: 'Ц',
  Tab: '\t',
  Tau: 'Τ',
  Tcaron: 'Ť',
  Tcedil: 'Ţ',
  Tcy: 'Т',
  Tfr: '𝔗',
  Therefore: '∴',
  Theta: 'Θ',
  ThickSpace: '  ',
  ThinSpace: ' ',
  Tilde: '∼',
  TildeEqual: '≃',
  TildeFullEqual: '≅',
  TildeTilde: '≈',
  Topf: '𝕋',
  TripleDot: '⃛',
  Tscr: '𝒯',
  Tstrok: 'Ŧ',
  Uacute: 'Ú',
  Uarr: '↟',
  Uarrocir: '⥉',
  Ubrcy: 'Ў',
  Ubreve: 'Ŭ',
  Ucirc: 'Û',
  Ucy: 'У',
  Udblac: 'Ű',
  Ufr: '𝔘',
  Ugrave: 'Ù',
  Umacr: 'Ū',
  UnderBar: '_',
  UnderBrace: '⏟',
  UnderBracket: '⎵',
  UnderParenthesis: '⏝',
  Union: '⋃',
  UnionPlus: '⊎',
  Uogon: 'Ų',
  Uopf: '𝕌',
  UpArrow: '↑',
  UpArrowBar: '⤒',
  UpArrowDownArrow: '⇅',
  UpDownArrow: '↕',
  UpEquilibrium: '⥮',
  UpTee: '⊥',
  UpTeeArrow: '↥',
  Uparrow: '⇑',
  Updownarrow: '⇕',
  UpperLeftArrow: '↖',
  UpperRightArrow: '↗',
  Upsi: 'ϒ',
  Upsilon: 'Υ',
  Uring: 'Ů',
  Uscr: '𝒰',
  Utilde: 'Ũ',
  Uuml: 'Ü',
  VDash: '⊫',
  Vbar: '⫫',
  Vcy: 'В',
  Vdash: '⊩',
  Vdashl: '⫦',
  Vee: '⋁',
  Verbar: '‖',
  Vert: '‖',
  VerticalBar: '∣',
  VerticalLine: '|',
  VerticalSeparator: '❘',
  VerticalTilde: '≀',
  VeryThinSpace: ' ',
  Vfr: '𝔙',
  Vopf: '𝕍',
  Vscr: '𝒱',
  Vvdash: '⊪',
  Wcirc: 'Ŵ',
  Wedge: '⋀',
  Wfr: '𝔚',
  Wopf: '𝕎',
  Wscr: '𝒲',
  Xfr: '𝔛',
  Xi: 'Ξ',
  Xopf: '𝕏',
  Xscr: '𝒳',
  YAcy: 'Я',
  YIcy: 'Ї',
  YUcy: 'Ю',
  Yacute: 'Ý',
  Ycirc: 'Ŷ',
  Ycy: 'Ы',
  Yfr: '𝔜',
  Yopf: '𝕐',
  Yscr: '𝒴',
  Yuml: 'Ÿ',
  ZHcy: 'Ж',
  Zacute: 'Ź',
  Zcaron: 'Ž',
  Zcy: 'З',
  Zdot: 'Ż',
  ZeroWidthSpace: '​',
  Zeta: 'Ζ',
  Zfr: 'ℨ',
  Zopf: 'ℤ',
  Zscr: '𝒵',
  aacute: 'á',
  abreve: 'ă',
  ac: '∾',
  acE: '∾̳',
  acd: '∿',
  acirc: 'â',
  acute: '´',
  acy: 'а',
  aelig: 'æ',
  af: '⁡',
  afr: '𝔞',
  agrave: 'à',
  alefsym: 'ℵ',
  aleph: 'ℵ',
  alpha: 'α',
  amacr: 'ā',
  amalg: '⨿',
  amp: '&',
  and: '∧',
  andand: '⩕',
  andd: '⩜',
  andslope: '⩘',
  andv: '⩚',
  ang: '∠',
  ange: '⦤',
  angle: '∠',
  angmsd: '∡',
  angmsdaa: '⦨',
  angmsdab: '⦩',
  angmsdac: '⦪',
  angmsdad: '⦫',
  angmsdae: '⦬',
  angmsdaf: '⦭',
  angmsdag: '⦮',
  angmsdah: '⦯',
  angrt: '∟',
  angrtvb: '⊾',
  angrtvbd: '⦝',
  angsph: '∢',
  angst: 'Å',
  angzarr: '⍼',
  aogon: 'ą',
  aopf: '𝕒',
  ap: '≈',
  apE: '⩰',
  apacir: '⩯',
  ape: '≊',
  apid: '≋',
  apos: "'",
  approx: '≈',
  approxeq: '≊',
  aring: 'å',
  ascr: '𝒶',
  ast: '*',
  asymp: '≈',
  asympeq: '≍',
  atilde: 'ã',
  auml: 'ä',
  awconint: '∳',
  awint: '⨑',
  bNot: '⫭',
  backcong: '≌',
  backepsilon: '϶',
  backprime: '‵',
  backsim: '∽',
  backsimeq: '⋍',
  barvee: '⊽',
  barwed: '⌅',
  barwedge: '⌅',
  bbrk: '⎵',
  bbrktbrk: '⎶',
  bcong: '≌',
  bcy: 'б',
  bdquo: '„',
  becaus: '∵',
  because: '∵',
  bemptyv: '⦰',
  bepsi: '϶',
  bernou: 'ℬ',
  beta: 'β',
  beth: 'ℶ',
  between: '≬',
  bfr: '𝔟',
  bigcap: '⋂',
  bigcirc: '◯',
  bigcup: '⋃',
  bigodot: '⨀',
  bigoplus: '⨁',
  bigotimes: '⨂',
  bigsqcup: '⨆',
  bigstar: '★',
  bigtriangledown: '▽',
  bigtriangleup: '△',
  biguplus: '⨄',
  bigvee: '⋁',
  bigwedge: '⋀',
  bkarow: '⤍',
  blacklozenge: '⧫',
  blacksquare: '▪',
  blacktriangle: '▴',
  blacktriangledown: '▾',
  blacktriangleleft: '◂',
  blacktriangleright: '▸',
  blank: '␣',
  blk12: '▒',
  blk14: '░',
  blk34: '▓',
  block: '█',
  bne: '=⃥',
  bnequiv: '≡⃥',
  bnot: '⌐',
  bopf: '𝕓',
  bot: '⊥',
  bottom: '⊥',
  bowtie: '⋈',
  boxDL: '╗',
  boxDR: '╔',
  boxDl: '╖',
  boxDr: '╓',
  boxH: '═',
  boxHD: '╦',
  boxHU: '╩',
  boxHd: '╤',
  boxHu: '╧',
  boxUL: '╝',
  boxUR: '╚',
  boxUl: '╜',
  boxUr: '╙',
  boxV: '║',
  boxVH: '╬',
  boxVL: '╣',
  boxVR: '╠',
  boxVh: '╫',
  boxVl: '╢',
  boxVr: '╟',
  boxbox: '⧉',
  boxdL: '╕',
  boxdR: '╒',
  boxdl: '┐',
  boxdr: '┌',
  boxh: '─',
  boxhD: '╥',
  boxhU: '╨',
  boxhd: '┬',
  boxhu: '┴',
  boxminus: '⊟',
  boxplus: '⊞',
  boxtimes: '⊠',
  boxuL: '╛',
  boxuR: '╘',
  boxul: '┘',
  boxur: '└',
  boxv: '│',
  boxvH: '╪',
  boxvL: '╡',
  boxvR: '╞',
  boxvh: '┼',
  boxvl: '┤',
  boxvr: '├',
  bprime: '‵',
  breve: '˘',
  brvbar: '¦',
  bscr: '𝒷',
  bsemi: '⁏',
  bsim: '∽',
  bsime: '⋍',
  bsol: '\\',
  bsolb: '⧅',
  bsolhsub: '⟈',
  bull: '•',
  bullet: '•',
  bump: '≎',
  bumpE: '⪮',
  bumpe: '≏',
  bumpeq: '≏',
  cacute: 'ć',
  cap: '∩',
  capand: '⩄',
  capbrcup: '⩉',
  capcap: '⩋',
  capcup: '⩇',
  capdot: '⩀',
  caps: '∩︀',
  caret: '⁁',
  caron: 'ˇ',
  ccaps: '⩍',
  ccaron: 'č',
  ccedil: 'ç',
  ccirc: 'ĉ',
  ccups: '⩌',
  ccupssm: '⩐',
  cdot: 'ċ',
  cedil: '¸',
  cemptyv: '⦲',
  cent: '¢',
  centerdot: '·',
  cfr: '𝔠',
  chcy: 'ч',
  check: '✓',
  checkmark: '✓',
  chi: 'χ',
  cir: '○',
  cirE: '⧃',
  circ: 'ˆ',
  circeq: '≗',
  circlearrowleft: '↺',
  circlearrowright: '↻',
  circledR: '®',
  circledS: 'Ⓢ',
  circledast: '⊛',
  circledcirc: '⊚',
  circleddash: '⊝',
  cire: '≗',
  cirfnint: '⨐',
  cirmid: '⫯',
  cirscir: '⧂',
  clubs: '♣',
  clubsuit: '♣',
  colon: ':',
  colone: '≔',
  coloneq: '≔',
  comma: ',',
  commat: '@',
  comp: '∁',
  compfn: '∘',
  complement: '∁',
  complexes: 'ℂ',
  cong: '≅',
  congdot: '⩭',
  conint: '∮',
  copf: '𝕔',
  coprod: '∐',
  copy: '©',
  copysr: '℗',
  crarr: '↵',
  cross: '✗',
  cscr: '𝒸',
  csub: '⫏',
  csube: '⫑',
  csup: '⫐',
  csupe: '⫒',
  ctdot: '⋯',
  cudarrl: '⤸',
  cudarrr: '⤵',
  cuepr: '⋞',
  cuesc: '⋟',
  cularr: '↶',
  cularrp: '⤽',
  cup: '∪',
  cupbrcap: '⩈',
  cupcap: '⩆',
  cupcup: '⩊',
  cupdot: '⊍',
  cupor: '⩅',
  cups: '∪︀',
  curarr: '↷',
  curarrm: '⤼',
  curlyeqprec: '⋞',
  curlyeqsucc: '⋟',
  curlyvee: '⋎',
  curlywedge: '⋏',
  curren: '¤',
  curvearrowleft: '↶',
  curvearrowright: '↷',
  cuvee: '⋎',
  cuwed: '⋏',
  cwconint: '∲',
  cwint: '∱',
  cylcty: '⌭',
  dArr: '⇓',
  dHar: '⥥',
  dagger: '†',
  daleth: 'ℸ',
  darr: '↓',
  dash: '‐',
  dashv: '⊣',
  dbkarow: '⤏',
  dblac: '˝',
  dcaron: 'ď',
  dcy: 'д',
  dd: 'ⅆ',
  ddagger: '‡',
  ddarr: '⇊',
  ddotseq: '⩷',
  deg: '°',
  delta: 'δ',
  demptyv: '⦱',
  dfisht: '⥿',
  dfr: '𝔡',
  dharl: '⇃',
  dharr: '⇂',
  diam: '⋄',
  diamond: '⋄',
  diamondsuit: '♦',
  diams: '♦',
  die: '¨',
  digamma: 'ϝ',
  disin: '⋲',
  div: '÷',
  divide: '÷',
  divideontimes: '⋇',
  divonx: '⋇',
  djcy: 'ђ',
  dlcorn: '⌞',
  dlcrop: '⌍',
  dollar: '$',
  dopf: '𝕕',
  dot: '˙',
  doteq: '≐',
  doteqdot: '≑',
  dotminus: '∸',
  dotplus: '∔',
  dotsquare: '⊡',
  doublebarwedge: '⌆',
  downarrow: '↓',
  downdownarrows: '⇊',
  downharpoonleft: '⇃',
  downharpoonright: '⇂',
  drbkarow: '⤐',
  drcorn: '⌟',
  drcrop: '⌌',
  dscr: '𝒹',
  dscy: 'ѕ',
  dsol: '⧶',
  dstrok: 'đ',
  dtdot: '⋱',
  dtri: '▿',
  dtrif: '▾',
  duarr: '⇵',
  duhar: '⥯',
  dwangle: '⦦',
  dzcy: 'џ',
  dzigrarr: '⟿',
  eDDot: '⩷',
  eDot: '≑',
  eacute: 'é',
  easter: '⩮',
  ecaron: 'ě',
  ecir: '≖',
  ecirc: 'ê',
  ecolon: '≕',
  ecy: 'э',
  edot: 'ė',
  ee: 'ⅇ',
  efDot: '≒',
  efr: '𝔢',
  eg: '⪚',
  egrave: 'è',
  egs: '⪖',
  egsdot: '⪘',
  el: '⪙',
  elinters: '⏧',
  ell: 'ℓ',
  els: '⪕',
  elsdot: '⪗',
  emacr: 'ē',
  empty: '∅',
  emptyset: '∅',
  emptyv: '∅',
  emsp13: ' ',
  emsp14: ' ',
  emsp: ' ',
  eng: 'ŋ',
  ensp: ' ',
  eogon: 'ę',
  eopf: '𝕖',
  epar: '⋕',
  eparsl: '⧣',
  eplus: '⩱',
  epsi: 'ε',
  epsilon: 'ε',
  epsiv: 'ϵ',
  eqcirc: '≖',
  eqcolon: '≕',
  eqsim: '≂',
  eqslantgtr: '⪖',
  eqslantless: '⪕',
  equals: '=',
  equest: '≟',
  equiv: '≡',
  equivDD: '⩸',
  eqvparsl: '⧥',
  erDot: '≓',
  erarr: '⥱',
  escr: 'ℯ',
  esdot: '≐',
  esim: '≂',
  eta: 'η',
  eth: 'ð',
  euml: 'ë',
  euro: '€',
  excl: '!',
  exist: '∃',
  expectation: 'ℰ',
  exponentiale: 'ⅇ',
  fallingdotseq: '≒',
  fcy: 'ф',
  female: '♀',
  ffilig: 'ﬃ',
  fflig: 'ﬀ',
  ffllig: 'ﬄ',
  ffr: '𝔣',
  filig: 'ﬁ',
  fjlig: 'fj',
  flat: '♭',
  fllig: 'ﬂ',
  fltns: '▱',
  fnof: 'ƒ',
  fopf: '𝕗',
  forall: '∀',
  fork: '⋔',
  forkv: '⫙',
  fpartint: '⨍',
  frac12: '½',
  frac13: '⅓',
  frac14: '¼',
  frac15: '⅕',
  frac16: '⅙',
  frac18: '⅛',
  frac23: '⅔',
  frac25: '⅖',
  frac34: '¾',
  frac35: '⅗',
  frac38: '⅜',
  frac45: '⅘',
  frac56: '⅚',
  frac58: '⅝',
  frac78: '⅞',
  frasl: '⁄',
  frown: '⌢',
  fscr: '𝒻',
  gE: '≧',
  gEl: '⪌',
  gacute: 'ǵ',
  gamma: 'γ',
  gammad: 'ϝ',
  gap: '⪆',
  gbreve: 'ğ',
  gcirc: 'ĝ',
  gcy: 'г',
  gdot: 'ġ',
  ge: '≥',
  gel: '⋛',
  geq: '≥',
  geqq: '≧',
  geqslant: '⩾',
  ges: '⩾',
  gescc: '⪩',
  gesdot: '⪀',
  gesdoto: '⪂',
  gesdotol: '⪄',
  gesl: '⋛︀',
  gesles: '⪔',
  gfr: '𝔤',
  gg: '≫',
  ggg: '⋙',
  gimel: 'ℷ',
  gjcy: 'ѓ',
  gl: '≷',
  glE: '⪒',
  gla: '⪥',
  glj: '⪤',
  gnE: '≩',
  gnap: '⪊',
  gnapprox: '⪊',
  gne: '⪈',
  gneq: '⪈',
  gneqq: '≩',
  gnsim: '⋧',
  gopf: '𝕘',
  grave: '`',
  gscr: 'ℊ',
  gsim: '≳',
  gsime: '⪎',
  gsiml: '⪐',
  gt: '>',
  gtcc: '⪧',
  gtcir: '⩺',
  gtdot: '⋗',
  gtlPar: '⦕',
  gtquest: '⩼',
  gtrapprox: '⪆',
  gtrarr: '⥸',
  gtrdot: '⋗',
  gtreqless: '⋛',
  gtreqqless: '⪌',
  gtrless: '≷',
  gtrsim: '≳',
  gvertneqq: '≩︀',
  gvnE: '≩︀',
  hArr: '⇔',
  hairsp: ' ',
  half: '½',
  hamilt: 'ℋ',
  hardcy: 'ъ',
  harr: '↔',
  harrcir: '⥈',
  harrw: '↭',
  hbar: 'ℏ',
  hcirc: 'ĥ',
  hearts: '♥',
  heartsuit: '♥',
  hellip: '…',
  hercon: '⊹',
  hfr: '𝔥',
  hksearow: '⤥',
  hkswarow: '⤦',
  hoarr: '⇿',
  homtht: '∻',
  hookleftarrow: '↩',
  hookrightarrow: '↪',
  hopf: '𝕙',
  horbar: '―',
  hscr: '𝒽',
  hslash: 'ℏ',
  hstrok: 'ħ',
  hybull: '⁃',
  hyphen: '‐',
  iacute: 'í',
  ic: '⁣',
  icirc: 'î',
  icy: 'и',
  iecy: 'е',
  iexcl: '¡',
  iff: '⇔',
  ifr: '𝔦',
  igrave: 'ì',
  ii: 'ⅈ',
  iiiint: '⨌',
  iiint: '∭',
  iinfin: '⧜',
  iiota: '℩',
  ijlig: 'ĳ',
  imacr: 'ī',
  image: 'ℑ',
  imagline: 'ℐ',
  imagpart: 'ℑ',
  imath: 'ı',
  imof: '⊷',
  imped: 'Ƶ',
  in: '∈',
  incare: '℅',
  infin: '∞',
  infintie: '⧝',
  inodot: 'ı',
  int: '∫',
  intcal: '⊺',
  integers: 'ℤ',
  intercal: '⊺',
  intlarhk: '⨗',
  intprod: '⨼',
  iocy: 'ё',
  iogon: 'į',
  iopf: '𝕚',
  iota: 'ι',
  iprod: '⨼',
  iquest: '¿',
  iscr: '𝒾',
  isin: '∈',
  isinE: '⋹',
  isindot: '⋵',
  isins: '⋴',
  isinsv: '⋳',
  isinv: '∈',
  it: '⁢',
  itilde: 'ĩ',
  iukcy: 'і',
  iuml: 'ï',
  jcirc: 'ĵ',
  jcy: 'й',
  jfr: '𝔧',
  jmath: 'ȷ',
  jopf: '𝕛',
  jscr: '𝒿',
  jsercy: 'ј',
  jukcy: 'є',
  kappa: 'κ',
  kappav: 'ϰ',
  kcedil: 'ķ',
  kcy: 'к',
  kfr: '𝔨',
  kgreen: 'ĸ',
  khcy: 'х',
  kjcy: 'ќ',
  kopf: '𝕜',
  kscr: '𝓀',
  lAarr: '⇚',
  lArr: '⇐',
  lAtail: '⤛',
  lBarr: '⤎',
  lE: '≦',
  lEg: '⪋',
  lHar: '⥢',
  lacute: 'ĺ',
  laemptyv: '⦴',
  lagran: 'ℒ',
  lambda: 'λ',
  lang: '⟨',
  langd: '⦑',
  langle: '⟨',
  lap: '⪅',
  laquo: '«',
  larr: '←',
  larrb: '⇤',
  larrbfs: '⤟',
  larrfs: '⤝',
  larrhk: '↩',
  larrlp: '↫',
  larrpl: '⤹',
  larrsim: '⥳',
  larrtl: '↢',
  lat: '⪫',
  latail: '⤙',
  late: '⪭',
  lates: '⪭︀',
  lbarr: '⤌',
  lbbrk: '❲',
  lbrace: '{',
  lbrack: '[',
  lbrke: '⦋',
  lbrksld: '⦏',
  lbrkslu: '⦍',
  lcaron: 'ľ',
  lcedil: 'ļ',
  lceil: '⌈',
  lcub: '{',
  lcy: 'л',
  ldca: '⤶',
  ldquo: '“',
  ldquor: '„',
  ldrdhar: '⥧',
  ldrushar: '⥋',
  ldsh: '↲',
  le: '≤',
  leftarrow: '←',
  leftarrowtail: '↢',
  leftharpoondown: '↽',
  leftharpoonup: '↼',
  leftleftarrows: '⇇',
  leftrightarrow: '↔',
  leftrightarrows: '⇆',
  leftrightharpoons: '⇋',
  leftrightsquigarrow: '↭',
  leftthreetimes: '⋋',
  leg: '⋚',
  leq: '≤',
  leqq: '≦',
  leqslant: '⩽',
  les: '⩽',
  lescc: '⪨',
  lesdot: '⩿',
  lesdoto: '⪁',
  lesdotor: '⪃',
  lesg: '⋚︀',
  lesges: '⪓',
  lessapprox: '⪅',
  lessdot: '⋖',
  lesseqgtr: '⋚',
  lesseqqgtr: '⪋',
  lessgtr: '≶',
  lesssim: '≲',
  lfisht: '⥼',
  lfloor: '⌊',
  lfr: '𝔩',
  lg: '≶',
  lgE: '⪑',
  lhard: '↽',
  lharu: '↼',
  lharul: '⥪',
  lhblk: '▄',
  ljcy: 'љ',
  ll: '≪',
  llarr: '⇇',
  llcorner: '⌞',
  llhard: '⥫',
  lltri: '◺',
  lmidot: 'ŀ',
  lmoust: '⎰',
  lmoustache: '⎰',
  lnE: '≨',
  lnap: '⪉',
  lnapprox: '⪉',
  lne: '⪇',
  lneq: '⪇',
  lneqq: '≨',
  lnsim: '⋦',
  loang: '⟬',
  loarr: '⇽',
  lobrk: '⟦',
  longleftarrow: '⟵',
  longleftrightarrow: '⟷',
  longmapsto: '⟼',
  longrightarrow: '⟶',
  looparrowleft: '↫',
  looparrowright: '↬',
  lopar: '⦅',
  lopf: '𝕝',
  loplus: '⨭',
  lotimes: '⨴',
  lowast: '∗',
  lowbar: '_',
  loz: '◊',
  lozenge: '◊',
  lozf: '⧫',
  lpar: '(',
  lparlt: '⦓',
  lrarr: '⇆',
  lrcorner: '⌟',
  lrhar: '⇋',
  lrhard: '⥭',
  lrm: '‎',
  lrtri: '⊿',
  lsaquo: '‹',
  lscr: '𝓁',
  lsh: '↰',
  lsim: '≲',
  lsime: '⪍',
  lsimg: '⪏',
  lsqb: '[',
  lsquo: '‘',
  lsquor: '‚',
  lstrok: 'ł',
  lt: '<',
  ltcc: '⪦',
  ltcir: '⩹',
  ltdot: '⋖',
  lthree: '⋋',
  ltimes: '⋉',
  ltlarr: '⥶',
  ltquest: '⩻',
  ltrPar: '⦖',
  ltri: '◃',
  ltrie: '⊴',
  ltrif: '◂',
  lurdshar: '⥊',
  luruhar: '⥦',
  lvertneqq: '≨︀',
  lvnE: '≨︀',
  mDDot: '∺',
  macr: '¯',
  male: '♂',
  malt: '✠',
  maltese: '✠',
  map: '↦',
  mapsto: '↦',
  mapstodown: '↧',
  mapstoleft: '↤',
  mapstoup: '↥',
  marker: '▮',
  mcomma: '⨩',
  mcy: 'м',
  mdash: '—',
  measuredangle: '∡',
  mfr: '𝔪',
  mho: '℧',
  micro: 'µ',
  mid: '∣',
  midast: '*',
  midcir: '⫰',
  middot: '·',
  minus: '−',
  minusb: '⊟',
  minusd: '∸',
  minusdu: '⨪',
  mlcp: '⫛',
  mldr: '…',
  mnplus: '∓',
  models: '⊧',
  mopf: '𝕞',
  mp: '∓',
  mscr: '𝓂',
  mstpos: '∾',
  mu: 'μ',
  multimap: '⊸',
  mumap: '⊸',
  nGg: '⋙̸',
  nGt: '≫⃒',
  nGtv: '≫̸',
  nLeftarrow: '⇍',
  nLeftrightarrow: '⇎',
  nLl: '⋘̸',
  nLt: '≪⃒',
  nLtv: '≪̸',
  nRightarrow: '⇏',
  nVDash: '⊯',
  nVdash: '⊮',
  nabla: '∇',
  nacute: 'ń',
  nang: '∠⃒',
  nap: '≉',
  napE: '⩰̸',
  napid: '≋̸',
  napos: 'ŉ',
  napprox: '≉',
  natur: '♮',
  natural: '♮',
  naturals: 'ℕ',
  nbsp: ' ',
  nbump: '≎̸',
  nbumpe: '≏̸',
  ncap: '⩃',
  ncaron: 'ň',
  ncedil: 'ņ',
  ncong: '≇',
  ncongdot: '⩭̸',
  ncup: '⩂',
  ncy: 'н',
  ndash: '–',
  ne: '≠',
  neArr: '⇗',
  nearhk: '⤤',
  nearr: '↗',
  nearrow: '↗',
  nedot: '≐̸',
  nequiv: '≢',
  nesear: '⤨',
  nesim: '≂̸',
  nexist: '∄',
  nexists: '∄',
  nfr: '𝔫',
  ngE: '≧̸',
  nge: '≱',
  ngeq: '≱',
  ngeqq: '≧̸',
  ngeqslant: '⩾̸',
  nges: '⩾̸',
  ngsim: '≵',
  ngt: '≯',
  ngtr: '≯',
  nhArr: '⇎',
  nharr: '↮',
  nhpar: '⫲',
  ni: '∋',
  nis: '⋼',
  nisd: '⋺',
  niv: '∋',
  njcy: 'њ',
  nlArr: '⇍',
  nlE: '≦̸',
  nlarr: '↚',
  nldr: '‥',
  nle: '≰',
  nleftarrow: '↚',
  nleftrightarrow: '↮',
  nleq: '≰',
  nleqq: '≦̸',
  nleqslant: '⩽̸',
  nles: '⩽̸',
  nless: '≮',
  nlsim: '≴',
  nlt: '≮',
  nltri: '⋪',
  nltrie: '⋬',
  nmid: '∤',
  nopf: '𝕟',
  not: '¬',
  notin: '∉',
  notinE: '⋹̸',
  notindot: '⋵̸',
  notinva: '∉',
  notinvb: '⋷',
  notinvc: '⋶',
  notni: '∌',
  notniva: '∌',
  notnivb: '⋾',
  notnivc: '⋽',
  npar: '∦',
  nparallel: '∦',
  nparsl: '⫽⃥',
  npart: '∂̸',
  npolint: '⨔',
  npr: '⊀',
  nprcue: '⋠',
  npre: '⪯̸',
  nprec: '⊀',
  npreceq: '⪯̸',
  nrArr: '⇏',
  nrarr: '↛',
  nrarrc: '⤳̸',
  nrarrw: '↝̸',
  nrightarrow: '↛',
  nrtri: '⋫',
  nrtrie: '⋭',
  nsc: '⊁',
  nsccue: '⋡',
  nsce: '⪰̸',
  nscr: '𝓃',
  nshortmid: '∤',
  nshortparallel: '∦',
  nsim: '≁',
  nsime: '≄',
  nsimeq: '≄',
  nsmid: '∤',
  nspar: '∦',
  nsqsube: '⋢',
  nsqsupe: '⋣',
  nsub: '⊄',
  nsubE: '⫅̸',
  nsube: '⊈',
  nsubset: '⊂⃒',
  nsubseteq: '⊈',
  nsubseteqq: '⫅̸',
  nsucc: '⊁',
  nsucceq: '⪰̸',
  nsup: '⊅',
  nsupE: '⫆̸',
  nsupe: '⊉',
  nsupset: '⊃⃒',
  nsupseteq: '⊉',
  nsupseteqq: '⫆̸',
  ntgl: '≹',
  ntilde: 'ñ',
  ntlg: '≸',
  ntriangleleft: '⋪',
  ntrianglelefteq: '⋬',
  ntriangleright: '⋫',
  ntrianglerighteq: '⋭',
  nu: 'ν',
  num: '#',
  numero: '№',
  numsp: ' ',
  nvDash: '⊭',
  nvHarr: '⤄',
  nvap: '≍⃒',
  nvdash: '⊬',
  nvge: '≥⃒',
  nvgt: '>⃒',
  nvinfin: '⧞',
  nvlArr: '⤂',
  nvle: '≤⃒',
  nvlt: '<⃒',
  nvltrie: '⊴⃒',
  nvrArr: '⤃',
  nvrtrie: '⊵⃒',
  nvsim: '∼⃒',
  nwArr: '⇖',
  nwarhk: '⤣',
  nwarr: '↖',
  nwarrow: '↖',
  nwnear: '⤧',
  oS: 'Ⓢ',
  oacute: 'ó',
  oast: '⊛',
  ocir: '⊚',
  ocirc: 'ô',
  ocy: 'о',
  odash: '⊝',
  odblac: 'ő',
  odiv: '⨸',
  odot: '⊙',
  odsold: '⦼',
  oelig: 'œ',
  ofcir: '⦿',
  ofr: '𝔬',
  ogon: '˛',
  ograve: 'ò',
  ogt: '⧁',
  ohbar: '⦵',
  ohm: 'Ω',
  oint: '∮',
  olarr: '↺',
  olcir: '⦾',
  olcross: '⦻',
  oline: '‾',
  olt: '⧀',
  omacr: 'ō',
  omega: 'ω',
  omicron: 'ο',
  omid: '⦶',
  ominus: '⊖',
  oopf: '𝕠',
  opar: '⦷',
  operp: '⦹',
  oplus: '⊕',
  or: '∨',
  orarr: '↻',
  ord: '⩝',
  order: 'ℴ',
  orderof: 'ℴ',
  ordf: 'ª',
  ordm: 'º',
  origof: '⊶',
  oror: '⩖',
  orslope: '⩗',
  orv: '⩛',
  oscr: 'ℴ',
  oslash: 'ø',
  osol: '⊘',
  otilde: 'õ',
  otimes: '⊗',
  otimesas: '⨶',
  ouml: 'ö',
  ovbar: '⌽',
  par: '∥',
  para: '¶',
  parallel: '∥',
  parsim: '⫳',
  parsl: '⫽',
  part: '∂',
  pcy: 'п',
  percnt: '%',
  period: '.',
  permil: '‰',
  perp: '⊥',
  pertenk: '‱',
  pfr: '𝔭',
  phi: 'φ',
  phiv: 'ϕ',
  phmmat: 'ℳ',
  phone: '☎',
  pi: 'π',
  pitchfork: '⋔',
  piv: 'ϖ',
  planck: 'ℏ',
  planckh: 'ℎ',
  plankv: 'ℏ',
  plus: '+',
  plusacir: '⨣',
  plusb: '⊞',
  pluscir: '⨢',
  plusdo: '∔',
  plusdu: '⨥',
  pluse: '⩲',
  plusmn: '±',
  plussim: '⨦',
  plustwo: '⨧',
  pm: '±',
  pointint: '⨕',
  popf: '𝕡',
  pound: '£',
  pr: '≺',
  prE: '⪳',
  prap: '⪷',
  prcue: '≼',
  pre: '⪯',
  prec: '≺',
  precapprox: '⪷',
  preccurlyeq: '≼',
  preceq: '⪯',
  precnapprox: '⪹',
  precneqq: '⪵',
  precnsim: '⋨',
  precsim: '≾',
  prime: '′',
  primes: 'ℙ',
  prnE: '⪵',
  prnap: '⪹',
  prnsim: '⋨',
  prod: '∏',
  profalar: '⌮',
  profline: '⌒',
  profsurf: '⌓',
  prop: '∝',
  propto: '∝',
  prsim: '≾',
  prurel: '⊰',
  pscr: '𝓅',
  psi: 'ψ',
  puncsp: ' ',
  qfr: '𝔮',
  qint: '⨌',
  qopf: '𝕢',
  qprime: '⁗',
  qscr: '𝓆',
  quaternions: 'ℍ',
  quatint: '⨖',
  quest: '?',
  questeq: '≟',
  quot: '"',
  rAarr: '⇛',
  rArr: '⇒',
  rAtail: '⤜',
  rBarr: '⤏',
  rHar: '⥤',
  race: '∽̱',
  racute: 'ŕ',
  radic: '√',
  raemptyv: '⦳',
  rang: '⟩',
  rangd: '⦒',
  range: '⦥',
  rangle: '⟩',
  raquo: '»',
  rarr: '→',
  rarrap: '⥵',
  rarrb: '⇥',
  rarrbfs: '⤠',
  rarrc: '⤳',
  rarrfs: '⤞',
  rarrhk: '↪',
  rarrlp: '↬',
  rarrpl: '⥅',
  rarrsim: '⥴',
  rarrtl: '↣',
  rarrw: '↝',
  ratail: '⤚',
  ratio: '∶',
  rationals: 'ℚ',
  rbarr: '⤍',
  rbbrk: '❳',
  rbrace: '}',
  rbrack: ']',
  rbrke: '⦌',
  rbrksld: '⦎',
  rbrkslu: '⦐',
  rcaron: 'ř',
  rcedil: 'ŗ',
  rceil: '⌉',
  rcub: '}',
  rcy: 'р',
  rdca: '⤷',
  rdldhar: '⥩',
  rdquo: '”',
  rdquor: '”',
  rdsh: '↳',
  real: 'ℜ',
  realine: 'ℛ',
  realpart: 'ℜ',
  reals: 'ℝ',
  rect: '▭',
  reg: '®',
  rfisht: '⥽',
  rfloor: '⌋',
  rfr: '𝔯',
  rhard: '⇁',
  rharu: '⇀',
  rharul: '⥬',
  rho: 'ρ',
  rhov: 'ϱ',
  rightarrow: '→',
  rightarrowtail: '↣',
  rightharpoondown: '⇁',
  rightharpoonup: '⇀',
  rightleftarrows: '⇄',
  rightleftharpoons: '⇌',
  rightrightarrows: '⇉',
  rightsquigarrow: '↝',
  rightthreetimes: '⋌',
  ring: '˚',
  risingdotseq: '≓',
  rlarr: '⇄',
  rlhar: '⇌',
  rlm: '‏',
  rmoust: '⎱',
  rmoustache: '⎱',
  rnmid: '⫮',
  roang: '⟭',
  roarr: '⇾',
  robrk: '⟧',
  ropar: '⦆',
  ropf: '𝕣',
  roplus: '⨮',
  rotimes: '⨵',
  rpar: ')',
  rpargt: '⦔',
  rppolint: '⨒',
  rrarr: '⇉',
  rsaquo: '›',
  rscr: '𝓇',
  rsh: '↱',
  rsqb: ']',
  rsquo: '’',
  rsquor: '’',
  rthree: '⋌',
  rtimes: '⋊',
  rtri: '▹',
  rtrie: '⊵',
  rtrif: '▸',
  rtriltri: '⧎',
  ruluhar: '⥨',
  rx: '℞',
  sacute: 'ś',
  sbquo: '‚',
  sc: '≻',
  scE: '⪴',
  scap: '⪸',
  scaron: 'š',
  sccue: '≽',
  sce: '⪰',
  scedil: 'ş',
  scirc: 'ŝ',
  scnE: '⪶',
  scnap: '⪺',
  scnsim: '⋩',
  scpolint: '⨓',
  scsim: '≿',
  scy: 'с',
  sdot: '⋅',
  sdotb: '⊡',
  sdote: '⩦',
  seArr: '⇘',
  searhk: '⤥',
  searr: '↘',
  searrow: '↘',
  sect: '§',
  semi: ';',
  seswar: '⤩',
  setminus: '∖',
  setmn: '∖',
  sext: '✶',
  sfr: '𝔰',
  sfrown: '⌢',
  sharp: '♯',
  shchcy: 'щ',
  shcy: 'ш',
  shortmid: '∣',
  shortparallel: '∥',
  shy: '­',
  sigma: 'σ',
  sigmaf: 'ς',
  sigmav: 'ς',
  sim: '∼',
  simdot: '⩪',
  sime: '≃',
  simeq: '≃',
  simg: '⪞',
  simgE: '⪠',
  siml: '⪝',
  simlE: '⪟',
  simne: '≆',
  simplus: '⨤',
  simrarr: '⥲',
  slarr: '←',
  smallsetminus: '∖',
  smashp: '⨳',
  smeparsl: '⧤',
  smid: '∣',
  smile: '⌣',
  smt: '⪪',
  smte: '⪬',
  smtes: '⪬︀',
  softcy: 'ь',
  sol: '/',
  solb: '⧄',
  solbar: '⌿',
  sopf: '𝕤',
  spades: '♠',
  spadesuit: '♠',
  spar: '∥',
  sqcap: '⊓',
  sqcaps: '⊓︀',
  sqcup: '⊔',
  sqcups: '⊔︀',
  sqsub: '⊏',
  sqsube: '⊑',
  sqsubset: '⊏',
  sqsubseteq: '⊑',
  sqsup: '⊐',
  sqsupe: '⊒',
  sqsupset: '⊐',
  sqsupseteq: '⊒',
  squ: '□',
  square: '□',
  squarf: '▪',
  squf: '▪',
  srarr: '→',
  sscr: '𝓈',
  ssetmn: '∖',
  ssmile: '⌣',
  sstarf: '⋆',
  star: '☆',
  starf: '★',
  straightepsilon: 'ϵ',
  straightphi: 'ϕ',
  strns: '¯',
  sub: '⊂',
  subE: '⫅',
  subdot: '⪽',
  sube: '⊆',
  subedot: '⫃',
  submult: '⫁',
  subnE: '⫋',
  subne: '⊊',
  subplus: '⪿',
  subrarr: '⥹',
  subset: '⊂',
  subseteq: '⊆',
  subseteqq: '⫅',
  subsetneq: '⊊',
  subsetneqq: '⫋',
  subsim: '⫇',
  subsub: '⫕',
  subsup: '⫓',
  succ: '≻',
  succapprox: '⪸',
  succcurlyeq: '≽',
  succeq: '⪰',
  succnapprox: '⪺',
  succneqq: '⪶',
  succnsim: '⋩',
  succsim: '≿',
  sum: '∑',
  sung: '♪',
  sup1: '¹',
  sup2: '²',
  sup3: '³',
  sup: '⊃',
  supE: '⫆',
  supdot: '⪾',
  supdsub: '⫘',
  supe: '⊇',
  supedot: '⫄',
  suphsol: '⟉',
  suphsub: '⫗',
  suplarr: '⥻',
  supmult: '⫂',
  supnE: '⫌',
  supne: '⊋',
  supplus: '⫀',
  supset: '⊃',
  supseteq: '⊇',
  supseteqq: '⫆',
  supsetneq: '⊋',
  supsetneqq: '⫌',
  supsim: '⫈',
  supsub: '⫔',
  supsup: '⫖',
  swArr: '⇙',
  swarhk: '⤦',
  swarr: '↙',
  swarrow: '↙',
  swnwar: '⤪',
  szlig: 'ß',
  target: '⌖',
  tau: 'τ',
  tbrk: '⎴',
  tcaron: 'ť',
  tcedil: 'ţ',
  tcy: 'т',
  tdot: '⃛',
  telrec: '⌕',
  tfr: '𝔱',
  there4: '∴',
  therefore: '∴',
  theta: 'θ',
  thetasym: 'ϑ',
  thetav: 'ϑ',
  thickapprox: '≈',
  thicksim: '∼',
  thinsp: ' ',
  thkap: '≈',
  thksim: '∼',
  thorn: 'þ',
  tilde: '˜',
  times: '×',
  timesb: '⊠',
  timesbar: '⨱',
  timesd: '⨰',
  tint: '∭',
  toea: '⤨',
  top: '⊤',
  topbot: '⌶',
  topcir: '⫱',
  topf: '𝕥',
  topfork: '⫚',
  tosa: '⤩',
  tprime: '‴',
  trade: '™',
  triangle: '▵',
  triangledown: '▿',
  triangleleft: '◃',
  trianglelefteq: '⊴',
  triangleq: '≜',
  triangleright: '▹',
  trianglerighteq: '⊵',
  tridot: '◬',
  trie: '≜',
  triminus: '⨺',
  triplus: '⨹',
  trisb: '⧍',
  tritime: '⨻',
  trpezium: '⏢',
  tscr: '𝓉',
  tscy: 'ц',
  tshcy: 'ћ',
  tstrok: 'ŧ',
  twixt: '≬',
  twoheadleftarrow: '↞',
  twoheadrightarrow: '↠',
  uArr: '⇑',
  uHar: '⥣',
  uacute: 'ú',
  uarr: '↑',
  ubrcy: 'ў',
  ubreve: 'ŭ',
  ucirc: 'û',
  ucy: 'у',
  udarr: '⇅',
  udblac: 'ű',
  udhar: '⥮',
  ufisht: '⥾',
  ufr: '𝔲',
  ugrave: 'ù',
  uharl: '↿',
  uharr: '↾',
  uhblk: '▀',
  ulcorn: '⌜',
  ulcorner: '⌜',
  ulcrop: '⌏',
  ultri: '◸',
  umacr: 'ū',
  uml: '¨',
  uogon: 'ų',
  uopf: '𝕦',
  uparrow: '↑',
  updownarrow: '↕',
  upharpoonleft: '↿',
  upharpoonright: '↾',
  uplus: '⊎',
  upsi: 'υ',
  upsih: 'ϒ',
  upsilon: 'υ',
  upuparrows: '⇈',
  urcorn: '⌝',
  urcorner: '⌝',
  urcrop: '⌎',
  uring: 'ů',
  urtri: '◹',
  uscr: '𝓊',
  utdot: '⋰',
  utilde: 'ũ',
  utri: '▵',
  utrif: '▴',
  uuarr: '⇈',
  uuml: 'ü',
  uwangle: '⦧',
  vArr: '⇕',
  vBar: '⫨',
  vBarv: '⫩',
  vDash: '⊨',
  vangrt: '⦜',
  varepsilon: 'ϵ',
  varkappa: 'ϰ',
  varnothing: '∅',
  varphi: 'ϕ',
  varpi: 'ϖ',
  varpropto: '∝',
  varr: '↕',
  varrho: 'ϱ',
  varsigma: 'ς',
  varsubsetneq: '⊊︀',
  varsubsetneqq: '⫋︀',
  varsupsetneq: '⊋︀',
  varsupsetneqq: '⫌︀',
  vartheta: 'ϑ',
  vartriangleleft: '⊲',
  vartriangleright: '⊳',
  vcy: 'в',
  vdash: '⊢',
  vee: '∨',
  veebar: '⊻',
  veeeq: '≚',
  vellip: '⋮',
  verbar: '|',
  vert: '|',
  vfr: '𝔳',
  vltri: '⊲',
  vnsub: '⊂⃒',
  vnsup: '⊃⃒',
  vopf: '𝕧',
  vprop: '∝',
  vrtri: '⊳',
  vscr: '𝓋',
  vsubnE: '⫋︀',
  vsubne: '⊊︀',
  vsupnE: '⫌︀',
  vsupne: '⊋︀',
  vzigzag: '⦚',
  wcirc: 'ŵ',
  wedbar: '⩟',
  wedge: '∧',
  wedgeq: '≙',
  weierp: '℘',
  wfr: '𝔴',
  wopf: '𝕨',
  wp: '℘',
  wr: '≀',
  wreath: '≀',
  wscr: '𝓌',
  xcap: '⋂',
  xcirc: '◯',
  xcup: '⋃',
  xdtri: '▽',
  xfr: '𝔵',
  xhArr: '⟺',
  xharr: '⟷',
  xi: 'ξ',
  xlArr: '⟸',
  xlarr: '⟵',
  xmap: '⟼',
  xnis: '⋻',
  xodot: '⨀',
  xopf: '𝕩',
  xoplus: '⨁',
  xotime: '⨂',
  xrArr: '⟹',
  xrarr: '⟶',
  xscr: '𝓍',
  xsqcup: '⨆',
  xuplus: '⨄',
  xutri: '△',
  xvee: '⋁',
  xwedge: '⋀',
  yacute: 'ý',
  yacy: 'я',
  ycirc: 'ŷ',
  ycy: 'ы',
  yen: '¥',
  yfr: '𝔶',
  yicy: 'ї',
  yopf: '𝕪',
  yscr: '𝓎',
  yucy: 'ю',
  yuml: 'ÿ',
  zacute: 'ź',
  zcaron: 'ž',
  zcy: 'з',
  zdot: 'ż',
  zeetrf: 'ℨ',
  zeta: 'ζ',
  zfr: '𝔷',
  zhcy: 'ж',
  zigrarr: '⇝',
  zopf: '𝕫',
  zscr: '𝓏',
  zwj: '‍',
  zwnj: '‌'
};

// To do: next major: use `Object.hasOwn`.
const own$5 = {}.hasOwnProperty;

/**
 * Decode a single character reference (without the `&` or `;`).
 * You probably only need this when you’re building parsers yourself that follow
 * different rules compared to HTML.
 * This is optimized to be tiny in browsers.
 *
 * @param {string} value
 *   `notin` (named), `#123` (deci), `#x123` (hexa).
 * @returns {string|false}
 *   Decoded reference.
 */
function decodeNamedCharacterReference(value) {
  return own$5.call(characterEntities, value) ? characterEntities[value] : false
}

/**
 * Turn the number (in string form as either hexa- or plain decimal) coming from
 * a numeric character reference into a character.
 *
 * Sort of like `String.fromCodePoint(Number.parseInt(value, base))`, but makes
 * non-characters and control characters safe.
 *
 * @param {string} value
 *   Value to decode.
 * @param {number} base
 *   Numeric base.
 * @returns {string}
 *   Character.
 */
function decodeNumericCharacterReference(value, base) {
  const code = Number.parseInt(value, base);
  if (
  // C0 except for HT, LF, FF, CR, space.
  code < 9 || code === 11 || code > 13 && code < 32 ||
  // Control character (DEL) of C0, and C1 controls.
  code > 126 && code < 160 ||
  // Lone high surrogates and low surrogates.
  code > 55_295 && code < 57_344 ||
  // Noncharacters.
  code > 64_975 && code < 65_008 || /* eslint-disable no-bitwise */
  (code & 65_535) === 65_535 || (code & 65_535) === 65_534 || /* eslint-enable no-bitwise */
  // Out of range
  code > 1_114_111) {
    return "\uFFFD";
  }
  return String.fromCodePoint(code);
}

const characterEscapeOrReference = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;

/**
 * Decode markdown strings (which occur in places such as fenced code info
 * strings, destinations, labels, and titles).
 *
 * The “string” content type allows character escapes and -references.
 * This decodes those.
 *
 * @param {string} value
 *   Value to decode.
 * @returns {string}
 *   Decoded value.
 */
function decodeString(value) {
  return value.replace(characterEscapeOrReference, decode);
}

/**
 * @param {string} $0
 *   Match.
 * @param {string} $1
 *   Character escape.
 * @param {string} $2
 *   Character reference.
 * @returns {string}
 *   Decoded value
 */
function decode($0, $1, $2) {
  if ($1) {
    // Escape.
    return $1;
  }

  // Reference.
  const head = $2.charCodeAt(0);
  if (head === 35) {
    const head = $2.charCodeAt(1);
    const hex = head === 120 || head === 88;
    return decodeNumericCharacterReference($2.slice(hex ? 2 : 1), hex ? 16 : 10);
  }
  return decodeNamedCharacterReference($2) || $0;
}

/**
 * @typedef {import('mdast').InlineCode} InlineCode
 * @typedef {import('mdast').Table} Table
 * @typedef {import('mdast').TableCell} TableCell
 * @typedef {import('mdast').TableRow} TableRow
 *
 * @typedef {import('markdown-table').Options} MarkdownTableOptions
 *
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 *
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').State} State
 * @typedef {import('mdast-util-to-markdown').Info} Info
 */


/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM tables in
 * markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable GFM tables.
 */
function gfmTableFromMarkdown() {
  return {
    enter: {
      table: enterTable,
      tableData: enterCell,
      tableHeader: enterCell,
      tableRow: enterRow
    },
    exit: {
      codeText: exitCodeText,
      table: exitTable,
      tableData: exit$1,
      tableHeader: exit$1,
      tableRow: exit$1
    }
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterTable(token) {
  const align = token._align;
  this.enter(
    {
      type: 'table',
      align: align.map(function (d) {
        return d === 'none' ? null : d
      }),
      children: []
    },
    token
  );
  this.data.inTable = true;
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitTable(token) {
  this.exit(token);
  this.data.inTable = undefined;
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterRow(token) {
  this.enter({type: 'tableRow', children: []}, token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exit$1(token) {
  this.exit(token);
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function enterCell(token) {
  this.enter({type: 'tableCell', children: []}, token);
}

// Overwrite the default code text data handler to unescape escaped pipes when
// they are in tables.
/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitCodeText(token) {
  let value = this.resume();

  if (this.data.inTable) {
    value = value.replace(/\\([\\|])/g, replace);
  }

  const node = this.stack[this.stack.length - 1];
  ok$1(node.type === 'inlineCode');
  node.value = value;
  this.exit(token);
}

/**
 * @param {string} $0
 * @param {string} $1
 * @returns {string}
 */
function replace($0, $1) {
  // Pipes work, backslashes don’t (but can’t escape pipes).
  return $1 === '|' ? $1 : $0
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM tables in
 * markdown.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM tables.
 */
function gfmTableToMarkdown(options) {
  const settings = options || {};
  const padding = settings.tableCellPadding;
  const alignDelimiters = settings.tablePipeAlign;
  const stringLength = settings.stringLength;
  const around = padding ? ' ' : '|';

  return {
    unsafe: [
      {character: '\r', inConstruct: 'tableCell'},
      {character: '\n', inConstruct: 'tableCell'},
      // A pipe, when followed by a tab or space (padding), or a dash or colon
      // (unpadded delimiter row), could result in a table.
      {atBreak: true, character: '|', after: '[\t :-]'},
      // A pipe in a cell must be encoded.
      {character: '|', inConstruct: 'tableCell'},
      // A colon must be followed by a dash, in which case it could start a
      // delimiter row.
      {atBreak: true, character: ':', after: '-'},
      // A delimiter row can also start with a dash, when followed by more
      // dashes, a colon, or a pipe.
      // This is a stricter version than the built in check for lists, thematic
      // breaks, and setex heading underlines though:
      // <https://github.com/syntax-tree/mdast-util-to-markdown/blob/51a2038/lib/unsafe.js#L57>
      {atBreak: true, character: '-', after: '[:|-]'}
    ],
    handlers: {
      inlineCode: inlineCodeWithTable,
      table: handleTable,
      tableCell: handleTableCell,
      tableRow: handleTableRow
    }
  }

  /**
   * @type {ToMarkdownHandle}
   * @param {Table} node
   */
  function handleTable(node, _, state, info) {
    return serializeData(handleTableAsData(node, state, info), node.align)
  }

  /**
   * This function isn’t really used normally, because we handle rows at the
   * table level.
   * But, if someone passes in a table row, this ensures we make somewhat sense.
   *
   * @type {ToMarkdownHandle}
   * @param {TableRow} node
   */
  function handleTableRow(node, _, state, info) {
    const row = handleTableRowAsData(node, state, info);
    const value = serializeData([row]);
    // `markdown-table` will always add an align row
    return value.slice(0, value.indexOf('\n'))
  }

  /**
   * @type {ToMarkdownHandle}
   * @param {TableCell} node
   */
  function handleTableCell(node, _, state, info) {
    const exit = state.enter('tableCell');
    const subexit = state.enter('phrasing');
    const value = state.containerPhrasing(node, {
      ...info,
      before: around,
      after: around
    });
    subexit();
    exit();
    return value
  }

  /**
   * @param {Array<Array<string>>} matrix
   * @param {Array<string | null | undefined> | null | undefined} [align]
   */
  function serializeData(matrix, align) {
    return markdownTable(matrix, {
      align,
      // @ts-expect-error: `markdown-table` types should support `null`.
      alignDelimiters,
      // @ts-expect-error: `markdown-table` types should support `null`.
      padding,
      // @ts-expect-error: `markdown-table` types should support `null`.
      stringLength
    })
  }

  /**
   * @param {Table} node
   * @param {State} state
   * @param {Info} info
   */
  function handleTableAsData(node, state, info) {
    const children = node.children;
    let index = -1;
    /** @type {Array<Array<string>>} */
    const result = [];
    const subexit = state.enter('table');

    while (++index < children.length) {
      result[index] = handleTableRowAsData(children[index], state, info);
    }

    subexit();

    return result
  }

  /**
   * @param {TableRow} node
   * @param {State} state
   * @param {Info} info
   */
  function handleTableRowAsData(node, state, info) {
    const children = node.children;
    let index = -1;
    /** @type {Array<string>} */
    const result = [];
    const subexit = state.enter('tableRow');

    while (++index < children.length) {
      // Note: the positional info as used here is incorrect.
      // Making it correct would be impossible due to aligning cells?
      // And it would need copy/pasting `markdown-table` into this project.
      result[index] = handleTableCell(children[index], node, state, info);
    }

    subexit();

    return result
  }

  /**
   * @type {ToMarkdownHandle}
   * @param {InlineCode} node
   */
  function inlineCodeWithTable(node, parent, state) {
    let value = handle.inlineCode(node, parent, state);

    if (state.stack.includes('tableCell')) {
      value = value.replace(/\|/g, '\\$&');
    }

    return value
  }
}

/**
 * @typedef {import('mdast').ListItem} ListItem
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('mdast-util-from-markdown').CompileContext} CompileContext
 * @typedef {import('mdast-util-from-markdown').Extension} FromMarkdownExtension
 * @typedef {import('mdast-util-from-markdown').Handle} FromMarkdownHandle
 * @typedef {import('mdast-util-to-markdown').Options} ToMarkdownExtension
 * @typedef {import('mdast-util-to-markdown').Handle} ToMarkdownHandle
 */


/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM task
 * list items in markdown.
 *
 * @returns {FromMarkdownExtension}
 *   Extension for `mdast-util-from-markdown` to enable GFM task list items.
 */
function gfmTaskListItemFromMarkdown() {
  return {
    exit: {
      taskListCheckValueChecked: exitCheck,
      taskListCheckValueUnchecked: exitCheck,
      paragraph: exitParagraphWithTaskListItem
    }
  }
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM task list
 * items in markdown.
 *
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM task list items.
 */
function gfmTaskListItemToMarkdown() {
  return {
    unsafe: [{atBreak: true, character: '-', after: '[:|-]'}],
    handlers: {listItem: listItemWithTaskListItem}
  }
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitCheck(token) {
  // We’re always in a paragraph, in a list item.
  const node = this.stack[this.stack.length - 2];
  ok$1(node.type === 'listItem');
  node.checked = token.type === 'taskListCheckValueChecked';
}

/**
 * @this {CompileContext}
 * @type {FromMarkdownHandle}
 */
function exitParagraphWithTaskListItem(token) {
  const parent = this.stack[this.stack.length - 2];

  if (
    parent &&
    parent.type === 'listItem' &&
    typeof parent.checked === 'boolean'
  ) {
    const node = this.stack[this.stack.length - 1];
    ok$1(node.type === 'paragraph');
    const head = node.children[0];

    if (head && head.type === 'text') {
      const siblings = parent.children;
      let index = -1;
      /** @type {Paragraph | undefined} */
      let firstParaghraph;

      while (++index < siblings.length) {
        const sibling = siblings[index];
        if (sibling.type === 'paragraph') {
          firstParaghraph = sibling;
          break
        }
      }

      if (firstParaghraph === node) {
        // Must start with a space or a tab.
        head.value = head.value.slice(1);

        if (head.value.length === 0) {
          node.children.shift();
        } else if (
          node.position &&
          head.position &&
          typeof head.position.start.offset === 'number'
        ) {
          head.position.start.column++;
          head.position.start.offset++;
          node.position.start = Object.assign({}, head.position.start);
        }
      }
    }
  }

  this.exit(token);
}

/**
 * @type {ToMarkdownHandle}
 * @param {ListItem} node
 */
function listItemWithTaskListItem(node, parent, state, info) {
  const head = node.children[0];
  const checkable =
    typeof node.checked === 'boolean' && head && head.type === 'paragraph';
  const checkbox = '[' + (node.checked ? 'x' : ' ') + '] ';
  const tracker = state.createTracker(info);

  if (checkable) {
    tracker.move(checkbox);
  }

  let value = handle.listItem(node, parent, state, {
    ...info,
    ...tracker.current()
  });

  if (checkable) {
    value = value.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, check);
  }

  return value

  /**
   * @param {string} $0
   * @returns {string}
   */
  function check($0) {
    return $0 + checkbox
  }
}

/**
 * @import {Extension as FromMarkdownExtension} from 'mdast-util-from-markdown'
 * @import {Options} from 'mdast-util-gfm'
 * @import {Options as ToMarkdownExtension} from 'mdast-util-to-markdown'
 */


/**
 * Create an extension for `mdast-util-from-markdown` to enable GFM (autolink
 * literals, footnotes, strikethrough, tables, tasklists).
 *
 * @returns {Array<FromMarkdownExtension>}
 *   Extension for `mdast-util-from-markdown` to enable GFM (autolink literals,
 *   footnotes, strikethrough, tables, tasklists).
 */
function gfmFromMarkdown() {
  return [
    gfmAutolinkLiteralFromMarkdown(),
    gfmFootnoteFromMarkdown(),
    gfmStrikethroughFromMarkdown(),
    gfmTableFromMarkdown(),
    gfmTaskListItemFromMarkdown()
  ]
}

/**
 * Create an extension for `mdast-util-to-markdown` to enable GFM (autolink
 * literals, footnotes, strikethrough, tables, tasklists).
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ToMarkdownExtension}
 *   Extension for `mdast-util-to-markdown` to enable GFM (autolink literals,
 *   footnotes, strikethrough, tables, tasklists).
 */
function gfmToMarkdown(options) {
  return {
    extensions: [
      gfmAutolinkLiteralToMarkdown(),
      gfmFootnoteToMarkdown(options),
      gfmStrikethroughToMarkdown(),
      gfmTableToMarkdown(options),
      gfmTaskListItemToMarkdown()
    ]
  }
}

/**
 * Like `Array#splice`, but smarter for giant arrays.
 *
 * `Array#splice` takes all items to be inserted as individual argument which
 * causes a stack overflow in V8 when trying to insert 100k items for instance.
 *
 * Otherwise, this does not return the removed items, and takes `items` as an
 * array instead of rest parameters.
 *
 * @template {unknown} T
 *   Item type.
 * @param {Array<T>} list
 *   List to operate on.
 * @param {number} start
 *   Index to remove/insert at (can be negative).
 * @param {number} remove
 *   Number of items to remove.
 * @param {Array<T>} items
 *   Items to inject into `list`.
 * @returns {undefined}
 *   Nothing.
 */
function splice(list, start, remove, items) {
  const end = list.length;
  let chunkStart = 0;
  /** @type {Array<unknown>} */
  let parameters;

  // Make start between zero and `end` (included).
  if (start < 0) {
    start = -start > end ? 0 : end + start;
  } else {
    start = start > end ? end : start;
  }
  remove = remove > 0 ? remove : 0;

  // No need to chunk the items if there’s only a couple (10k) items.
  if (items.length < 10000) {
    parameters = Array.from(items);
    parameters.unshift(start, remove);
    // @ts-expect-error Hush, it’s fine.
    list.splice(...parameters);
  } else {
    // Delete `remove` items starting from `start`
    if (remove) list.splice(start, remove);

    // Insert the items in chunks to not cause stack overflows.
    while (chunkStart < items.length) {
      parameters = items.slice(chunkStart, chunkStart + 10000);
      parameters.unshift(start, 0);
      // @ts-expect-error Hush, it’s fine.
      list.splice(...parameters);
      chunkStart += 10000;
      start += 10000;
    }
  }
}

/**
 * Append `items` (an array) at the end of `list` (another array).
 * When `list` was empty, returns `items` instead.
 *
 * This prevents a potentially expensive operation when `list` is empty,
 * and adds items in batches to prevent V8 from hanging.
 *
 * @template {unknown} T
 *   Item type.
 * @param {Array<T>} list
 *   List to operate on.
 * @param {Array<T>} items
 *   Items to add to `list`.
 * @returns {Array<T>}
 *   Either `list` or `items`.
 */
function push(list, items) {
  if (list.length > 0) {
    splice(list, list.length, 0, items);
    return list;
  }
  return items;
}

/**
 * @import {
 *   Extension,
 *   Handles,
 *   HtmlExtension,
 *   NormalizedExtension
 * } from 'micromark-util-types'
 */


const hasOwnProperty = {}.hasOwnProperty;

/**
 * Combine multiple syntax extensions into one.
 *
 * @param {ReadonlyArray<Extension>} extensions
 *   List of syntax extensions.
 * @returns {NormalizedExtension}
 *   A single combined extension.
 */
function combineExtensions(extensions) {
  /** @type {NormalizedExtension} */
  const all = {};
  let index = -1;

  while (++index < extensions.length) {
    syntaxExtension(all, extensions[index]);
  }

  return all
}

/**
 * Merge `extension` into `all`.
 *
 * @param {NormalizedExtension} all
 *   Extension to merge into.
 * @param {Extension} extension
 *   Extension to merge.
 * @returns {undefined}
 *   Nothing.
 */
function syntaxExtension(all, extension) {
  /** @type {keyof Extension} */
  let hook;

  for (hook in extension) {
    const maybe = hasOwnProperty.call(all, hook) ? all[hook] : undefined;
    /** @type {Record<string, unknown>} */
    const left = maybe || (all[hook] = {});
    /** @type {Record<string, unknown> | undefined} */
    const right = extension[hook];
    /** @type {string} */
    let code;

    if (right) {
      for (code in right) {
        if (!hasOwnProperty.call(left, code)) left[code] = [];
        const value = right[code];
        constructs(
          // @ts-expect-error Looks like a list.
          left[code],
          Array.isArray(value) ? value : value ? [value] : []
        );
      }
    }
  }
}

/**
 * Merge `list` into `existing` (both lists of constructs).
 * Mutates `existing`.
 *
 * @param {Array<unknown>} existing
 *   List of constructs to merge into.
 * @param {Array<unknown>} list
 *   List of constructs to merge.
 * @returns {undefined}
 *   Nothing.
 */
function constructs(existing, list) {
  let index = -1;
  /** @type {Array<unknown>} */
  const before = [];

  while (++index < list.length) {
(list[index].add === 'after' ? existing : before).push(list[index]);
  }

  splice(existing, 0, 0, before);
}

/**
 * @import {Code, ConstructRecord, Event, Extension, Previous, State, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

const wwwPrefix = {
  tokenize: tokenizeWwwPrefix,
  partial: true
};
const domain = {
  tokenize: tokenizeDomain,
  partial: true
};
const path = {
  tokenize: tokenizePath,
  partial: true
};
const trail = {
  tokenize: tokenizeTrail,
  partial: true
};
const emailDomainDotTrail = {
  tokenize: tokenizeEmailDomainDotTrail,
  partial: true
};
const wwwAutolink = {
  name: 'wwwAutolink',
  tokenize: tokenizeWwwAutolink,
  previous: previousWww
};
const protocolAutolink = {
  name: 'protocolAutolink',
  tokenize: tokenizeProtocolAutolink,
  previous: previousProtocol
};
const emailAutolink = {
  name: 'emailAutolink',
  tokenize: tokenizeEmailAutolink,
  previous: previousEmail
};

/** @type {ConstructRecord} */
const text$3 = {};

/**
 * Create an extension for `micromark` to support GitHub autolink literal
 * syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable GFM
 *   autolink literal syntax.
 */
function gfmAutolinkLiteral() {
  return {
    text: text$3
  };
}

/** @type {Code} */
let code$1 = 48;

// Add alphanumerics.
while (code$1 < 123) {
  text$3[code$1] = emailAutolink;
  code$1++;
  if (code$1 === 58) code$1 = 65;else if (code$1 === 91) code$1 = 97;
}
text$3[43] = emailAutolink;
text$3[45] = emailAutolink;
text$3[46] = emailAutolink;
text$3[95] = emailAutolink;
text$3[72] = [emailAutolink, protocolAutolink];
text$3[104] = [emailAutolink, protocolAutolink];
text$3[87] = [emailAutolink, wwwAutolink];
text$3[119] = [emailAutolink, wwwAutolink];

// To do: perform email autolink literals on events, afterwards.
// That’s where `markdown-rs` and `cmark-gfm` perform it.
// It should look for `@`, then for atext backwards, and then for a label
// forwards.
// To do: `mailto:`, `xmpp:` protocol as prefix.

/**
 * Email autolink literal.
 *
 * ```markdown
 * > | a contact@example.org b
 *       ^^^^^^^^^^^^^^^^^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeEmailAutolink(effects, ok, nok) {
  const self = this;
  /** @type {boolean | undefined} */
  let dot;
  /** @type {boolean} */
  let data;
  return start;

  /**
   * Start of email autolink literal.
   *
   * ```markdown
   * > | a contact@example.org b
   *       ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    if (!gfmAtext(code) || !previousEmail.call(self, self.previous) || previousUnbalanced(self.events)) {
      return nok(code);
    }
    effects.enter('literalAutolink');
    effects.enter('literalAutolinkEmail');
    return atext(code);
  }

  /**
   * In email atext.
   *
   * ```markdown
   * > | a contact@example.org b
   *       ^
   * ```
   *
   * @type {State}
   */
  function atext(code) {
    if (gfmAtext(code)) {
      effects.consume(code);
      return atext;
    }
    if (code === 64) {
      effects.consume(code);
      return emailDomain;
    }
    return nok(code);
  }

  /**
   * In email domain.
   *
   * The reference code is a bit overly complex as it handles the `@`, of which
   * there may be just one.
   * Source: <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L318>
   *
   * ```markdown
   * > | a contact@example.org b
   *               ^
   * ```
   *
   * @type {State}
   */
  function emailDomain(code) {
    // Dot followed by alphanumerical (not `-` or `_`).
    if (code === 46) {
      return effects.check(emailDomainDotTrail, emailDomainAfter, emailDomainDot)(code);
    }

    // Alphanumerical, `-`, and `_`.
    if (code === 45 || code === 95 || asciiAlphanumeric(code)) {
      data = true;
      effects.consume(code);
      return emailDomain;
    }

    // To do: `/` if xmpp.

    // Note: normally we’d truncate trailing punctuation from the link.
    // However, email autolink literals cannot contain any of those markers,
    // except for `.`, but that can only occur if it isn’t trailing.
    // So we can ignore truncating!
    return emailDomainAfter(code);
  }

  /**
   * In email domain, on dot that is not a trail.
   *
   * ```markdown
   * > | a contact@example.org b
   *                      ^
   * ```
   *
   * @type {State}
   */
  function emailDomainDot(code) {
    effects.consume(code);
    dot = true;
    return emailDomain;
  }

  /**
   * After email domain.
   *
   * ```markdown
   * > | a contact@example.org b
   *                          ^
   * ```
   *
   * @type {State}
   */
  function emailDomainAfter(code) {
    // Domain must not be empty, must include a dot, and must end in alphabetical.
    // Source: <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L332>.
    if (data && dot && asciiAlpha(self.previous)) {
      effects.exit('literalAutolinkEmail');
      effects.exit('literalAutolink');
      return ok(code);
    }
    return nok(code);
  }
}

/**
 * `www` autolink literal.
 *
 * ```markdown
 * > | a www.example.org b
 *       ^^^^^^^^^^^^^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeWwwAutolink(effects, ok, nok) {
  const self = this;
  return wwwStart;

  /**
   * Start of www autolink literal.
   *
   * ```markdown
   * > | www.example.com/a?b#c
   *     ^
   * ```
   *
   * @type {State}
   */
  function wwwStart(code) {
    if (code !== 87 && code !== 119 || !previousWww.call(self, self.previous) || previousUnbalanced(self.events)) {
      return nok(code);
    }
    effects.enter('literalAutolink');
    effects.enter('literalAutolinkWww');
    // Note: we *check*, so we can discard the `www.` we parsed.
    // If it worked, we consider it as a part of the domain.
    return effects.check(wwwPrefix, effects.attempt(domain, effects.attempt(path, wwwAfter), nok), nok)(code);
  }

  /**
   * After a www autolink literal.
   *
   * ```markdown
   * > | www.example.com/a?b#c
   *                          ^
   * ```
   *
   * @type {State}
   */
  function wwwAfter(code) {
    effects.exit('literalAutolinkWww');
    effects.exit('literalAutolink');
    return ok(code);
  }
}

/**
 * Protocol autolink literal.
 *
 * ```markdown
 * > | a https://example.org b
 *       ^^^^^^^^^^^^^^^^^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeProtocolAutolink(effects, ok, nok) {
  const self = this;
  let buffer = '';
  let seen = false;
  return protocolStart;

  /**
   * Start of protocol autolink literal.
   *
   * ```markdown
   * > | https://example.com/a?b#c
   *     ^
   * ```
   *
   * @type {State}
   */
  function protocolStart(code) {
    if ((code === 72 || code === 104) && previousProtocol.call(self, self.previous) && !previousUnbalanced(self.events)) {
      effects.enter('literalAutolink');
      effects.enter('literalAutolinkHttp');
      buffer += String.fromCodePoint(code);
      effects.consume(code);
      return protocolPrefixInside;
    }
    return nok(code);
  }

  /**
   * In protocol.
   *
   * ```markdown
   * > | https://example.com/a?b#c
   *     ^^^^^
   * ```
   *
   * @type {State}
   */
  function protocolPrefixInside(code) {
    // `5` is size of `https`
    if (asciiAlpha(code) && buffer.length < 5) {
      // @ts-expect-error: definitely number.
      buffer += String.fromCodePoint(code);
      effects.consume(code);
      return protocolPrefixInside;
    }
    if (code === 58) {
      const protocol = buffer.toLowerCase();
      if (protocol === 'http' || protocol === 'https') {
        effects.consume(code);
        return protocolSlashesInside;
      }
    }
    return nok(code);
  }

  /**
   * In slashes.
   *
   * ```markdown
   * > | https://example.com/a?b#c
   *           ^^
   * ```
   *
   * @type {State}
   */
  function protocolSlashesInside(code) {
    if (code === 47) {
      effects.consume(code);
      if (seen) {
        return afterProtocol;
      }
      seen = true;
      return protocolSlashesInside;
    }
    return nok(code);
  }

  /**
   * After protocol, before domain.
   *
   * ```markdown
   * > | https://example.com/a?b#c
   *             ^
   * ```
   *
   * @type {State}
   */
  function afterProtocol(code) {
    // To do: this is different from `markdown-rs`:
    // https://github.com/wooorm/markdown-rs/blob/b3a921c761309ae00a51fe348d8a43adbc54b518/src/construct/gfm_autolink_literal.rs#L172-L182
    return code === null || asciiControl(code) || markdownLineEndingOrSpace(code) || unicodeWhitespace(code) || unicodePunctuation(code) ? nok(code) : effects.attempt(domain, effects.attempt(path, protocolAfter), nok)(code);
  }

  /**
   * After a protocol autolink literal.
   *
   * ```markdown
   * > | https://example.com/a?b#c
   *                              ^
   * ```
   *
   * @type {State}
   */
  function protocolAfter(code) {
    effects.exit('literalAutolinkHttp');
    effects.exit('literalAutolink');
    return ok(code);
  }
}

/**
 * `www` prefix.
 *
 * ```markdown
 * > | a www.example.org b
 *       ^^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeWwwPrefix(effects, ok, nok) {
  let size = 0;
  return wwwPrefixInside;

  /**
   * In www prefix.
   *
   * ```markdown
   * > | www.example.com
   *     ^^^^
   * ```
   *
   * @type {State}
   */
  function wwwPrefixInside(code) {
    if ((code === 87 || code === 119) && size < 3) {
      size++;
      effects.consume(code);
      return wwwPrefixInside;
    }
    if (code === 46 && size === 3) {
      effects.consume(code);
      return wwwPrefixAfter;
    }
    return nok(code);
  }

  /**
   * After www prefix.
   *
   * ```markdown
   * > | www.example.com
   *         ^
   * ```
   *
   * @type {State}
   */
  function wwwPrefixAfter(code) {
    // If there is *anything*, we can link.
    return code === null ? nok(code) : ok(code);
  }
}

/**
 * Domain.
 *
 * ```markdown
 * > | a https://example.org b
 *               ^^^^^^^^^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeDomain(effects, ok, nok) {
  /** @type {boolean | undefined} */
  let underscoreInLastSegment;
  /** @type {boolean | undefined} */
  let underscoreInLastLastSegment;
  /** @type {boolean | undefined} */
  let seen;
  return domainInside;

  /**
   * In domain.
   *
   * ```markdown
   * > | https://example.com/a
   *             ^^^^^^^^^^^
   * ```
   *
   * @type {State}
   */
  function domainInside(code) {
    // Check whether this marker, which is a trailing punctuation
    // marker, optionally followed by more trailing markers, and then
    // followed by an end.
    if (code === 46 || code === 95) {
      return effects.check(trail, domainAfter, domainAtPunctuation)(code);
    }

    // GH documents that only alphanumerics (other than `-`, `.`, and `_`) can
    // occur, which sounds like ASCII only, but they also support `www.點看.com`,
    // so that’s Unicode.
    // Instead of some new production for Unicode alphanumerics, markdown
    // already has that for Unicode punctuation and whitespace, so use those.
    // Source: <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L12>.
    if (code === null || markdownLineEndingOrSpace(code) || unicodeWhitespace(code) || code !== 45 && unicodePunctuation(code)) {
      return domainAfter(code);
    }
    seen = true;
    effects.consume(code);
    return domainInside;
  }

  /**
   * In domain, at potential trailing punctuation, that was not trailing.
   *
   * ```markdown
   * > | https://example.com
   *                    ^
   * ```
   *
   * @type {State}
   */
  function domainAtPunctuation(code) {
    // There is an underscore in the last segment of the domain
    if (code === 95) {
      underscoreInLastSegment = true;
    }
    // Otherwise, it’s a `.`: save the last segment underscore in the
    // penultimate segment slot.
    else {
      underscoreInLastLastSegment = underscoreInLastSegment;
      underscoreInLastSegment = undefined;
    }
    effects.consume(code);
    return domainInside;
  }

  /**
   * After domain.
   *
   * ```markdown
   * > | https://example.com/a
   *                        ^
   * ```
   *
   * @type {State} */
  function domainAfter(code) {
    // Note: that’s GH says a dot is needed, but it’s not true:
    // <https://github.com/github/cmark-gfm/issues/279>
    if (underscoreInLastLastSegment || underscoreInLastSegment || !seen) {
      return nok(code);
    }
    return ok(code);
  }
}

/**
 * Path.
 *
 * ```markdown
 * > | a https://example.org/stuff b
 *                          ^^^^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizePath(effects, ok) {
  let sizeOpen = 0;
  let sizeClose = 0;
  return pathInside;

  /**
   * In path.
   *
   * ```markdown
   * > | https://example.com/a
   *                        ^^
   * ```
   *
   * @type {State}
   */
  function pathInside(code) {
    if (code === 40) {
      sizeOpen++;
      effects.consume(code);
      return pathInside;
    }

    // To do: `markdown-rs` also needs this.
    // If this is a paren, and there are less closings than openings,
    // we don’t check for a trail.
    if (code === 41 && sizeClose < sizeOpen) {
      return pathAtPunctuation(code);
    }

    // Check whether this trailing punctuation marker is optionally
    // followed by more trailing markers, and then followed
    // by an end.
    if (code === 33 || code === 34 || code === 38 || code === 39 || code === 41 || code === 42 || code === 44 || code === 46 || code === 58 || code === 59 || code === 60 || code === 63 || code === 93 || code === 95 || code === 126) {
      return effects.check(trail, ok, pathAtPunctuation)(code);
    }
    if (code === null || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
      return ok(code);
    }
    effects.consume(code);
    return pathInside;
  }

  /**
   * In path, at potential trailing punctuation, that was not trailing.
   *
   * ```markdown
   * > | https://example.com/a"b
   *                          ^
   * ```
   *
   * @type {State}
   */
  function pathAtPunctuation(code) {
    // Count closing parens.
    if (code === 41) {
      sizeClose++;
    }
    effects.consume(code);
    return pathInside;
  }
}

/**
 * Trail.
 *
 * This calls `ok` if this *is* the trail, followed by an end, which means
 * the entire trail is not part of the link.
 * It calls `nok` if this *is* part of the link.
 *
 * ```markdown
 * > | https://example.com").
 *                        ^^^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeTrail(effects, ok, nok) {
  return trail;

  /**
   * In trail of domain or path.
   *
   * ```markdown
   * > | https://example.com").
   *                        ^
   * ```
   *
   * @type {State}
   */
  function trail(code) {
    // Regular trailing punctuation.
    if (code === 33 || code === 34 || code === 39 || code === 41 || code === 42 || code === 44 || code === 46 || code === 58 || code === 59 || code === 63 || code === 95 || code === 126) {
      effects.consume(code);
      return trail;
    }

    // `&` followed by one or more alphabeticals and then a `;`, is
    // as a whole considered as trailing punctuation.
    // In all other cases, it is considered as continuation of the URL.
    if (code === 38) {
      effects.consume(code);
      return trailCharacterReferenceStart;
    }

    // Needed because we allow literals after `[`, as we fix:
    // <https://github.com/github/cmark-gfm/issues/278>.
    // Check that it is not followed by `(` or `[`.
    if (code === 93) {
      effects.consume(code);
      return trailBracketAfter;
    }
    if (
    // `<` is an end.
    code === 60 ||
    // So is whitespace.
    code === null || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
      return ok(code);
    }
    return nok(code);
  }

  /**
   * In trail, after `]`.
   *
   * > 👉 **Note**: this deviates from `cmark-gfm` to fix a bug.
   * > See end of <https://github.com/github/cmark-gfm/issues/278> for more.
   *
   * ```markdown
   * > | https://example.com](
   *                         ^
   * ```
   *
   * @type {State}
   */
  function trailBracketAfter(code) {
    // Whitespace or something that could start a resource or reference is the end.
    // Switch back to trail otherwise.
    if (code === null || code === 40 || code === 91 || markdownLineEndingOrSpace(code) || unicodeWhitespace(code)) {
      return ok(code);
    }
    return trail(code);
  }

  /**
   * In character-reference like trail, after `&`.
   *
   * ```markdown
   * > | https://example.com&amp;).
   *                         ^
   * ```
   *
   * @type {State}
   */
  function trailCharacterReferenceStart(code) {
    // When non-alpha, it’s not a trail.
    return asciiAlpha(code) ? trailCharacterReferenceInside(code) : nok(code);
  }

  /**
   * In character-reference like trail.
   *
   * ```markdown
   * > | https://example.com&amp;).
   *                         ^
   * ```
   *
   * @type {State}
   */
  function trailCharacterReferenceInside(code) {
    // Switch back to trail if this is well-formed.
    if (code === 59) {
      effects.consume(code);
      return trail;
    }
    if (asciiAlpha(code)) {
      effects.consume(code);
      return trailCharacterReferenceInside;
    }

    // It’s not a trail.
    return nok(code);
  }
}

/**
 * Dot in email domain trail.
 *
 * This calls `ok` if this *is* the trail, followed by an end, which means
 * the trail is not part of the link.
 * It calls `nok` if this *is* part of the link.
 *
 * ```markdown
 * > | contact@example.org.
 *                        ^
 * ```
 *
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeEmailDomainDotTrail(effects, ok, nok) {
  return start;

  /**
   * Dot.
   *
   * ```markdown
   * > | contact@example.org.
   *                    ^   ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // Must be dot.
    effects.consume(code);
    return after;
  }

  /**
   * After dot.
   *
   * ```markdown
   * > | contact@example.org.
   *                     ^   ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    // Not a trail if alphanumeric.
    return asciiAlphanumeric(code) ? nok(code) : ok(code);
  }
}

/**
 * See:
 * <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L156>.
 *
 * @type {Previous}
 */
function previousWww(code) {
  return code === null || code === 40 || code === 42 || code === 95 || code === 91 || code === 93 || code === 126 || markdownLineEndingOrSpace(code);
}

/**
 * See:
 * <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L214>.
 *
 * @type {Previous}
 */
function previousProtocol(code) {
  return !asciiAlpha(code);
}

/**
 * @this {TokenizeContext}
 * @type {Previous}
 */
function previousEmail(code) {
  // Do not allow a slash “inside” atext.
  // The reference code is a bit weird, but that’s what it results in.
  // Source: <https://github.com/github/cmark-gfm/blob/ef1cfcb/extensions/autolink.c#L307>.
  // Other than slash, every preceding character is allowed.
  return !(code === 47 || gfmAtext(code));
}

/**
 * @param {Code} code
 * @returns {boolean}
 */
function gfmAtext(code) {
  return code === 43 || code === 45 || code === 46 || code === 95 || asciiAlphanumeric(code);
}

/**
 * @param {Array<Event>} events
 * @returns {boolean}
 */
function previousUnbalanced(events) {
  let index = events.length;
  let result = false;
  while (index--) {
    const token = events[index][1];
    if ((token.type === 'labelLink' || token.type === 'labelImage') && !token._balanced) {
      result = true;
      break;
    }

    // If we’ve seen this token, and it was marked as not having any unbalanced
    // bracket before it, we can exit.
    if (token._gfmAutolinkLiteralWalkedInto) {
      result = false;
      break;
    }
  }
  if (events.length > 0 && !result) {
    // Mark the last token as “walked into” w/o finding
    // anything.
    events[events.length - 1][1]._gfmAutolinkLiteralWalkedInto = true;
  }
  return result;
}

/**
 * Normalize a URL.
 *
 * Encode unsafe characters with percent-encoding, skipping already encoded
 * sequences.
 *
 * @param {string} value
 *   URI to normalize.
 * @returns {string}
 *   Normalized URI.
 */
function normalizeUri(value) {
  /** @type {Array<string>} */
  const result = [];
  let index = -1;
  let start = 0;
  let skip = 0;
  while (++index < value.length) {
    const code = value.charCodeAt(index);
    /** @type {string} */
    let replace = '';

    // A correct percent encoded value.
    if (code === 37 && asciiAlphanumeric(value.charCodeAt(index + 1)) && asciiAlphanumeric(value.charCodeAt(index + 2))) {
      skip = 2;
    }
    // ASCII.
    else if (code < 128) {
      if (!/[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(code))) {
        replace = String.fromCharCode(code);
      }
    }
    // Astral.
    else if (code > 55_295 && code < 57_344) {
      const next = value.charCodeAt(index + 1);

      // A correct surrogate pair.
      if (code < 56_320 && next > 56_319 && next < 57_344) {
        replace = String.fromCharCode(code, next);
        skip = 1;
      }
      // Lone surrogate.
      else {
        replace = "\uFFFD";
      }
    }
    // Unicode.
    else {
      replace = String.fromCharCode(code);
    }
    if (replace) {
      result.push(value.slice(start, index), encodeURIComponent(replace));
      start = index + skip + 1;
      replace = '';
    }
    if (skip) {
      index += skip;
      skip = 0;
    }
  }
  return result.join('') + value.slice(start);
}

/**
 * @import {Event, Resolver, TokenizeContext} from 'micromark-util-types'
 */

/**
 * Call all `resolveAll`s.
 *
 * @param {ReadonlyArray<{resolveAll?: Resolver | undefined}>} constructs
 *   List of constructs, optionally with `resolveAll`s.
 * @param {Array<Event>} events
 *   List of events.
 * @param {TokenizeContext} context
 *   Context used by `tokenize`.
 * @returns {Array<Event>}
 *   Changed events.
 */
function resolveAll(constructs, events, context) {
  /** @type {Array<Resolver>} */
  const called = [];
  let index = -1;

  while (++index < constructs.length) {
    const resolve = constructs[index].resolveAll;

    if (resolve && !called.includes(resolve)) {
      events = resolve(events, context);
      called.push(resolve);
    }
  }

  return events
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   Event,
 *   Point,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const attention = {
  name: 'attention',
  resolveAll: resolveAllAttention,
  tokenize: tokenizeAttention
};

/**
 * Take all events and resolve attention to emphasis or strong.
 *
 * @type {Resolver}
 */
// eslint-disable-next-line complexity
function resolveAllAttention(events, context) {
  let index = -1;
  /** @type {number} */
  let open;
  /** @type {Token} */
  let group;
  /** @type {Token} */
  let text;
  /** @type {Token} */
  let openingSequence;
  /** @type {Token} */
  let closingSequence;
  /** @type {number} */
  let use;
  /** @type {Array<Event>} */
  let nextEvents;
  /** @type {number} */
  let offset;

  // Walk through all events.
  //
  // Note: performance of this is fine on an mb of normal markdown, but it’s
  // a bottleneck for malicious stuff.
  while (++index < events.length) {
    // Find a token that can close.
    if (events[index][0] === 'enter' && events[index][1].type === 'attentionSequence' && events[index][1]._close) {
      open = index;

      // Now walk back to find an opener.
      while (open--) {
        // Find a token that can open the closer.
        if (events[open][0] === 'exit' && events[open][1].type === 'attentionSequence' && events[open][1]._open &&
        // If the markers are the same:
        context.sliceSerialize(events[open][1]).charCodeAt(0) === context.sliceSerialize(events[index][1]).charCodeAt(0)) {
          // If the opening can close or the closing can open,
          // and the close size *is not* a multiple of three,
          // but the sum of the opening and closing size *is* multiple of three,
          // then don’t match.
          if ((events[open][1]._close || events[index][1]._open) && (events[index][1].end.offset - events[index][1].start.offset) % 3 && !((events[open][1].end.offset - events[open][1].start.offset + events[index][1].end.offset - events[index][1].start.offset) % 3)) {
            continue;
          }

          // Number of markers to use from the sequence.
          use = events[open][1].end.offset - events[open][1].start.offset > 1 && events[index][1].end.offset - events[index][1].start.offset > 1 ? 2 : 1;
          const start = {
            ...events[open][1].end
          };
          const end = {
            ...events[index][1].start
          };
          movePoint(start, -use);
          movePoint(end, use);
          openingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start,
            end: {
              ...events[open][1].end
            }
          };
          closingSequence = {
            type: use > 1 ? "strongSequence" : "emphasisSequence",
            start: {
              ...events[index][1].start
            },
            end
          };
          text = {
            type: use > 1 ? "strongText" : "emphasisText",
            start: {
              ...events[open][1].end
            },
            end: {
              ...events[index][1].start
            }
          };
          group = {
            type: use > 1 ? "strong" : "emphasis",
            start: {
              ...openingSequence.start
            },
            end: {
              ...closingSequence.end
            }
          };
          events[open][1].end = {
            ...openingSequence.start
          };
          events[index][1].start = {
            ...closingSequence.end
          };
          nextEvents = [];

          // If there are more markers in the opening, add them before.
          if (events[open][1].end.offset - events[open][1].start.offset) {
            nextEvents = push(nextEvents, [['enter', events[open][1], context], ['exit', events[open][1], context]]);
          }

          // Opening.
          nextEvents = push(nextEvents, [['enter', group, context], ['enter', openingSequence, context], ['exit', openingSequence, context], ['enter', text, context]]);

          // Always populated by defaults.

          // Between.
          nextEvents = push(nextEvents, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + 1, index), context));

          // Closing.
          nextEvents = push(nextEvents, [['exit', text, context], ['enter', closingSequence, context], ['exit', closingSequence, context], ['exit', group, context]]);

          // If there are more markers in the closing, add them after.
          if (events[index][1].end.offset - events[index][1].start.offset) {
            offset = 2;
            nextEvents = push(nextEvents, [['enter', events[index][1], context], ['exit', events[index][1], context]]);
          } else {
            offset = 0;
          }
          splice(events, open - 1, index - open + 3, nextEvents);
          index = open + nextEvents.length - offset - 2;
          break;
        }
      }
    }
  }

  // Remove remaining sequences.
  index = -1;
  while (++index < events.length) {
    if (events[index][1].type === 'attentionSequence') {
      events[index][1].type = 'data';
    }
  }
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeAttention(effects, ok) {
  const attentionMarkers = this.parser.constructs.attentionMarkers.null;
  const previous = this.previous;
  const before = classifyCharacter(previous);

  /** @type {NonNullable<Code>} */
  let marker;
  return start;

  /**
   * Before a sequence.
   *
   * ```markdown
   * > | **
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    marker = code;
    effects.enter('attentionSequence');
    return inside(code);
  }

  /**
   * In a sequence.
   *
   * ```markdown
   * > | **
   *     ^^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    if (code === marker) {
      effects.consume(code);
      return inside;
    }
    const token = effects.exit('attentionSequence');

    // To do: next major: move this to resolver, just like `markdown-rs`.
    const after = classifyCharacter(code);

    // Always populated by defaults.

    const open = !after || after === 2 && before || attentionMarkers.includes(code);
    const close = !before || before === 2 && after || attentionMarkers.includes(previous);
    token._open = Boolean(marker === 42 ? open : open && (before || !close));
    token._close = Boolean(marker === 42 ? close : close && (after || !open));
    return ok(code);
  }
}

/**
 * Move a point a bit.
 *
 * Note: `move` only works inside lines! It’s not possible to move past other
 * chunks (replacement characters, tabs, or line endings).
 *
 * @param {Point} point
 *   Point.
 * @param {number} offset
 *   Amount to move.
 * @returns {undefined}
 *   Nothing.
 */
function movePoint(point, offset) {
  point.column += offset;
  point.offset += offset;
  point._bufferIndex += offset;
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const autolink = {
  name: 'autolink',
  tokenize: tokenizeAutolink
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeAutolink(effects, ok, nok) {
  let size = 0;
  return start;

  /**
   * Start of an autolink.
   *
   * ```markdown
   * > | a<https://example.com>b
   *      ^
   * > | a<user@example.com>b
   *      ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("autolink");
    effects.enter("autolinkMarker");
    effects.consume(code);
    effects.exit("autolinkMarker");
    effects.enter("autolinkProtocol");
    return open;
  }

  /**
   * After `<`, at protocol or atext.
   *
   * ```markdown
   * > | a<https://example.com>b
   *       ^
   * > | a<user@example.com>b
   *       ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (asciiAlpha(code)) {
      effects.consume(code);
      return schemeOrEmailAtext;
    }
    if (code === 64) {
      return nok(code);
    }
    return emailAtext(code);
  }

  /**
   * At second byte of protocol or atext.
   *
   * ```markdown
   * > | a<https://example.com>b
   *        ^
   * > | a<user@example.com>b
   *        ^
   * ```
   *
   * @type {State}
   */
  function schemeOrEmailAtext(code) {
    // ASCII alphanumeric and `+`, `-`, and `.`.
    if (code === 43 || code === 45 || code === 46 || asciiAlphanumeric(code)) {
      // Count the previous alphabetical from `open` too.
      size = 1;
      return schemeInsideOrEmailAtext(code);
    }
    return emailAtext(code);
  }

  /**
   * In ambiguous protocol or atext.
   *
   * ```markdown
   * > | a<https://example.com>b
   *        ^
   * > | a<user@example.com>b
   *        ^
   * ```
   *
   * @type {State}
   */
  function schemeInsideOrEmailAtext(code) {
    if (code === 58) {
      effects.consume(code);
      size = 0;
      return urlInside;
    }

    // ASCII alphanumeric and `+`, `-`, and `.`.
    if ((code === 43 || code === 45 || code === 46 || asciiAlphanumeric(code)) && size++ < 32) {
      effects.consume(code);
      return schemeInsideOrEmailAtext;
    }
    size = 0;
    return emailAtext(code);
  }

  /**
   * After protocol, in URL.
   *
   * ```markdown
   * > | a<https://example.com>b
   *             ^
   * ```
   *
   * @type {State}
   */
  function urlInside(code) {
    if (code === 62) {
      effects.exit("autolinkProtocol");
      effects.enter("autolinkMarker");
      effects.consume(code);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok;
    }

    // ASCII control, space, or `<`.
    if (code === null || code === 32 || code === 60 || asciiControl(code)) {
      return nok(code);
    }
    effects.consume(code);
    return urlInside;
  }

  /**
   * In email atext.
   *
   * ```markdown
   * > | a<user.name@example.com>b
   *              ^
   * ```
   *
   * @type {State}
   */
  function emailAtext(code) {
    if (code === 64) {
      effects.consume(code);
      return emailAtSignOrDot;
    }
    if (asciiAtext(code)) {
      effects.consume(code);
      return emailAtext;
    }
    return nok(code);
  }

  /**
   * In label, after at-sign or dot.
   *
   * ```markdown
   * > | a<user.name@example.com>b
   *                 ^       ^
   * ```
   *
   * @type {State}
   */
  function emailAtSignOrDot(code) {
    return asciiAlphanumeric(code) ? emailLabel(code) : nok(code);
  }

  /**
   * In label, where `.` and `>` are allowed.
   *
   * ```markdown
   * > | a<user.name@example.com>b
   *                   ^
   * ```
   *
   * @type {State}
   */
  function emailLabel(code) {
    if (code === 46) {
      effects.consume(code);
      size = 0;
      return emailAtSignOrDot;
    }
    if (code === 62) {
      // Exit, then change the token type.
      effects.exit("autolinkProtocol").type = "autolinkEmail";
      effects.enter("autolinkMarker");
      effects.consume(code);
      effects.exit("autolinkMarker");
      effects.exit("autolink");
      return ok;
    }
    return emailValue(code);
  }

  /**
   * In label, where `.` and `>` are *not* allowed.
   *
   * Though, this is also used in `emailLabel` to parse other values.
   *
   * ```markdown
   * > | a<user.name@ex-ample.com>b
   *                    ^
   * ```
   *
   * @type {State}
   */
  function emailValue(code) {
    // ASCII alphanumeric or `-`.
    if ((code === 45 || asciiAlphanumeric(code)) && size++ < 63) {
      const next = code === 45 ? emailValue : emailLabel;
      effects.consume(code);
      return next;
    }
    return nok(code);
  }
}

/**
 * @import {Effects, State, TokenType} from 'micromark-util-types'
 */


// To do: implement `spaceOrTab`, `spaceOrTabMinMax`, `spaceOrTabWithOptions`.

/**
 * Parse spaces and tabs.
 *
 * There is no `nok` parameter:
 *
 * *   spaces in markdown are often optional, in which case this factory can be
 *     used and `ok` will be switched to whether spaces were found or not
 * *   one line ending or space can be detected with `markdownSpace(code)` right
 *     before using `factorySpace`
 *
 * ###### Examples
 *
 * Where `␉` represents a tab (plus how much it expands) and `␠` represents a
 * single space.
 *
 * ```markdown
 * ␉
 * ␠␠␠␠
 * ␉␠
 * ```
 *
 * @param {Effects} effects
 *   Context.
 * @param {State} ok
 *   State switched to when successful.
 * @param {TokenType} type
 *   Type (`' \t'`).
 * @param {number | undefined} [max=Infinity]
 *   Max (exclusive).
 * @returns {State}
 *   Start state.
 */
function factorySpace(effects, ok, type, max) {
  const limit = max ? max - 1 : Number.POSITIVE_INFINITY;
  let size = 0;
  return start;

  /** @type {State} */
  function start(code) {
    if (markdownSpace(code)) {
      effects.enter(type);
      return prefix(code);
    }
    return ok(code);
  }

  /** @type {State} */
  function prefix(code) {
    if (markdownSpace(code) && size++ < limit) {
      effects.consume(code);
      return prefix;
    }
    effects.exit(type);
    return ok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const blankLine = {
  partial: true,
  tokenize: tokenizeBlankLine
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeBlankLine(effects, ok, nok) {
  return start;

  /**
   * Start of blank line.
   *
   * > 👉 **Note**: `␠` represents a space character.
   *
   * ```markdown
   * > | ␠␠␊
   *     ^
   * > | ␊
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    return markdownSpace(code) ? factorySpace(effects, after, "linePrefix")(code) : after(code);
  }

  /**
   * At eof/eol, after optional whitespace.
   *
   * > 👉 **Note**: `␠` represents a space character.
   *
   * ```markdown
   * > | ␠␠␊
   *       ^
   * > | ␊
   *     ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    return code === null || markdownLineEnding(code) ? ok(code) : nok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   Exiter,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const blockQuote = {
  continuation: {
    tokenize: tokenizeBlockQuoteContinuation
  },
  exit,
  name: 'blockQuote',
  tokenize: tokenizeBlockQuoteStart
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeBlockQuoteStart(effects, ok, nok) {
  const self = this;
  return start;

  /**
   * Start of block quote.
   *
   * ```markdown
   * > | > a
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    if (code === 62) {
      const state = self.containerState;
      if (!state.open) {
        effects.enter("blockQuote", {
          _container: true
        });
        state.open = true;
      }
      effects.enter("blockQuotePrefix");
      effects.enter("blockQuoteMarker");
      effects.consume(code);
      effects.exit("blockQuoteMarker");
      return after;
    }
    return nok(code);
  }

  /**
   * After `>`, before optional whitespace.
   *
   * ```markdown
   * > | > a
   *      ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    if (markdownSpace(code)) {
      effects.enter("blockQuotePrefixWhitespace");
      effects.consume(code);
      effects.exit("blockQuotePrefixWhitespace");
      effects.exit("blockQuotePrefix");
      return ok;
    }
    effects.exit("blockQuotePrefix");
    return ok(code);
  }
}

/**
 * Start of block quote continuation.
 *
 * ```markdown
 *   | > a
 * > | > b
 *     ^
 * ```
 *
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeBlockQuoteContinuation(effects, ok, nok) {
  const self = this;
  return contStart;

  /**
   * Start of block quote continuation.
   *
   * Also used to parse the first block quote opening.
   *
   * ```markdown
   *   | > a
   * > | > b
   *     ^
   * ```
   *
   * @type {State}
   */
  function contStart(code) {
    if (markdownSpace(code)) {
      // Always populated by defaults.

      return factorySpace(effects, contBefore, "linePrefix", self.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4)(code);
    }
    return contBefore(code);
  }

  /**
   * At `>`, after optional whitespace.
   *
   * Also used to parse the first block quote opening.
   *
   * ```markdown
   *   | > a
   * > | > b
   *     ^
   * ```
   *
   * @type {State}
   */
  function contBefore(code) {
    return effects.attempt(blockQuote, ok, nok)(code);
  }
}

/** @type {Exiter} */
function exit(effects) {
  effects.exit("blockQuote");
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const characterEscape = {
  name: 'characterEscape',
  tokenize: tokenizeCharacterEscape
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeCharacterEscape(effects, ok, nok) {
  return start;

  /**
   * Start of character escape.
   *
   * ```markdown
   * > | a\*b
   *      ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("characterEscape");
    effects.enter("escapeMarker");
    effects.consume(code);
    effects.exit("escapeMarker");
    return inside;
  }

  /**
   * After `\`, at punctuation.
   *
   * ```markdown
   * > | a\*b
   *       ^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    // ASCII punctuation.
    if (asciiPunctuation(code)) {
      effects.enter("characterEscapeValue");
      effects.consume(code);
      effects.exit("characterEscapeValue");
      effects.exit("characterEscape");
      return ok;
    }
    return nok(code);
  }
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const characterReference = {
  name: 'characterReference',
  tokenize: tokenizeCharacterReference
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeCharacterReference(effects, ok, nok) {
  const self = this;
  let size = 0;
  /** @type {number} */
  let max;
  /** @type {(code: Code) => boolean} */
  let test;
  return start;

  /**
   * Start of character reference.
   *
   * ```markdown
   * > | a&amp;b
   *      ^
   * > | a&#123;b
   *      ^
   * > | a&#x9;b
   *      ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("characterReference");
    effects.enter("characterReferenceMarker");
    effects.consume(code);
    effects.exit("characterReferenceMarker");
    return open;
  }

  /**
   * After `&`, at `#` for numeric references or alphanumeric for named
   * references.
   *
   * ```markdown
   * > | a&amp;b
   *       ^
   * > | a&#123;b
   *       ^
   * > | a&#x9;b
   *       ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (code === 35) {
      effects.enter("characterReferenceMarkerNumeric");
      effects.consume(code);
      effects.exit("characterReferenceMarkerNumeric");
      return numeric;
    }
    effects.enter("characterReferenceValue");
    max = 31;
    test = asciiAlphanumeric;
    return value(code);
  }

  /**
   * After `#`, at `x` for hexadecimals or digit for decimals.
   *
   * ```markdown
   * > | a&#123;b
   *        ^
   * > | a&#x9;b
   *        ^
   * ```
   *
   * @type {State}
   */
  function numeric(code) {
    if (code === 88 || code === 120) {
      effects.enter("characterReferenceMarkerHexadecimal");
      effects.consume(code);
      effects.exit("characterReferenceMarkerHexadecimal");
      effects.enter("characterReferenceValue");
      max = 6;
      test = asciiHexDigit;
      return value;
    }
    effects.enter("characterReferenceValue");
    max = 7;
    test = asciiDigit;
    return value(code);
  }

  /**
   * After markers (`&#x`, `&#`, or `&`), in value, before `;`.
   *
   * The character reference kind defines what and how many characters are
   * allowed.
   *
   * ```markdown
   * > | a&amp;b
   *       ^^^
   * > | a&#123;b
   *        ^^^
   * > | a&#x9;b
   *         ^
   * ```
   *
   * @type {State}
   */
  function value(code) {
    if (code === 59 && size) {
      const token = effects.exit("characterReferenceValue");
      if (test === asciiAlphanumeric && !decodeNamedCharacterReference(self.sliceSerialize(token))) {
        return nok(code);
      }

      // To do: `markdown-rs` uses a different name:
      // `CharacterReferenceMarkerSemi`.
      effects.enter("characterReferenceMarker");
      effects.consume(code);
      effects.exit("characterReferenceMarker");
      effects.exit("characterReference");
      return ok;
    }
    if (test(code) && size++ < max) {
      effects.consume(code);
      return value;
    }
    return nok(code);
  }
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const nonLazyContinuation = {
  partial: true,
  tokenize: tokenizeNonLazyContinuation
};

/** @type {Construct} */
const codeFenced = {
  concrete: true,
  name: 'codeFenced',
  tokenize: tokenizeCodeFenced
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeCodeFenced(effects, ok, nok) {
  const self = this;
  /** @type {Construct} */
  const closeStart = {
    partial: true,
    tokenize: tokenizeCloseStart
  };
  let initialPrefix = 0;
  let sizeOpen = 0;
  /** @type {NonNullable<Code>} */
  let marker;
  return start;

  /**
   * Start of code.
   *
   * ```markdown
   * > | ~~~js
   *     ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // To do: parse whitespace like `markdown-rs`.
    return beforeSequenceOpen(code);
  }

  /**
   * In opening fence, after prefix, at sequence.
   *
   * ```markdown
   * > | ~~~js
   *     ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function beforeSequenceOpen(code) {
    const tail = self.events[self.events.length - 1];
    initialPrefix = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
    marker = code;
    effects.enter("codeFenced");
    effects.enter("codeFencedFence");
    effects.enter("codeFencedFenceSequence");
    return sequenceOpen(code);
  }

  /**
   * In opening fence sequence.
   *
   * ```markdown
   * > | ~~~js
   *      ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function sequenceOpen(code) {
    if (code === marker) {
      sizeOpen++;
      effects.consume(code);
      return sequenceOpen;
    }
    if (sizeOpen < 3) {
      return nok(code);
    }
    effects.exit("codeFencedFenceSequence");
    return markdownSpace(code) ? factorySpace(effects, infoBefore, "whitespace")(code) : infoBefore(code);
  }

  /**
   * In opening fence, after the sequence (and optional whitespace), before info.
   *
   * ```markdown
   * > | ~~~js
   *        ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function infoBefore(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("codeFencedFence");
      return self.interrupt ? ok(code) : effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
    }
    effects.enter("codeFencedFenceInfo");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return info(code);
  }

  /**
   * In info.
   *
   * ```markdown
   * > | ~~~js
   *        ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function info(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return infoBefore(code);
    }
    if (markdownSpace(code)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceInfo");
      return factorySpace(effects, metaBefore, "whitespace")(code);
    }
    if (code === 96 && code === marker) {
      return nok(code);
    }
    effects.consume(code);
    return info;
  }

  /**
   * In opening fence, after info and whitespace, before meta.
   *
   * ```markdown
   * > | ~~~js eval
   *           ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function metaBefore(code) {
    if (code === null || markdownLineEnding(code)) {
      return infoBefore(code);
    }
    effects.enter("codeFencedFenceMeta");
    effects.enter("chunkString", {
      contentType: "string"
    });
    return meta(code);
  }

  /**
   * In meta.
   *
   * ```markdown
   * > | ~~~js eval
   *           ^
   *   | alert(1)
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function meta(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("chunkString");
      effects.exit("codeFencedFenceMeta");
      return infoBefore(code);
    }
    if (code === 96 && code === marker) {
      return nok(code);
    }
    effects.consume(code);
    return meta;
  }

  /**
   * At eol/eof in code, before a non-lazy closing fence or content.
   *
   * ```markdown
   * > | ~~~js
   *          ^
   * > | alert(1)
   *             ^
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function atNonLazyBreak(code) {
    return effects.attempt(closeStart, after, contentBefore)(code);
  }

  /**
   * Before code content, not a closing fence, at eol.
   *
   * ```markdown
   *   | ~~~js
   * > | alert(1)
   *             ^
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function contentBefore(code) {
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return contentStart;
  }

  /**
   * Before code content, not a closing fence.
   *
   * ```markdown
   *   | ~~~js
   * > | alert(1)
   *     ^
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function contentStart(code) {
    return initialPrefix > 0 && markdownSpace(code) ? factorySpace(effects, beforeContentChunk, "linePrefix", initialPrefix + 1)(code) : beforeContentChunk(code);
  }

  /**
   * Before code content, after optional prefix.
   *
   * ```markdown
   *   | ~~~js
   * > | alert(1)
   *     ^
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function beforeContentChunk(code) {
    if (code === null || markdownLineEnding(code)) {
      return effects.check(nonLazyContinuation, atNonLazyBreak, after)(code);
    }
    effects.enter("codeFlowValue");
    return contentChunk(code);
  }

  /**
   * In code content.
   *
   * ```markdown
   *   | ~~~js
   * > | alert(1)
   *     ^^^^^^^^
   *   | ~~~
   * ```
   *
   * @type {State}
   */
  function contentChunk(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("codeFlowValue");
      return beforeContentChunk(code);
    }
    effects.consume(code);
    return contentChunk;
  }

  /**
   * After code.
   *
   * ```markdown
   *   | ~~~js
   *   | alert(1)
   * > | ~~~
   *        ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    effects.exit("codeFenced");
    return ok(code);
  }

  /**
   * @this {TokenizeContext}
   *   Context.
   * @type {Tokenizer}
   */
  function tokenizeCloseStart(effects, ok, nok) {
    let size = 0;
    return startBefore;

    /**
     *
     *
     * @type {State}
     */
    function startBefore(code) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return start;
    }

    /**
     * Before closing fence, at optional whitespace.
     *
     * ```markdown
     *   | ~~~js
     *   | alert(1)
     * > | ~~~
     *     ^
     * ```
     *
     * @type {State}
     */
    function start(code) {
      // Always populated by defaults.

      // To do: `enter` here or in next state?
      effects.enter("codeFencedFence");
      return markdownSpace(code) ? factorySpace(effects, beforeSequenceClose, "linePrefix", self.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4)(code) : beforeSequenceClose(code);
    }

    /**
     * In closing fence, after optional whitespace, at sequence.
     *
     * ```markdown
     *   | ~~~js
     *   | alert(1)
     * > | ~~~
     *     ^
     * ```
     *
     * @type {State}
     */
    function beforeSequenceClose(code) {
      if (code === marker) {
        effects.enter("codeFencedFenceSequence");
        return sequenceClose(code);
      }
      return nok(code);
    }

    /**
     * In closing fence sequence.
     *
     * ```markdown
     *   | ~~~js
     *   | alert(1)
     * > | ~~~
     *     ^
     * ```
     *
     * @type {State}
     */
    function sequenceClose(code) {
      if (code === marker) {
        size++;
        effects.consume(code);
        return sequenceClose;
      }
      if (size >= sizeOpen) {
        effects.exit("codeFencedFenceSequence");
        return markdownSpace(code) ? factorySpace(effects, sequenceCloseAfter, "whitespace")(code) : sequenceCloseAfter(code);
      }
      return nok(code);
    }

    /**
     * After closing fence sequence, after optional whitespace.
     *
     * ```markdown
     *   | ~~~js
     *   | alert(1)
     * > | ~~~
     *        ^
     * ```
     *
     * @type {State}
     */
    function sequenceCloseAfter(code) {
      if (code === null || markdownLineEnding(code)) {
        effects.exit("codeFencedFence");
        return ok(code);
      }
      return nok(code);
    }
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeNonLazyContinuation(effects, ok, nok) {
  const self = this;
  return start;

  /**
   *
   *
   * @type {State}
   */
  function start(code) {
    if (code === null) {
      return nok(code);
    }
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return lineStart;
  }

  /**
   *
   *
   * @type {State}
   */
  function lineStart(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const codeIndented = {
  name: 'codeIndented',
  tokenize: tokenizeCodeIndented
};

/** @type {Construct} */
const furtherStart = {
  partial: true,
  tokenize: tokenizeFurtherStart
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeCodeIndented(effects, ok, nok) {
  const self = this;
  return start;

  /**
   * Start of code (indented).
   *
   * > **Parsing note**: it is not needed to check if this first line is a
   * > filled line (that it has a non-whitespace character), because blank lines
   * > are parsed already, so we never run into that.
   *
   * ```markdown
   * > |     aaa
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // To do: manually check if interrupting like `markdown-rs`.

    effects.enter("codeIndented");
    // To do: use an improved `space_or_tab` function like `markdown-rs`,
    // so that we can drop the next state.
    return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code);
  }

  /**
   * At start, after 1 or 4 spaces.
   *
   * ```markdown
   * > |     aaa
   *         ^
   * ```
   *
   * @type {State}
   */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? atBreak(code) : nok(code);
  }

  /**
   * At a break.
   *
   * ```markdown
   * > |     aaa
   *         ^  ^
   * ```
   *
   * @type {State}
   */
  function atBreak(code) {
    if (code === null) {
      return after(code);
    }
    if (markdownLineEnding(code)) {
      return effects.attempt(furtherStart, atBreak, after)(code);
    }
    effects.enter("codeFlowValue");
    return inside(code);
  }

  /**
   * In code content.
   *
   * ```markdown
   * > |     aaa
   *         ^^^^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("codeFlowValue");
      return atBreak(code);
    }
    effects.consume(code);
    return inside;
  }

  /** @type {State} */
  function after(code) {
    effects.exit("codeIndented");
    // To do: allow interrupting like `markdown-rs`.
    // Feel free to interrupt.
    // tokenizer.interrupt = false
    return ok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeFurtherStart(effects, ok, nok) {
  const self = this;
  return furtherStart;

  /**
   * At eol, trying to parse another indent.
   *
   * ```markdown
   * > |     aaa
   *            ^
   *   |     bbb
   * ```
   *
   * @type {State}
   */
  function furtherStart(code) {
    // To do: improve `lazy` / `pierce` handling.
    // If this is a lazy line, it can’t be code.
    if (self.parser.lazy[self.now().line]) {
      return nok(code);
    }
    if (markdownLineEnding(code)) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return furtherStart;
    }

    // To do: the code here in `micromark-js` is a bit different from
    // `markdown-rs` because there it can attempt spaces.
    // We can’t yet.
    //
    // To do: use an improved `space_or_tab` function like `markdown-rs`,
    // so that we can drop the next state.
    return factorySpace(effects, afterPrefix, "linePrefix", 4 + 1)(code);
  }

  /**
   * At start, after 1 or 4 spaces.
   *
   * ```markdown
   * > |     aaa
   *         ^
   * ```
   *
   * @type {State}
   */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4 ? ok(code) : markdownLineEnding(code) ? furtherStart(code) : nok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   Previous,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const codeText = {
  name: 'codeText',
  previous,
  resolve: resolveCodeText,
  tokenize: tokenizeCodeText
};

// To do: next major: don’t resolve, like `markdown-rs`.
/** @type {Resolver} */
function resolveCodeText(events) {
  let tailExitIndex = events.length - 4;
  let headEnterIndex = 3;
  /** @type {number} */
  let index;
  /** @type {number | undefined} */
  let enter;

  // If we start and end with an EOL or a space.
  if ((events[headEnterIndex][1].type === "lineEnding" || events[headEnterIndex][1].type === 'space') && (events[tailExitIndex][1].type === "lineEnding" || events[tailExitIndex][1].type === 'space')) {
    index = headEnterIndex;

    // And we have data.
    while (++index < tailExitIndex) {
      if (events[index][1].type === "codeTextData") {
        // Then we have padding.
        events[headEnterIndex][1].type = "codeTextPadding";
        events[tailExitIndex][1].type = "codeTextPadding";
        headEnterIndex += 2;
        tailExitIndex -= 2;
        break;
      }
    }
  }

  // Merge adjacent spaces and data.
  index = headEnterIndex - 1;
  tailExitIndex++;
  while (++index <= tailExitIndex) {
    if (enter === undefined) {
      if (index !== tailExitIndex && events[index][1].type !== "lineEnding") {
        enter = index;
      }
    } else if (index === tailExitIndex || events[index][1].type === "lineEnding") {
      events[enter][1].type = "codeTextData";
      if (index !== enter + 2) {
        events[enter][1].end = events[index - 1][1].end;
        events.splice(enter + 2, index - enter - 2);
        tailExitIndex -= index - enter - 2;
        index = enter + 2;
      }
      enter = undefined;
    }
  }
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Previous}
 */
function previous(code) {
  // If there is a previous code, there will always be a tail.
  return code !== 96 || this.events[this.events.length - 1][1].type === "characterEscape";
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeCodeText(effects, ok, nok) {
  let sizeOpen = 0;
  /** @type {number} */
  let size;
  /** @type {Token} */
  let token;
  return start;

  /**
   * Start of code (text).
   *
   * ```markdown
   * > | `a`
   *     ^
   * > | \`a`
   *      ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("codeText");
    effects.enter("codeTextSequence");
    return sequenceOpen(code);
  }

  /**
   * In opening sequence.
   *
   * ```markdown
   * > | `a`
   *     ^
   * ```
   *
   * @type {State}
   */
  function sequenceOpen(code) {
    if (code === 96) {
      effects.consume(code);
      sizeOpen++;
      return sequenceOpen;
    }
    effects.exit("codeTextSequence");
    return between(code);
  }

  /**
   * Between something and something else.
   *
   * ```markdown
   * > | `a`
   *      ^^
   * ```
   *
   * @type {State}
   */
  function between(code) {
    // EOF.
    if (code === null) {
      return nok(code);
    }

    // To do: next major: don’t do spaces in resolve, but when compiling,
    // like `markdown-rs`.
    // Tabs don’t work, and virtual spaces don’t make sense.
    if (code === 32) {
      effects.enter('space');
      effects.consume(code);
      effects.exit('space');
      return between;
    }

    // Closing fence? Could also be data.
    if (code === 96) {
      token = effects.enter("codeTextSequence");
      size = 0;
      return sequenceClose(code);
    }
    if (markdownLineEnding(code)) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return between;
    }

    // Data.
    effects.enter("codeTextData");
    return data(code);
  }

  /**
   * In data.
   *
   * ```markdown
   * > | `a`
   *      ^
   * ```
   *
   * @type {State}
   */
  function data(code) {
    if (code === null || code === 32 || code === 96 || markdownLineEnding(code)) {
      effects.exit("codeTextData");
      return between(code);
    }
    effects.consume(code);
    return data;
  }

  /**
   * In closing sequence.
   *
   * ```markdown
   * > | `a`
   *       ^
   * ```
   *
   * @type {State}
   */
  function sequenceClose(code) {
    // More.
    if (code === 96) {
      effects.consume(code);
      size++;
      return sequenceClose;
    }

    // Done!
    if (size === sizeOpen) {
      effects.exit("codeTextSequence");
      effects.exit("codeText");
      return ok(code);
    }

    // More or less accents: mark as data.
    token.type = "codeTextData";
    return data(code);
  }
}

/**
 * Some of the internal operations of micromark do lots of editing
 * operations on very large arrays. This runs into problems with two
 * properties of most circa-2020 JavaScript interpreters:
 *
 *  - Array-length modifications at the high end of an array (push/pop) are
 *    expected to be common and are implemented in (amortized) time
 *    proportional to the number of elements added or removed, whereas
 *    other operations (shift/unshift and splice) are much less efficient.
 *  - Function arguments are passed on the stack, so adding tens of thousands
 *    of elements to an array with `arr.push(...newElements)` will frequently
 *    cause stack overflows. (see <https://stackoverflow.com/questions/22123769/rangeerror-maximum-call-stack-size-exceeded-why>)
 *
 * SpliceBuffers are an implementation of gap buffers, which are a
 * generalization of the "queue made of two stacks" idea. The splice buffer
 * maintains a cursor, and moving the cursor has cost proportional to the
 * distance the cursor moves, but inserting, deleting, or splicing in
 * new information at the cursor is as efficient as the push/pop operation.
 * This allows for an efficient sequence of splices (or pushes, pops, shifts,
 * or unshifts) as long such edits happen at the same part of the array or
 * generally sweep through the array from the beginning to the end.
 *
 * The interface for splice buffers also supports large numbers of inputs by
 * passing a single array argument rather passing multiple arguments on the
 * function call stack.
 *
 * @template T
 *   Item type.
 */
class SpliceBuffer {
  /**
   * @param {ReadonlyArray<T> | null | undefined} [initial]
   *   Initial items (optional).
   * @returns
   *   Splice buffer.
   */
  constructor(initial) {
    /** @type {Array<T>} */
    this.left = initial ? [...initial] : [];
    /** @type {Array<T>} */
    this.right = [];
  }

  /**
   * Array access;
   * does not move the cursor.
   *
   * @param {number} index
   *   Index.
   * @return {T}
   *   Item.
   */
  get(index) {
    if (index < 0 || index >= this.left.length + this.right.length) {
      throw new RangeError('Cannot access index `' + index + '` in a splice buffer of size `' + (this.left.length + this.right.length) + '`');
    }
    if (index < this.left.length) return this.left[index];
    return this.right[this.right.length - index + this.left.length - 1];
  }

  /**
   * The length of the splice buffer, one greater than the largest index in the
   * array.
   */
  get length() {
    return this.left.length + this.right.length;
  }

  /**
   * Remove and return `list[0]`;
   * moves the cursor to `0`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  shift() {
    this.setCursor(0);
    return this.right.pop();
  }

  /**
   * Slice the buffer to get an array;
   * does not move the cursor.
   *
   * @param {number} start
   *   Start.
   * @param {number | null | undefined} [end]
   *   End (optional).
   * @returns {Array<T>}
   *   Array of items.
   */
  slice(start, end) {
    /** @type {number} */
    const stop = end === null || end === undefined ? Number.POSITIVE_INFINITY : end;
    if (stop < this.left.length) {
      return this.left.slice(start, stop);
    }
    if (start > this.left.length) {
      return this.right.slice(this.right.length - stop + this.left.length, this.right.length - start + this.left.length).reverse();
    }
    return this.left.slice(start).concat(this.right.slice(this.right.length - stop + this.left.length).reverse());
  }

  /**
   * Mimics the behavior of Array.prototype.splice() except for the change of
   * interface necessary to avoid segfaults when patching in very large arrays.
   *
   * This operation moves cursor is moved to `start` and results in the cursor
   * placed after any inserted items.
   *
   * @param {number} start
   *   Start;
   *   zero-based index at which to start changing the array;
   *   negative numbers count backwards from the end of the array and values
   *   that are out-of bounds are clamped to the appropriate end of the array.
   * @param {number | null | undefined} [deleteCount=0]
   *   Delete count (default: `0`);
   *   maximum number of elements to delete, starting from start.
   * @param {Array<T> | null | undefined} [items=[]]
   *   Items to include in place of the deleted items (default: `[]`).
   * @return {Array<T>}
   *   Any removed items.
   */
  splice(start, deleteCount, items) {
    /** @type {number} */
    const count = deleteCount || 0;
    this.setCursor(Math.trunc(start));
    const removed = this.right.splice(this.right.length - count, Number.POSITIVE_INFINITY);
    if (items) chunkedPush(this.left, items);
    return removed.reverse();
  }

  /**
   * Remove and return the highest-numbered item in the array, so
   * `list[list.length - 1]`;
   * Moves the cursor to `length`.
   *
   * @returns {T | undefined}
   *   Item, optional.
   */
  pop() {
    this.setCursor(Number.POSITIVE_INFINITY);
    return this.left.pop();
  }

  /**
   * Inserts a single item to the high-numbered side of the array;
   * moves the cursor to `length`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  push(item) {
    this.setCursor(Number.POSITIVE_INFINITY);
    this.left.push(item);
  }

  /**
   * Inserts many items to the high-numbered side of the array.
   * Moves the cursor to `length`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  pushMany(items) {
    this.setCursor(Number.POSITIVE_INFINITY);
    chunkedPush(this.left, items);
  }

  /**
   * Inserts a single item to the low-numbered side of the array;
   * Moves the cursor to `0`.
   *
   * @param {T} item
   *   Item.
   * @returns {undefined}
   *   Nothing.
   */
  unshift(item) {
    this.setCursor(0);
    this.right.push(item);
  }

  /**
   * Inserts many items to the low-numbered side of the array;
   * moves the cursor to `0`.
   *
   * @param {Array<T>} items
   *   Items.
   * @returns {undefined}
   *   Nothing.
   */
  unshiftMany(items) {
    this.setCursor(0);
    chunkedPush(this.right, items.reverse());
  }

  /**
   * Move the cursor to a specific position in the array. Requires
   * time proportional to the distance moved.
   *
   * If `n < 0`, the cursor will end up at the beginning.
   * If `n > length`, the cursor will end up at the end.
   *
   * @param {number} n
   *   Position.
   * @return {undefined}
   *   Nothing.
   */
  setCursor(n) {
    if (n === this.left.length || n > this.left.length && this.right.length === 0 || n < 0 && this.left.length === 0) return;
    if (n < this.left.length) {
      // Move cursor to the this.left
      const removed = this.left.splice(n, Number.POSITIVE_INFINITY);
      chunkedPush(this.right, removed.reverse());
    } else {
      // Move cursor to the this.right
      const removed = this.right.splice(this.left.length + this.right.length - n, Number.POSITIVE_INFINITY);
      chunkedPush(this.left, removed.reverse());
    }
  }
}

/**
 * Avoid stack overflow by pushing items onto the stack in segments
 *
 * @template T
 *   Item type.
 * @param {Array<T>} list
 *   List to inject into.
 * @param {ReadonlyArray<T>} right
 *   Items to inject.
 * @return {undefined}
 *   Nothing.
 */
function chunkedPush(list, right) {
  /** @type {number} */
  let chunkStart = 0;
  if (right.length < 10000) {
    list.push(...right);
  } else {
    while (chunkStart < right.length) {
      list.push(...right.slice(chunkStart, chunkStart + 10000));
      chunkStart += 10000;
    }
  }
}

/**
 * @import {Chunk, Event, Token} from 'micromark-util-types'
 */


/**
 * Tokenize subcontent.
 *
 * @param {Array<Event>} eventsArray
 *   List of events.
 * @returns {boolean}
 *   Whether subtokens were found.
 */
// eslint-disable-next-line complexity
function subtokenize(eventsArray) {
  /** @type {Record<string, number>} */
  const jumps = {};
  let index = -1;
  /** @type {Event} */
  let event;
  /** @type {number | undefined} */
  let lineIndex;
  /** @type {number} */
  let otherIndex;
  /** @type {Event} */
  let otherEvent;
  /** @type {Array<Event>} */
  let parameters;
  /** @type {Array<Event>} */
  let subevents;
  /** @type {boolean | undefined} */
  let more;
  const events = new SpliceBuffer(eventsArray);
  while (++index < events.length) {
    while (index in jumps) {
      index = jumps[index];
    }
    event = events.get(index);

    // Add a hook for the GFM tasklist extension, which needs to know if text
    // is in the first content of a list item.
    if (index && event[1].type === "chunkFlow" && events.get(index - 1)[1].type === "listItemPrefix") {
      subevents = event[1]._tokenizer.events;
      otherIndex = 0;
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "lineEndingBlank") {
        otherIndex += 2;
      }
      if (otherIndex < subevents.length && subevents[otherIndex][1].type === "content") {
        while (++otherIndex < subevents.length) {
          if (subevents[otherIndex][1].type === "content") {
            break;
          }
          if (subevents[otherIndex][1].type === "chunkText") {
            subevents[otherIndex][1]._isInFirstContentOfListItem = true;
            otherIndex++;
          }
        }
      }
    }

    // Enter.
    if (event[0] === 'enter') {
      if (event[1].contentType) {
        Object.assign(jumps, subcontent(events, index));
        index = jumps[index];
        more = true;
      }
    }
    // Exit.
    else if (event[1]._container) {
      otherIndex = index;
      lineIndex = undefined;
      while (otherIndex--) {
        otherEvent = events.get(otherIndex);
        if (otherEvent[1].type === "lineEnding" || otherEvent[1].type === "lineEndingBlank") {
          if (otherEvent[0] === 'enter') {
            if (lineIndex) {
              events.get(lineIndex)[1].type = "lineEndingBlank";
            }
            otherEvent[1].type = "lineEnding";
            lineIndex = otherIndex;
          }
        } else if (otherEvent[1].type === "linePrefix" || otherEvent[1].type === "listItemIndent") ; else {
          break;
        }
      }
      if (lineIndex) {
        // Fix position.
        event[1].end = {
          ...events.get(lineIndex)[1].start
        };

        // Switch container exit w/ line endings.
        parameters = events.slice(lineIndex, index);
        parameters.unshift(event);
        events.splice(lineIndex, index - lineIndex + 1, parameters);
      }
    }
  }

  // The changes to the `events` buffer must be copied back into the eventsArray
  splice(eventsArray, 0, Number.POSITIVE_INFINITY, events.slice(0));
  return !more;
}

/**
 * Tokenize embedded tokens.
 *
 * @param {SpliceBuffer<Event>} events
 *   Events.
 * @param {number} eventIndex
 *   Index.
 * @returns {Record<string, number>}
 *   Gaps.
 */
function subcontent(events, eventIndex) {
  const token = events.get(eventIndex)[1];
  const context = events.get(eventIndex)[2];
  let startPosition = eventIndex - 1;
  /** @type {Array<number>} */
  const startPositions = [];
  let tokenizer = token._tokenizer;
  if (!tokenizer) {
    tokenizer = context.parser[token.contentType](token.start);
    if (token._contentTypeTextTrailing) {
      tokenizer._contentTypeTextTrailing = true;
    }
  }
  const childEvents = tokenizer.events;
  /** @type {Array<[number, number]>} */
  const jumps = [];
  /** @type {Record<string, number>} */
  const gaps = {};
  /** @type {Array<Chunk>} */
  let stream;
  /** @type {Token | undefined} */
  let previous;
  let index = -1;
  /** @type {Token | undefined} */
  let current = token;
  let adjust = 0;
  let start = 0;
  const breaks = [start];

  // Loop forward through the linked tokens to pass them in order to the
  // subtokenizer.
  while (current) {
    // Find the position of the event for this token.
    while (events.get(++startPosition)[1] !== current) {
      // Empty.
    }
    startPositions.push(startPosition);
    if (!current._tokenizer) {
      stream = context.sliceStream(current);
      if (!current.next) {
        stream.push(null);
      }
      if (previous) {
        tokenizer.defineSkip(current.start);
      }
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = true;
      }
      tokenizer.write(stream);
      if (current._isInFirstContentOfListItem) {
        tokenizer._gfmTasklistFirstContentOfListItem = undefined;
      }
    }

    // Unravel the next token.
    previous = current;
    current = current.next;
  }

  // Now, loop back through all events (and linked tokens), to figure out which
  // parts belong where.
  current = token;
  while (++index < childEvents.length) {
    if (
    // Find a void token that includes a break.
    childEvents[index][0] === 'exit' && childEvents[index - 1][0] === 'enter' && childEvents[index][1].type === childEvents[index - 1][1].type && childEvents[index][1].start.line !== childEvents[index][1].end.line) {
      start = index + 1;
      breaks.push(start);
      // Help GC.
      current._tokenizer = undefined;
      current.previous = undefined;
      current = current.next;
    }
  }

  // Help GC.
  tokenizer.events = [];

  // If there’s one more token (which is the cases for lines that end in an
  // EOF), that’s perfect: the last point we found starts it.
  // If there isn’t then make sure any remaining content is added to it.
  if (current) {
    // Help GC.
    current._tokenizer = undefined;
    current.previous = undefined;
  } else {
    breaks.pop();
  }

  // Now splice the events from the subtokenizer into the current events,
  // moving back to front so that splice indices aren’t affected.
  index = breaks.length;
  while (index--) {
    const slice = childEvents.slice(breaks[index], breaks[index + 1]);
    const start = startPositions.pop();
    jumps.push([start, start + slice.length - 1]);
    events.splice(start, 2, slice);
  }
  jumps.reverse();
  index = -1;
  while (++index < jumps.length) {
    gaps[adjust + jumps[index][0]] = adjust + jumps[index][1];
    adjust += jumps[index][1] - jumps[index][0] - 1;
  }
  return gaps;
}

/**
 * @import {
 *   Construct,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

/**
 * No name because it must not be turned off.
 * @type {Construct}
 */
const content$1 = {
  resolve: resolveContent,
  tokenize: tokenizeContent
};

/** @type {Construct} */
const continuationConstruct = {
  partial: true,
  tokenize: tokenizeContinuation
};

/**
 * Content is transparent: it’s parsed right now. That way, definitions are also
 * parsed right now: before text in paragraphs (specifically, media) are parsed.
 *
 * @type {Resolver}
 */
function resolveContent(events) {
  subtokenize(events);
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeContent(effects, ok) {
  /** @type {Token | undefined} */
  let previous;
  return chunkStart;

  /**
   * Before a content chunk.
   *
   * ```markdown
   * > | abc
   *     ^
   * ```
   *
   * @type {State}
   */
  function chunkStart(code) {
    effects.enter("content");
    previous = effects.enter("chunkContent", {
      contentType: "content"
    });
    return chunkInside(code);
  }

  /**
   * In a content chunk.
   *
   * ```markdown
   * > | abc
   *     ^^^
   * ```
   *
   * @type {State}
   */
  function chunkInside(code) {
    if (code === null) {
      return contentEnd(code);
    }

    // To do: in `markdown-rs`, each line is parsed on its own, and everything
    // is stitched together resolving.
    if (markdownLineEnding(code)) {
      return effects.check(continuationConstruct, contentContinue, contentEnd)(code);
    }

    // Data.
    effects.consume(code);
    return chunkInside;
  }

  /**
   *
   *
   * @type {State}
   */
  function contentEnd(code) {
    effects.exit("chunkContent");
    effects.exit("content");
    return ok(code);
  }

  /**
   *
   *
   * @type {State}
   */
  function contentContinue(code) {
    effects.consume(code);
    effects.exit("chunkContent");
    previous.next = effects.enter("chunkContent", {
      contentType: "content",
      previous
    });
    previous = previous.next;
    return chunkInside;
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeContinuation(effects, ok, nok) {
  const self = this;
  return startLookahead;

  /**
   *
   *
   * @type {State}
   */
  function startLookahead(code) {
    effects.exit("chunkContent");
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return factorySpace(effects, prefixed, "linePrefix");
  }

  /**
   *
   *
   * @type {State}
   */
  function prefixed(code) {
    if (code === null || markdownLineEnding(code)) {
      return nok(code);
    }

    // Always populated by defaults.

    const tail = self.events[self.events.length - 1];
    if (!self.parser.constructs.disable.null.includes('codeIndented') && tail && tail[1].type === "linePrefix" && tail[2].sliceSerialize(tail[1], true).length >= 4) {
      return ok(code);
    }
    return effects.interrupt(self.parser.constructs.flow, nok, ok)(code);
  }
}

/**
 * @import {Effects, State, TokenType} from 'micromark-util-types'
 */

/**
 * Parse destinations.
 *
 * ###### Examples
 *
 * ```markdown
 * <a>
 * <a\>b>
 * <a b>
 * <a)>
 * a
 * a\)b
 * a(b)c
 * a(b)
 * ```
 *
 * @param {Effects} effects
 *   Context.
 * @param {State} ok
 *   State switched to when successful.
 * @param {State} nok
 *   State switched to when unsuccessful.
 * @param {TokenType} type
 *   Type for whole (`<a>` or `b`).
 * @param {TokenType} literalType
 *   Type when enclosed (`<a>`).
 * @param {TokenType} literalMarkerType
 *   Type for enclosing (`<` and `>`).
 * @param {TokenType} rawType
 *   Type when not enclosed (`b`).
 * @param {TokenType} stringType
 *   Type for the value (`a` or `b`).
 * @param {number | undefined} [max=Infinity]
 *   Depth of nested parens (inclusive).
 * @returns {State}
 *   Start state.
 */
function factoryDestination(effects, ok, nok, type, literalType, literalMarkerType, rawType, stringType, max) {
  const limit = max || Number.POSITIVE_INFINITY;
  let balance = 0;
  return start;

  /**
   * Start of destination.
   *
   * ```markdown
   * > | <aa>
   *     ^
   * > | aa
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    if (code === 60) {
      effects.enter(type);
      effects.enter(literalType);
      effects.enter(literalMarkerType);
      effects.consume(code);
      effects.exit(literalMarkerType);
      return enclosedBefore;
    }

    // ASCII control, space, closing paren.
    if (code === null || code === 32 || code === 41 || asciiControl(code)) {
      return nok(code);
    }
    effects.enter(type);
    effects.enter(rawType);
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return raw(code);
  }

  /**
   * After `<`, at an enclosed destination.
   *
   * ```markdown
   * > | <aa>
   *      ^
   * ```
   *
   * @type {State}
   */
  function enclosedBefore(code) {
    if (code === 62) {
      effects.enter(literalMarkerType);
      effects.consume(code);
      effects.exit(literalMarkerType);
      effects.exit(literalType);
      effects.exit(type);
      return ok;
    }
    effects.enter(stringType);
    effects.enter("chunkString", {
      contentType: "string"
    });
    return enclosed(code);
  }

  /**
   * In enclosed destination.
   *
   * ```markdown
   * > | <aa>
   *      ^
   * ```
   *
   * @type {State}
   */
  function enclosed(code) {
    if (code === 62) {
      effects.exit("chunkString");
      effects.exit(stringType);
      return enclosedBefore(code);
    }
    if (code === null || code === 60 || markdownLineEnding(code)) {
      return nok(code);
    }
    effects.consume(code);
    return code === 92 ? enclosedEscape : enclosed;
  }

  /**
   * After `\`, at a special character.
   *
   * ```markdown
   * > | <a\*a>
   *        ^
   * ```
   *
   * @type {State}
   */
  function enclosedEscape(code) {
    if (code === 60 || code === 62 || code === 92) {
      effects.consume(code);
      return enclosed;
    }
    return enclosed(code);
  }

  /**
   * In raw destination.
   *
   * ```markdown
   * > | aa
   *     ^
   * ```
   *
   * @type {State}
   */
  function raw(code) {
    if (!balance && (code === null || code === 41 || markdownLineEndingOrSpace(code))) {
      effects.exit("chunkString");
      effects.exit(stringType);
      effects.exit(rawType);
      effects.exit(type);
      return ok(code);
    }
    if (balance < limit && code === 40) {
      effects.consume(code);
      balance++;
      return raw;
    }
    if (code === 41) {
      effects.consume(code);
      balance--;
      return raw;
    }

    // ASCII control (but *not* `\0`) and space and `(`.
    // Note: in `markdown-rs`, `\0` exists in codes, in `micromark-js` it
    // doesn’t.
    if (code === null || code === 32 || code === 40 || asciiControl(code)) {
      return nok(code);
    }
    effects.consume(code);
    return code === 92 ? rawEscape : raw;
  }

  /**
   * After `\`, at special character.
   *
   * ```markdown
   * > | a\*a
   *       ^
   * ```
   *
   * @type {State}
   */
  function rawEscape(code) {
    if (code === 40 || code === 41 || code === 92) {
      effects.consume(code);
      return raw;
    }
    return raw(code);
  }
}

/**
 * @import {
 *   Effects,
 *   State,
 *   TokenizeContext,
 *   TokenType
 * } from 'micromark-util-types'
 */

/**
 * Parse labels.
 *
 * > 👉 **Note**: labels in markdown are capped at 999 characters in the string.
 *
 * ###### Examples
 *
 * ```markdown
 * [a]
 * [a
 * b]
 * [a\]b]
 * ```
 *
 * @this {TokenizeContext}
 *   Tokenize context.
 * @param {Effects} effects
 *   Context.
 * @param {State} ok
 *   State switched to when successful.
 * @param {State} nok
 *   State switched to when unsuccessful.
 * @param {TokenType} type
 *   Type of the whole label (`[a]`).
 * @param {TokenType} markerType
 *   Type for the markers (`[` and `]`).
 * @param {TokenType} stringType
 *   Type for the identifier (`a`).
 * @returns {State}
 *   Start state.
 */
function factoryLabel(effects, ok, nok, type, markerType, stringType) {
  const self = this;
  let size = 0;
  /** @type {boolean} */
  let seen;
  return start;

  /**
   * Start of label.
   *
   * ```markdown
   * > | [a]
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter(type);
    effects.enter(markerType);
    effects.consume(code);
    effects.exit(markerType);
    effects.enter(stringType);
    return atBreak;
  }

  /**
   * In label, at something, before something else.
   *
   * ```markdown
   * > | [a]
   *      ^
   * ```
   *
   * @type {State}
   */
  function atBreak(code) {
    if (size > 999 || code === null || code === 91 || code === 93 && !seen ||
    // To do: remove in the future once we’ve switched from
    // `micromark-extension-footnote` to `micromark-extension-gfm-footnote`,
    // which doesn’t need this.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    code === 94 && !size && '_hiddenFootnoteSupport' in self.parser.constructs) {
      return nok(code);
    }
    if (code === 93) {
      effects.exit(stringType);
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      effects.exit(type);
      return ok;
    }

    // To do: indent? Link chunks and EOLs together?
    if (markdownLineEnding(code)) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return atBreak;
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return labelInside(code);
  }

  /**
   * In label, in text.
   *
   * ```markdown
   * > | [a]
   *      ^
   * ```
   *
   * @type {State}
   */
  function labelInside(code) {
    if (code === null || code === 91 || code === 93 || markdownLineEnding(code) || size++ > 999) {
      effects.exit("chunkString");
      return atBreak(code);
    }
    effects.consume(code);
    if (!seen) seen = !markdownSpace(code);
    return code === 92 ? labelEscape : labelInside;
  }

  /**
   * After `\`, at a special character.
   *
   * ```markdown
   * > | [a\*a]
   *        ^
   * ```
   *
   * @type {State}
   */
  function labelEscape(code) {
    if (code === 91 || code === 92 || code === 93) {
      effects.consume(code);
      size++;
      return labelInside;
    }
    return labelInside(code);
  }
}

/**
 * @import {
 *   Code,
 *   Effects,
 *   State,
 *   TokenType
 * } from 'micromark-util-types'
 */

/**
 * Parse titles.
 *
 * ###### Examples
 *
 * ```markdown
 * "a"
 * 'b'
 * (c)
 * "a
 * b"
 * 'a
 *     b'
 * (a\)b)
 * ```
 *
 * @param {Effects} effects
 *   Context.
 * @param {State} ok
 *   State switched to when successful.
 * @param {State} nok
 *   State switched to when unsuccessful.
 * @param {TokenType} type
 *   Type of the whole title (`"a"`, `'b'`, `(c)`).
 * @param {TokenType} markerType
 *   Type for the markers (`"`, `'`, `(`, and `)`).
 * @param {TokenType} stringType
 *   Type for the value (`a`).
 * @returns {State}
 *   Start state.
 */
function factoryTitle(effects, ok, nok, type, markerType, stringType) {
  /** @type {NonNullable<Code>} */
  let marker;
  return start;

  /**
   * Start of title.
   *
   * ```markdown
   * > | "a"
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    if (code === 34 || code === 39 || code === 40) {
      effects.enter(type);
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      marker = code === 40 ? 41 : code;
      return begin;
    }
    return nok(code);
  }

  /**
   * After opening marker.
   *
   * This is also used at the closing marker.
   *
   * ```markdown
   * > | "a"
   *      ^
   * ```
   *
   * @type {State}
   */
  function begin(code) {
    if (code === marker) {
      effects.enter(markerType);
      effects.consume(code);
      effects.exit(markerType);
      effects.exit(type);
      return ok;
    }
    effects.enter(stringType);
    return atBreak(code);
  }

  /**
   * At something, before something else.
   *
   * ```markdown
   * > | "a"
   *      ^
   * ```
   *
   * @type {State}
   */
  function atBreak(code) {
    if (code === marker) {
      effects.exit(stringType);
      return begin(marker);
    }
    if (code === null) {
      return nok(code);
    }

    // Note: blank lines can’t exist in content.
    if (markdownLineEnding(code)) {
      // To do: use `space_or_tab_eol_with_options`, connect.
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return factorySpace(effects, atBreak, "linePrefix");
    }
    effects.enter("chunkString", {
      contentType: "string"
    });
    return inside(code);
  }

  /**
   *
   *
   * @type {State}
   */
  function inside(code) {
    if (code === marker || code === null || markdownLineEnding(code)) {
      effects.exit("chunkString");
      return atBreak(code);
    }
    effects.consume(code);
    return code === 92 ? escape : inside;
  }

  /**
   * After `\`, at a special character.
   *
   * ```markdown
   * > | "a\*b"
   *      ^
   * ```
   *
   * @type {State}
   */
  function escape(code) {
    if (code === marker || code === 92) {
      effects.consume(code);
      return inside;
    }
    return inside(code);
  }
}

/**
 * @import {Effects, State} from 'micromark-util-types'
 */

/**
 * Parse spaces and tabs.
 *
 * There is no `nok` parameter:
 *
 * *   line endings or spaces in markdown are often optional, in which case this
 *     factory can be used and `ok` will be switched to whether spaces were found
 *     or not
 * *   one line ending or space can be detected with
 *     `markdownLineEndingOrSpace(code)` right before using `factoryWhitespace`
 *
 * @param {Effects} effects
 *   Context.
 * @param {State} ok
 *   State switched to when successful.
 * @returns {State}
 *   Start state.
 */
function factoryWhitespace(effects, ok) {
  /** @type {boolean} */
  let seen;
  return start;

  /** @type {State} */
  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      seen = true;
      return start;
    }
    if (markdownSpace(code)) {
      return factorySpace(effects, start, seen ? "linePrefix" : "lineSuffix")(code);
    }
    return ok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const definition = {
  name: 'definition',
  tokenize: tokenizeDefinition
};

/** @type {Construct} */
const titleBefore = {
  partial: true,
  tokenize: tokenizeTitleBefore
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeDefinition(effects, ok, nok) {
  const self = this;
  /** @type {string} */
  let identifier;
  return start;

  /**
   * At start of a definition.
   *
   * ```markdown
   * > | [a]: b "c"
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // Do not interrupt paragraphs (but do follow definitions).
    // To do: do `interrupt` the way `markdown-rs` does.
    // To do: parse whitespace the way `markdown-rs` does.
    effects.enter("definition");
    return before(code);
  }

  /**
   * After optional whitespace, at `[`.
   *
   * ```markdown
   * > | [a]: b "c"
   *     ^
   * ```
   *
   * @type {State}
   */
  function before(code) {
    // To do: parse whitespace the way `markdown-rs` does.

    return factoryLabel.call(self, effects, labelAfter,
    // Note: we don’t need to reset the way `markdown-rs` does.
    nok, "definitionLabel", "definitionLabelMarker", "definitionLabelString")(code);
  }

  /**
   * After label.
   *
   * ```markdown
   * > | [a]: b "c"
   *        ^
   * ```
   *
   * @type {State}
   */
  function labelAfter(code) {
    identifier = normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1));
    if (code === 58) {
      effects.enter("definitionMarker");
      effects.consume(code);
      effects.exit("definitionMarker");
      return markerAfter;
    }
    return nok(code);
  }

  /**
   * After marker.
   *
   * ```markdown
   * > | [a]: b "c"
   *         ^
   * ```
   *
   * @type {State}
   */
  function markerAfter(code) {
    // Note: whitespace is optional.
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, destinationBefore)(code) : destinationBefore(code);
  }

  /**
   * Before destination.
   *
   * ```markdown
   * > | [a]: b "c"
   *          ^
   * ```
   *
   * @type {State}
   */
  function destinationBefore(code) {
    return factoryDestination(effects, destinationAfter,
    // Note: we don’t need to reset the way `markdown-rs` does.
    nok, "definitionDestination", "definitionDestinationLiteral", "definitionDestinationLiteralMarker", "definitionDestinationRaw", "definitionDestinationString")(code);
  }

  /**
   * After destination.
   *
   * ```markdown
   * > | [a]: b "c"
   *           ^
   * ```
   *
   * @type {State}
   */
  function destinationAfter(code) {
    return effects.attempt(titleBefore, after, after)(code);
  }

  /**
   * After definition.
   *
   * ```markdown
   * > | [a]: b
   *           ^
   * > | [a]: b "c"
   *               ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    return markdownSpace(code) ? factorySpace(effects, afterWhitespace, "whitespace")(code) : afterWhitespace(code);
  }

  /**
   * After definition, after optional whitespace.
   *
   * ```markdown
   * > | [a]: b
   *           ^
   * > | [a]: b "c"
   *               ^
   * ```
   *
   * @type {State}
   */
  function afterWhitespace(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("definition");

      // Note: we don’t care about uniqueness.
      // It’s likely that that doesn’t happen very frequently.
      // It is more likely that it wastes precious time.
      self.parser.defined.push(identifier);

      // To do: `markdown-rs` interrupt.
      // // You’d be interrupting.
      // tokenizer.interrupt = true
      return ok(code);
    }
    return nok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeTitleBefore(effects, ok, nok) {
  return titleBefore;

  /**
   * After destination, at whitespace.
   *
   * ```markdown
   * > | [a]: b
   *           ^
   * > | [a]: b "c"
   *           ^
   * ```
   *
   * @type {State}
   */
  function titleBefore(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, beforeMarker)(code) : nok(code);
  }

  /**
   * At title.
   *
   * ```markdown
   *   | [a]: b
   * > | "c"
   *     ^
   * ```
   *
   * @type {State}
   */
  function beforeMarker(code) {
    return factoryTitle(effects, titleAfter, nok, "definitionTitle", "definitionTitleMarker", "definitionTitleString")(code);
  }

  /**
   * After title.
   *
   * ```markdown
   * > | [a]: b "c"
   *               ^
   * ```
   *
   * @type {State}
   */
  function titleAfter(code) {
    return markdownSpace(code) ? factorySpace(effects, titleAfterOptionalWhitespace, "whitespace")(code) : titleAfterOptionalWhitespace(code);
  }

  /**
   * After title, after optional whitespace.
   *
   * ```markdown
   * > | [a]: b "c"
   *               ^
   * ```
   *
   * @type {State}
   */
  function titleAfterOptionalWhitespace(code) {
    return code === null || markdownLineEnding(code) ? ok(code) : nok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const hardBreakEscape = {
  name: 'hardBreakEscape',
  tokenize: tokenizeHardBreakEscape
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeHardBreakEscape(effects, ok, nok) {
  return start;

  /**
   * Start of a hard break (escape).
   *
   * ```markdown
   * > | a\
   *      ^
   *   | b
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("hardBreakEscape");
    effects.consume(code);
    return after;
  }

  /**
   * After `\`, at eol.
   *
   * ```markdown
   * > | a\
   *       ^
   *   | b
   * ```
   *
   *  @type {State}
   */
  function after(code) {
    if (markdownLineEnding(code)) {
      effects.exit("hardBreakEscape");
      return ok(code);
    }
    return nok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const headingAtx = {
  name: 'headingAtx',
  resolve: resolveHeadingAtx,
  tokenize: tokenizeHeadingAtx
};

/** @type {Resolver} */
function resolveHeadingAtx(events, context) {
  let contentEnd = events.length - 2;
  let contentStart = 3;
  /** @type {Token} */
  let content;
  /** @type {Token} */
  let text;

  // Prefix whitespace, part of the opening.
  if (events[contentStart][1].type === "whitespace") {
    contentStart += 2;
  }

  // Suffix whitespace, part of the closing.
  if (contentEnd - 2 > contentStart && events[contentEnd][1].type === "whitespace") {
    contentEnd -= 2;
  }
  if (events[contentEnd][1].type === "atxHeadingSequence" && (contentStart === contentEnd - 1 || contentEnd - 4 > contentStart && events[contentEnd - 2][1].type === "whitespace")) {
    contentEnd -= contentStart + 1 === contentEnd ? 2 : 4;
  }
  if (contentEnd > contentStart) {
    content = {
      type: "atxHeadingText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end
    };
    text = {
      type: "chunkText",
      start: events[contentStart][1].start,
      end: events[contentEnd][1].end,
      contentType: "text"
    };
    splice(events, contentStart, contentEnd - contentStart + 1, [['enter', content, context], ['enter', text, context], ['exit', text, context], ['exit', content, context]]);
  }
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeHeadingAtx(effects, ok, nok) {
  let size = 0;
  return start;

  /**
   * Start of a heading (atx).
   *
   * ```markdown
   * > | ## aa
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // To do: parse indent like `markdown-rs`.
    effects.enter("atxHeading");
    return before(code);
  }

  /**
   * After optional whitespace, at `#`.
   *
   * ```markdown
   * > | ## aa
   *     ^
   * ```
   *
   * @type {State}
   */
  function before(code) {
    effects.enter("atxHeadingSequence");
    return sequenceOpen(code);
  }

  /**
   * In opening sequence.
   *
   * ```markdown
   * > | ## aa
   *     ^
   * ```
   *
   * @type {State}
   */
  function sequenceOpen(code) {
    if (code === 35 && size++ < 6) {
      effects.consume(code);
      return sequenceOpen;
    }

    // Always at least one `#`.
    if (code === null || markdownLineEndingOrSpace(code)) {
      effects.exit("atxHeadingSequence");
      return atBreak(code);
    }
    return nok(code);
  }

  /**
   * After something, before something else.
   *
   * ```markdown
   * > | ## aa
   *       ^
   * ```
   *
   * @type {State}
   */
  function atBreak(code) {
    if (code === 35) {
      effects.enter("atxHeadingSequence");
      return sequenceFurther(code);
    }
    if (code === null || markdownLineEnding(code)) {
      effects.exit("atxHeading");
      // To do: interrupt like `markdown-rs`.
      // // Feel free to interrupt.
      // tokenizer.interrupt = false
      return ok(code);
    }
    if (markdownSpace(code)) {
      return factorySpace(effects, atBreak, "whitespace")(code);
    }

    // To do: generate `data` tokens, add the `text` token later.
    // Needs edit map, see: `markdown.rs`.
    effects.enter("atxHeadingText");
    return data(code);
  }

  /**
   * In further sequence (after whitespace).
   *
   * Could be normal “visible” hashes in the heading or a final sequence.
   *
   * ```markdown
   * > | ## aa ##
   *           ^
   * ```
   *
   * @type {State}
   */
  function sequenceFurther(code) {
    if (code === 35) {
      effects.consume(code);
      return sequenceFurther;
    }
    effects.exit("atxHeadingSequence");
    return atBreak(code);
  }

  /**
   * In text.
   *
   * ```markdown
   * > | ## aa
   *        ^
   * ```
   *
   * @type {State}
   */
  function data(code) {
    if (code === null || code === 35 || markdownLineEndingOrSpace(code)) {
      effects.exit("atxHeadingText");
      return atBreak(code);
    }
    effects.consume(code);
    return data;
  }
}

/**
 * List of lowercase HTML “block” tag names.
 *
 * The list, when parsing HTML (flow), results in more relaxed rules (condition
 * 6).
 * Because they are known blocks, the HTML-like syntax doesn’t have to be
 * strictly parsed.
 * For tag names not in this list, a more strict algorithm (condition 7) is used
 * to detect whether the HTML-like syntax is seen as HTML (flow) or not.
 *
 * This is copied from:
 * <https://spec.commonmark.org/0.30/#html-blocks>.
 *
 * > 👉 **Note**: `search` was added in `CommonMark@0.31`.
 */
const htmlBlockNames = [
  'address',
  'article',
  'aside',
  'base',
  'basefont',
  'blockquote',
  'body',
  'caption',
  'center',
  'col',
  'colgroup',
  'dd',
  'details',
  'dialog',
  'dir',
  'div',
  'dl',
  'dt',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'frame',
  'frameset',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hr',
  'html',
  'iframe',
  'legend',
  'li',
  'link',
  'main',
  'menu',
  'menuitem',
  'nav',
  'noframes',
  'ol',
  'optgroup',
  'option',
  'p',
  'param',
  'search',
  'section',
  'summary',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'title',
  'tr',
  'track',
  'ul'
];

/**
 * List of lowercase HTML “raw” tag names.
 *
 * The list, when parsing HTML (flow), results in HTML that can include lines
 * without exiting, until a closing tag also in this list is found (condition
 * 1).
 *
 * This module is copied from:
 * <https://spec.commonmark.org/0.30/#html-blocks>.
 *
 * > 👉 **Note**: `textarea` was added in `CommonMark@0.30`.
 */
const htmlRawNames = ['pre', 'script', 'style', 'textarea'];

/**
 * @import {
 *   Code,
 *   Construct,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */


/** @type {Construct} */
const htmlFlow = {
  concrete: true,
  name: 'htmlFlow',
  resolveTo: resolveToHtmlFlow,
  tokenize: tokenizeHtmlFlow
};

/** @type {Construct} */
const blankLineBefore = {
  partial: true,
  tokenize: tokenizeBlankLineBefore
};
const nonLazyContinuationStart = {
  partial: true,
  tokenize: tokenizeNonLazyContinuationStart
};

/** @type {Resolver} */
function resolveToHtmlFlow(events) {
  let index = events.length;
  while (index--) {
    if (events[index][0] === 'enter' && events[index][1].type === "htmlFlow") {
      break;
    }
  }
  if (index > 1 && events[index - 2][1].type === "linePrefix") {
    // Add the prefix start to the HTML token.
    events[index][1].start = events[index - 2][1].start;
    // Add the prefix start to the HTML line token.
    events[index + 1][1].start = events[index - 2][1].start;
    // Remove the line prefix.
    events.splice(index - 2, 2);
  }
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeHtmlFlow(effects, ok, nok) {
  const self = this;
  /** @type {number} */
  let marker;
  /** @type {boolean} */
  let closingTag;
  /** @type {string} */
  let buffer;
  /** @type {number} */
  let index;
  /** @type {Code} */
  let markerB;
  return start;

  /**
   * Start of HTML (flow).
   *
   * ```markdown
   * > | <x />
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // To do: parse indent like `markdown-rs`.
    return before(code);
  }

  /**
   * At `<`, after optional whitespace.
   *
   * ```markdown
   * > | <x />
   *     ^
   * ```
   *
   * @type {State}
   */
  function before(code) {
    effects.enter("htmlFlow");
    effects.enter("htmlFlowData");
    effects.consume(code);
    return open;
  }

  /**
   * After `<`, at tag name or other stuff.
   *
   * ```markdown
   * > | <x />
   *      ^
   * > | <!doctype>
   *      ^
   * > | <!--xxx-->
   *      ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (code === 33) {
      effects.consume(code);
      return declarationOpen;
    }
    if (code === 47) {
      effects.consume(code);
      closingTag = true;
      return tagCloseStart;
    }
    if (code === 63) {
      effects.consume(code);
      marker = 3;
      // To do:
      // tokenizer.concrete = true
      // To do: use `markdown-rs` style interrupt.
      // While we’re in an instruction instead of a declaration, we’re on a `?`
      // right now, so we do need to search for `>`, similar to declarations.
      return self.interrupt ? ok : continuationDeclarationInside;
    }

    // ASCII alphabetical.
    if (asciiAlpha(code)) {
      // Always the case.
      effects.consume(code);
      buffer = String.fromCharCode(code);
      return tagName;
    }
    return nok(code);
  }

  /**
   * After `<!`, at declaration, comment, or CDATA.
   *
   * ```markdown
   * > | <!doctype>
   *       ^
   * > | <!--xxx-->
   *       ^
   * > | <![CDATA[>&<]]>
   *       ^
   * ```
   *
   * @type {State}
   */
  function declarationOpen(code) {
    if (code === 45) {
      effects.consume(code);
      marker = 2;
      return commentOpenInside;
    }
    if (code === 91) {
      effects.consume(code);
      marker = 5;
      index = 0;
      return cdataOpenInside;
    }

    // ASCII alphabetical.
    if (asciiAlpha(code)) {
      effects.consume(code);
      marker = 4;
      // // Do not form containers.
      // tokenizer.concrete = true
      return self.interrupt ? ok : continuationDeclarationInside;
    }
    return nok(code);
  }

  /**
   * After `<!-`, inside a comment, at another `-`.
   *
   * ```markdown
   * > | <!--xxx-->
   *        ^
   * ```
   *
   * @type {State}
   */
  function commentOpenInside(code) {
    if (code === 45) {
      effects.consume(code);
      // // Do not form containers.
      // tokenizer.concrete = true
      return self.interrupt ? ok : continuationDeclarationInside;
    }
    return nok(code);
  }

  /**
   * After `<![`, inside CDATA, expecting `CDATA[`.
   *
   * ```markdown
   * > | <![CDATA[>&<]]>
   *        ^^^^^^
   * ```
   *
   * @type {State}
   */
  function cdataOpenInside(code) {
    const value = "CDATA[";
    if (code === value.charCodeAt(index++)) {
      effects.consume(code);
      if (index === value.length) {
        // // Do not form containers.
        // tokenizer.concrete = true
        return self.interrupt ? ok : continuation;
      }
      return cdataOpenInside;
    }
    return nok(code);
  }

  /**
   * After `</`, in closing tag, at tag name.
   *
   * ```markdown
   * > | </x>
   *       ^
   * ```
   *
   * @type {State}
   */
  function tagCloseStart(code) {
    if (asciiAlpha(code)) {
      // Always the case.
      effects.consume(code);
      buffer = String.fromCharCode(code);
      return tagName;
    }
    return nok(code);
  }

  /**
   * In tag name.
   *
   * ```markdown
   * > | <ab>
   *      ^^
   * > | </ab>
   *       ^^
   * ```
   *
   * @type {State}
   */
  function tagName(code) {
    if (code === null || code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
      const slash = code === 47;
      const name = buffer.toLowerCase();
      if (!slash && !closingTag && htmlRawNames.includes(name)) {
        marker = 1;
        // // Do not form containers.
        // tokenizer.concrete = true
        return self.interrupt ? ok(code) : continuation(code);
      }
      if (htmlBlockNames.includes(buffer.toLowerCase())) {
        marker = 6;
        if (slash) {
          effects.consume(code);
          return basicSelfClosing;
        }

        // // Do not form containers.
        // tokenizer.concrete = true
        return self.interrupt ? ok(code) : continuation(code);
      }
      marker = 7;
      // Do not support complete HTML when interrupting.
      return self.interrupt && !self.parser.lazy[self.now().line] ? nok(code) : closingTag ? completeClosingTagAfter(code) : completeAttributeNameBefore(code);
    }

    // ASCII alphanumerical and `-`.
    if (code === 45 || asciiAlphanumeric(code)) {
      effects.consume(code);
      buffer += String.fromCharCode(code);
      return tagName;
    }
    return nok(code);
  }

  /**
   * After closing slash of a basic tag name.
   *
   * ```markdown
   * > | <div/>
   *          ^
   * ```
   *
   * @type {State}
   */
  function basicSelfClosing(code) {
    if (code === 62) {
      effects.consume(code);
      // // Do not form containers.
      // tokenizer.concrete = true
      return self.interrupt ? ok : continuation;
    }
    return nok(code);
  }

  /**
   * After closing slash of a complete tag name.
   *
   * ```markdown
   * > | <x/>
   *        ^
   * ```
   *
   * @type {State}
   */
  function completeClosingTagAfter(code) {
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeClosingTagAfter;
    }
    return completeEnd(code);
  }

  /**
   * At an attribute name.
   *
   * At first, this state is used after a complete tag name, after whitespace,
   * where it expects optional attributes or the end of the tag.
   * It is also reused after attributes, when expecting more optional
   * attributes.
   *
   * ```markdown
   * > | <a />
   *        ^
   * > | <a :b>
   *        ^
   * > | <a _b>
   *        ^
   * > | <a b>
   *        ^
   * > | <a >
   *        ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeNameBefore(code) {
    if (code === 47) {
      effects.consume(code);
      return completeEnd;
    }

    // ASCII alphanumerical and `:` and `_`.
    if (code === 58 || code === 95 || asciiAlpha(code)) {
      effects.consume(code);
      return completeAttributeName;
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAttributeNameBefore;
    }
    return completeEnd(code);
  }

  /**
   * In attribute name.
   *
   * ```markdown
   * > | <a :b>
   *         ^
   * > | <a _b>
   *         ^
   * > | <a b>
   *         ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeName(code) {
    // ASCII alphanumerical and `-`, `.`, `:`, and `_`.
    if (code === 45 || code === 46 || code === 58 || code === 95 || asciiAlphanumeric(code)) {
      effects.consume(code);
      return completeAttributeName;
    }
    return completeAttributeNameAfter(code);
  }

  /**
   * After attribute name, at an optional initializer, the end of the tag, or
   * whitespace.
   *
   * ```markdown
   * > | <a b>
   *         ^
   * > | <a b=c>
   *         ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeNameAfter(code) {
    if (code === 61) {
      effects.consume(code);
      return completeAttributeValueBefore;
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAttributeNameAfter;
    }
    return completeAttributeNameBefore(code);
  }

  /**
   * Before unquoted, double quoted, or single quoted attribute value, allowing
   * whitespace.
   *
   * ```markdown
   * > | <a b=c>
   *          ^
   * > | <a b="c">
   *          ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeValueBefore(code) {
    if (code === null || code === 60 || code === 61 || code === 62 || code === 96) {
      return nok(code);
    }
    if (code === 34 || code === 39) {
      effects.consume(code);
      markerB = code;
      return completeAttributeValueQuoted;
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAttributeValueBefore;
    }
    return completeAttributeValueUnquoted(code);
  }

  /**
   * In double or single quoted attribute value.
   *
   * ```markdown
   * > | <a b="c">
   *           ^
   * > | <a b='c'>
   *           ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeValueQuoted(code) {
    if (code === markerB) {
      effects.consume(code);
      markerB = null;
      return completeAttributeValueQuotedAfter;
    }
    if (code === null || markdownLineEnding(code)) {
      return nok(code);
    }
    effects.consume(code);
    return completeAttributeValueQuoted;
  }

  /**
   * In unquoted attribute value.
   *
   * ```markdown
   * > | <a b=c>
   *          ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeValueUnquoted(code) {
    if (code === null || code === 34 || code === 39 || code === 47 || code === 60 || code === 61 || code === 62 || code === 96 || markdownLineEndingOrSpace(code)) {
      return completeAttributeNameAfter(code);
    }
    effects.consume(code);
    return completeAttributeValueUnquoted;
  }

  /**
   * After double or single quoted attribute value, before whitespace or the
   * end of the tag.
   *
   * ```markdown
   * > | <a b="c">
   *            ^
   * ```
   *
   * @type {State}
   */
  function completeAttributeValueQuotedAfter(code) {
    if (code === 47 || code === 62 || markdownSpace(code)) {
      return completeAttributeNameBefore(code);
    }
    return nok(code);
  }

  /**
   * In certain circumstances of a complete tag where only an `>` is allowed.
   *
   * ```markdown
   * > | <a b="c">
   *             ^
   * ```
   *
   * @type {State}
   */
  function completeEnd(code) {
    if (code === 62) {
      effects.consume(code);
      return completeAfter;
    }
    return nok(code);
  }

  /**
   * After `>` in a complete tag.
   *
   * ```markdown
   * > | <x>
   *        ^
   * ```
   *
   * @type {State}
   */
  function completeAfter(code) {
    if (code === null || markdownLineEnding(code)) {
      // // Do not form containers.
      // tokenizer.concrete = true
      return continuation(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return completeAfter;
    }
    return nok(code);
  }

  /**
   * In continuation of any HTML kind.
   *
   * ```markdown
   * > | <!--xxx-->
   *          ^
   * ```
   *
   * @type {State}
   */
  function continuation(code) {
    if (code === 45 && marker === 2) {
      effects.consume(code);
      return continuationCommentInside;
    }
    if (code === 60 && marker === 1) {
      effects.consume(code);
      return continuationRawTagOpen;
    }
    if (code === 62 && marker === 4) {
      effects.consume(code);
      return continuationClose;
    }
    if (code === 63 && marker === 3) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    if (code === 93 && marker === 5) {
      effects.consume(code);
      return continuationCdataInside;
    }
    if (markdownLineEnding(code) && (marker === 6 || marker === 7)) {
      effects.exit("htmlFlowData");
      return effects.check(blankLineBefore, continuationAfter, continuationStart)(code);
    }
    if (code === null || markdownLineEnding(code)) {
      effects.exit("htmlFlowData");
      return continuationStart(code);
    }
    effects.consume(code);
    return continuation;
  }

  /**
   * In continuation, at eol.
   *
   * ```markdown
   * > | <x>
   *        ^
   *   | asd
   * ```
   *
   * @type {State}
   */
  function continuationStart(code) {
    return effects.check(nonLazyContinuationStart, continuationStartNonLazy, continuationAfter)(code);
  }

  /**
   * In continuation, at eol, before non-lazy content.
   *
   * ```markdown
   * > | <x>
   *        ^
   *   | asd
   * ```
   *
   * @type {State}
   */
  function continuationStartNonLazy(code) {
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return continuationBefore;
  }

  /**
   * In continuation, before non-lazy content.
   *
   * ```markdown
   *   | <x>
   * > | asd
   *     ^
   * ```
   *
   * @type {State}
   */
  function continuationBefore(code) {
    if (code === null || markdownLineEnding(code)) {
      return continuationStart(code);
    }
    effects.enter("htmlFlowData");
    return continuation(code);
  }

  /**
   * In comment continuation, after one `-`, expecting another.
   *
   * ```markdown
   * > | <!--xxx-->
   *             ^
   * ```
   *
   * @type {State}
   */
  function continuationCommentInside(code) {
    if (code === 45) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    return continuation(code);
  }

  /**
   * In raw continuation, after `<`, at `/`.
   *
   * ```markdown
   * > | <script>console.log(1)</script>
   *                            ^
   * ```
   *
   * @type {State}
   */
  function continuationRawTagOpen(code) {
    if (code === 47) {
      effects.consume(code);
      buffer = '';
      return continuationRawEndTag;
    }
    return continuation(code);
  }

  /**
   * In raw continuation, after `</`, in a raw tag name.
   *
   * ```markdown
   * > | <script>console.log(1)</script>
   *                             ^^^^^^
   * ```
   *
   * @type {State}
   */
  function continuationRawEndTag(code) {
    if (code === 62) {
      const name = buffer.toLowerCase();
      if (htmlRawNames.includes(name)) {
        effects.consume(code);
        return continuationClose;
      }
      return continuation(code);
    }
    if (asciiAlpha(code) && buffer.length < 8) {
      // Always the case.
      effects.consume(code);
      buffer += String.fromCharCode(code);
      return continuationRawEndTag;
    }
    return continuation(code);
  }

  /**
   * In cdata continuation, after `]`, expecting `]>`.
   *
   * ```markdown
   * > | <![CDATA[>&<]]>
   *                  ^
   * ```
   *
   * @type {State}
   */
  function continuationCdataInside(code) {
    if (code === 93) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    return continuation(code);
  }

  /**
   * In declaration or instruction continuation, at `>`.
   *
   * ```markdown
   * > | <!-->
   *         ^
   * > | <?>
   *       ^
   * > | <!q>
   *        ^
   * > | <!--ab-->
   *             ^
   * > | <![CDATA[>&<]]>
   *                   ^
   * ```
   *
   * @type {State}
   */
  function continuationDeclarationInside(code) {
    if (code === 62) {
      effects.consume(code);
      return continuationClose;
    }

    // More dashes.
    if (code === 45 && marker === 2) {
      effects.consume(code);
      return continuationDeclarationInside;
    }
    return continuation(code);
  }

  /**
   * In closed continuation: everything we get until the eol/eof is part of it.
   *
   * ```markdown
   * > | <!doctype>
   *               ^
   * ```
   *
   * @type {State}
   */
  function continuationClose(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("htmlFlowData");
      return continuationAfter(code);
    }
    effects.consume(code);
    return continuationClose;
  }

  /**
   * Done.
   *
   * ```markdown
   * > | <!doctype>
   *               ^
   * ```
   *
   * @type {State}
   */
  function continuationAfter(code) {
    effects.exit("htmlFlow");
    // // Feel free to interrupt.
    // tokenizer.interrupt = false
    // // No longer concrete.
    // tokenizer.concrete = false
    return ok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeNonLazyContinuationStart(effects, ok, nok) {
  const self = this;
  return start;

  /**
   * At eol, before continuation.
   *
   * ```markdown
   * > | * ```js
   *            ^
   *   | b
   * ```
   *
   * @type {State}
   */
  function start(code) {
    if (markdownLineEnding(code)) {
      effects.enter("lineEnding");
      effects.consume(code);
      effects.exit("lineEnding");
      return after;
    }
    return nok(code);
  }

  /**
   * A continuation.
   *
   * ```markdown
   *   | * ```js
   * > | b
   *     ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    return self.parser.lazy[self.now().line] ? nok(code) : ok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeBlankLineBefore(effects, ok, nok) {
  return start;

  /**
   * Before eol, expecting blank line.
   *
   * ```markdown
   * > | <div>
   *          ^
   *   |
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return effects.attempt(blankLine, ok, nok);
  }
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const htmlText = {
  name: 'htmlText',
  tokenize: tokenizeHtmlText
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeHtmlText(effects, ok, nok) {
  const self = this;
  /** @type {NonNullable<Code> | undefined} */
  let marker;
  /** @type {number} */
  let index;
  /** @type {State} */
  let returnState;
  return start;

  /**
   * Start of HTML (text).
   *
   * ```markdown
   * > | a <b> c
   *       ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("htmlText");
    effects.enter("htmlTextData");
    effects.consume(code);
    return open;
  }

  /**
   * After `<`, at tag name or other stuff.
   *
   * ```markdown
   * > | a <b> c
   *        ^
   * > | a <!doctype> c
   *        ^
   * > | a <!--b--> c
   *        ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (code === 33) {
      effects.consume(code);
      return declarationOpen;
    }
    if (code === 47) {
      effects.consume(code);
      return tagCloseStart;
    }
    if (code === 63) {
      effects.consume(code);
      return instruction;
    }

    // ASCII alphabetical.
    if (asciiAlpha(code)) {
      effects.consume(code);
      return tagOpen;
    }
    return nok(code);
  }

  /**
   * After `<!`, at declaration, comment, or CDATA.
   *
   * ```markdown
   * > | a <!doctype> c
   *         ^
   * > | a <!--b--> c
   *         ^
   * > | a <![CDATA[>&<]]> c
   *         ^
   * ```
   *
   * @type {State}
   */
  function declarationOpen(code) {
    if (code === 45) {
      effects.consume(code);
      return commentOpenInside;
    }
    if (code === 91) {
      effects.consume(code);
      index = 0;
      return cdataOpenInside;
    }
    if (asciiAlpha(code)) {
      effects.consume(code);
      return declaration;
    }
    return nok(code);
  }

  /**
   * In a comment, after `<!-`, at another `-`.
   *
   * ```markdown
   * > | a <!--b--> c
   *          ^
   * ```
   *
   * @type {State}
   */
  function commentOpenInside(code) {
    if (code === 45) {
      effects.consume(code);
      return commentEnd;
    }
    return nok(code);
  }

  /**
   * In comment.
   *
   * ```markdown
   * > | a <!--b--> c
   *           ^
   * ```
   *
   * @type {State}
   */
  function comment(code) {
    if (code === null) {
      return nok(code);
    }
    if (code === 45) {
      effects.consume(code);
      return commentClose;
    }
    if (markdownLineEnding(code)) {
      returnState = comment;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return comment;
  }

  /**
   * In comment, after `-`.
   *
   * ```markdown
   * > | a <!--b--> c
   *             ^
   * ```
   *
   * @type {State}
   */
  function commentClose(code) {
    if (code === 45) {
      effects.consume(code);
      return commentEnd;
    }
    return comment(code);
  }

  /**
   * In comment, after `--`.
   *
   * ```markdown
   * > | a <!--b--> c
   *              ^
   * ```
   *
   * @type {State}
   */
  function commentEnd(code) {
    return code === 62 ? end(code) : code === 45 ? commentClose(code) : comment(code);
  }

  /**
   * After `<![`, in CDATA, expecting `CDATA[`.
   *
   * ```markdown
   * > | a <![CDATA[>&<]]> b
   *          ^^^^^^
   * ```
   *
   * @type {State}
   */
  function cdataOpenInside(code) {
    const value = "CDATA[";
    if (code === value.charCodeAt(index++)) {
      effects.consume(code);
      return index === value.length ? cdata : cdataOpenInside;
    }
    return nok(code);
  }

  /**
   * In CDATA.
   *
   * ```markdown
   * > | a <![CDATA[>&<]]> b
   *                ^^^
   * ```
   *
   * @type {State}
   */
  function cdata(code) {
    if (code === null) {
      return nok(code);
    }
    if (code === 93) {
      effects.consume(code);
      return cdataClose;
    }
    if (markdownLineEnding(code)) {
      returnState = cdata;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return cdata;
  }

  /**
   * In CDATA, after `]`, at another `]`.
   *
   * ```markdown
   * > | a <![CDATA[>&<]]> b
   *                    ^
   * ```
   *
   * @type {State}
   */
  function cdataClose(code) {
    if (code === 93) {
      effects.consume(code);
      return cdataEnd;
    }
    return cdata(code);
  }

  /**
   * In CDATA, after `]]`, at `>`.
   *
   * ```markdown
   * > | a <![CDATA[>&<]]> b
   *                     ^
   * ```
   *
   * @type {State}
   */
  function cdataEnd(code) {
    if (code === 62) {
      return end(code);
    }
    if (code === 93) {
      effects.consume(code);
      return cdataEnd;
    }
    return cdata(code);
  }

  /**
   * In declaration.
   *
   * ```markdown
   * > | a <!b> c
   *          ^
   * ```
   *
   * @type {State}
   */
  function declaration(code) {
    if (code === null || code === 62) {
      return end(code);
    }
    if (markdownLineEnding(code)) {
      returnState = declaration;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return declaration;
  }

  /**
   * In instruction.
   *
   * ```markdown
   * > | a <?b?> c
   *         ^
   * ```
   *
   * @type {State}
   */
  function instruction(code) {
    if (code === null) {
      return nok(code);
    }
    if (code === 63) {
      effects.consume(code);
      return instructionClose;
    }
    if (markdownLineEnding(code)) {
      returnState = instruction;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return instruction;
  }

  /**
   * In instruction, after `?`, at `>`.
   *
   * ```markdown
   * > | a <?b?> c
   *           ^
   * ```
   *
   * @type {State}
   */
  function instructionClose(code) {
    return code === 62 ? end(code) : instruction(code);
  }

  /**
   * After `</`, in closing tag, at tag name.
   *
   * ```markdown
   * > | a </b> c
   *         ^
   * ```
   *
   * @type {State}
   */
  function tagCloseStart(code) {
    // ASCII alphabetical.
    if (asciiAlpha(code)) {
      effects.consume(code);
      return tagClose;
    }
    return nok(code);
  }

  /**
   * After `</x`, in a tag name.
   *
   * ```markdown
   * > | a </b> c
   *          ^
   * ```
   *
   * @type {State}
   */
  function tagClose(code) {
    // ASCII alphanumerical and `-`.
    if (code === 45 || asciiAlphanumeric(code)) {
      effects.consume(code);
      return tagClose;
    }
    return tagCloseBetween(code);
  }

  /**
   * In closing tag, after tag name.
   *
   * ```markdown
   * > | a </b> c
   *          ^
   * ```
   *
   * @type {State}
   */
  function tagCloseBetween(code) {
    if (markdownLineEnding(code)) {
      returnState = tagCloseBetween;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagCloseBetween;
    }
    return end(code);
  }

  /**
   * After `<x`, in opening tag name.
   *
   * ```markdown
   * > | a <b> c
   *         ^
   * ```
   *
   * @type {State}
   */
  function tagOpen(code) {
    // ASCII alphanumerical and `-`.
    if (code === 45 || asciiAlphanumeric(code)) {
      effects.consume(code);
      return tagOpen;
    }
    if (code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code);
    }
    return nok(code);
  }

  /**
   * In opening tag, after tag name.
   *
   * ```markdown
   * > | a <b> c
   *         ^
   * ```
   *
   * @type {State}
   */
  function tagOpenBetween(code) {
    if (code === 47) {
      effects.consume(code);
      return end;
    }

    // ASCII alphabetical and `:` and `_`.
    if (code === 58 || code === 95 || asciiAlpha(code)) {
      effects.consume(code);
      return tagOpenAttributeName;
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenBetween;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagOpenBetween;
    }
    return end(code);
  }

  /**
   * In attribute name.
   *
   * ```markdown
   * > | a <b c> d
   *          ^
   * ```
   *
   * @type {State}
   */
  function tagOpenAttributeName(code) {
    // ASCII alphabetical and `-`, `.`, `:`, and `_`.
    if (code === 45 || code === 46 || code === 58 || code === 95 || asciiAlphanumeric(code)) {
      effects.consume(code);
      return tagOpenAttributeName;
    }
    return tagOpenAttributeNameAfter(code);
  }

  /**
   * After attribute name, before initializer, the end of the tag, or
   * whitespace.
   *
   * ```markdown
   * > | a <b c> d
   *           ^
   * ```
   *
   * @type {State}
   */
  function tagOpenAttributeNameAfter(code) {
    if (code === 61) {
      effects.consume(code);
      return tagOpenAttributeValueBefore;
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeNameAfter;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagOpenAttributeNameAfter;
    }
    return tagOpenBetween(code);
  }

  /**
   * Before unquoted, double quoted, or single quoted attribute value, allowing
   * whitespace.
   *
   * ```markdown
   * > | a <b c=d> e
   *            ^
   * ```
   *
   * @type {State}
   */
  function tagOpenAttributeValueBefore(code) {
    if (code === null || code === 60 || code === 61 || code === 62 || code === 96) {
      return nok(code);
    }
    if (code === 34 || code === 39) {
      effects.consume(code);
      marker = code;
      return tagOpenAttributeValueQuoted;
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeValueBefore;
      return lineEndingBefore(code);
    }
    if (markdownSpace(code)) {
      effects.consume(code);
      return tagOpenAttributeValueBefore;
    }
    effects.consume(code);
    return tagOpenAttributeValueUnquoted;
  }

  /**
   * In double or single quoted attribute value.
   *
   * ```markdown
   * > | a <b c="d"> e
   *             ^
   * ```
   *
   * @type {State}
   */
  function tagOpenAttributeValueQuoted(code) {
    if (code === marker) {
      effects.consume(code);
      marker = undefined;
      return tagOpenAttributeValueQuotedAfter;
    }
    if (code === null) {
      return nok(code);
    }
    if (markdownLineEnding(code)) {
      returnState = tagOpenAttributeValueQuoted;
      return lineEndingBefore(code);
    }
    effects.consume(code);
    return tagOpenAttributeValueQuoted;
  }

  /**
   * In unquoted attribute value.
   *
   * ```markdown
   * > | a <b c=d> e
   *            ^
   * ```
   *
   * @type {State}
   */
  function tagOpenAttributeValueUnquoted(code) {
    if (code === null || code === 34 || code === 39 || code === 60 || code === 61 || code === 96) {
      return nok(code);
    }
    if (code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code);
    }
    effects.consume(code);
    return tagOpenAttributeValueUnquoted;
  }

  /**
   * After double or single quoted attribute value, before whitespace or the end
   * of the tag.
   *
   * ```markdown
   * > | a <b c="d"> e
   *               ^
   * ```
   *
   * @type {State}
   */
  function tagOpenAttributeValueQuotedAfter(code) {
    if (code === 47 || code === 62 || markdownLineEndingOrSpace(code)) {
      return tagOpenBetween(code);
    }
    return nok(code);
  }

  /**
   * In certain circumstances of a tag where only an `>` is allowed.
   *
   * ```markdown
   * > | a <b c="d"> e
   *               ^
   * ```
   *
   * @type {State}
   */
  function end(code) {
    if (code === 62) {
      effects.consume(code);
      effects.exit("htmlTextData");
      effects.exit("htmlText");
      return ok;
    }
    return nok(code);
  }

  /**
   * At eol.
   *
   * > 👉 **Note**: we can’t have blank lines in text, so no need to worry about
   * > empty tokens.
   *
   * ```markdown
   * > | a <!--a
   *            ^
   *   | b-->
   * ```
   *
   * @type {State}
   */
  function lineEndingBefore(code) {
    effects.exit("htmlTextData");
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return lineEndingAfter;
  }

  /**
   * After eol, at optional whitespace.
   *
   * > 👉 **Note**: we can’t have blank lines in text, so no need to worry about
   * > empty tokens.
   *
   * ```markdown
   *   | a <!--a
   * > | b-->
   *     ^
   * ```
   *
   * @type {State}
   */
  function lineEndingAfter(code) {
    // Always populated by defaults.

    return markdownSpace(code) ? factorySpace(effects, lineEndingAfterPrefix, "linePrefix", self.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4)(code) : lineEndingAfterPrefix(code);
  }

  /**
   * After eol, after optional whitespace.
   *
   * > 👉 **Note**: we can’t have blank lines in text, so no need to worry about
   * > empty tokens.
   *
   * ```markdown
   *   | a <!--a
   * > | b-->
   *     ^
   * ```
   *
   * @type {State}
   */
  function lineEndingAfterPrefix(code) {
    effects.enter("htmlTextData");
    return returnState(code);
  }
}

/**
 * @import {
 *   Construct,
 *   Event,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const labelEnd = {
  name: 'labelEnd',
  resolveAll: resolveAllLabelEnd,
  resolveTo: resolveToLabelEnd,
  tokenize: tokenizeLabelEnd
};

/** @type {Construct} */
const resourceConstruct = {
  tokenize: tokenizeResource
};
/** @type {Construct} */
const referenceFullConstruct = {
  tokenize: tokenizeReferenceFull
};
/** @type {Construct} */
const referenceCollapsedConstruct = {
  tokenize: tokenizeReferenceCollapsed
};

/** @type {Resolver} */
function resolveAllLabelEnd(events) {
  let index = -1;
  /** @type {Array<Event>} */
  const newEvents = [];
  while (++index < events.length) {
    const token = events[index][1];
    newEvents.push(events[index]);
    if (token.type === "labelImage" || token.type === "labelLink" || token.type === "labelEnd") {
      // Remove the marker.
      const offset = token.type === "labelImage" ? 4 : 2;
      token.type = "data";
      index += offset;
    }
  }

  // If the events are equal, we don't have to copy newEvents to events
  if (events.length !== newEvents.length) {
    splice(events, 0, events.length, newEvents);
  }
  return events;
}

/** @type {Resolver} */
function resolveToLabelEnd(events, context) {
  let index = events.length;
  let offset = 0;
  /** @type {Token} */
  let token;
  /** @type {number | undefined} */
  let open;
  /** @type {number | undefined} */
  let close;
  /** @type {Array<Event>} */
  let media;

  // Find an opening.
  while (index--) {
    token = events[index][1];
    if (open) {
      // If we see another link, or inactive link label, we’ve been here before.
      if (token.type === "link" || token.type === "labelLink" && token._inactive) {
        break;
      }

      // Mark other link openings as inactive, as we can’t have links in
      // links.
      if (events[index][0] === 'enter' && token.type === "labelLink") {
        token._inactive = true;
      }
    } else if (close) {
      if (events[index][0] === 'enter' && (token.type === "labelImage" || token.type === "labelLink") && !token._balanced) {
        open = index;
        if (token.type !== "labelLink") {
          offset = 2;
          break;
        }
      }
    } else if (token.type === "labelEnd") {
      close = index;
    }
  }
  const group = {
    type: events[open][1].type === "labelLink" ? "link" : "image",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };
  const label = {
    type: "label",
    start: {
      ...events[open][1].start
    },
    end: {
      ...events[close][1].end
    }
  };
  const text = {
    type: "labelText",
    start: {
      ...events[open + offset + 2][1].end
    },
    end: {
      ...events[close - 2][1].start
    }
  };
  media = [['enter', group, context], ['enter', label, context]];

  // Opening marker.
  media = push(media, events.slice(open + 1, open + offset + 3));

  // Text open.
  media = push(media, [['enter', text, context]]);

  // Always populated by defaults.

  // Between.
  media = push(media, resolveAll(context.parser.constructs.insideSpan.null, events.slice(open + offset + 4, close - 3), context));

  // Text close, marker close, label close.
  media = push(media, [['exit', text, context], events[close - 2], events[close - 1], ['exit', label, context]]);

  // Reference, resource, or so.
  media = push(media, events.slice(close + 1));

  // Media close.
  media = push(media, [['exit', group, context]]);
  splice(events, open, events.length, media);
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeLabelEnd(effects, ok, nok) {
  const self = this;
  let index = self.events.length;
  /** @type {Token} */
  let labelStart;
  /** @type {boolean} */
  let defined;

  // Find an opening.
  while (index--) {
    if ((self.events[index][1].type === "labelImage" || self.events[index][1].type === "labelLink") && !self.events[index][1]._balanced) {
      labelStart = self.events[index][1];
      break;
    }
  }
  return start;

  /**
   * Start of label end.
   *
   * ```markdown
   * > | [a](b) c
   *       ^
   * > | [a][b] c
   *       ^
   * > | [a][] b
   *       ^
   * > | [a] b
   * ```
   *
   * @type {State}
   */
  function start(code) {
    // If there is not an okay opening.
    if (!labelStart) {
      return nok(code);
    }

    // If the corresponding label (link) start is marked as inactive,
    // it means we’d be wrapping a link, like this:
    //
    // ```markdown
    // > | a [b [c](d) e](f) g.
    //                  ^
    // ```
    //
    // We can’t have that, so it’s just balanced brackets.
    if (labelStart._inactive) {
      return labelEndNok(code);
    }
    defined = self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize({
      start: labelStart.end,
      end: self.now()
    })));
    effects.enter("labelEnd");
    effects.enter("labelMarker");
    effects.consume(code);
    effects.exit("labelMarker");
    effects.exit("labelEnd");
    return after;
  }

  /**
   * After `]`.
   *
   * ```markdown
   * > | [a](b) c
   *       ^
   * > | [a][b] c
   *       ^
   * > | [a][] b
   *       ^
   * > | [a] b
   *       ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    // Note: `markdown-rs` also parses GFM footnotes here, which for us is in
    // an extension.

    // Resource (`[asd](fgh)`)?
    if (code === 40) {
      return effects.attempt(resourceConstruct, labelEndOk, defined ? labelEndOk : labelEndNok)(code);
    }

    // Full (`[asd][fgh]`) or collapsed (`[asd][]`) reference?
    if (code === 91) {
      return effects.attempt(referenceFullConstruct, labelEndOk, defined ? referenceNotFull : labelEndNok)(code);
    }

    // Shortcut (`[asd]`) reference?
    return defined ? labelEndOk(code) : labelEndNok(code);
  }

  /**
   * After `]`, at `[`, but not at a full reference.
   *
   * > 👉 **Note**: we only get here if the label is defined.
   *
   * ```markdown
   * > | [a][] b
   *        ^
   * > | [a] b
   *        ^
   * ```
   *
   * @type {State}
   */
  function referenceNotFull(code) {
    return effects.attempt(referenceCollapsedConstruct, labelEndOk, labelEndNok)(code);
  }

  /**
   * Done, we found something.
   *
   * ```markdown
   * > | [a](b) c
   *           ^
   * > | [a][b] c
   *           ^
   * > | [a][] b
   *          ^
   * > | [a] b
   *        ^
   * ```
   *
   * @type {State}
   */
  function labelEndOk(code) {
    // Note: `markdown-rs` does a bunch of stuff here.
    return ok(code);
  }

  /**
   * Done, it’s nothing.
   *
   * There was an okay opening, but we didn’t match anything.
   *
   * ```markdown
   * > | [a](b c
   *        ^
   * > | [a][b c
   *        ^
   * > | [a] b
   *        ^
   * ```
   *
   * @type {State}
   */
  function labelEndNok(code) {
    labelStart._balanced = true;
    return nok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeResource(effects, ok, nok) {
  return resourceStart;

  /**
   * At a resource.
   *
   * ```markdown
   * > | [a](b) c
   *        ^
   * ```
   *
   * @type {State}
   */
  function resourceStart(code) {
    effects.enter("resource");
    effects.enter("resourceMarker");
    effects.consume(code);
    effects.exit("resourceMarker");
    return resourceBefore;
  }

  /**
   * In resource, after `(`, at optional whitespace.
   *
   * ```markdown
   * > | [a](b) c
   *         ^
   * ```
   *
   * @type {State}
   */
  function resourceBefore(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceOpen)(code) : resourceOpen(code);
  }

  /**
   * In resource, after optional whitespace, at `)` or a destination.
   *
   * ```markdown
   * > | [a](b) c
   *         ^
   * ```
   *
   * @type {State}
   */
  function resourceOpen(code) {
    if (code === 41) {
      return resourceEnd(code);
    }
    return factoryDestination(effects, resourceDestinationAfter, resourceDestinationMissing, "resourceDestination", "resourceDestinationLiteral", "resourceDestinationLiteralMarker", "resourceDestinationRaw", "resourceDestinationString", 32)(code);
  }

  /**
   * In resource, after destination, at optional whitespace.
   *
   * ```markdown
   * > | [a](b) c
   *          ^
   * ```
   *
   * @type {State}
   */
  function resourceDestinationAfter(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceBetween)(code) : resourceEnd(code);
  }

  /**
   * At invalid destination.
   *
   * ```markdown
   * > | [a](<<) b
   *         ^
   * ```
   *
   * @type {State}
   */
  function resourceDestinationMissing(code) {
    return nok(code);
  }

  /**
   * In resource, after destination and whitespace, at `(` or title.
   *
   * ```markdown
   * > | [a](b ) c
   *           ^
   * ```
   *
   * @type {State}
   */
  function resourceBetween(code) {
    if (code === 34 || code === 39 || code === 40) {
      return factoryTitle(effects, resourceTitleAfter, nok, "resourceTitle", "resourceTitleMarker", "resourceTitleString")(code);
    }
    return resourceEnd(code);
  }

  /**
   * In resource, after title, at optional whitespace.
   *
   * ```markdown
   * > | [a](b "c") d
   *              ^
   * ```
   *
   * @type {State}
   */
  function resourceTitleAfter(code) {
    return markdownLineEndingOrSpace(code) ? factoryWhitespace(effects, resourceEnd)(code) : resourceEnd(code);
  }

  /**
   * In resource, at `)`.
   *
   * ```markdown
   * > | [a](b) d
   *          ^
   * ```
   *
   * @type {State}
   */
  function resourceEnd(code) {
    if (code === 41) {
      effects.enter("resourceMarker");
      effects.consume(code);
      effects.exit("resourceMarker");
      effects.exit("resource");
      return ok;
    }
    return nok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeReferenceFull(effects, ok, nok) {
  const self = this;
  return referenceFull;

  /**
   * In a reference (full), at the `[`.
   *
   * ```markdown
   * > | [a][b] d
   *        ^
   * ```
   *
   * @type {State}
   */
  function referenceFull(code) {
    return factoryLabel.call(self, effects, referenceFullAfter, referenceFullMissing, "reference", "referenceMarker", "referenceString")(code);
  }

  /**
   * In a reference (full), after `]`.
   *
   * ```markdown
   * > | [a][b] d
   *          ^
   * ```
   *
   * @type {State}
   */
  function referenceFullAfter(code) {
    return self.parser.defined.includes(normalizeIdentifier(self.sliceSerialize(self.events[self.events.length - 1][1]).slice(1, -1))) ? ok(code) : nok(code);
  }

  /**
   * In reference (full) that was missing.
   *
   * ```markdown
   * > | [a][b d
   *        ^
   * ```
   *
   * @type {State}
   */
  function referenceFullMissing(code) {
    return nok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeReferenceCollapsed(effects, ok, nok) {
  return referenceCollapsedStart;

  /**
   * In reference (collapsed), at `[`.
   *
   * > 👉 **Note**: we only get here if the label is defined.
   *
   * ```markdown
   * > | [a][] d
   *        ^
   * ```
   *
   * @type {State}
   */
  function referenceCollapsedStart(code) {
    // We only attempt a collapsed label if there’s a `[`.

    effects.enter("reference");
    effects.enter("referenceMarker");
    effects.consume(code);
    effects.exit("referenceMarker");
    return referenceCollapsedOpen;
  }

  /**
   * In reference (collapsed), at `]`.
   *
   * > 👉 **Note**: we only get here if the label is defined.
   *
   * ```markdown
   * > | [a][] d
   *         ^
   * ```
   *
   *  @type {State}
   */
  function referenceCollapsedOpen(code) {
    if (code === 93) {
      effects.enter("referenceMarker");
      effects.consume(code);
      effects.exit("referenceMarker");
      effects.exit("reference");
      return ok;
    }
    return nok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */


/** @type {Construct} */
const labelStartImage = {
  name: 'labelStartImage',
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartImage
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeLabelStartImage(effects, ok, nok) {
  const self = this;
  return start;

  /**
   * Start of label (image) start.
   *
   * ```markdown
   * > | a ![b] c
   *       ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("labelImage");
    effects.enter("labelImageMarker");
    effects.consume(code);
    effects.exit("labelImageMarker");
    return open;
  }

  /**
   * After `!`, at `[`.
   *
   * ```markdown
   * > | a ![b] c
   *        ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (code === 91) {
      effects.enter("labelMarker");
      effects.consume(code);
      effects.exit("labelMarker");
      effects.exit("labelImage");
      return after;
    }
    return nok(code);
  }

  /**
   * After `![`.
   *
   * ```markdown
   * > | a ![b] c
   *         ^
   * ```
   *
   * This is needed in because, when GFM footnotes are enabled, images never
   * form when started with a `^`.
   * Instead, links form:
   *
   * ```markdown
   * ![^a](b)
   *
   * ![^a][b]
   *
   * [b]: c
   * ```
   *
   * ```html
   * <p>!<a href=\"b\">^a</a></p>
   * <p>!<a href=\"c\">^a</a></p>
   * ```
   *
   * @type {State}
   */
  function after(code) {
    // To do: use a new field to do this, this is still needed for
    // `micromark-extension-gfm-footnote`, but the `label-start-link`
    // behavior isn’t.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    return code === 94 && '_hiddenFootnoteSupport' in self.parser.constructs ? nok(code) : ok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */


/** @type {Construct} */
const labelStartLink = {
  name: 'labelStartLink',
  resolveAll: labelEnd.resolveAll,
  tokenize: tokenizeLabelStartLink
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeLabelStartLink(effects, ok, nok) {
  const self = this;
  return start;

  /**
   * Start of label (link) start.
   *
   * ```markdown
   * > | a [b] c
   *       ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("labelLink");
    effects.enter("labelMarker");
    effects.consume(code);
    effects.exit("labelMarker");
    effects.exit("labelLink");
    return after;
  }

  /** @type {State} */
  function after(code) {
    // To do: this isn’t needed in `micromark-extension-gfm-footnote`,
    // remove.
    // Hidden footnotes hook.
    /* c8 ignore next 3 */
    return code === 94 && '_hiddenFootnoteSupport' in self.parser.constructs ? nok(code) : ok(code);
  }
}

/**
 * @import {
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const lineEnding = {
  name: 'lineEnding',
  tokenize: tokenizeLineEnding
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeLineEnding(effects, ok) {
  return start;

  /** @type {State} */
  function start(code) {
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return factorySpace(effects, ok, "linePrefix");
  }
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const thematicBreak$1 = {
  name: 'thematicBreak',
  tokenize: tokenizeThematicBreak
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeThematicBreak(effects, ok, nok) {
  let size = 0;
  /** @type {NonNullable<Code>} */
  let marker;
  return start;

  /**
   * Start of thematic break.
   *
   * ```markdown
   * > | ***
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter("thematicBreak");
    // To do: parse indent like `markdown-rs`.
    return before(code);
  }

  /**
   * After optional whitespace, at marker.
   *
   * ```markdown
   * > | ***
   *     ^
   * ```
   *
   * @type {State}
   */
  function before(code) {
    marker = code;
    return atBreak(code);
  }

  /**
   * After something, before something else.
   *
   * ```markdown
   * > | ***
   *     ^
   * ```
   *
   * @type {State}
   */
  function atBreak(code) {
    if (code === marker) {
      effects.enter("thematicBreakSequence");
      return sequence(code);
    }
    if (size >= 3 && (code === null || markdownLineEnding(code))) {
      effects.exit("thematicBreak");
      return ok(code);
    }
    return nok(code);
  }

  /**
   * In sequence.
   *
   * ```markdown
   * > | ***
   *     ^
   * ```
   *
   * @type {State}
   */
  function sequence(code) {
    if (code === marker) {
      effects.consume(code);
      size++;
      return sequence;
    }
    effects.exit("thematicBreakSequence");
    return markdownSpace(code) ? factorySpace(effects, atBreak, "whitespace")(code) : atBreak(code);
  }
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   Exiter,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */


/** @type {Construct} */
const list$1 = {
  continuation: {
    tokenize: tokenizeListContinuation
  },
  exit: tokenizeListEnd,
  name: 'list',
  tokenize: tokenizeListStart
};

/** @type {Construct} */
const listItemPrefixWhitespaceConstruct = {
  partial: true,
  tokenize: tokenizeListItemPrefixWhitespace
};

/** @type {Construct} */
const indentConstruct = {
  partial: true,
  tokenize: tokenizeIndent$1
};

// To do: `markdown-rs` parses list items on their own and later stitches them
// together.

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeListStart(effects, ok, nok) {
  const self = this;
  const tail = self.events[self.events.length - 1];
  let initialSize = tail && tail[1].type === "linePrefix" ? tail[2].sliceSerialize(tail[1], true).length : 0;
  let size = 0;
  return start;

  /** @type {State} */
  function start(code) {
    const kind = self.containerState.type || (code === 42 || code === 43 || code === 45 ? "listUnordered" : "listOrdered");
    if (kind === "listUnordered" ? !self.containerState.marker || code === self.containerState.marker : asciiDigit(code)) {
      if (!self.containerState.type) {
        self.containerState.type = kind;
        effects.enter(kind, {
          _container: true
        });
      }
      if (kind === "listUnordered") {
        effects.enter("listItemPrefix");
        return code === 42 || code === 45 ? effects.check(thematicBreak$1, nok, atMarker)(code) : atMarker(code);
      }
      if (!self.interrupt || code === 49) {
        effects.enter("listItemPrefix");
        effects.enter("listItemValue");
        return inside(code);
      }
    }
    return nok(code);
  }

  /** @type {State} */
  function inside(code) {
    if (asciiDigit(code) && ++size < 10) {
      effects.consume(code);
      return inside;
    }
    if ((!self.interrupt || size < 2) && (self.containerState.marker ? code === self.containerState.marker : code === 41 || code === 46)) {
      effects.exit("listItemValue");
      return atMarker(code);
    }
    return nok(code);
  }

  /**
   * @type {State}
   **/
  function atMarker(code) {
    effects.enter("listItemMarker");
    effects.consume(code);
    effects.exit("listItemMarker");
    self.containerState.marker = self.containerState.marker || code;
    return effects.check(blankLine,
    // Can’t be empty when interrupting.
    self.interrupt ? nok : onBlank, effects.attempt(listItemPrefixWhitespaceConstruct, endOfPrefix, otherPrefix));
  }

  /** @type {State} */
  function onBlank(code) {
    self.containerState.initialBlankLine = true;
    initialSize++;
    return endOfPrefix(code);
  }

  /** @type {State} */
  function otherPrefix(code) {
    if (markdownSpace(code)) {
      effects.enter("listItemPrefixWhitespace");
      effects.consume(code);
      effects.exit("listItemPrefixWhitespace");
      return endOfPrefix;
    }
    return nok(code);
  }

  /** @type {State} */
  function endOfPrefix(code) {
    self.containerState.size = initialSize + self.sliceSerialize(effects.exit("listItemPrefix"), true).length;
    return ok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeListContinuation(effects, ok, nok) {
  const self = this;
  self.containerState._closeFlow = undefined;
  return effects.check(blankLine, onBlank, notBlank);

  /** @type {State} */
  function onBlank(code) {
    self.containerState.furtherBlankLines = self.containerState.furtherBlankLines || self.containerState.initialBlankLine;

    // We have a blank line.
    // Still, try to consume at most the items size.
    return factorySpace(effects, ok, "listItemIndent", self.containerState.size + 1)(code);
  }

  /** @type {State} */
  function notBlank(code) {
    if (self.containerState.furtherBlankLines || !markdownSpace(code)) {
      self.containerState.furtherBlankLines = undefined;
      self.containerState.initialBlankLine = undefined;
      return notInCurrentItem(code);
    }
    self.containerState.furtherBlankLines = undefined;
    self.containerState.initialBlankLine = undefined;
    return effects.attempt(indentConstruct, ok, notInCurrentItem)(code);
  }

  /** @type {State} */
  function notInCurrentItem(code) {
    // While we do continue, we signal that the flow should be closed.
    self.containerState._closeFlow = true;
    // As we’re closing flow, we’re no longer interrupting.
    self.interrupt = undefined;
    // Always populated by defaults.

    return factorySpace(effects, effects.attempt(list$1, ok, nok), "linePrefix", self.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4)(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeIndent$1(effects, ok, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, "listItemIndent", self.containerState.size + 1);

  /** @type {State} */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === "listItemIndent" && tail[2].sliceSerialize(tail[1], true).length === self.containerState.size ? ok(code) : nok(code);
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Exiter}
 */
function tokenizeListEnd(effects) {
  effects.exit(this.containerState.type);
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeListItemPrefixWhitespace(effects, ok, nok) {
  const self = this;

  // Always populated by defaults.

  return factorySpace(effects, afterPrefix, "listItemPrefixWhitespace", self.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4 + 1);

  /** @type {State} */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return !markdownSpace(code) && tail && tail[1].type === "listItemPrefixWhitespace" ? ok(code) : nok(code);
  }
}

/**
 * @import {
 *   Code,
 *   Construct,
 *   Resolver,
 *   State,
 *   TokenizeContext,
 *   Tokenizer
 * } from 'micromark-util-types'
 */

/** @type {Construct} */
const setextUnderline = {
  name: 'setextUnderline',
  resolveTo: resolveToSetextUnderline,
  tokenize: tokenizeSetextUnderline
};

/** @type {Resolver} */
function resolveToSetextUnderline(events, context) {
  // To do: resolve like `markdown-rs`.
  let index = events.length;
  /** @type {number | undefined} */
  let content;
  /** @type {number | undefined} */
  let text;
  /** @type {number | undefined} */
  let definition;

  // Find the opening of the content.
  // It’ll always exist: we don’t tokenize if it isn’t there.
  while (index--) {
    if (events[index][0] === 'enter') {
      if (events[index][1].type === "content") {
        content = index;
        break;
      }
      if (events[index][1].type === "paragraph") {
        text = index;
      }
    }
    // Exit
    else {
      if (events[index][1].type === "content") {
        // Remove the content end (if needed we’ll add it later)
        events.splice(index, 1);
      }
      if (!definition && events[index][1].type === "definition") {
        definition = index;
      }
    }
  }
  const heading = {
    type: "setextHeading",
    start: {
      ...events[content][1].start
    },
    end: {
      ...events[events.length - 1][1].end
    }
  };

  // Change the paragraph to setext heading text.
  events[text][1].type = "setextHeadingText";

  // If we have definitions in the content, we’ll keep on having content,
  // but we need move it.
  if (definition) {
    events.splice(text, 0, ['enter', heading, context]);
    events.splice(definition + 1, 0, ['exit', events[content][1], context]);
    events[content][1].end = {
      ...events[definition][1].end
    };
  } else {
    events[content][1] = heading;
  }

  // Add the heading exit at the end.
  events.push(['exit', heading, context]);
  return events;
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 */
function tokenizeSetextUnderline(effects, ok, nok) {
  const self = this;
  /** @type {NonNullable<Code>} */
  let marker;
  return start;

  /**
   * At start of heading (setext) underline.
   *
   * ```markdown
   *   | aa
   * > | ==
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    let index = self.events.length;
    /** @type {boolean | undefined} */
    let paragraph;
    // Find an opening.
    while (index--) {
      // Skip enter/exit of line ending, line prefix, and content.
      // We can now either have a definition or a paragraph.
      if (self.events[index][1].type !== "lineEnding" && self.events[index][1].type !== "linePrefix" && self.events[index][1].type !== "content") {
        paragraph = self.events[index][1].type === "paragraph";
        break;
      }
    }

    // To do: handle lazy/pierce like `markdown-rs`.
    // To do: parse indent like `markdown-rs`.
    if (!self.parser.lazy[self.now().line] && (self.interrupt || paragraph)) {
      effects.enter("setextHeadingLine");
      marker = code;
      return before(code);
    }
    return nok(code);
  }

  /**
   * After optional whitespace, at `-` or `=`.
   *
   * ```markdown
   *   | aa
   * > | ==
   *     ^
   * ```
   *
   * @type {State}
   */
  function before(code) {
    effects.enter("setextHeadingLineSequence");
    return inside(code);
  }

  /**
   * In sequence.
   *
   * ```markdown
   *   | aa
   * > | ==
   *     ^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    if (code === marker) {
      effects.consume(code);
      return inside;
    }
    effects.exit("setextHeadingLineSequence");
    return markdownSpace(code) ? factorySpace(effects, after, "lineSuffix")(code) : after(code);
  }

  /**
   * After sequence, after optional whitespace.
   *
   * ```markdown
   *   | aa
   * > | ==
   *       ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    if (code === null || markdownLineEnding(code)) {
      effects.exit("setextHeadingLine");
      return ok(code);
    }
    return nok(code);
  }
}

/**
 * @import {Event, Exiter, Extension, Resolver, State, Token, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

const indent = {
  tokenize: tokenizeIndent,
  partial: true
};

// To do: micromark should support a `_hiddenGfmFootnoteSupport`, which only
// affects label start (image).
// That will let us drop `tokenizePotentialGfmFootnote*`.
// It currently has a `_hiddenFootnoteSupport`, which affects that and more.
// That can be removed when `micromark-extension-footnote` is archived.

/**
 * Create an extension for `micromark` to enable GFM footnote syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to
 *   enable GFM footnote syntax.
 */
function gfmFootnote() {
  /** @type {Extension} */
  return {
    document: {
      [91]: {
        name: 'gfmFootnoteDefinition',
        tokenize: tokenizeDefinitionStart,
        continuation: {
          tokenize: tokenizeDefinitionContinuation
        },
        exit: gfmFootnoteDefinitionEnd
      }
    },
    text: {
      [91]: {
        name: 'gfmFootnoteCall',
        tokenize: tokenizeGfmFootnoteCall
      },
      [93]: {
        name: 'gfmPotentialFootnoteCall',
        add: 'after',
        tokenize: tokenizePotentialGfmFootnoteCall,
        resolveTo: resolveToPotentialGfmFootnoteCall
      }
    }
  };
}

// To do: remove after micromark update.
/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizePotentialGfmFootnoteCall(effects, ok, nok) {
  const self = this;
  let index = self.events.length;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  /** @type {Token} */
  let labelStart;

  // Find an opening.
  while (index--) {
    const token = self.events[index][1];
    if (token.type === "labelImage") {
      labelStart = token;
      break;
    }

    // Exit if we’ve walked far enough.
    if (token.type === 'gfmFootnoteCall' || token.type === "labelLink" || token.type === "label" || token.type === "image" || token.type === "link") {
      break;
    }
  }
  return start;

  /**
   * @type {State}
   */
  function start(code) {
    if (!labelStart || !labelStart._balanced) {
      return nok(code);
    }
    const id = normalizeIdentifier(self.sliceSerialize({
      start: labelStart.end,
      end: self.now()
    }));
    if (id.codePointAt(0) !== 94 || !defined.includes(id.slice(1))) {
      return nok(code);
    }
    effects.enter('gfmFootnoteCallLabelMarker');
    effects.consume(code);
    effects.exit('gfmFootnoteCallLabelMarker');
    return ok(code);
  }
}

// To do: remove after micromark update.
/** @type {Resolver} */
function resolveToPotentialGfmFootnoteCall(events, context) {
  let index = events.length;

  // Find an opening.
  while (index--) {
    if (events[index][1].type === "labelImage" && events[index][0] === 'enter') {
      events[index][1];
      break;
    }
  }
  // Change the `labelImageMarker` to a `data`.
  events[index + 1][1].type = "data";
  events[index + 3][1].type = 'gfmFootnoteCallLabelMarker';

  // The whole (without `!`):
  /** @type {Token} */
  const call = {
    type: 'gfmFootnoteCall',
    start: Object.assign({}, events[index + 3][1].start),
    end: Object.assign({}, events[events.length - 1][1].end)
  };
  // The `^` marker
  /** @type {Token} */
  const marker = {
    type: 'gfmFootnoteCallMarker',
    start: Object.assign({}, events[index + 3][1].end),
    end: Object.assign({}, events[index + 3][1].end)
  };
  // Increment the end 1 character.
  marker.end.column++;
  marker.end.offset++;
  marker.end._bufferIndex++;
  /** @type {Token} */
  const string = {
    type: 'gfmFootnoteCallString',
    start: Object.assign({}, marker.end),
    end: Object.assign({}, events[events.length - 1][1].start)
  };
  /** @type {Token} */
  const chunk = {
    type: "chunkString",
    contentType: 'string',
    start: Object.assign({}, string.start),
    end: Object.assign({}, string.end)
  };

  /** @type {Array<Event>} */
  const replacement = [
  // Take the `labelImageMarker` (now `data`, the `!`)
  events[index + 1], events[index + 2], ['enter', call, context],
  // The `[`
  events[index + 3], events[index + 4],
  // The `^`.
  ['enter', marker, context], ['exit', marker, context],
  // Everything in between.
  ['enter', string, context], ['enter', chunk, context], ['exit', chunk, context], ['exit', string, context],
  // The ending (`]`, properly parsed and labelled).
  events[events.length - 2], events[events.length - 1], ['exit', call, context]];
  events.splice(index, events.length - index + 1, ...replacement);
  return events;
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeGfmFootnoteCall(effects, ok, nok) {
  const self = this;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  let size = 0;
  /** @type {boolean} */
  let data;

  // Note: the implementation of `markdown-rs` is different, because it houses
  // core *and* extensions in one project.
  // Therefore, it can include footnote logic inside `label-end`.
  // We can’t do that, but luckily, we can parse footnotes in a simpler way than
  // needed for labels.
  return start;

  /**
   * Start of footnote label.
   *
   * ```markdown
   * > | a [^b] c
   *       ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter('gfmFootnoteCall');
    effects.enter('gfmFootnoteCallLabelMarker');
    effects.consume(code);
    effects.exit('gfmFootnoteCallLabelMarker');
    return callStart;
  }

  /**
   * After `[`, at `^`.
   *
   * ```markdown
   * > | a [^b] c
   *        ^
   * ```
   *
   * @type {State}
   */
  function callStart(code) {
    if (code !== 94) return nok(code);
    effects.enter('gfmFootnoteCallMarker');
    effects.consume(code);
    effects.exit('gfmFootnoteCallMarker');
    effects.enter('gfmFootnoteCallString');
    effects.enter('chunkString').contentType = 'string';
    return callData;
  }

  /**
   * In label.
   *
   * ```markdown
   * > | a [^b] c
   *         ^
   * ```
   *
   * @type {State}
   */
  function callData(code) {
    if (
    // Too long.
    size > 999 ||
    // Closing brace with nothing.
    code === 93 && !data ||
    // Space or tab is not supported by GFM for some reason.
    // `\n` and `[` not being supported makes sense.
    code === null || code === 91 || markdownLineEndingOrSpace(code)) {
      return nok(code);
    }
    if (code === 93) {
      effects.exit('chunkString');
      const token = effects.exit('gfmFootnoteCallString');
      if (!defined.includes(normalizeIdentifier(self.sliceSerialize(token)))) {
        return nok(code);
      }
      effects.enter('gfmFootnoteCallLabelMarker');
      effects.consume(code);
      effects.exit('gfmFootnoteCallLabelMarker');
      effects.exit('gfmFootnoteCall');
      return ok;
    }
    if (!markdownLineEndingOrSpace(code)) {
      data = true;
    }
    size++;
    effects.consume(code);
    return code === 92 ? callEscape : callData;
  }

  /**
   * On character after escape.
   *
   * ```markdown
   * > | a [^b\c] d
   *           ^
   * ```
   *
   * @type {State}
   */
  function callEscape(code) {
    if (code === 91 || code === 92 || code === 93) {
      effects.consume(code);
      size++;
      return callData;
    }
    return callData(code);
  }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeDefinitionStart(effects, ok, nok) {
  const self = this;
  const defined = self.parser.gfmFootnotes || (self.parser.gfmFootnotes = []);
  /** @type {string} */
  let identifier;
  let size = 0;
  /** @type {boolean | undefined} */
  let data;
  return start;

  /**
   * Start of GFM footnote definition.
   *
   * ```markdown
   * > | [^a]: b
   *     ^
   * ```
   *
   * @type {State}
   */
  function start(code) {
    effects.enter('gfmFootnoteDefinition')._container = true;
    effects.enter('gfmFootnoteDefinitionLabel');
    effects.enter('gfmFootnoteDefinitionLabelMarker');
    effects.consume(code);
    effects.exit('gfmFootnoteDefinitionLabelMarker');
    return labelAtMarker;
  }

  /**
   * In label, at caret.
   *
   * ```markdown
   * > | [^a]: b
   *      ^
   * ```
   *
   * @type {State}
   */
  function labelAtMarker(code) {
    if (code === 94) {
      effects.enter('gfmFootnoteDefinitionMarker');
      effects.consume(code);
      effects.exit('gfmFootnoteDefinitionMarker');
      effects.enter('gfmFootnoteDefinitionLabelString');
      effects.enter('chunkString').contentType = 'string';
      return labelInside;
    }
    return nok(code);
  }

  /**
   * In label.
   *
   * > 👉 **Note**: `cmark-gfm` prevents whitespace from occurring in footnote
   * > definition labels.
   *
   * ```markdown
   * > | [^a]: b
   *       ^
   * ```
   *
   * @type {State}
   */
  function labelInside(code) {
    if (
    // Too long.
    size > 999 ||
    // Closing brace with nothing.
    code === 93 && !data ||
    // Space or tab is not supported by GFM for some reason.
    // `\n` and `[` not being supported makes sense.
    code === null || code === 91 || markdownLineEndingOrSpace(code)) {
      return nok(code);
    }
    if (code === 93) {
      effects.exit('chunkString');
      const token = effects.exit('gfmFootnoteDefinitionLabelString');
      identifier = normalizeIdentifier(self.sliceSerialize(token));
      effects.enter('gfmFootnoteDefinitionLabelMarker');
      effects.consume(code);
      effects.exit('gfmFootnoteDefinitionLabelMarker');
      effects.exit('gfmFootnoteDefinitionLabel');
      return labelAfter;
    }
    if (!markdownLineEndingOrSpace(code)) {
      data = true;
    }
    size++;
    effects.consume(code);
    return code === 92 ? labelEscape : labelInside;
  }

  /**
   * After `\`, at a special character.
   *
   * > 👉 **Note**: `cmark-gfm` currently does not support escaped brackets:
   * > <https://github.com/github/cmark-gfm/issues/240>
   *
   * ```markdown
   * > | [^a\*b]: c
   *         ^
   * ```
   *
   * @type {State}
   */
  function labelEscape(code) {
    if (code === 91 || code === 92 || code === 93) {
      effects.consume(code);
      size++;
      return labelInside;
    }
    return labelInside(code);
  }

  /**
   * After definition label.
   *
   * ```markdown
   * > | [^a]: b
   *         ^
   * ```
   *
   * @type {State}
   */
  function labelAfter(code) {
    if (code === 58) {
      effects.enter('definitionMarker');
      effects.consume(code);
      effects.exit('definitionMarker');
      if (!defined.includes(identifier)) {
        defined.push(identifier);
      }

      // Any whitespace after the marker is eaten, forming indented code
      // is not possible.
      // No space is also fine, just like a block quote marker.
      return factorySpace(effects, whitespaceAfter, 'gfmFootnoteDefinitionWhitespace');
    }
    return nok(code);
  }

  /**
   * After definition prefix.
   *
   * ```markdown
   * > | [^a]: b
   *           ^
   * ```
   *
   * @type {State}
   */
  function whitespaceAfter(code) {
    // `markdown-rs` has a wrapping token for the prefix that is closed here.
    return ok(code);
  }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeDefinitionContinuation(effects, ok, nok) {
  /// Start of footnote definition continuation.
  ///
  /// ```markdown
  ///   | [^a]: b
  /// > |     c
  ///     ^
  /// ```
  //
  // Either a blank line, which is okay, or an indented thing.
  return effects.check(blankLine, ok, effects.attempt(indent, ok, nok));
}

/** @type {Exiter} */
function gfmFootnoteDefinitionEnd(effects) {
  effects.exit('gfmFootnoteDefinition');
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeIndent(effects, ok, nok) {
  const self = this;
  return factorySpace(effects, afterPrefix, 'gfmFootnoteDefinitionIndent', 4 + 1);

  /**
   * @type {State}
   */
  function afterPrefix(code) {
    const tail = self.events[self.events.length - 1];
    return tail && tail[1].type === 'gfmFootnoteDefinitionIndent' && tail[2].sliceSerialize(tail[1], true).length === 4 ? ok(code) : nok(code);
  }
}

/**
 * @import {Options} from 'micromark-extension-gfm-strikethrough'
 * @import {Event, Extension, Resolver, State, Token, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

/**
 * Create an extension for `micromark` to enable GFM strikethrough syntax.
 *
 * @param {Options | null | undefined} [options={}]
 *   Configuration.
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions`, to
 *   enable GFM strikethrough syntax.
 */
function gfmStrikethrough(options) {
  const options_ = options || {};
  let single = options_.singleTilde;
  const tokenizer = {
    name: 'strikethrough',
    tokenize: tokenizeStrikethrough,
    resolveAll: resolveAllStrikethrough
  };
  if (single === null || single === undefined) {
    single = true;
  }
  return {
    text: {
      [126]: tokenizer
    },
    insideSpan: {
      null: [tokenizer]
    },
    attentionMarkers: {
      null: [126]
    }
  };

  /**
   * Take events and resolve strikethrough.
   *
   * @type {Resolver}
   */
  function resolveAllStrikethrough(events, context) {
    let index = -1;

    // Walk through all events.
    while (++index < events.length) {
      // Find a token that can close.
      if (events[index][0] === 'enter' && events[index][1].type === 'strikethroughSequenceTemporary' && events[index][1]._close) {
        let open = index;

        // Now walk back to find an opener.
        while (open--) {
          // Find a token that can open the closer.
          if (events[open][0] === 'exit' && events[open][1].type === 'strikethroughSequenceTemporary' && events[open][1]._open &&
          // If the sizes are the same:
          events[index][1].end.offset - events[index][1].start.offset === events[open][1].end.offset - events[open][1].start.offset) {
            events[index][1].type = 'strikethroughSequence';
            events[open][1].type = 'strikethroughSequence';

            /** @type {Token} */
            const strikethrough = {
              type: 'strikethrough',
              start: Object.assign({}, events[open][1].start),
              end: Object.assign({}, events[index][1].end)
            };

            /** @type {Token} */
            const text = {
              type: 'strikethroughText',
              start: Object.assign({}, events[open][1].end),
              end: Object.assign({}, events[index][1].start)
            };

            // Opening.
            /** @type {Array<Event>} */
            const nextEvents = [['enter', strikethrough, context], ['enter', events[open][1], context], ['exit', events[open][1], context], ['enter', text, context]];
            const insideSpan = context.parser.constructs.insideSpan.null;
            if (insideSpan) {
              // Between.
              splice(nextEvents, nextEvents.length, 0, resolveAll(insideSpan, events.slice(open + 1, index), context));
            }

            // Closing.
            splice(nextEvents, nextEvents.length, 0, [['exit', text, context], ['enter', events[index][1], context], ['exit', events[index][1], context], ['exit', strikethrough, context]]);
            splice(events, open - 1, index - open + 3, nextEvents);
            index = open + nextEvents.length - 2;
            break;
          }
        }
      }
    }
    index = -1;
    while (++index < events.length) {
      if (events[index][1].type === 'strikethroughSequenceTemporary') {
        events[index][1].type = "data";
      }
    }
    return events;
  }

  /**
   * @this {TokenizeContext}
   * @type {Tokenizer}
   */
  function tokenizeStrikethrough(effects, ok, nok) {
    const previous = this.previous;
    const events = this.events;
    let size = 0;
    return start;

    /** @type {State} */
    function start(code) {
      if (previous === 126 && events[events.length - 1][1].type !== "characterEscape") {
        return nok(code);
      }
      effects.enter('strikethroughSequenceTemporary');
      return more(code);
    }

    /** @type {State} */
    function more(code) {
      const before = classifyCharacter(previous);
      if (code === 126) {
        // If this is the third marker, exit.
        if (size > 1) return nok(code);
        effects.consume(code);
        size++;
        return more;
      }
      if (size < 2 && !single) return nok(code);
      const token = effects.exit('strikethroughSequenceTemporary');
      const after = classifyCharacter(code);
      token._open = !after || after === 2 && Boolean(before);
      token._close = !before || before === 2 && Boolean(after);
      return ok(code);
    }
  }
}

/**
 * @import {Event} from 'micromark-util-types'
 */

// Port of `edit_map.rs` from `markdown-rs`.
// This should move to `markdown-js` later.

// Deal with several changes in events, batching them together.
//
// Preferably, changes should be kept to a minimum.
// Sometimes, it’s needed to change the list of events, because parsing can be
// messy, and it helps to expose a cleaner interface of events to the compiler
// and other users.
// It can also help to merge many adjacent similar events.
// And, in other cases, it’s needed to parse subcontent: pass some events
// through another tokenizer and inject the result.

/**
 * @typedef {[number, number, Array<Event>]} Change
 * @typedef {[number, number, number]} Jump
 */

/**
 * Tracks a bunch of edits.
 */
class EditMap {
  /**
   * Create a new edit map.
   */
  constructor() {
    /**
     * Record of changes.
     *
     * @type {Array<Change>}
     */
    this.map = [];
  }

  /**
   * Create an edit: a remove and/or add at a certain place.
   *
   * @param {number} index
   * @param {number} remove
   * @param {Array<Event>} add
   * @returns {undefined}
   */
  add(index, remove, add) {
    addImplementation(this, index, remove, add);
  }

  // To do: add this when moving to `micromark`.
  // /**
  //  * Create an edit: but insert `add` before existing additions.
  //  *
  //  * @param {number} index
  //  * @param {number} remove
  //  * @param {Array<Event>} add
  //  * @returns {undefined}
  //  */
  // addBefore(index, remove, add) {
  //   addImplementation(this, index, remove, add, true)
  // }

  /**
   * Done, change the events.
   *
   * @param {Array<Event>} events
   * @returns {undefined}
   */
  consume(events) {
    this.map.sort(function (a, b) {
      return a[0] - b[0];
    });

    /* c8 ignore next 3 -- `resolve` is never called without tables, so without edits. */
    if (this.map.length === 0) {
      return;
    }

    // To do: if links are added in events, like they are in `markdown-rs`,
    // this is needed.
    // // Calculate jumps: where items in the current list move to.
    // /** @type {Array<Jump>} */
    // const jumps = []
    // let index = 0
    // let addAcc = 0
    // let removeAcc = 0
    // while (index < this.map.length) {
    //   const [at, remove, add] = this.map[index]
    //   removeAcc += remove
    //   addAcc += add.length
    //   jumps.push([at, removeAcc, addAcc])
    //   index += 1
    // }
    //
    // . shiftLinks(events, jumps)

    let index = this.map.length;
    /** @type {Array<Array<Event>>} */
    const vecs = [];
    while (index > 0) {
      index -= 1;
      vecs.push(events.slice(this.map[index][0] + this.map[index][1]), this.map[index][2]);

      // Truncate rest.
      events.length = this.map[index][0];
    }
    vecs.push(events.slice());
    events.length = 0;
    let slice = vecs.pop();
    while (slice) {
      for (const element of slice) {
        events.push(element);
      }
      slice = vecs.pop();
    }

    // Truncate everything.
    this.map.length = 0;
  }
}

/**
 * Create an edit.
 *
 * @param {EditMap} editMap
 * @param {number} at
 * @param {number} remove
 * @param {Array<Event>} add
 * @returns {undefined}
 */
function addImplementation(editMap, at, remove, add) {
  let index = 0;

  /* c8 ignore next 3 -- `resolve` is never called without tables, so without edits. */
  if (remove === 0 && add.length === 0) {
    return;
  }
  while (index < editMap.map.length) {
    if (editMap.map[index][0] === at) {
      editMap.map[index][1] += remove;

      // To do: before not used by tables, use when moving to micromark.
      // if (before) {
      //   add.push(...editMap.map[index][2])
      //   editMap.map[index][2] = add
      // } else {
      editMap.map[index][2].push(...add);
      // }

      return;
    }
    index += 1;
  }
  editMap.map.push([at, remove, add]);
}

// /**
//  * Shift `previous` and `next` links according to `jumps`.
//  *
//  * This fixes links in case there are events removed or added between them.
//  *
//  * @param {Array<Event>} events
//  * @param {Array<Jump>} jumps
//  */
// function shiftLinks(events, jumps) {
//   let jumpIndex = 0
//   let index = 0
//   let add = 0
//   let rm = 0

//   while (index < events.length) {
//     const rmCurr = rm

//     while (jumpIndex < jumps.length && jumps[jumpIndex][0] <= index) {
//       add = jumps[jumpIndex][2]
//       rm = jumps[jumpIndex][1]
//       jumpIndex += 1
//     }

//     // Ignore items that will be removed.
//     if (rm > rmCurr) {
//       index += rm - rmCurr
//     } else {
//       // ?
//       // if let Some(link) = &events[index].link {
//       //     if let Some(next) = link.next {
//       //         events[next].link.as_mut().unwrap().previous = Some(index + add - rm);
//       //         while jumpIndex < jumps.len() && jumps[jumpIndex].0 <= next {
//       //             add = jumps[jumpIndex].2;
//       //             rm = jumps[jumpIndex].1;
//       //             jumpIndex += 1;
//       //         }
//       //         events[index].link.as_mut().unwrap().next = Some(next + add - rm);
//       //         index = next;
//       //         continue;
//       //     }
//       // }
//       index += 1
//     }
//   }
// }

/**
 * @import {Event} from 'micromark-util-types'
 */

/**
 * @typedef {'center' | 'left' | 'none' | 'right'} Align
 */

/**
 * Figure out the alignment of a GFM table.
 *
 * @param {Readonly<Array<Event>>} events
 *   List of events.
 * @param {number} index
 *   Table enter event.
 * @returns {Array<Align>}
 *   List of aligns.
 */
function gfmTableAlign(events, index) {
  let inDelimiterRow = false;
  /** @type {Array<Align>} */
  const align = [];
  while (index < events.length) {
    const event = events[index];
    if (inDelimiterRow) {
      if (event[0] === 'enter') {
        // Start of alignment value: set a new column.
        // To do: `markdown-rs` uses `tableDelimiterCellValue`.
        if (event[1].type === 'tableContent') {
          align.push(events[index + 1][1].type === 'tableDelimiterMarker' ? 'left' : 'none');
        }
      }
      // Exits:
      // End of alignment value: change the column.
      // To do: `markdown-rs` uses `tableDelimiterCellValue`.
      else if (event[1].type === 'tableContent') {
        if (events[index - 1][1].type === 'tableDelimiterMarker') {
          const alignIndex = align.length - 1;
          align[alignIndex] = align[alignIndex] === 'left' ? 'center' : 'right';
        }
      }
      // Done!
      else if (event[1].type === 'tableDelimiterRow') {
        break;
      }
    } else if (event[0] === 'enter' && event[1].type === 'tableDelimiterRow') {
      inDelimiterRow = true;
    }
    index += 1;
  }
  return align;
}

/**
 * @import {Event, Extension, Point, Resolver, State, Token, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */


/**
 * Create an HTML extension for `micromark` to support GitHub tables syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable GFM
 *   table syntax.
 */
function gfmTable() {
  return {
    flow: {
      null: {
        name: 'table',
        tokenize: tokenizeTable,
        resolveAll: resolveTable
      }
    }
  };
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeTable(effects, ok, nok) {
  const self = this;
  let size = 0;
  let sizeB = 0;
  /** @type {boolean | undefined} */
  let seen;
  return start;

  /**
   * Start of a GFM table.
   *
   * If there is a valid table row or table head before, then we try to parse
   * another row.
   * Otherwise, we try to parse a head.
   *
   * ```markdown
   * > | | a |
   *     ^
   *   | | - |
   * > | | b |
   *     ^
   * ```
   * @type {State}
   */
  function start(code) {
    let index = self.events.length - 1;
    while (index > -1) {
      const type = self.events[index][1].type;
      if (type === "lineEnding" ||
      // Note: markdown-rs uses `whitespace` instead of `linePrefix`
      type === "linePrefix") index--;else break;
    }
    const tail = index > -1 ? self.events[index][1].type : null;
    const next = tail === 'tableHead' || tail === 'tableRow' ? bodyRowStart : headRowBefore;

    // Don’t allow lazy body rows.
    if (next === bodyRowStart && self.parser.lazy[self.now().line]) {
      return nok(code);
    }
    return next(code);
  }

  /**
   * Before table head row.
   *
   * ```markdown
   * > | | a |
   *     ^
   *   | | - |
   *   | | b |
   * ```
   *
   * @type {State}
   */
  function headRowBefore(code) {
    effects.enter('tableHead');
    effects.enter('tableRow');
    return headRowStart(code);
  }

  /**
   * Before table head row, after whitespace.
   *
   * ```markdown
   * > | | a |
   *     ^
   *   | | - |
   *   | | b |
   * ```
   *
   * @type {State}
   */
  function headRowStart(code) {
    if (code === 124) {
      return headRowBreak(code);
    }

    // To do: micromark-js should let us parse our own whitespace in extensions,
    // like `markdown-rs`:
    //
    // ```js
    // // 4+ spaces.
    // if (markdownSpace(code)) {
    //   return nok(code)
    // }
    // ```

    seen = true;
    // Count the first character, that isn’t a pipe, double.
    sizeB += 1;
    return headRowBreak(code);
  }

  /**
   * At break in table head row.
   *
   * ```markdown
   * > | | a |
   *     ^
   *       ^
   *         ^
   *   | | - |
   *   | | b |
   * ```
   *
   * @type {State}
   */
  function headRowBreak(code) {
    if (code === null) {
      // Note: in `markdown-rs`, we need to reset, in `micromark-js` we don‘t.
      return nok(code);
    }
    if (markdownLineEnding(code)) {
      // If anything other than one pipe (ignoring whitespace) was used, it’s fine.
      if (sizeB > 1) {
        sizeB = 0;
        // To do: check if this works.
        // Feel free to interrupt:
        self.interrupt = true;
        effects.exit('tableRow');
        effects.enter("lineEnding");
        effects.consume(code);
        effects.exit("lineEnding");
        return headDelimiterStart;
      }

      // Note: in `markdown-rs`, we need to reset, in `micromark-js` we don‘t.
      return nok(code);
    }
    if (markdownSpace(code)) {
      // To do: check if this is fine.
      // effects.attempt(State::Next(StateName::GfmTableHeadRowBreak), State::Nok)
      // State::Retry(space_or_tab(tokenizer))
      return factorySpace(effects, headRowBreak, "whitespace")(code);
    }
    sizeB += 1;
    if (seen) {
      seen = false;
      // Header cell count.
      size += 1;
    }
    if (code === 124) {
      effects.enter('tableCellDivider');
      effects.consume(code);
      effects.exit('tableCellDivider');
      // Whether a delimiter was seen.
      seen = true;
      return headRowBreak;
    }

    // Anything else is cell data.
    effects.enter("data");
    return headRowData(code);
  }

  /**
   * In table head row data.
   *
   * ```markdown
   * > | | a |
   *       ^
   *   | | - |
   *   | | b |
   * ```
   *
   * @type {State}
   */
  function headRowData(code) {
    if (code === null || code === 124 || markdownLineEndingOrSpace(code)) {
      effects.exit("data");
      return headRowBreak(code);
    }
    effects.consume(code);
    return code === 92 ? headRowEscape : headRowData;
  }

  /**
   * In table head row escape.
   *
   * ```markdown
   * > | | a\-b |
   *         ^
   *   | | ---- |
   *   | | c    |
   * ```
   *
   * @type {State}
   */
  function headRowEscape(code) {
    if (code === 92 || code === 124) {
      effects.consume(code);
      return headRowData;
    }
    return headRowData(code);
  }

  /**
   * Before delimiter row.
   *
   * ```markdown
   *   | | a |
   * > | | - |
   *     ^
   *   | | b |
   * ```
   *
   * @type {State}
   */
  function headDelimiterStart(code) {
    // Reset `interrupt`.
    self.interrupt = false;

    // Note: in `markdown-rs`, we need to handle piercing here too.
    if (self.parser.lazy[self.now().line]) {
      return nok(code);
    }
    effects.enter('tableDelimiterRow');
    // Track if we’ve seen a `:` or `|`.
    seen = false;
    if (markdownSpace(code)) {
      return factorySpace(effects, headDelimiterBefore, "linePrefix", self.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4)(code);
    }
    return headDelimiterBefore(code);
  }

  /**
   * Before delimiter row, after optional whitespace.
   *
   * Reused when a `|` is found later, to parse another cell.
   *
   * ```markdown
   *   | | a |
   * > | | - |
   *     ^
   *   | | b |
   * ```
   *
   * @type {State}
   */
  function headDelimiterBefore(code) {
    if (code === 45 || code === 58) {
      return headDelimiterValueBefore(code);
    }
    if (code === 124) {
      seen = true;
      // If we start with a pipe, we open a cell marker.
      effects.enter('tableCellDivider');
      effects.consume(code);
      effects.exit('tableCellDivider');
      return headDelimiterCellBefore;
    }

    // More whitespace / empty row not allowed at start.
    return headDelimiterNok(code);
  }

  /**
   * After `|`, before delimiter cell.
   *
   * ```markdown
   *   | | a |
   * > | | - |
   *      ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterCellBefore(code) {
    if (markdownSpace(code)) {
      return factorySpace(effects, headDelimiterValueBefore, "whitespace")(code);
    }
    return headDelimiterValueBefore(code);
  }

  /**
   * Before delimiter cell value.
   *
   * ```markdown
   *   | | a |
   * > | | - |
   *       ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterValueBefore(code) {
    // Align: left.
    if (code === 58) {
      sizeB += 1;
      seen = true;
      effects.enter('tableDelimiterMarker');
      effects.consume(code);
      effects.exit('tableDelimiterMarker');
      return headDelimiterLeftAlignmentAfter;
    }

    // Align: none.
    if (code === 45) {
      sizeB += 1;
      // To do: seems weird that this *isn’t* left aligned, but that state is used?
      return headDelimiterLeftAlignmentAfter(code);
    }
    if (code === null || markdownLineEnding(code)) {
      return headDelimiterCellAfter(code);
    }
    return headDelimiterNok(code);
  }

  /**
   * After delimiter cell left alignment marker.
   *
   * ```markdown
   *   | | a  |
   * > | | :- |
   *        ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterLeftAlignmentAfter(code) {
    if (code === 45) {
      effects.enter('tableDelimiterFiller');
      return headDelimiterFiller(code);
    }

    // Anything else is not ok after the left-align colon.
    return headDelimiterNok(code);
  }

  /**
   * In delimiter cell filler.
   *
   * ```markdown
   *   | | a |
   * > | | - |
   *       ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterFiller(code) {
    if (code === 45) {
      effects.consume(code);
      return headDelimiterFiller;
    }

    // Align is `center` if it was `left`, `right` otherwise.
    if (code === 58) {
      seen = true;
      effects.exit('tableDelimiterFiller');
      effects.enter('tableDelimiterMarker');
      effects.consume(code);
      effects.exit('tableDelimiterMarker');
      return headDelimiterRightAlignmentAfter;
    }
    effects.exit('tableDelimiterFiller');
    return headDelimiterRightAlignmentAfter(code);
  }

  /**
   * After delimiter cell right alignment marker.
   *
   * ```markdown
   *   | |  a |
   * > | | -: |
   *         ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterRightAlignmentAfter(code) {
    if (markdownSpace(code)) {
      return factorySpace(effects, headDelimiterCellAfter, "whitespace")(code);
    }
    return headDelimiterCellAfter(code);
  }

  /**
   * After delimiter cell.
   *
   * ```markdown
   *   | |  a |
   * > | | -: |
   *          ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterCellAfter(code) {
    if (code === 124) {
      return headDelimiterBefore(code);
    }
    if (code === null || markdownLineEnding(code)) {
      // Exit when:
      // * there was no `:` or `|` at all (it’s a thematic break or setext
      //   underline instead)
      // * the header cell count is not the delimiter cell count
      if (!seen || size !== sizeB) {
        return headDelimiterNok(code);
      }

      // Note: in markdown-rs`, a reset is needed here.
      effects.exit('tableDelimiterRow');
      effects.exit('tableHead');
      // To do: in `markdown-rs`, resolvers need to be registered manually.
      // effects.register_resolver(ResolveName::GfmTable)
      return ok(code);
    }
    return headDelimiterNok(code);
  }

  /**
   * In delimiter row, at a disallowed byte.
   *
   * ```markdown
   *   | | a |
   * > | | x |
   *       ^
   * ```
   *
   * @type {State}
   */
  function headDelimiterNok(code) {
    // Note: in `markdown-rs`, we need to reset, in `micromark-js` we don‘t.
    return nok(code);
  }

  /**
   * Before table body row.
   *
   * ```markdown
   *   | | a |
   *   | | - |
   * > | | b |
   *     ^
   * ```
   *
   * @type {State}
   */
  function bodyRowStart(code) {
    // Note: in `markdown-rs` we need to manually take care of a prefix,
    // but in `micromark-js` that is done for us, so if we’re here, we’re
    // never at whitespace.
    effects.enter('tableRow');
    return bodyRowBreak(code);
  }

  /**
   * At break in table body row.
   *
   * ```markdown
   *   | | a |
   *   | | - |
   * > | | b |
   *     ^
   *       ^
   *         ^
   * ```
   *
   * @type {State}
   */
  function bodyRowBreak(code) {
    if (code === 124) {
      effects.enter('tableCellDivider');
      effects.consume(code);
      effects.exit('tableCellDivider');
      return bodyRowBreak;
    }
    if (code === null || markdownLineEnding(code)) {
      effects.exit('tableRow');
      return ok(code);
    }
    if (markdownSpace(code)) {
      return factorySpace(effects, bodyRowBreak, "whitespace")(code);
    }

    // Anything else is cell content.
    effects.enter("data");
    return bodyRowData(code);
  }

  /**
   * In table body row data.
   *
   * ```markdown
   *   | | a |
   *   | | - |
   * > | | b |
   *       ^
   * ```
   *
   * @type {State}
   */
  function bodyRowData(code) {
    if (code === null || code === 124 || markdownLineEndingOrSpace(code)) {
      effects.exit("data");
      return bodyRowBreak(code);
    }
    effects.consume(code);
    return code === 92 ? bodyRowEscape : bodyRowData;
  }

  /**
   * In table body row escape.
   *
   * ```markdown
   *   | | a    |
   *   | | ---- |
   * > | | b\-c |
   *         ^
   * ```
   *
   * @type {State}
   */
  function bodyRowEscape(code) {
    if (code === 92 || code === 124) {
      effects.consume(code);
      return bodyRowData;
    }
    return bodyRowData(code);
  }
}

/** @type {Resolver} */

function resolveTable(events, context) {
  let index = -1;
  let inFirstCellAwaitingPipe = true;
  /** @type {RowKind} */
  let rowKind = 0;
  /** @type {Range} */
  let lastCell = [0, 0, 0, 0];
  /** @type {Range} */
  let cell = [0, 0, 0, 0];
  let afterHeadAwaitingFirstBodyRow = false;
  let lastTableEnd = 0;
  /** @type {Token | undefined} */
  let currentTable;
  /** @type {Token | undefined} */
  let currentBody;
  /** @type {Token | undefined} */
  let currentCell;
  const map = new EditMap();
  while (++index < events.length) {
    const event = events[index];
    const token = event[1];
    if (event[0] === 'enter') {
      // Start of head.
      if (token.type === 'tableHead') {
        afterHeadAwaitingFirstBodyRow = false;

        // Inject previous (body end and) table end.
        if (lastTableEnd !== 0) {
          flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
          currentBody = undefined;
          lastTableEnd = 0;
        }

        // Inject table start.
        currentTable = {
          type: 'table',
          start: Object.assign({}, token.start),
          // Note: correct end is set later.
          end: Object.assign({}, token.end)
        };
        map.add(index, 0, [['enter', currentTable, context]]);
      } else if (token.type === 'tableRow' || token.type === 'tableDelimiterRow') {
        inFirstCellAwaitingPipe = true;
        currentCell = undefined;
        lastCell = [0, 0, 0, 0];
        cell = [0, index + 1, 0, 0];

        // Inject table body start.
        if (afterHeadAwaitingFirstBodyRow) {
          afterHeadAwaitingFirstBodyRow = false;
          currentBody = {
            type: 'tableBody',
            start: Object.assign({}, token.start),
            // Note: correct end is set later.
            end: Object.assign({}, token.end)
          };
          map.add(index, 0, [['enter', currentBody, context]]);
        }
        rowKind = token.type === 'tableDelimiterRow' ? 2 : currentBody ? 3 : 1;
      }
      // Cell data.
      else if (rowKind && (token.type === "data" || token.type === 'tableDelimiterMarker' || token.type === 'tableDelimiterFiller')) {
        inFirstCellAwaitingPipe = false;

        // First value in cell.
        if (cell[2] === 0) {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map, context, lastCell, rowKind, undefined, currentCell);
            lastCell = [0, 0, 0, 0];
          }
          cell[2] = index;
        }
      } else if (token.type === 'tableCellDivider') {
        if (inFirstCellAwaitingPipe) {
          inFirstCellAwaitingPipe = false;
        } else {
          if (lastCell[1] !== 0) {
            cell[0] = cell[1];
            currentCell = flushCell(map, context, lastCell, rowKind, undefined, currentCell);
          }
          lastCell = cell;
          cell = [lastCell[1], index, 0, 0];
        }
      }
    }
    // Exit events.
    else if (token.type === 'tableHead') {
      afterHeadAwaitingFirstBodyRow = true;
      lastTableEnd = index;
    } else if (token.type === 'tableRow' || token.type === 'tableDelimiterRow') {
      lastTableEnd = index;
      if (lastCell[1] !== 0) {
        cell[0] = cell[1];
        currentCell = flushCell(map, context, lastCell, rowKind, index, currentCell);
      } else if (cell[1] !== 0) {
        currentCell = flushCell(map, context, cell, rowKind, index, currentCell);
      }
      rowKind = 0;
    } else if (rowKind && (token.type === "data" || token.type === 'tableDelimiterMarker' || token.type === 'tableDelimiterFiller')) {
      cell[3] = index;
    }
  }
  if (lastTableEnd !== 0) {
    flushTableEnd(map, context, lastTableEnd, currentTable, currentBody);
  }
  map.consume(context.events);

  // To do: move this into `html`, when events are exposed there.
  // That’s what `markdown-rs` does.
  // That needs updates to `mdast-util-gfm-table`.
  index = -1;
  while (++index < context.events.length) {
    const event = context.events[index];
    if (event[0] === 'enter' && event[1].type === 'table') {
      event[1]._align = gfmTableAlign(context.events, index);
    }
  }
  return events;
}

/**
 * Generate a cell.
 *
 * @param {EditMap} map
 * @param {Readonly<TokenizeContext>} context
 * @param {Readonly<Range>} range
 * @param {RowKind} rowKind
 * @param {number | undefined} rowEnd
 * @param {Token | undefined} previousCell
 * @returns {Token | undefined}
 */
// eslint-disable-next-line max-params
function flushCell(map, context, range, rowKind, rowEnd, previousCell) {
  // `markdown-rs` uses:
  // rowKind === 2 ? 'tableDelimiterCell' : 'tableCell'
  const groupName = rowKind === 1 ? 'tableHeader' : rowKind === 2 ? 'tableDelimiter' : 'tableData';
  // `markdown-rs` uses:
  // rowKind === 2 ? 'tableDelimiterCellValue' : 'tableCellText'
  const valueName = 'tableContent';

  // Insert an exit for the previous cell, if there is one.
  //
  // ```markdown
  // > | | aa | bb | cc |
  //          ^-- exit
  //           ^^^^-- this cell
  // ```
  if (range[0] !== 0) {
    previousCell.end = Object.assign({}, getPoint(context.events, range[0]));
    map.add(range[0], 0, [['exit', previousCell, context]]);
  }

  // Insert enter of this cell.
  //
  // ```markdown
  // > | | aa | bb | cc |
  //           ^-- enter
  //           ^^^^-- this cell
  // ```
  const now = getPoint(context.events, range[1]);
  previousCell = {
    type: groupName,
    start: Object.assign({}, now),
    // Note: correct end is set later.
    end: Object.assign({}, now)
  };
  map.add(range[1], 0, [['enter', previousCell, context]]);

  // Insert text start at first data start and end at last data end, and
  // remove events between.
  //
  // ```markdown
  // > | | aa | bb | cc |
  //            ^-- enter
  //             ^-- exit
  //           ^^^^-- this cell
  // ```
  if (range[2] !== 0) {
    const relatedStart = getPoint(context.events, range[2]);
    const relatedEnd = getPoint(context.events, range[3]);
    /** @type {Token} */
    const valueToken = {
      type: valueName,
      start: Object.assign({}, relatedStart),
      end: Object.assign({}, relatedEnd)
    };
    map.add(range[2], 0, [['enter', valueToken, context]]);
    if (rowKind !== 2) {
      // Fix positional info on remaining events
      const start = context.events[range[2]];
      const end = context.events[range[3]];
      start[1].end = Object.assign({}, end[1].end);
      start[1].type = "chunkText";
      start[1].contentType = "text";

      // Remove if needed.
      if (range[3] > range[2] + 1) {
        const a = range[2] + 1;
        const b = range[3] - range[2] - 1;
        map.add(a, b, []);
      }
    }
    map.add(range[3] + 1, 0, [['exit', valueToken, context]]);
  }

  // Insert an exit for the last cell, if at the row end.
  //
  // ```markdown
  // > | | aa | bb | cc |
  //                    ^-- exit
  //               ^^^^^^-- this cell (the last one contains two “between” parts)
  // ```
  if (rowEnd !== undefined) {
    previousCell.end = Object.assign({}, getPoint(context.events, rowEnd));
    map.add(rowEnd, 0, [['exit', previousCell, context]]);
    previousCell = undefined;
  }
  return previousCell;
}

/**
 * Generate table end (and table body end).
 *
 * @param {Readonly<EditMap>} map
 * @param {Readonly<TokenizeContext>} context
 * @param {number} index
 * @param {Token} table
 * @param {Token | undefined} tableBody
 */
// eslint-disable-next-line max-params
function flushTableEnd(map, context, index, table, tableBody) {
  /** @type {Array<Event>} */
  const exits = [];
  const related = getPoint(context.events, index);
  if (tableBody) {
    tableBody.end = Object.assign({}, related);
    exits.push(['exit', tableBody, context]);
  }
  table.end = Object.assign({}, related);
  exits.push(['exit', table, context]);
  map.add(index + 1, 0, exits);
}

/**
 * @param {Readonly<Array<Event>>} events
 * @param {number} index
 * @returns {Readonly<Point>}
 */
function getPoint(events, index) {
  const event = events[index];
  const side = event[0] === 'enter' ? 'start' : 'end';
  return event[1][side];
}

/**
 * @import {Extension, State, TokenizeContext, Tokenizer} from 'micromark-util-types'
 */

const tasklistCheck = {
  name: 'tasklistCheck',
  tokenize: tokenizeTasklistCheck
};

/**
 * Create an HTML extension for `micromark` to support GFM task list items
 * syntax.
 *
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `htmlExtensions` to
 *   support GFM task list items when serializing to HTML.
 */
function gfmTaskListItem() {
  return {
    text: {
      [91]: tasklistCheck
    }
  };
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function tokenizeTasklistCheck(effects, ok, nok) {
  const self = this;
  return open;

  /**
   * At start of task list item check.
   *
   * ```markdown
   * > | * [x] y.
   *       ^
   * ```
   *
   * @type {State}
   */
  function open(code) {
    if (
    // Exit if there’s stuff before.
    self.previous !== null ||
    // Exit if not in the first content that is the first child of a list
    // item.
    !self._gfmTasklistFirstContentOfListItem) {
      return nok(code);
    }
    effects.enter('taskListCheck');
    effects.enter('taskListCheckMarker');
    effects.consume(code);
    effects.exit('taskListCheckMarker');
    return inside;
  }

  /**
   * In task list item check.
   *
   * ```markdown
   * > | * [x] y.
   *        ^
   * ```
   *
   * @type {State}
   */
  function inside(code) {
    // Currently we match how GH works in files.
    // To match how GH works in comments, use `markdownSpace` (`[\t ]`) instead
    // of `markdownLineEndingOrSpace` (`[\t\n\r ]`).
    if (markdownLineEndingOrSpace(code)) {
      effects.enter('taskListCheckValueUnchecked');
      effects.consume(code);
      effects.exit('taskListCheckValueUnchecked');
      return close;
    }
    if (code === 88 || code === 120) {
      effects.enter('taskListCheckValueChecked');
      effects.consume(code);
      effects.exit('taskListCheckValueChecked');
      return close;
    }
    return nok(code);
  }

  /**
   * At close of task list item check.
   *
   * ```markdown
   * > | * [x] y.
   *         ^
   * ```
   *
   * @type {State}
   */
  function close(code) {
    if (code === 93) {
      effects.enter('taskListCheckMarker');
      effects.consume(code);
      effects.exit('taskListCheckMarker');
      effects.exit('taskListCheck');
      return after;
    }
    return nok(code);
  }

  /**
   * @type {State}
   */
  function after(code) {
    // EOL in paragraph means there must be something else after it.
    if (markdownLineEnding(code)) {
      return ok(code);
    }

    // Space or tab?
    // Check what comes after.
    if (markdownSpace(code)) {
      return effects.check({
        tokenize: spaceThenNonSpace
      }, ok, nok)(code);
    }

    // EOF, or non-whitespace, both wrong.
    return nok(code);
  }
}

/**
 * @this {TokenizeContext}
 * @type {Tokenizer}
 */
function spaceThenNonSpace(effects, ok, nok) {
  return factorySpace(effects, after, "whitespace");

  /**
   * After whitespace, after task list item check.
   *
   * ```markdown
   * > | * [x] y.
   *           ^
   * ```
   *
   * @type {State}
   */
  function after(code) {
    // EOF means there was nothing, so bad.
    // EOL means there’s content after it, so good.
    // Impossible to have more spaces.
    // Anything else is good.
    return code === null ? nok(code) : ok(code);
  }
}

/**
 * @typedef {import('micromark-extension-gfm-footnote').HtmlOptions} HtmlOptions
 * @typedef {import('micromark-extension-gfm-strikethrough').Options} Options
 * @typedef {import('micromark-util-types').Extension} Extension
 * @typedef {import('micromark-util-types').HtmlExtension} HtmlExtension
 */


/**
 * Create an extension for `micromark` to enable GFM syntax.
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 *
 *   Passed to `micromark-extens-gfm-strikethrough`.
 * @returns {Extension}
 *   Extension for `micromark` that can be passed in `extensions` to enable GFM
 *   syntax.
 */
function gfm(options) {
  return combineExtensions([
    gfmAutolinkLiteral(),
    gfmFootnote(),
    gfmStrikethrough(options),
    gfmTable(),
    gfmTaskListItem()
  ])
}

/**
 * @import {Root} from 'mdast'
 * @import {Options} from 'remark-gfm'
 * @import {} from 'remark-parse'
 * @import {} from 'remark-stringify'
 * @import {Processor} from 'unified'
 */


/** @type {Options} */
const emptyOptions$1 = {};

/**
 * Add support GFM (autolink literals, footnotes, strikethrough, tables,
 * tasklists).
 *
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
function remarkGfm(options) {
  // @ts-expect-error: TS is wrong about `this`.
  // eslint-disable-next-line unicorn/no-this-assignment
  const self = /** @type {Processor<Root>} */ (this);
  const settings = options || emptyOptions$1;
  const data = self.data();

  const micromarkExtensions =
    data.micromarkExtensions || (data.micromarkExtensions = []);
  const fromMarkdownExtensions =
    data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
  const toMarkdownExtensions =
    data.toMarkdownExtensions || (data.toMarkdownExtensions = []);

  micromarkExtensions.push(gfm(settings));
  fromMarkdownExtensions.push(gfmFromMarkdown());
  toMarkdownExtensions.push(gfmToMarkdown(settings));
}

/**
 * @import {
 *   InitialConstruct,
 *   Initializer,
 *   State,
 *   TokenizeContext,
 *   Token
 * } from 'micromark-util-types'
 */

/** @type {InitialConstruct} */
const content = {
  tokenize: initializeContent
};

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Initializer}
 *   Content.
 */
function initializeContent(effects) {
  const contentStart = effects.attempt(this.parser.constructs.contentInitial, afterContentStartConstruct, paragraphInitial);
  /** @type {Token} */
  let previous;
  return contentStart;

  /** @type {State} */
  function afterContentStartConstruct(code) {
    if (code === null) {
      effects.consume(code);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    return factorySpace(effects, contentStart, "linePrefix");
  }

  /** @type {State} */
  function paragraphInitial(code) {
    effects.enter("paragraph");
    return lineStart(code);
  }

  /** @type {State} */
  function lineStart(code) {
    const token = effects.enter("chunkText", {
      contentType: "text",
      previous
    });
    if (previous) {
      previous.next = token;
    }
    previous = token;
    return data(code);
  }

  /** @type {State} */
  function data(code) {
    if (code === null) {
      effects.exit("chunkText");
      effects.exit("paragraph");
      effects.consume(code);
      return;
    }
    if (markdownLineEnding(code)) {
      effects.consume(code);
      effects.exit("chunkText");
      return lineStart;
    }

    // Data.
    effects.consume(code);
    return data;
  }
}

/**
 * @import {
 *   Construct,
 *   ContainerState,
 *   InitialConstruct,
 *   Initializer,
 *   Point,
 *   State,
 *   TokenizeContext,
 *   Tokenizer,
 *   Token
 * } from 'micromark-util-types'
 */

/** @type {InitialConstruct} */
const document$1 = {
  tokenize: initializeDocument
};

/** @type {Construct} */
const containerConstruct = {
  tokenize: tokenizeContainer
};

/**
 * @this {TokenizeContext}
 *   Self.
 * @type {Initializer}
 *   Initializer.
 */
function initializeDocument(effects) {
  const self = this;
  /** @type {Array<StackItem>} */
  const stack = [];
  let continued = 0;
  /** @type {TokenizeContext | undefined} */
  let childFlow;
  /** @type {Token | undefined} */
  let childToken;
  /** @type {number} */
  let lineStartOffset;
  return start;

  /** @type {State} */
  function start(code) {
    // First we iterate through the open blocks, starting with the root
    // document, and descending through last children down to the last open
    // block.
    // Each block imposes a condition that the line must satisfy if the block is
    // to remain open.
    // For example, a block quote requires a `>` character.
    // A paragraph requires a non-blank line.
    // In this phase we may match all or just some of the open blocks.
    // But we cannot close unmatched blocks yet, because we may have a lazy
    // continuation line.
    if (continued < stack.length) {
      const item = stack[continued];
      self.containerState = item[1];
      return effects.attempt(item[0].continuation, documentContinue, checkNewContainers)(code);
    }

    // Done.
    return checkNewContainers(code);
  }

  /** @type {State} */
  function documentContinue(code) {
    continued++;

    // Note: this field is called `_closeFlow` but it also closes containers.
    // Perhaps a good idea to rename it but it’s already used in the wild by
    // extensions.
    if (self.containerState._closeFlow) {
      self.containerState._closeFlow = undefined;
      if (childFlow) {
        closeFlow();
      }

      // Note: this algorithm for moving events around is similar to the
      // algorithm when dealing with lazy lines in `writeToChild`.
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      /** @type {Point | undefined} */
      let point;

      // Find the flow chunk.
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === 'exit' && self.events[indexBeforeFlow][1].type === "chunkFlow") {
          point = self.events[indexBeforeFlow][1].end;
          break;
        }
      }
      exitContainers(continued);

      // Fix positions.
      let index = indexBeforeExits;
      while (index < self.events.length) {
        self.events[index][1].end = {
          ...point
        };
        index++;
      }

      // Inject the exits earlier (they’re still also at the end).
      splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));

      // Discard the duplicate exits.
      self.events.length = index;
      return checkNewContainers(code);
    }
    return start(code);
  }

  /** @type {State} */
  function checkNewContainers(code) {
    // Next, after consuming the continuation markers for existing blocks, we
    // look for new block starts (e.g. `>` for a block quote).
    // If we encounter a new block start, we close any blocks unmatched in
    // step 1 before creating the new block as a child of the last matched
    // block.
    if (continued === stack.length) {
      // No need to `check` whether there’s a container, of `exitContainers`
      // would be moot.
      // We can instead immediately `attempt` to parse one.
      if (!childFlow) {
        return documentContinued(code);
      }

      // If we have concrete content, such as block HTML or fenced code,
      // we can’t have containers “pierce” into them, so we can immediately
      // start.
      if (childFlow.currentConstruct && childFlow.currentConstruct.concrete) {
        return flowStart(code);
      }

      // If we do have flow, it could still be a blank line,
      // but we’d be interrupting it w/ a new container if there’s a current
      // construct.
      // To do: next major: remove `_gfmTableDynamicInterruptHack` (no longer
      // needed in micromark-extension-gfm-table@1.0.6).
      self.interrupt = Boolean(childFlow.currentConstruct && !childFlow._gfmTableDynamicInterruptHack);
    }

    // Check if there is a new container.
    self.containerState = {};
    return effects.check(containerConstruct, thereIsANewContainer, thereIsNoNewContainer)(code);
  }

  /** @type {State} */
  function thereIsANewContainer(code) {
    if (childFlow) closeFlow();
    exitContainers(continued);
    return documentContinued(code);
  }

  /** @type {State} */
  function thereIsNoNewContainer(code) {
    self.parser.lazy[self.now().line] = continued !== stack.length;
    lineStartOffset = self.now().offset;
    return flowStart(code);
  }

  /** @type {State} */
  function documentContinued(code) {
    // Try new containers.
    self.containerState = {};
    return effects.attempt(containerConstruct, containerContinue, flowStart)(code);
  }

  /** @type {State} */
  function containerContinue(code) {
    continued++;
    stack.push([self.currentConstruct, self.containerState]);
    // Try another.
    return documentContinued(code);
  }

  /** @type {State} */
  function flowStart(code) {
    if (code === null) {
      if (childFlow) closeFlow();
      exitContainers(0);
      effects.consume(code);
      return;
    }
    childFlow = childFlow || self.parser.flow(self.now());
    effects.enter("chunkFlow", {
      _tokenizer: childFlow,
      contentType: "flow",
      previous: childToken
    });
    return flowContinue(code);
  }

  /** @type {State} */
  function flowContinue(code) {
    if (code === null) {
      writeToChild(effects.exit("chunkFlow"), true);
      exitContainers(0);
      effects.consume(code);
      return;
    }
    if (markdownLineEnding(code)) {
      effects.consume(code);
      writeToChild(effects.exit("chunkFlow"));
      // Get ready for the next line.
      continued = 0;
      self.interrupt = undefined;
      return start;
    }
    effects.consume(code);
    return flowContinue;
  }

  /**
   * @param {Token} token
   *   Token.
   * @param {boolean | undefined} [endOfFile]
   *   Whether the token is at the end of the file (default: `false`).
   * @returns {undefined}
   *   Nothing.
   */
  function writeToChild(token, endOfFile) {
    const stream = self.sliceStream(token);
    if (endOfFile) stream.push(null);
    token.previous = childToken;
    if (childToken) childToken.next = token;
    childToken = token;
    childFlow.defineSkip(token.start);
    childFlow.write(stream);

    // Alright, so we just added a lazy line:
    //
    // ```markdown
    // > a
    // b.
    //
    // Or:
    //
    // > ~~~c
    // d
    //
    // Or:
    //
    // > | e |
    // f
    // ```
    //
    // The construct in the second example (fenced code) does not accept lazy
    // lines, so it marked itself as done at the end of its first line, and
    // then the content construct parses `d`.
    // Most constructs in markdown match on the first line: if the first line
    // forms a construct, a non-lazy line can’t “unmake” it.
    //
    // The construct in the third example is potentially a GFM table, and
    // those are *weird*.
    // It *could* be a table, from the first line, if the following line
    // matches a condition.
    // In this case, that second line is lazy, which “unmakes” the first line
    // and turns the whole into one content block.
    //
    // We’ve now parsed the non-lazy and the lazy line, and can figure out
    // whether the lazy line started a new flow block.
    // If it did, we exit the current containers between the two flow blocks.
    if (self.parser.lazy[token.start.line]) {
      let index = childFlow.events.length;
      while (index--) {
        if (
        // The token starts before the line ending…
        childFlow.events[index][1].start.offset < lineStartOffset && (
        // …and either is not ended yet…
        !childFlow.events[index][1].end ||
        // …or ends after it.
        childFlow.events[index][1].end.offset > lineStartOffset)) {
          // Exit: there’s still something open, which means it’s a lazy line
          // part of something.
          return;
        }
      }

      // Note: this algorithm for moving events around is similar to the
      // algorithm when closing flow in `documentContinue`.
      const indexBeforeExits = self.events.length;
      let indexBeforeFlow = indexBeforeExits;
      /** @type {boolean | undefined} */
      let seen;
      /** @type {Point | undefined} */
      let point;

      // Find the previous chunk (the one before the lazy line).
      while (indexBeforeFlow--) {
        if (self.events[indexBeforeFlow][0] === 'exit' && self.events[indexBeforeFlow][1].type === "chunkFlow") {
          if (seen) {
            point = self.events[indexBeforeFlow][1].end;
            break;
          }
          seen = true;
        }
      }
      exitContainers(continued);

      // Fix positions.
      index = indexBeforeExits;
      while (index < self.events.length) {
        self.events[index][1].end = {
          ...point
        };
        index++;
      }

      // Inject the exits earlier (they’re still also at the end).
      splice(self.events, indexBeforeFlow + 1, 0, self.events.slice(indexBeforeExits));

      // Discard the duplicate exits.
      self.events.length = index;
    }
  }

  /**
   * @param {number} size
   *   Size.
   * @returns {undefined}
   *   Nothing.
   */
  function exitContainers(size) {
    let index = stack.length;

    // Exit open containers.
    while (index-- > size) {
      const entry = stack[index];
      self.containerState = entry[1];
      entry[0].exit.call(self, effects);
    }
    stack.length = size;
  }
  function closeFlow() {
    childFlow.write([null]);
    childToken = undefined;
    childFlow = undefined;
    self.containerState._closeFlow = undefined;
  }
}

/**
 * @this {TokenizeContext}
 *   Context.
 * @type {Tokenizer}
 *   Tokenizer.
 */
function tokenizeContainer(effects, ok, nok) {
  // Always populated by defaults.

  return factorySpace(effects, effects.attempt(this.parser.constructs.document, ok, nok), "linePrefix", this.parser.constructs.disable.null.includes('codeIndented') ? undefined : 4);
}

/**
 * @import {
 *   InitialConstruct,
 *   Initializer,
 *   State,
 *   TokenizeContext
 * } from 'micromark-util-types'
 */

/** @type {InitialConstruct} */
const flow$1 = {
  tokenize: initializeFlow
};

/**
 * @this {TokenizeContext}
 *   Self.
 * @type {Initializer}
 *   Initializer.
 */
function initializeFlow(effects) {
  const self = this;
  const initial = effects.attempt(
  // Try to parse a blank line.
  blankLine, atBlankEnding,
  // Try to parse initial flow (essentially, only code).
  effects.attempt(this.parser.constructs.flowInitial, afterConstruct, factorySpace(effects, effects.attempt(this.parser.constructs.flow, afterConstruct, effects.attempt(content$1, afterConstruct)), "linePrefix")));
  return initial;

  /** @type {State} */
  function atBlankEnding(code) {
    if (code === null) {
      effects.consume(code);
      return;
    }
    effects.enter("lineEndingBlank");
    effects.consume(code);
    effects.exit("lineEndingBlank");
    self.currentConstruct = undefined;
    return initial;
  }

  /** @type {State} */
  function afterConstruct(code) {
    if (code === null) {
      effects.consume(code);
      return;
    }
    effects.enter("lineEnding");
    effects.consume(code);
    effects.exit("lineEnding");
    self.currentConstruct = undefined;
    return initial;
  }
}

/**
 * @import {
 *   Code,
 *   InitialConstruct,
 *   Initializer,
 *   Resolver,
 *   State,
 *   TokenizeContext
 * } from 'micromark-util-types'
 */

const resolver = {
  resolveAll: createResolver()
};
const string$1 = initializeFactory('string');
const text$2 = initializeFactory('text');

/**
 * @param {'string' | 'text'} field
 *   Field.
 * @returns {InitialConstruct}
 *   Construct.
 */
function initializeFactory(field) {
  return {
    resolveAll: createResolver(field === 'text' ? resolveAllLineSuffixes : undefined),
    tokenize: initializeText
  };

  /**
   * @this {TokenizeContext}
   *   Context.
   * @type {Initializer}
   */
  function initializeText(effects) {
    const self = this;
    const constructs = this.parser.constructs[field];
    const text = effects.attempt(constructs, start, notText);
    return start;

    /** @type {State} */
    function start(code) {
      return atBreak(code) ? text(code) : notText(code);
    }

    /** @type {State} */
    function notText(code) {
      if (code === null) {
        effects.consume(code);
        return;
      }
      effects.enter("data");
      effects.consume(code);
      return data;
    }

    /** @type {State} */
    function data(code) {
      if (atBreak(code)) {
        effects.exit("data");
        return text(code);
      }

      // Data.
      effects.consume(code);
      return data;
    }

    /**
     * @param {Code} code
     *   Code.
     * @returns {boolean}
     *   Whether the code is a break.
     */
    function atBreak(code) {
      if (code === null) {
        return true;
      }
      const list = constructs[code];
      let index = -1;
      if (list) {
        // Always populated by defaults.

        while (++index < list.length) {
          const item = list[index];
          if (!item.previous || item.previous.call(self, self.previous)) {
            return true;
          }
        }
      }
      return false;
    }
  }
}

/**
 * @param {Resolver | undefined} [extraResolver]
 *   Resolver.
 * @returns {Resolver}
 *   Resolver.
 */
function createResolver(extraResolver) {
  return resolveAllText;

  /** @type {Resolver} */
  function resolveAllText(events, context) {
    let index = -1;
    /** @type {number | undefined} */
    let enter;

    // A rather boring computation (to merge adjacent `data` events) which
    // improves mm performance by 29%.
    while (++index <= events.length) {
      if (enter === undefined) {
        if (events[index] && events[index][1].type === "data") {
          enter = index;
          index++;
        }
      } else if (!events[index] || events[index][1].type !== "data") {
        // Don’t do anything if there is one data token.
        if (index !== enter + 2) {
          events[enter][1].end = events[index - 1][1].end;
          events.splice(enter + 2, index - enter - 2);
          index = enter + 2;
        }
        enter = undefined;
      }
    }
    return extraResolver ? extraResolver(events, context) : events;
  }
}

/**
 * A rather ugly set of instructions which again looks at chunks in the input
 * stream.
 * The reason to do this here is that it is *much* faster to parse in reverse.
 * And that we can’t hook into `null` to split the line suffix before an EOF.
 * To do: figure out if we can make this into a clean utility, or even in core.
 * As it will be useful for GFMs literal autolink extension (and maybe even
 * tables?)
 *
 * @type {Resolver}
 */
function resolveAllLineSuffixes(events, context) {
  let eventIndex = 0; // Skip first.

  while (++eventIndex <= events.length) {
    if ((eventIndex === events.length || events[eventIndex][1].type === "lineEnding") && events[eventIndex - 1][1].type === "data") {
      const data = events[eventIndex - 1][1];
      const chunks = context.sliceStream(data);
      let index = chunks.length;
      let bufferIndex = -1;
      let size = 0;
      /** @type {boolean | undefined} */
      let tabs;
      while (index--) {
        const chunk = chunks[index];
        if (typeof chunk === 'string') {
          bufferIndex = chunk.length;
          while (chunk.charCodeAt(bufferIndex - 1) === 32) {
            size++;
            bufferIndex--;
          }
          if (bufferIndex) break;
          bufferIndex = -1;
        }
        // Number
        else if (chunk === -2) {
          tabs = true;
          size++;
        } else if (chunk === -1) ; else {
          // Replacement character, exit.
          index++;
          break;
        }
      }

      // Allow final trailing whitespace.
      if (context._contentTypeTextTrailing && eventIndex === events.length) {
        size = 0;
      }
      if (size) {
        const token = {
          type: eventIndex === events.length || tabs || size < 2 ? "lineSuffix" : "hardBreakTrailing",
          start: {
            _bufferIndex: index ? bufferIndex : data.start._bufferIndex + bufferIndex,
            _index: data.start._index + index,
            line: data.end.line,
            column: data.end.column - size,
            offset: data.end.offset - size
          },
          end: {
            ...data.end
          }
        };
        data.end = {
          ...token.start
        };
        if (data.start.offset === data.end.offset) {
          Object.assign(data, token);
        } else {
          events.splice(eventIndex, 0, ['enter', token, context], ['exit', token, context]);
          eventIndex += 2;
        }
      }
      eventIndex++;
    }
  }
  return events;
}

/**
 * @import {Extension} from 'micromark-util-types'
 */


/** @satisfies {Extension['document']} */
const document = {
  [42]: list$1,
  [43]: list$1,
  [45]: list$1,
  [48]: list$1,
  [49]: list$1,
  [50]: list$1,
  [51]: list$1,
  [52]: list$1,
  [53]: list$1,
  [54]: list$1,
  [55]: list$1,
  [56]: list$1,
  [57]: list$1,
  [62]: blockQuote
};

/** @satisfies {Extension['contentInitial']} */
const contentInitial = {
  [91]: definition
};

/** @satisfies {Extension['flowInitial']} */
const flowInitial = {
  [-2]: codeIndented,
  [-1]: codeIndented,
  [32]: codeIndented
};

/** @satisfies {Extension['flow']} */
const flow = {
  [35]: headingAtx,
  [42]: thematicBreak$1,
  [45]: [setextUnderline, thematicBreak$1],
  [60]: htmlFlow,
  [61]: setextUnderline,
  [95]: thematicBreak$1,
  [96]: codeFenced,
  [126]: codeFenced
};

/** @satisfies {Extension['string']} */
const string = {
  [38]: characterReference,
  [92]: characterEscape
};

/** @satisfies {Extension['text']} */
const text$1 = {
  [-5]: lineEnding,
  [-4]: lineEnding,
  [-3]: lineEnding,
  [33]: labelStartImage,
  [38]: characterReference,
  [42]: attention,
  [60]: [autolink, htmlText],
  [91]: labelStartLink,
  [92]: [hardBreakEscape, characterEscape],
  [93]: labelEnd,
  [95]: attention,
  [96]: codeText
};

/** @satisfies {Extension['insideSpan']} */
const insideSpan = {
  null: [attention, resolver]
};

/** @satisfies {Extension['attentionMarkers']} */
const attentionMarkers = {
  null: [42, 95]
};

/** @satisfies {Extension['disable']} */
const disable = {
  null: []
};

var defaultConstructs = /*#__PURE__*/Object.freeze({
	__proto__: null,
	attentionMarkers: attentionMarkers,
	contentInitial: contentInitial,
	disable: disable,
	document: document,
	flow: flow,
	flowInitial: flowInitial,
	insideSpan: insideSpan,
	string: string,
	text: text$1
});

/**
 * @import {
 *   Chunk,
 *   Code,
 *   ConstructRecord,
 *   Construct,
 *   Effects,
 *   InitialConstruct,
 *   ParseContext,
 *   Point,
 *   State,
 *   TokenizeContext,
 *   Token
 * } from 'micromark-util-types'
 */

/**
 * Create a tokenizer.
 * Tokenizers deal with one type of data (e.g., containers, flow, text).
 * The parser is the object dealing with it all.
 * `initialize` works like other constructs, except that only its `tokenize`
 * function is used, in which case it doesn’t receive an `ok` or `nok`.
 * `from` can be given to set the point before the first character, although
 * when further lines are indented, they must be set with `defineSkip`.
 *
 * @param {ParseContext} parser
 *   Parser.
 * @param {InitialConstruct} initialize
 *   Construct.
 * @param {Omit<Point, '_bufferIndex' | '_index'> | undefined} [from]
 *   Point (optional).
 * @returns {TokenizeContext}
 *   Context.
 */
function createTokenizer(parser, initialize, from) {
  /** @type {Point} */
  let point = {
    _bufferIndex: -1,
    _index: 0,
    line: from && from.line || 1,
    column: from && from.column || 1,
    offset: from && from.offset || 0
  };
  /** @type {Record<string, number>} */
  const columnStart = {};
  /** @type {Array<Construct>} */
  const resolveAllConstructs = [];
  /** @type {Array<Chunk>} */
  let chunks = [];
  /** @type {Array<Token>} */
  let stack = [];

  /**
   * Tools used for tokenizing.
   *
   * @type {Effects}
   */
  const effects = {
    attempt: constructFactory(onsuccessfulconstruct),
    check: constructFactory(onsuccessfulcheck),
    consume,
    enter,
    exit,
    interrupt: constructFactory(onsuccessfulcheck, {
      interrupt: true
    })
  };

  /**
   * State and tools for resolving and serializing.
   *
   * @type {TokenizeContext}
   */
  const context = {
    code: null,
    containerState: {},
    defineSkip,
    events: [],
    now,
    parser,
    previous: null,
    sliceSerialize,
    sliceStream,
    write
  };

  /**
   * The state function.
   *
   * @type {State | undefined}
   */
  let state = initialize.tokenize.call(context, effects);
  if (initialize.resolveAll) {
    resolveAllConstructs.push(initialize);
  }
  return context;

  /** @type {TokenizeContext['write']} */
  function write(slice) {
    chunks = push(chunks, slice);
    main();

    // Exit if we’re not done, resolve might change stuff.
    if (chunks[chunks.length - 1] !== null) {
      return [];
    }
    addResult(initialize, 0);

    // Otherwise, resolve, and exit.
    context.events = resolveAll(resolveAllConstructs, context.events, context);
    return context.events;
  }

  //
  // Tools.
  //

  /** @type {TokenizeContext['sliceSerialize']} */
  function sliceSerialize(token, expandTabs) {
    return serializeChunks(sliceStream(token), expandTabs);
  }

  /** @type {TokenizeContext['sliceStream']} */
  function sliceStream(token) {
    return sliceChunks(chunks, token);
  }

  /** @type {TokenizeContext['now']} */
  function now() {
    // This is a hot path, so we clone manually instead of `Object.assign({}, point)`
    const {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    } = point;
    return {
      _bufferIndex,
      _index,
      line,
      column,
      offset
    };
  }

  /** @type {TokenizeContext['defineSkip']} */
  function defineSkip(value) {
    columnStart[value.line] = value.column;
    accountForPotentialSkip();
  }

  //
  // State management.
  //

  /**
   * Main loop (note that `_index` and `_bufferIndex` in `point` are modified by
   * `consume`).
   * Here is where we walk through the chunks, which either include strings of
   * several characters, or numerical character codes.
   * The reason to do this in a loop instead of a call is so the stack can
   * drain.
   *
   * @returns {undefined}
   *   Nothing.
   */
  function main() {
    /** @type {number} */
    let chunkIndex;
    while (point._index < chunks.length) {
      const chunk = chunks[point._index];

      // If we’re in a buffer chunk, loop through it.
      if (typeof chunk === 'string') {
        chunkIndex = point._index;
        if (point._bufferIndex < 0) {
          point._bufferIndex = 0;
        }
        while (point._index === chunkIndex && point._bufferIndex < chunk.length) {
          go(chunk.charCodeAt(point._bufferIndex));
        }
      } else {
        go(chunk);
      }
    }
  }

  /**
   * Deal with one code.
   *
   * @param {Code} code
   *   Code.
   * @returns {undefined}
   *   Nothing.
   */
  function go(code) {
    state = state(code);
  }

  /** @type {Effects['consume']} */
  function consume(code) {
    if (markdownLineEnding(code)) {
      point.line++;
      point.column = 1;
      point.offset += code === -3 ? 2 : 1;
      accountForPotentialSkip();
    } else if (code !== -1) {
      point.column++;
      point.offset++;
    }

    // Not in a string chunk.
    if (point._bufferIndex < 0) {
      point._index++;
    } else {
      point._bufferIndex++;

      // At end of string chunk.
      if (point._bufferIndex ===
      // Points w/ non-negative `_bufferIndex` reference
      // strings.
      /** @type {string} */
      chunks[point._index].length) {
        point._bufferIndex = -1;
        point._index++;
      }
    }

    // Expose the previous character.
    context.previous = code;
  }

  /** @type {Effects['enter']} */
  function enter(type, fields) {
    /** @type {Token} */
    // @ts-expect-error Patch instead of assign required fields to help GC.
    const token = fields || {};
    token.type = type;
    token.start = now();
    context.events.push(['enter', token, context]);
    stack.push(token);
    return token;
  }

  /** @type {Effects['exit']} */
  function exit(type) {
    const token = stack.pop();
    token.end = now();
    context.events.push(['exit', token, context]);
    return token;
  }

  /**
   * Use results.
   *
   * @type {ReturnHandle}
   */
  function onsuccessfulconstruct(construct, info) {
    addResult(construct, info.from);
  }

  /**
   * Discard results.
   *
   * @type {ReturnHandle}
   */
  function onsuccessfulcheck(_, info) {
    info.restore();
  }

  /**
   * Factory to attempt/check/interrupt.
   *
   * @param {ReturnHandle} onreturn
   *   Callback.
   * @param {{interrupt?: boolean | undefined} | undefined} [fields]
   *   Fields.
   */
  function constructFactory(onreturn, fields) {
    return hook;

    /**
     * Handle either an object mapping codes to constructs, a list of
     * constructs, or a single construct.
     *
     * @param {Array<Construct> | ConstructRecord | Construct} constructs
     *   Constructs.
     * @param {State} returnState
     *   State.
     * @param {State | undefined} [bogusState]
     *   State.
     * @returns {State}
     *   State.
     */
    function hook(constructs, returnState, bogusState) {
      /** @type {ReadonlyArray<Construct>} */
      let listOfConstructs;
      /** @type {number} */
      let constructIndex;
      /** @type {Construct} */
      let currentConstruct;
      /** @type {Info} */
      let info;
      return Array.isArray(constructs) ? /* c8 ignore next 1 */
      handleListOfConstructs(constructs) : 'tokenize' in constructs ?
      // Looks like a construct.
      handleListOfConstructs([(/** @type {Construct} */constructs)]) : handleMapOfConstructs(constructs);

      /**
       * Handle a list of construct.
       *
       * @param {ConstructRecord} map
       *   Constructs.
       * @returns {State}
       *   State.
       */
      function handleMapOfConstructs(map) {
        return start;

        /** @type {State} */
        function start(code) {
          const left = code !== null && map[code];
          const all = code !== null && map.null;
          const list = [
          // To do: add more extension tests.
          /* c8 ignore next 2 */
          ...(Array.isArray(left) ? left : left ? [left] : []), ...(Array.isArray(all) ? all : all ? [all] : [])];
          return handleListOfConstructs(list)(code);
        }
      }

      /**
       * Handle a list of construct.
       *
       * @param {ReadonlyArray<Construct>} list
       *   Constructs.
       * @returns {State}
       *   State.
       */
      function handleListOfConstructs(list) {
        listOfConstructs = list;
        constructIndex = 0;
        if (list.length === 0) {
          return bogusState;
        }
        return handleConstruct(list[constructIndex]);
      }

      /**
       * Handle a single construct.
       *
       * @param {Construct} construct
       *   Construct.
       * @returns {State}
       *   State.
       */
      function handleConstruct(construct) {
        return start;

        /** @type {State} */
        function start(code) {
          // To do: not needed to store if there is no bogus state, probably?
          // Currently doesn’t work because `inspect` in document does a check
          // w/o a bogus, which doesn’t make sense. But it does seem to help perf
          // by not storing.
          info = store();
          currentConstruct = construct;
          if (!construct.partial) {
            context.currentConstruct = construct;
          }

          // Always populated by defaults.

          if (construct.name && context.parser.constructs.disable.null.includes(construct.name)) {
            return nok();
          }
          return construct.tokenize.call(
          // If we do have fields, create an object w/ `context` as its
          // prototype.
          // This allows a “live binding”, which is needed for `interrupt`.
          fields ? Object.assign(Object.create(context), fields) : context, effects, ok, nok)(code);
        }
      }

      /** @type {State} */
      function ok(code) {
        onreturn(currentConstruct, info);
        return returnState;
      }

      /** @type {State} */
      function nok(code) {
        info.restore();
        if (++constructIndex < listOfConstructs.length) {
          return handleConstruct(listOfConstructs[constructIndex]);
        }
        return bogusState;
      }
    }
  }

  /**
   * @param {Construct} construct
   *   Construct.
   * @param {number} from
   *   From.
   * @returns {undefined}
   *   Nothing.
   */
  function addResult(construct, from) {
    if (construct.resolveAll && !resolveAllConstructs.includes(construct)) {
      resolveAllConstructs.push(construct);
    }
    if (construct.resolve) {
      splice(context.events, from, context.events.length - from, construct.resolve(context.events.slice(from), context));
    }
    if (construct.resolveTo) {
      context.events = construct.resolveTo(context.events, context);
    }
  }

  /**
   * Store state.
   *
   * @returns {Info}
   *   Info.
   */
  function store() {
    const startPoint = now();
    const startPrevious = context.previous;
    const startCurrentConstruct = context.currentConstruct;
    const startEventsIndex = context.events.length;
    const startStack = Array.from(stack);
    return {
      from: startEventsIndex,
      restore
    };

    /**
     * Restore state.
     *
     * @returns {undefined}
     *   Nothing.
     */
    function restore() {
      point = startPoint;
      context.previous = startPrevious;
      context.currentConstruct = startCurrentConstruct;
      context.events.length = startEventsIndex;
      stack = startStack;
      accountForPotentialSkip();
    }
  }

  /**
   * Move the current point a bit forward in the line when it’s on a column
   * skip.
   *
   * @returns {undefined}
   *   Nothing.
   */
  function accountForPotentialSkip() {
    if (point.line in columnStart && point.column < 2) {
      point.column = columnStart[point.line];
      point.offset += columnStart[point.line] - 1;
    }
  }
}

/**
 * Get the chunks from a slice of chunks in the range of a token.
 *
 * @param {ReadonlyArray<Chunk>} chunks
 *   Chunks.
 * @param {Pick<Token, 'end' | 'start'>} token
 *   Token.
 * @returns {Array<Chunk>}
 *   Chunks.
 */
function sliceChunks(chunks, token) {
  const startIndex = token.start._index;
  const startBufferIndex = token.start._bufferIndex;
  const endIndex = token.end._index;
  const endBufferIndex = token.end._bufferIndex;
  /** @type {Array<Chunk>} */
  let view;
  if (startIndex === endIndex) {
    // @ts-expect-error `_bufferIndex` is used on string chunks.
    view = [chunks[startIndex].slice(startBufferIndex, endBufferIndex)];
  } else {
    view = chunks.slice(startIndex, endIndex);
    if (startBufferIndex > -1) {
      const head = view[0];
      if (typeof head === 'string') {
        view[0] = head.slice(startBufferIndex);
        /* c8 ignore next 4 -- used to be used, no longer */
      } else {
        view.shift();
      }
    }
    if (endBufferIndex > 0) {
      // @ts-expect-error `_bufferIndex` is used on string chunks.
      view.push(chunks[endIndex].slice(0, endBufferIndex));
    }
  }
  return view;
}

/**
 * Get the string value of a slice of chunks.
 *
 * @param {ReadonlyArray<Chunk>} chunks
 *   Chunks.
 * @param {boolean | undefined} [expandTabs=false]
 *   Whether to expand tabs (default: `false`).
 * @returns {string}
 *   Result.
 */
function serializeChunks(chunks, expandTabs) {
  let index = -1;
  /** @type {Array<string>} */
  const result = [];
  /** @type {boolean | undefined} */
  let atTab;
  while (++index < chunks.length) {
    const chunk = chunks[index];
    /** @type {string} */
    let value;
    if (typeof chunk === 'string') {
      value = chunk;
    } else switch (chunk) {
      case -5:
        {
          value = "\r";
          break;
        }
      case -4:
        {
          value = "\n";
          break;
        }
      case -3:
        {
          value = "\r" + "\n";
          break;
        }
      case -2:
        {
          value = expandTabs ? " " : "\t";
          break;
        }
      case -1:
        {
          if (!expandTabs && atTab) continue;
          value = " ";
          break;
        }
      default:
        {
          // Currently only replacement character.
          value = String.fromCharCode(chunk);
        }
    }
    atTab = chunk === -2;
    result.push(value);
  }
  return result.join('');
}

/**
 * @import {
 *   Create,
 *   FullNormalizedExtension,
 *   InitialConstruct,
 *   ParseContext,
 *   ParseOptions
 * } from 'micromark-util-types'
 */


/**
 * @param {ParseOptions | null | undefined} [options]
 *   Configuration (optional).
 * @returns {ParseContext}
 *   Parser.
 */
function parse$2(options) {
  const settings = options || {};
  const constructs = /** @type {FullNormalizedExtension} */
  combineExtensions([defaultConstructs, ...(settings.extensions || [])]);

  /** @type {ParseContext} */
  const parser = {
    constructs,
    content: create(content),
    defined: [],
    document: create(document$1),
    flow: create(flow$1),
    lazy: {},
    string: create(string$1),
    text: create(text$2)
  };
  return parser;

  /**
   * @param {InitialConstruct} initial
   *   Construct to start with.
   * @returns {Create}
   *   Create a tokenizer.
   */
  function create(initial) {
    return creator;
    /** @type {Create} */
    function creator(from) {
      return createTokenizer(parser, initial, from);
    }
  }
}

/**
 * @import {Event} from 'micromark-util-types'
 */


/**
 * @param {Array<Event>} events
 *   Events.
 * @returns {Array<Event>}
 *   Events.
 */
function postprocess(events) {
  while (!subtokenize(events)) {
    // Empty
  }
  return events;
}

/**
 * @import {Chunk, Code, Encoding, Value} from 'micromark-util-types'
 */

/**
 * @callback Preprocessor
 *   Preprocess a value.
 * @param {Value} value
 *   Value.
 * @param {Encoding | null | undefined} [encoding]
 *   Encoding when `value` is a typed array (optional).
 * @param {boolean | null | undefined} [end=false]
 *   Whether this is the last chunk (default: `false`).
 * @returns {Array<Chunk>}
 *   Chunks.
 */

const search = /[\0\t\n\r]/g;

/**
 * @returns {Preprocessor}
 *   Preprocess a value.
 */
function preprocess() {
  let column = 1;
  let buffer = '';
  /** @type {boolean | undefined} */
  let start = true;
  /** @type {boolean | undefined} */
  let atCarriageReturn;
  return preprocessor;

  /** @type {Preprocessor} */
  // eslint-disable-next-line complexity
  function preprocessor(value, encoding, end) {
    /** @type {Array<Chunk>} */
    const chunks = [];
    /** @type {RegExpMatchArray | null} */
    let match;
    /** @type {number} */
    let next;
    /** @type {number} */
    let startPosition;
    /** @type {number} */
    let endPosition;
    /** @type {Code} */
    let code;
    value = buffer + (typeof value === 'string' ? value.toString() : new TextDecoder(encoding || undefined).decode(value));
    startPosition = 0;
    buffer = '';
    if (start) {
      // To do: `markdown-rs` actually parses BOMs (byte order mark).
      if (value.charCodeAt(0) === 65279) {
        startPosition++;
      }
      start = undefined;
    }
    while (startPosition < value.length) {
      search.lastIndex = startPosition;
      match = search.exec(value);
      endPosition = match && match.index !== undefined ? match.index : value.length;
      code = value.charCodeAt(endPosition);
      if (!match) {
        buffer = value.slice(startPosition);
        break;
      }
      if (code === 10 && startPosition === endPosition && atCarriageReturn) {
        chunks.push(-3);
        atCarriageReturn = undefined;
      } else {
        if (atCarriageReturn) {
          chunks.push(-5);
          atCarriageReturn = undefined;
        }
        if (startPosition < endPosition) {
          chunks.push(value.slice(startPosition, endPosition));
          column += endPosition - startPosition;
        }
        switch (code) {
          case 0:
            {
              chunks.push(65533);
              column++;
              break;
            }
          case 9:
            {
              next = Math.ceil(column / 4) * 4;
              chunks.push(-2);
              while (column++ < next) chunks.push(-1);
              break;
            }
          case 10:
            {
              chunks.push(-4);
              column = 1;
              break;
            }
          default:
            {
              atCarriageReturn = true;
              column = 1;
            }
        }
      }
      startPosition = endPosition + 1;
    }
    if (end) {
      if (atCarriageReturn) chunks.push(-5);
      if (buffer) chunks.push(buffer);
      chunks.push(null);
    }
    return chunks;
  }
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Point} Point
 * @typedef {import('unist').Position} Position
 */

/**
 * @typedef NodeLike
 * @property {string} type
 * @property {PositionLike | null | undefined} [position]
 *
 * @typedef PointLike
 * @property {number | null | undefined} [line]
 * @property {number | null | undefined} [column]
 * @property {number | null | undefined} [offset]
 *
 * @typedef PositionLike
 * @property {PointLike | null | undefined} [start]
 * @property {PointLike | null | undefined} [end]
 */

/**
 * Serialize the positional info of a point, position (start and end points),
 * or node.
 *
 * @param {Node | NodeLike | Point | PointLike | Position | PositionLike | null | undefined} [value]
 *   Node, position, or point.
 * @returns {string}
 *   Pretty printed positional info of a node (`string`).
 *
 *   In the format of a range `ls:cs-le:ce` (when given `node` or `position`)
 *   or a point `l:c` (when given `point`), where `l` stands for line, `c` for
 *   column, `s` for `start`, and `e` for end.
 *   An empty string (`''`) is returned if the given value is neither `node`,
 *   `position`, nor `point`.
 */
function stringifyPosition(value) {
  // Nothing.
  if (!value || typeof value !== 'object') {
    return ''
  }

  // Node.
  if ('position' in value || 'type' in value) {
    return position$1(value.position)
  }

  // Position.
  if ('start' in value || 'end' in value) {
    return position$1(value)
  }

  // Point.
  if ('line' in value || 'column' in value) {
    return point$2(value)
  }

  // ?
  return ''
}

/**
 * @param {Point | PointLike | null | undefined} point
 * @returns {string}
 */
function point$2(point) {
  return index(point && point.line) + ':' + index(point && point.column)
}

/**
 * @param {Position | PositionLike | null | undefined} pos
 * @returns {string}
 */
function position$1(pos) {
  return point$2(pos && pos.start) + '-' + point$2(pos && pos.end)
}

/**
 * @param {number | null | undefined} value
 * @returns {number}
 */
function index(value) {
  return value && typeof value === 'number' ? value : 1
}

/**
 * @import {
 *   Break,
 *   Blockquote,
 *   Code,
 *   Definition,
 *   Emphasis,
 *   Heading,
 *   Html,
 *   Image,
 *   InlineCode,
 *   Link,
 *   ListItem,
 *   List,
 *   Nodes,
 *   Paragraph,
 *   PhrasingContent,
 *   ReferenceType,
 *   Root,
 *   Strong,
 *   Text,
 *   ThematicBreak
 * } from 'mdast'
 * @import {
 *   Encoding,
 *   Event,
 *   Token,
 *   Value
 * } from 'micromark-util-types'
 * @import {Point} from 'unist'
 * @import {
 *   CompileContext,
 *   CompileData,
 *   Config,
 *   Extension,
 *   Handle,
 *   OnEnterError,
 *   Options
 * } from './types.js'
 */

const own$4 = {}.hasOwnProperty;

/**
 * Turn markdown into a syntax tree.
 *
 * @overload
 * @param {Value} value
 * @param {Encoding | null | undefined} [encoding]
 * @param {Options | null | undefined} [options]
 * @returns {Root}
 *
 * @overload
 * @param {Value} value
 * @param {Options | null | undefined} [options]
 * @returns {Root}
 *
 * @param {Value} value
 *   Markdown to parse.
 * @param {Encoding | Options | null | undefined} [encoding]
 *   Character encoding for when `value` is `Buffer`.
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns {Root}
 *   mdast tree.
 */
function fromMarkdown(value, encoding, options) {
  if (typeof encoding !== 'string') {
    options = encoding;
    encoding = undefined;
  }
  return compiler(options)(postprocess(parse$2(options).document().write(preprocess()(value, encoding, true))));
}

/**
 * Note this compiler only understand complete buffering, not streaming.
 *
 * @param {Options | null | undefined} [options]
 */
function compiler(options) {
  /** @type {Config} */
  const config = {
    transforms: [],
    canContainEols: ['emphasis', 'fragment', 'heading', 'paragraph', 'strong'],
    enter: {
      autolink: opener(link),
      autolinkProtocol: onenterdata,
      autolinkEmail: onenterdata,
      atxHeading: opener(heading),
      blockQuote: opener(blockQuote),
      characterEscape: onenterdata,
      characterReference: onenterdata,
      codeFenced: opener(codeFlow),
      codeFencedFenceInfo: buffer,
      codeFencedFenceMeta: buffer,
      codeIndented: opener(codeFlow, buffer),
      codeText: opener(codeText, buffer),
      codeTextData: onenterdata,
      data: onenterdata,
      codeFlowValue: onenterdata,
      definition: opener(definition),
      definitionDestinationString: buffer,
      definitionLabelString: buffer,
      definitionTitleString: buffer,
      emphasis: opener(emphasis),
      hardBreakEscape: opener(hardBreak),
      hardBreakTrailing: opener(hardBreak),
      htmlFlow: opener(html, buffer),
      htmlFlowData: onenterdata,
      htmlText: opener(html, buffer),
      htmlTextData: onenterdata,
      image: opener(image),
      label: buffer,
      link: opener(link),
      listItem: opener(listItem),
      listItemValue: onenterlistitemvalue,
      listOrdered: opener(list, onenterlistordered),
      listUnordered: opener(list),
      paragraph: opener(paragraph),
      reference: onenterreference,
      referenceString: buffer,
      resourceDestinationString: buffer,
      resourceTitleString: buffer,
      setextHeading: opener(heading),
      strong: opener(strong),
      thematicBreak: opener(thematicBreak)
    },
    exit: {
      atxHeading: closer(),
      atxHeadingSequence: onexitatxheadingsequence,
      autolink: closer(),
      autolinkEmail: onexitautolinkemail,
      autolinkProtocol: onexitautolinkprotocol,
      blockQuote: closer(),
      characterEscapeValue: onexitdata,
      characterReferenceMarkerHexadecimal: onexitcharacterreferencemarker,
      characterReferenceMarkerNumeric: onexitcharacterreferencemarker,
      characterReferenceValue: onexitcharacterreferencevalue,
      characterReference: onexitcharacterreference,
      codeFenced: closer(onexitcodefenced),
      codeFencedFence: onexitcodefencedfence,
      codeFencedFenceInfo: onexitcodefencedfenceinfo,
      codeFencedFenceMeta: onexitcodefencedfencemeta,
      codeFlowValue: onexitdata,
      codeIndented: closer(onexitcodeindented),
      codeText: closer(onexitcodetext),
      codeTextData: onexitdata,
      data: onexitdata,
      definition: closer(),
      definitionDestinationString: onexitdefinitiondestinationstring,
      definitionLabelString: onexitdefinitionlabelstring,
      definitionTitleString: onexitdefinitiontitlestring,
      emphasis: closer(),
      hardBreakEscape: closer(onexithardbreak),
      hardBreakTrailing: closer(onexithardbreak),
      htmlFlow: closer(onexithtmlflow),
      htmlFlowData: onexitdata,
      htmlText: closer(onexithtmltext),
      htmlTextData: onexitdata,
      image: closer(onexitimage),
      label: onexitlabel,
      labelText: onexitlabeltext,
      lineEnding: onexitlineending,
      link: closer(onexitlink),
      listItem: closer(),
      listOrdered: closer(),
      listUnordered: closer(),
      paragraph: closer(),
      referenceString: onexitreferencestring,
      resourceDestinationString: onexitresourcedestinationstring,
      resourceTitleString: onexitresourcetitlestring,
      resource: onexitresource,
      setextHeading: closer(onexitsetextheading),
      setextHeadingLineSequence: onexitsetextheadinglinesequence,
      setextHeadingText: onexitsetextheadingtext,
      strong: closer(),
      thematicBreak: closer()
    }
  };
  configure(config, (options || {}).mdastExtensions || []);

  /** @type {CompileData} */
  const data = {};
  return compile;

  /**
   * Turn micromark events into an mdast tree.
   *
   * @param {Array<Event>} events
   *   Events.
   * @returns {Root}
   *   mdast tree.
   */
  function compile(events) {
    /** @type {Root} */
    let tree = {
      type: 'root',
      children: []
    };
    /** @type {Omit<CompileContext, 'sliceSerialize'>} */
    const context = {
      stack: [tree],
      tokenStack: [],
      config,
      enter,
      exit,
      buffer,
      resume,
      data
    };
    /** @type {Array<number>} */
    const listStack = [];
    let index = -1;
    while (++index < events.length) {
      // We preprocess lists to add `listItem` tokens, and to infer whether
      // items the list itself are spread out.
      if (events[index][1].type === "listOrdered" || events[index][1].type === "listUnordered") {
        if (events[index][0] === 'enter') {
          listStack.push(index);
        } else {
          const tail = listStack.pop();
          index = prepareList(events, tail, index);
        }
      }
    }
    index = -1;
    while (++index < events.length) {
      const handler = config[events[index][0]];
      if (own$4.call(handler, events[index][1].type)) {
        handler[events[index][1].type].call(Object.assign({
          sliceSerialize: events[index][2].sliceSerialize
        }, context), events[index][1]);
      }
    }

    // Handle tokens still being open.
    if (context.tokenStack.length > 0) {
      const tail = context.tokenStack[context.tokenStack.length - 1];
      const handler = tail[1] || defaultOnError;
      handler.call(context, undefined, tail[0]);
    }

    // Figure out `root` position.
    tree.position = {
      start: point$1(events.length > 0 ? events[0][1].start : {
        line: 1,
        column: 1,
        offset: 0
      }),
      end: point$1(events.length > 0 ? events[events.length - 2][1].end : {
        line: 1,
        column: 1,
        offset: 0
      })
    };

    // Call transforms.
    index = -1;
    while (++index < config.transforms.length) {
      tree = config.transforms[index](tree) || tree;
    }
    return tree;
  }

  /**
   * @param {Array<Event>} events
   * @param {number} start
   * @param {number} length
   * @returns {number}
   */
  function prepareList(events, start, length) {
    let index = start - 1;
    let containerBalance = -1;
    let listSpread = false;
    /** @type {Token | undefined} */
    let listItem;
    /** @type {number | undefined} */
    let lineIndex;
    /** @type {number | undefined} */
    let firstBlankLineIndex;
    /** @type {boolean | undefined} */
    let atMarker;
    while (++index <= length) {
      const event = events[index];
      switch (event[1].type) {
        case "listUnordered":
        case "listOrdered":
        case "blockQuote":
          {
            if (event[0] === 'enter') {
              containerBalance++;
            } else {
              containerBalance--;
            }
            atMarker = undefined;
            break;
          }
        case "lineEndingBlank":
          {
            if (event[0] === 'enter') {
              if (listItem && !atMarker && !containerBalance && !firstBlankLineIndex) {
                firstBlankLineIndex = index;
              }
              atMarker = undefined;
            }
            break;
          }
        case "linePrefix":
        case "listItemValue":
        case "listItemMarker":
        case "listItemPrefix":
        case "listItemPrefixWhitespace":
          {
            // Empty.

            break;
          }
        default:
          {
            atMarker = undefined;
          }
      }
      if (!containerBalance && event[0] === 'enter' && event[1].type === "listItemPrefix" || containerBalance === -1 && event[0] === 'exit' && (event[1].type === "listUnordered" || event[1].type === "listOrdered")) {
        if (listItem) {
          let tailIndex = index;
          lineIndex = undefined;
          while (tailIndex--) {
            const tailEvent = events[tailIndex];
            if (tailEvent[1].type === "lineEnding" || tailEvent[1].type === "lineEndingBlank") {
              if (tailEvent[0] === 'exit') continue;
              if (lineIndex) {
                events[lineIndex][1].type = "lineEndingBlank";
                listSpread = true;
              }
              tailEvent[1].type = "lineEnding";
              lineIndex = tailIndex;
            } else if (tailEvent[1].type === "linePrefix" || tailEvent[1].type === "blockQuotePrefix" || tailEvent[1].type === "blockQuotePrefixWhitespace" || tailEvent[1].type === "blockQuoteMarker" || tailEvent[1].type === "listItemIndent") ; else {
              break;
            }
          }
          if (firstBlankLineIndex && (!lineIndex || firstBlankLineIndex < lineIndex)) {
            listItem._spread = true;
          }

          // Fix position.
          listItem.end = Object.assign({}, lineIndex ? events[lineIndex][1].start : event[1].end);
          events.splice(lineIndex || index, 0, ['exit', listItem, event[2]]);
          index++;
          length++;
        }

        // Create a new list item.
        if (event[1].type === "listItemPrefix") {
          /** @type {Token} */
          const item = {
            type: 'listItem',
            _spread: false,
            start: Object.assign({}, event[1].start),
            // @ts-expect-error: we’ll add `end` in a second.
            end: undefined
          };
          listItem = item;
          events.splice(index, 0, ['enter', item, event[2]]);
          index++;
          length++;
          firstBlankLineIndex = undefined;
          atMarker = true;
        }
      }
    }
    events[start][1]._spread = listSpread;
    return length;
  }

  /**
   * Create an opener handle.
   *
   * @param {(token: Token) => Nodes} create
   *   Create a node.
   * @param {Handle | undefined} [and]
   *   Optional function to also run.
   * @returns {Handle}
   *   Handle.
   */
  function opener(create, and) {
    return open;

    /**
     * @this {CompileContext}
     * @param {Token} token
     * @returns {undefined}
     */
    function open(token) {
      enter.call(this, create(token), token);
      if (and) and.call(this, token);
    }
  }

  /**
   * @type {CompileContext['buffer']}
   */
  function buffer() {
    this.stack.push({
      type: 'fragment',
      children: []
    });
  }

  /**
   * @type {CompileContext['enter']}
   */
  function enter(node, token, errorHandler) {
    const parent = this.stack[this.stack.length - 1];
    /** @type {Array<Nodes>} */
    const siblings = parent.children;
    siblings.push(node);
    this.stack.push(node);
    this.tokenStack.push([token, errorHandler || undefined]);
    node.position = {
      start: point$1(token.start),
      // @ts-expect-error: `end` will be patched later.
      end: undefined
    };
  }

  /**
   * Create a closer handle.
   *
   * @param {Handle | undefined} [and]
   *   Optional function to also run.
   * @returns {Handle}
   *   Handle.
   */
  function closer(and) {
    return close;

    /**
     * @this {CompileContext}
     * @param {Token} token
     * @returns {undefined}
     */
    function close(token) {
      if (and) and.call(this, token);
      exit.call(this, token);
    }
  }

  /**
   * @type {CompileContext['exit']}
   */
  function exit(token, onExitError) {
    const node = this.stack.pop();
    const open = this.tokenStack.pop();
    if (!open) {
      throw new Error('Cannot close `' + token.type + '` (' + stringifyPosition({
        start: token.start,
        end: token.end
      }) + '): it’s not open');
    } else if (open[0].type !== token.type) {
      if (onExitError) {
        onExitError.call(this, token, open[0]);
      } else {
        const handler = open[1] || defaultOnError;
        handler.call(this, token, open[0]);
      }
    }
    node.position.end = point$1(token.end);
  }

  /**
   * @type {CompileContext['resume']}
   */
  function resume() {
    return toString$2(this.stack.pop());
  }

  //
  // Handlers.
  //

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onenterlistordered() {
    this.data.expectingFirstListItemValue = true;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onenterlistitemvalue(token) {
    if (this.data.expectingFirstListItemValue) {
      const ancestor = this.stack[this.stack.length - 2];
      ancestor.start = Number.parseInt(this.sliceSerialize(token), 10);
      this.data.expectingFirstListItemValue = undefined;
    }
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcodefencedfenceinfo() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.lang = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcodefencedfencemeta() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.meta = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcodefencedfence() {
    // Exit if this is the closing fence.
    if (this.data.flowCodeInside) return;
    this.buffer();
    this.data.flowCodeInside = true;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcodefenced() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.value = data.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, '');
    this.data.flowCodeInside = undefined;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcodeindented() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.value = data.replace(/(\r?\n|\r)$/g, '');
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitdefinitionlabelstring(token) {
    const label = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.label = label;
    node.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitdefinitiontitlestring() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.title = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitdefinitiondestinationstring() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.url = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitatxheadingsequence(token) {
    const node = this.stack[this.stack.length - 1];
    if (!node.depth) {
      const depth = this.sliceSerialize(token).length;
      node.depth = depth;
    }
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitsetextheadingtext() {
    this.data.setextHeadingSlurpLineEnding = true;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitsetextheadinglinesequence(token) {
    const node = this.stack[this.stack.length - 1];
    node.depth = this.sliceSerialize(token).codePointAt(0) === 61 ? 1 : 2;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitsetextheading() {
    this.data.setextHeadingSlurpLineEnding = undefined;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onenterdata(token) {
    const node = this.stack[this.stack.length - 1];
    /** @type {Array<Nodes>} */
    const siblings = node.children;
    let tail = siblings[siblings.length - 1];
    if (!tail || tail.type !== 'text') {
      // Add a new text node.
      tail = text();
      tail.position = {
        start: point$1(token.start),
        // @ts-expect-error: we’ll add `end` later.
        end: undefined
      };
      siblings.push(tail);
    }
    this.stack.push(tail);
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitdata(token) {
    const tail = this.stack.pop();
    tail.value += this.sliceSerialize(token);
    tail.position.end = point$1(token.end);
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitlineending(token) {
    const context = this.stack[this.stack.length - 1];
    // If we’re at a hard break, include the line ending in there.
    if (this.data.atHardBreak) {
      const tail = context.children[context.children.length - 1];
      tail.position.end = point$1(token.end);
      this.data.atHardBreak = undefined;
      return;
    }
    if (!this.data.setextHeadingSlurpLineEnding && config.canContainEols.includes(context.type)) {
      onenterdata.call(this, token);
      onexitdata.call(this, token);
    }
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexithardbreak() {
    this.data.atHardBreak = true;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexithtmlflow() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.value = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexithtmltext() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.value = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitcodetext() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.value = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitlink() {
    const node = this.stack[this.stack.length - 1];
    // Note: there are also `identifier` and `label` fields on this link node!
    // These are used / cleaned here.

    // To do: clean.
    if (this.data.inReference) {
      /** @type {ReferenceType} */
      const referenceType = this.data.referenceType || 'shortcut';
      node.type += 'Reference';
      // @ts-expect-error: mutate.
      node.referenceType = referenceType;
      // @ts-expect-error: mutate.
      delete node.url;
      delete node.title;
    } else {
      // @ts-expect-error: mutate.
      delete node.identifier;
      // @ts-expect-error: mutate.
      delete node.label;
    }
    this.data.referenceType = undefined;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitimage() {
    const node = this.stack[this.stack.length - 1];
    // Note: there are also `identifier` and `label` fields on this link node!
    // These are used / cleaned here.

    // To do: clean.
    if (this.data.inReference) {
      /** @type {ReferenceType} */
      const referenceType = this.data.referenceType || 'shortcut';
      node.type += 'Reference';
      // @ts-expect-error: mutate.
      node.referenceType = referenceType;
      // @ts-expect-error: mutate.
      delete node.url;
      delete node.title;
    } else {
      // @ts-expect-error: mutate.
      delete node.identifier;
      // @ts-expect-error: mutate.
      delete node.label;
    }
    this.data.referenceType = undefined;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitlabeltext(token) {
    const string = this.sliceSerialize(token);
    const ancestor = this.stack[this.stack.length - 2];
    // @ts-expect-error: stash this on the node, as it might become a reference
    // later.
    ancestor.label = decodeString(string);
    // @ts-expect-error: same as above.
    ancestor.identifier = normalizeIdentifier(string).toLowerCase();
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitlabel() {
    const fragment = this.stack[this.stack.length - 1];
    const value = this.resume();
    const node = this.stack[this.stack.length - 1];
    // Assume a reference.
    this.data.inReference = true;
    if (node.type === 'link') {
      /** @type {Array<PhrasingContent>} */
      const children = fragment.children;
      node.children = children;
    } else {
      node.alt = value;
    }
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitresourcedestinationstring() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.url = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitresourcetitlestring() {
    const data = this.resume();
    const node = this.stack[this.stack.length - 1];
    node.title = data;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitresource() {
    this.data.inReference = undefined;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onenterreference() {
    this.data.referenceType = 'collapsed';
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitreferencestring(token) {
    const label = this.resume();
    const node = this.stack[this.stack.length - 1];
    // @ts-expect-error: stash this on the node, as it might become a reference
    // later.
    node.label = label;
    // @ts-expect-error: same as above.
    node.identifier = normalizeIdentifier(this.sliceSerialize(token)).toLowerCase();
    this.data.referenceType = 'full';
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */

  function onexitcharacterreferencemarker(token) {
    this.data.characterReferenceType = token.type;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcharacterreferencevalue(token) {
    const data = this.sliceSerialize(token);
    const type = this.data.characterReferenceType;
    /** @type {string} */
    let value;
    if (type) {
      value = decodeNumericCharacterReference(data, type === "characterReferenceMarkerNumeric" ? 10 : 16);
      this.data.characterReferenceType = undefined;
    } else {
      const result = decodeNamedCharacterReference(data);
      value = result;
    }
    const tail = this.stack[this.stack.length - 1];
    tail.value += value;
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitcharacterreference(token) {
    const tail = this.stack.pop();
    tail.position.end = point$1(token.end);
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitautolinkprotocol(token) {
    onexitdata.call(this, token);
    const node = this.stack[this.stack.length - 1];
    node.url = this.sliceSerialize(token);
  }

  /**
   * @this {CompileContext}
   * @type {Handle}
   */
  function onexitautolinkemail(token) {
    onexitdata.call(this, token);
    const node = this.stack[this.stack.length - 1];
    node.url = 'mailto:' + this.sliceSerialize(token);
  }

  //
  // Creaters.
  //

  /** @returns {Blockquote} */
  function blockQuote() {
    return {
      type: 'blockquote',
      children: []
    };
  }

  /** @returns {Code} */
  function codeFlow() {
    return {
      type: 'code',
      lang: null,
      meta: null,
      value: ''
    };
  }

  /** @returns {InlineCode} */
  function codeText() {
    return {
      type: 'inlineCode',
      value: ''
    };
  }

  /** @returns {Definition} */
  function definition() {
    return {
      type: 'definition',
      identifier: '',
      label: null,
      title: null,
      url: ''
    };
  }

  /** @returns {Emphasis} */
  function emphasis() {
    return {
      type: 'emphasis',
      children: []
    };
  }

  /** @returns {Heading} */
  function heading() {
    return {
      type: 'heading',
      // @ts-expect-error `depth` will be set later.
      depth: 0,
      children: []
    };
  }

  /** @returns {Break} */
  function hardBreak() {
    return {
      type: 'break'
    };
  }

  /** @returns {Html} */
  function html() {
    return {
      type: 'html',
      value: ''
    };
  }

  /** @returns {Image} */
  function image() {
    return {
      type: 'image',
      title: null,
      url: '',
      alt: null
    };
  }

  /** @returns {Link} */
  function link() {
    return {
      type: 'link',
      title: null,
      url: '',
      children: []
    };
  }

  /**
   * @param {Token} token
   * @returns {List}
   */
  function list(token) {
    return {
      type: 'list',
      ordered: token.type === 'listOrdered',
      start: null,
      spread: token._spread,
      children: []
    };
  }

  /**
   * @param {Token} token
   * @returns {ListItem}
   */
  function listItem(token) {
    return {
      type: 'listItem',
      spread: token._spread,
      checked: null,
      children: []
    };
  }

  /** @returns {Paragraph} */
  function paragraph() {
    return {
      type: 'paragraph',
      children: []
    };
  }

  /** @returns {Strong} */
  function strong() {
    return {
      type: 'strong',
      children: []
    };
  }

  /** @returns {Text} */
  function text() {
    return {
      type: 'text',
      value: ''
    };
  }

  /** @returns {ThematicBreak} */
  function thematicBreak() {
    return {
      type: 'thematicBreak'
    };
  }
}

/**
 * Copy a point-like value.
 *
 * @param {Point} d
 *   Point-like value.
 * @returns {Point}
 *   unist point.
 */
function point$1(d) {
  return {
    line: d.line,
    column: d.column,
    offset: d.offset
  };
}

/**
 * @param {Config} combined
 * @param {Array<Array<Extension> | Extension>} extensions
 * @returns {undefined}
 */
function configure(combined, extensions) {
  let index = -1;
  while (++index < extensions.length) {
    const value = extensions[index];
    if (Array.isArray(value)) {
      configure(combined, value);
    } else {
      extension(combined, value);
    }
  }
}

/**
 * @param {Config} combined
 * @param {Extension} extension
 * @returns {undefined}
 */
function extension(combined, extension) {
  /** @type {keyof Extension} */
  let key;
  for (key in extension) {
    if (own$4.call(extension, key)) {
      switch (key) {
        case 'canContainEols':
          {
            const right = extension[key];
            if (right) {
              combined[key].push(...right);
            }
            break;
          }
        case 'transforms':
          {
            const right = extension[key];
            if (right) {
              combined[key].push(...right);
            }
            break;
          }
        case 'enter':
        case 'exit':
          {
            const right = extension[key];
            if (right) {
              Object.assign(combined[key], right);
            }
            break;
          }
        // No default
      }
    }
  }
}

/** @type {OnEnterError} */
function defaultOnError(left, right) {
  if (left) {
    throw new Error('Cannot close `' + left.type + '` (' + stringifyPosition({
      start: left.start,
      end: left.end
    }) + '): a different token (`' + right.type + '`, ' + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ') is open');
  } else {
    throw new Error('Cannot close document, a token (`' + right.type + '`, ' + stringifyPosition({
      start: right.start,
      end: right.end
    }) + ') is still open');
  }
}

/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-from-markdown').Options} FromMarkdownOptions
 * @typedef {import('unified').Parser<Root>} Parser
 * @typedef {import('unified').Processor<Root>} Processor
 */


/**
 * Aadd support for parsing from markdown.
 *
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {undefined}
 *   Nothing.
 */
function remarkParse(options) {
  /** @type {Processor} */
  // @ts-expect-error: TS in JSDoc generates wrong types if `this` is typed regularly.
  const self = this;

  self.parser = parser;

  /**
   * @type {Parser}
   */
  function parser(doc) {
    return fromMarkdown(doc, {
      ...self.data('settings'),
      ...options,
      // Note: these options are not in the readme.
      // The goal is for them to be set by plugins on `data` instead of being
      // passed by users.
      extensions: self.data('micromarkExtensions') || [],
      mdastExtensions: self.data('fromMarkdownExtensions') || []
    })
  }
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Blockquote} Blockquote
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `blockquote` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Blockquote} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function blockquote(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'blockquote',
    properties: {},
    children: state.wrap(state.all(node), true)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Text} Text
 * @typedef {import('mdast').Break} Break
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `break` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Break} node
 *   mdast node.
 * @returns {Array<Element | Text>}
 *   hast element content.
 */
function hardBreak(state, node) {
  /** @type {Element} */
  const result = {type: 'element', tagName: 'br', properties: {}, children: []};
  state.patch(node, result);
  return [state.applyData(node, result), {type: 'text', value: '\n'}]
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').Code} Code
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `code` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Code} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function code(state, node) {
  const value = node.value ? node.value + '\n' : '';
  /** @type {Properties} */
  const properties = {};

  if (node.lang) {
    properties.className = ['language-' + node.lang];
  }

  // Create `<code>`.
  /** @type {Element} */
  let result = {
    type: 'element',
    tagName: 'code',
    properties,
    children: [{type: 'text', value}]
  };

  if (node.meta) {
    result.data = {meta: node.meta};
  }

  state.patch(node, result);
  result = state.applyData(node, result);

  // Create `<pre>`.
  result = {type: 'element', tagName: 'pre', properties: {}, children: [result]};
  state.patch(node, result);
  return result
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Delete} Delete
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `delete` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Delete} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function strikethrough(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'del',
    properties: {},
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Emphasis} Emphasis
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `emphasis` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Emphasis} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function emphasis(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'em',
    properties: {},
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').FootnoteReference} FootnoteReference
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `footnoteReference` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {FootnoteReference} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function footnoteReference(state, node) {
  const clobberPrefix =
    typeof state.options.clobberPrefix === 'string'
      ? state.options.clobberPrefix
      : 'user-content-';
  const id = String(node.identifier).toUpperCase();
  const safeId = normalizeUri(id.toLowerCase());
  const index = state.footnoteOrder.indexOf(id);
  /** @type {number} */
  let counter;

  let reuseCounter = state.footnoteCounts.get(id);

  if (reuseCounter === undefined) {
    reuseCounter = 0;
    state.footnoteOrder.push(id);
    counter = state.footnoteOrder.length;
  } else {
    counter = index + 1;
  }

  reuseCounter += 1;
  state.footnoteCounts.set(id, reuseCounter);

  /** @type {Element} */
  const link = {
    type: 'element',
    tagName: 'a',
    properties: {
      href: '#' + clobberPrefix + 'fn-' + safeId,
      id:
        clobberPrefix +
        'fnref-' +
        safeId +
        (reuseCounter > 1 ? '-' + reuseCounter : ''),
      dataFootnoteRef: true,
      ariaDescribedBy: ['footnote-label']
    },
    children: [{type: 'text', value: String(counter)}]
  };
  state.patch(node, link);

  /** @type {Element} */
  const sup = {
    type: 'element',
    tagName: 'sup',
    properties: {},
    children: [link]
  };
  state.patch(node, sup);
  return state.applyData(node, sup)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Heading} Heading
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `heading` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Heading} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function heading(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'h' + node.depth,
    properties: {},
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Html} Html
 * @typedef {import('../state.js').State} State
 * @typedef {import('../../index.js').Raw} Raw
 */


/**
 * Turn an mdast `html` node into hast (`raw` node in dangerous mode, otherwise
 * nothing).
 *
 * @param {State} state
 *   Info passed around.
 * @param {Html} node
 *   mdast node.
 * @returns {Element | Raw | undefined}
 *   hast node.
 */
function html(state, node) {
  if (state.options.allowDangerousHtml) {
    /** @type {Raw} */
    const result = {type: 'raw', value: node.value};
    state.patch(node, result);
    return state.applyData(node, result)
  }

  return undefined
}

/**
 * @typedef {import('hast').ElementContent} ElementContent
 *
 * @typedef {import('mdast').Nodes} Nodes
 * @typedef {import('mdast').Reference} Reference
 *
 * @typedef {import('./state.js').State} State
 */


/**
 * Return the content of a reference without definition as plain text.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Extract<Nodes, Reference>} node
 *   Reference node (image, link).
 * @returns {Array<ElementContent>}
 *   hast content.
 */
function revert(state, node) {
  const subtype = node.referenceType;
  let suffix = ']';

  if (subtype === 'collapsed') {
    suffix += '[]';
  } else if (subtype === 'full') {
    suffix += '[' + (node.label || node.identifier) + ']';
  }

  if (node.type === 'imageReference') {
    return [{type: 'text', value: '![' + node.alt + suffix}]
  }

  const contents = state.all(node);
  const head = contents[0];

  if (head && head.type === 'text') {
    head.value = '[' + head.value;
  } else {
    contents.unshift({type: 'text', value: '['});
  }

  const tail = contents[contents.length - 1];

  if (tail && tail.type === 'text') {
    tail.value += suffix;
  } else {
    contents.push({type: 'text', value: suffix});
  }

  return contents
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').ImageReference} ImageReference
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `imageReference` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {ImageReference} node
 *   mdast node.
 * @returns {Array<ElementContent> | ElementContent}
 *   hast node.
 */
function imageReference(state, node) {
  const id = String(node.identifier).toUpperCase();
  const definition = state.definitionById.get(id);

  if (!definition) {
    return revert(state, node)
  }

  /** @type {Properties} */
  const properties = {src: normalizeUri(definition.url || ''), alt: node.alt};

  if (definition.title !== null && definition.title !== undefined) {
    properties.title = definition.title;
  }

  /** @type {Element} */
  const result = {type: 'element', tagName: 'img', properties, children: []};
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').Image} Image
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `image` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Image} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function image(state, node) {
  /** @type {Properties} */
  const properties = {src: normalizeUri(node.url)};

  if (node.alt !== null && node.alt !== undefined) {
    properties.alt = node.alt;
  }

  if (node.title !== null && node.title !== undefined) {
    properties.title = node.title;
  }

  /** @type {Element} */
  const result = {type: 'element', tagName: 'img', properties, children: []};
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Text} Text
 * @typedef {import('mdast').InlineCode} InlineCode
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `inlineCode` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {InlineCode} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function inlineCode(state, node) {
  /** @type {Text} */
  const text = {type: 'text', value: node.value.replace(/\r?\n|\r/g, ' ')};
  state.patch(node, text);

  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'code',
    properties: {},
    children: [text]
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').LinkReference} LinkReference
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `linkReference` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {LinkReference} node
 *   mdast node.
 * @returns {Array<ElementContent> | ElementContent}
 *   hast node.
 */
function linkReference(state, node) {
  const id = String(node.identifier).toUpperCase();
  const definition = state.definitionById.get(id);

  if (!definition) {
    return revert(state, node)
  }

  /** @type {Properties} */
  const properties = {href: normalizeUri(definition.url || '')};

  if (definition.title !== null && definition.title !== undefined) {
    properties.title = definition.title;
  }

  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'a',
    properties,
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').Link} Link
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `link` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Link} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function link(state, node) {
  /** @type {Properties} */
  const properties = {href: normalizeUri(node.url)};

  if (node.title !== null && node.title !== undefined) {
    properties.title = node.title;
  }

  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'a',
    properties,
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').ListItem} ListItem
 * @typedef {import('mdast').Parents} Parents
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `listItem` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {ListItem} node
 *   mdast node.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {Element}
 *   hast node.
 */
function listItem(state, node, parent) {
  const results = state.all(node);
  const loose = parent ? listLoose(parent) : listItemLoose(node);
  /** @type {Properties} */
  const properties = {};
  /** @type {Array<ElementContent>} */
  const children = [];

  if (typeof node.checked === 'boolean') {
    const head = results[0];
    /** @type {Element} */
    let paragraph;

    if (head && head.type === 'element' && head.tagName === 'p') {
      paragraph = head;
    } else {
      paragraph = {type: 'element', tagName: 'p', properties: {}, children: []};
      results.unshift(paragraph);
    }

    if (paragraph.children.length > 0) {
      paragraph.children.unshift({type: 'text', value: ' '});
    }

    paragraph.children.unshift({
      type: 'element',
      tagName: 'input',
      properties: {type: 'checkbox', checked: node.checked, disabled: true},
      children: []
    });

    // According to github-markdown-css, this class hides bullet.
    // See: <https://github.com/sindresorhus/github-markdown-css>.
    properties.className = ['task-list-item'];
  }

  let index = -1;

  while (++index < results.length) {
    const child = results[index];

    // Add eols before nodes, except if this is a loose, first paragraph.
    if (
      loose ||
      index !== 0 ||
      child.type !== 'element' ||
      child.tagName !== 'p'
    ) {
      children.push({type: 'text', value: '\n'});
    }

    if (child.type === 'element' && child.tagName === 'p' && !loose) {
      children.push(...child.children);
    } else {
      children.push(child);
    }
  }

  const tail = results[results.length - 1];

  // Add a final eol.
  if (tail && (loose || tail.type !== 'element' || tail.tagName !== 'p')) {
    children.push({type: 'text', value: '\n'});
  }

  /** @type {Element} */
  const result = {type: 'element', tagName: 'li', properties, children};
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @param {Parents} node
 * @return {Boolean}
 */
function listLoose(node) {
  let loose = false;
  if (node.type === 'list') {
    loose = node.spread || false;
    const children = node.children;
    let index = -1;

    while (!loose && ++index < children.length) {
      loose = listItemLoose(children[index]);
    }
  }

  return loose
}

/**
 * @param {ListItem} node
 * @return {Boolean}
 */
function listItemLoose(node) {
  const spread = node.spread;

  return spread === null || spread === undefined
    ? node.children.length > 1
    : spread
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').List} List
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `list` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {List} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function list(state, node) {
  /** @type {Properties} */
  const properties = {};
  const results = state.all(node);
  let index = -1;

  if (typeof node.start === 'number' && node.start !== 1) {
    properties.start = node.start;
  }

  // Like GitHub, add a class for custom styling.
  while (++index < results.length) {
    const child = results[index];

    if (
      child.type === 'element' &&
      child.tagName === 'li' &&
      child.properties &&
      Array.isArray(child.properties.className) &&
      child.properties.className.includes('task-list-item')
    ) {
      properties.className = ['contains-task-list'];
      break
    }
  }

  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: node.ordered ? 'ol' : 'ul',
    properties,
    children: state.wrap(results, true)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Paragraph} Paragraph
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `paragraph` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Paragraph} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function paragraph(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'p',
    properties: {},
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Parents} HastParents
 * @typedef {import('hast').Root} HastRoot
 * @typedef {import('mdast').Root} MdastRoot
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `root` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {MdastRoot} node
 *   mdast node.
 * @returns {HastParents}
 *   hast node.
 */
function root$1(state, node) {
  /** @type {HastRoot} */
  const result = {type: 'root', children: state.wrap(state.all(node))};
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Strong} Strong
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `strong` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Strong} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function strong(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'strong',
    properties: {},
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Point} Point
 * @typedef {import('unist').Position} Position
 */

/**
 * @typedef NodeLike
 * @property {string} type
 * @property {PositionLike | null | undefined} [position]
 *
 * @typedef PositionLike
 * @property {PointLike | null | undefined} [start]
 * @property {PointLike | null | undefined} [end]
 *
 * @typedef PointLike
 * @property {number | null | undefined} [line]
 * @property {number | null | undefined} [column]
 * @property {number | null | undefined} [offset]
 */

/**
 * Get the ending point of `node`.
 *
 * @param node
 *   Node.
 * @returns
 *   Point.
 */
const pointEnd = point('end');

/**
 * Get the starting point of `node`.
 *
 * @param node
 *   Node.
 * @returns
 *   Point.
 */
const pointStart = point('start');

/**
 * Get the positional info of `node`.
 *
 * @param {'end' | 'start'} type
 *   Side.
 * @returns
 *   Getter.
 */
function point(type) {
  return point

  /**
   * Get the point info of `node` at a bound side.
   *
   * @param {Node | NodeLike | null | undefined} [node]
   * @returns {Point | undefined}
   */
  function point(node) {
    const point = (node && node.position && node.position[type]) || {};

    if (
      typeof point.line === 'number' &&
      point.line > 0 &&
      typeof point.column === 'number' &&
      point.column > 0
    ) {
      return {
        line: point.line,
        column: point.column,
        offset:
          typeof point.offset === 'number' && point.offset > -1
            ? point.offset
            : undefined
      }
    }
  }
}

/**
 * Get the positional info of `node`.
 *
 * @param {Node | NodeLike | null | undefined} [node]
 *   Node.
 * @returns {Position | undefined}
 *   Position.
 */
function position(node) {
  const start = pointStart(node);
  const end = pointEnd(node);

  if (start && end) {
    return {start, end}
  }
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').Table} Table
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `table` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {Table} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function table(state, node) {
  const rows = state.all(node);
  const firstRow = rows.shift();
  /** @type {Array<Element>} */
  const tableContent = [];

  if (firstRow) {
    /** @type {Element} */
    const head = {
      type: 'element',
      tagName: 'thead',
      properties: {},
      children: state.wrap([firstRow], true)
    };
    state.patch(node.children[0], head);
    tableContent.push(head);
  }

  if (rows.length > 0) {
    /** @type {Element} */
    const body = {
      type: 'element',
      tagName: 'tbody',
      properties: {},
      children: state.wrap(rows, true)
    };

    const start = pointStart(node.children[1]);
    const end = pointEnd(node.children[node.children.length - 1]);
    if (start && end) body.position = {start, end};
    tableContent.push(body);
  }

  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'table',
    properties: {},
    children: state.wrap(tableContent, true)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 * @typedef {import('hast').Properties} Properties
 * @typedef {import('mdast').Parents} Parents
 * @typedef {import('mdast').TableRow} TableRow
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `tableRow` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {TableRow} node
 *   mdast node.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {Element}
 *   hast node.
 */
function tableRow(state, node, parent) {
  const siblings = parent ? parent.children : undefined;
  // Generate a body row when without parent.
  const rowIndex = siblings ? siblings.indexOf(node) : 1;
  const tagName = rowIndex === 0 ? 'th' : 'td';
  // To do: option to use `style`?
  const align = parent && parent.type === 'table' ? parent.align : undefined;
  const length = align ? align.length : node.children.length;
  let cellIndex = -1;
  /** @type {Array<ElementContent>} */
  const cells = [];

  while (++cellIndex < length) {
    // Note: can also be undefined.
    const cell = node.children[cellIndex];
    /** @type {Properties} */
    const properties = {};
    const alignValue = align ? align[cellIndex] : undefined;

    if (alignValue) {
      properties.align = alignValue;
    }

    /** @type {Element} */
    let result = {type: 'element', tagName, properties, children: []};

    if (cell) {
      result.children = state.all(cell);
      state.patch(cell, result);
      result = state.applyData(cell, result);
    }

    cells.push(result);
  }

  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'tr',
    properties: {},
    children: state.wrap(cells, true)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').TableCell} TableCell
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `tableCell` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {TableCell} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function tableCell(state, node) {
  // Note: this function is normally not called: see `table-row` for how rows
  // and their cells are compiled.
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'td', // Assume body cell.
    properties: {},
    children: state.all(node)
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

const tab = 9; /* `\t` */
const space = 32; /* ` ` */

/**
 * Remove initial and final spaces and tabs at the line breaks in `value`.
 * Does not trim initial and final spaces and tabs of the value itself.
 *
 * @param {string} value
 *   Value to trim.
 * @returns {string}
 *   Trimmed value.
 */
function trimLines(value) {
  const source = String(value);
  const search = /\r?\n|\r/g;
  let match = search.exec(source);
  let last = 0;
  /** @type {Array<string>} */
  const lines = [];

  while (match) {
    lines.push(
      trimLine(source.slice(last, match.index), last > 0, true),
      match[0]
    );

    last = match.index + match[0].length;
    match = search.exec(source);
  }

  lines.push(trimLine(source.slice(last), last > 0, false));

  return lines.join('')
}

/**
 * @param {string} value
 *   Line to trim.
 * @param {boolean} start
 *   Whether to trim the start of the line.
 * @param {boolean} end
 *   Whether to trim the end of the line.
 * @returns {string}
 *   Trimmed line.
 */
function trimLine(value, start, end) {
  let startIndex = 0;
  let endIndex = value.length;

  if (start) {
    let code = value.codePointAt(startIndex);

    while (code === tab || code === space) {
      startIndex++;
      code = value.codePointAt(startIndex);
    }
  }

  if (end) {
    let code = value.codePointAt(endIndex - 1);

    while (code === tab || code === space) {
      endIndex--;
      code = value.codePointAt(endIndex - 1);
    }
  }

  return endIndex > startIndex ? value.slice(startIndex, endIndex) : ''
}

/**
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').Text} HastText
 * @typedef {import('mdast').Text} MdastText
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `text` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {MdastText} node
 *   mdast node.
 * @returns {HastElement | HastText}
 *   hast node.
 */
function text(state, node) {
  /** @type {HastText} */
  const result = {type: 'text', value: trimLines(String(node.value))};
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('mdast').ThematicBreak} ThematicBreak
 * @typedef {import('../state.js').State} State
 */


/**
 * Turn an mdast `thematicBreak` node into hast.
 *
 * @param {State} state
 *   Info passed around.
 * @param {ThematicBreak} node
 *   mdast node.
 * @returns {Element}
 *   hast node.
 */
function thematicBreak(state, node) {
  /** @type {Element} */
  const result = {
    type: 'element',
    tagName: 'hr',
    properties: {},
    children: []
  };
  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * Default handlers for nodes.
 *
 * @satisfies {import('../state.js').Handlers}
 */
const handlers = {
  blockquote,
  break: hardBreak,
  code,
  delete: strikethrough,
  emphasis,
  footnoteReference,
  heading,
  html,
  imageReference,
  image,
  inlineCode,
  linkReference,
  link,
  listItem,
  list,
  paragraph,
  // @ts-expect-error: root is different, but hard to type.
  root: root$1,
  strong,
  table,
  tableCell,
  tableRow,
  text,
  thematicBreak,
  toml: ignore,
  yaml: ignore,
  definition: ignore,
  footnoteDefinition: ignore
};

// Return nothing for nodes that are ignored.
function ignore() {
  return undefined
}

const VOID       = -1;
const PRIMITIVE  = 0;
const ARRAY      = 1;
const OBJECT     = 2;
const DATE       = 3;
const REGEXP     = 4;
const MAP        = 5;
const SET        = 6;
const ERROR      = 7;
const BIGINT     = 8;
// export const SYMBOL = 9;

const env = typeof self === 'object' ? self : globalThis;

const deserializer = ($, _) => {
  const as = (out, index) => {
    $.set(index, out);
    return out;
  };

  const unpair = index => {
    if ($.has(index))
      return $.get(index);

    const [type, value] = _[index];
    switch (type) {
      case PRIMITIVE:
      case VOID:
        return as(value, index);
      case ARRAY: {
        const arr = as([], index);
        for (const index of value)
          arr.push(unpair(index));
        return arr;
      }
      case OBJECT: {
        const object = as({}, index);
        for (const [key, index] of value)
          object[unpair(key)] = unpair(index);
        return object;
      }
      case DATE:
        return as(new Date(value), index);
      case REGEXP: {
        const {source, flags} = value;
        return as(new RegExp(source, flags), index);
      }
      case MAP: {
        const map = as(new Map, index);
        for (const [key, index] of value)
          map.set(unpair(key), unpair(index));
        return map;
      }
      case SET: {
        const set = as(new Set, index);
        for (const index of value)
          set.add(unpair(index));
        return set;
      }
      case ERROR: {
        const {name, message} = value;
        return as(new env[name](message), index);
      }
      case BIGINT:
        return as(BigInt(value), index);
      case 'BigInt':
        return as(Object(BigInt(value)), index);
      case 'ArrayBuffer':
        return as(new Uint8Array(value).buffer, value);
      case 'DataView': {
        const { buffer } = new Uint8Array(value);
        return as(new DataView(buffer), value);
      }
    }
    return as(new env[type](value), index);
  };

  return unpair;
};

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns a deserialized value from a serialized array of Records.
 * @param {Record[]} serialized a previously serialized value.
 * @returns {any}
 */
const deserialize = serialized => deserializer(new Map, serialized)(0);

const EMPTY = '';

const {toString: toString$1} = {};
const {keys} = Object;

const typeOf = value => {
  const type = typeof value;
  if (type !== 'object' || !value)
    return [PRIMITIVE, type];

  const asString = toString$1.call(value).slice(8, -1);
  switch (asString) {
    case 'Array':
      return [ARRAY, EMPTY];
    case 'Object':
      return [OBJECT, EMPTY];
    case 'Date':
      return [DATE, EMPTY];
    case 'RegExp':
      return [REGEXP, EMPTY];
    case 'Map':
      return [MAP, EMPTY];
    case 'Set':
      return [SET, EMPTY];
    case 'DataView':
      return [ARRAY, asString];
  }

  if (asString.includes('Array'))
    return [ARRAY, asString];

  if (asString.includes('Error'))
    return [ERROR, asString];

  return [OBJECT, asString];
};

const shouldSkip = ([TYPE, type]) => (
  TYPE === PRIMITIVE &&
  (type === 'function' || type === 'symbol')
);

const serializer = (strict, json, $, _) => {

  const as = (out, value) => {
    const index = _.push(out) - 1;
    $.set(value, index);
    return index;
  };

  const pair = value => {
    if ($.has(value))
      return $.get(value);

    let [TYPE, type] = typeOf(value);
    switch (TYPE) {
      case PRIMITIVE: {
        let entry = value;
        switch (type) {
          case 'bigint':
            TYPE = BIGINT;
            entry = value.toString();
            break;
          case 'function':
          case 'symbol':
            if (strict)
              throw new TypeError('unable to serialize ' + type);
            entry = null;
            break;
          case 'undefined':
            return as([VOID], value);
        }
        return as([TYPE, entry], value);
      }
      case ARRAY: {
        if (type) {
          let spread = value;
          if (type === 'DataView') {
            spread = new Uint8Array(value.buffer);
          }
          else if (type === 'ArrayBuffer') {
            spread = new Uint8Array(value);
          }
          return as([type, [...spread]], value);
        }

        const arr = [];
        const index = as([TYPE, arr], value);
        for (const entry of value)
          arr.push(pair(entry));
        return index;
      }
      case OBJECT: {
        if (type) {
          switch (type) {
            case 'BigInt':
              return as([type, value.toString()], value);
            case 'Boolean':
            case 'Number':
            case 'String':
              return as([type, value.valueOf()], value);
          }
        }

        if (json && ('toJSON' in value))
          return pair(value.toJSON());

        const entries = [];
        const index = as([TYPE, entries], value);
        for (const key of keys(value)) {
          if (strict || !shouldSkip(typeOf(value[key])))
            entries.push([pair(key), pair(value[key])]);
        }
        return index;
      }
      case DATE:
        return as([TYPE, value.toISOString()], value);
      case REGEXP: {
        const {source, flags} = value;
        return as([TYPE, {source, flags}], value);
      }
      case MAP: {
        const entries = [];
        const index = as([TYPE, entries], value);
        for (const [key, entry] of value) {
          if (strict || !(shouldSkip(typeOf(key)) || shouldSkip(typeOf(entry))))
            entries.push([pair(key), pair(entry)]);
        }
        return index;
      }
      case SET: {
        const entries = [];
        const index = as([TYPE, entries], value);
        for (const entry of value) {
          if (strict || !shouldSkip(typeOf(entry)))
            entries.push(pair(entry));
        }
        return index;
      }
    }

    const {message} = value;
    return as([TYPE, {name: type, message}], value);
  };

  return pair;
};

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns an array of serialized Records.
 * @param {any} value a serializable value.
 * @param {{json?: boolean, lossy?: boolean}?} options an object with a `lossy` or `json` property that,
 *  if `true`, will not throw errors on incompatible types, and behave more
 *  like JSON stringify would behave. Symbol and Function will be discarded.
 * @returns {Record[]}
 */
 const serialize = (value, {json, lossy} = {}) => {
  const _ = [];
  return serializer(!(json || lossy), !!json, new Map, _)(value), _;
};

/**
 * @typedef {Array<string,any>} Record a type representation
 */

/**
 * Returns an array of serialized Records.
 * @param {any} any a serializable value.
 * @param {{transfer?: any[], json?: boolean, lossy?: boolean}?} options an object with
 * a transfer option (ignored when polyfilled) and/or non standard fields that
 * fallback to the polyfill if present.
 * @returns {Record[]}
 */
var structuredClone$1 = typeof structuredClone === "function" ?
  /* c8 ignore start */
  (any, options) => (
    options && ('json' in options || 'lossy' in options) ?
      deserialize(serialize(any, options)) : structuredClone(any)
  ) :
  (any, options) => deserialize(serialize(any, options));

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').ElementContent} ElementContent
 *
 * @typedef {import('./state.js').State} State
 */


/**
 * Generate the default content that GitHub uses on backreferences.
 *
 * @param {number} _
 *   Index of the definition in the order that they are first referenced,
 *   0-indexed.
 * @param {number} rereferenceIndex
 *   Index of calls to the same definition, 0-indexed.
 * @returns {Array<ElementContent>}
 *   Content.
 */
function defaultFootnoteBackContent(_, rereferenceIndex) {
  /** @type {Array<ElementContent>} */
  const result = [{type: 'text', value: '↩'}];

  if (rereferenceIndex > 1) {
    result.push({
      type: 'element',
      tagName: 'sup',
      properties: {},
      children: [{type: 'text', value: String(rereferenceIndex)}]
    });
  }

  return result
}

/**
 * Generate the default label that GitHub uses on backreferences.
 *
 * @param {number} referenceIndex
 *   Index of the definition in the order that they are first referenced,
 *   0-indexed.
 * @param {number} rereferenceIndex
 *   Index of calls to the same definition, 0-indexed.
 * @returns {string}
 *   Label.
 */
function defaultFootnoteBackLabel(referenceIndex, rereferenceIndex) {
  return (
    'Back to reference ' +
    (referenceIndex + 1) +
    (rereferenceIndex > 1 ? '-' + rereferenceIndex : '')
  )
}

/**
 * Generate a hast footer for called footnote definitions.
 *
 * @param {State} state
 *   Info passed around.
 * @returns {Element | undefined}
 *   `section` element or `undefined`.
 */
// eslint-disable-next-line complexity
function footer(state) {
  const clobberPrefix =
    typeof state.options.clobberPrefix === 'string'
      ? state.options.clobberPrefix
      : 'user-content-';
  const footnoteBackContent =
    state.options.footnoteBackContent || defaultFootnoteBackContent;
  const footnoteBackLabel =
    state.options.footnoteBackLabel || defaultFootnoteBackLabel;
  const footnoteLabel = state.options.footnoteLabel || 'Footnotes';
  const footnoteLabelTagName = state.options.footnoteLabelTagName || 'h2';
  const footnoteLabelProperties = state.options.footnoteLabelProperties || {
    className: ['sr-only']
  };
  /** @type {Array<ElementContent>} */
  const listItems = [];
  let referenceIndex = -1;

  while (++referenceIndex < state.footnoteOrder.length) {
    const definition = state.footnoteById.get(
      state.footnoteOrder[referenceIndex]
    );

    if (!definition) {
      continue
    }

    const content = state.all(definition);
    const id = String(definition.identifier).toUpperCase();
    const safeId = normalizeUri(id.toLowerCase());
    let rereferenceIndex = 0;
    /** @type {Array<ElementContent>} */
    const backReferences = [];
    const counts = state.footnoteCounts.get(id);

    // eslint-disable-next-line no-unmodified-loop-condition
    while (counts !== undefined && ++rereferenceIndex <= counts) {
      if (backReferences.length > 0) {
        backReferences.push({type: 'text', value: ' '});
      }

      let children =
        typeof footnoteBackContent === 'string'
          ? footnoteBackContent
          : footnoteBackContent(referenceIndex, rereferenceIndex);

      if (typeof children === 'string') {
        children = {type: 'text', value: children};
      }

      backReferences.push({
        type: 'element',
        tagName: 'a',
        properties: {
          href:
            '#' +
            clobberPrefix +
            'fnref-' +
            safeId +
            (rereferenceIndex > 1 ? '-' + rereferenceIndex : ''),
          dataFootnoteBackref: '',
          ariaLabel:
            typeof footnoteBackLabel === 'string'
              ? footnoteBackLabel
              : footnoteBackLabel(referenceIndex, rereferenceIndex),
          className: ['data-footnote-backref']
        },
        children: Array.isArray(children) ? children : [children]
      });
    }

    const tail = content[content.length - 1];

    if (tail && tail.type === 'element' && tail.tagName === 'p') {
      const tailTail = tail.children[tail.children.length - 1];
      if (tailTail && tailTail.type === 'text') {
        tailTail.value += ' ';
      } else {
        tail.children.push({type: 'text', value: ' '});
      }

      tail.children.push(...backReferences);
    } else {
      content.push(...backReferences);
    }

    /** @type {Element} */
    const listItem = {
      type: 'element',
      tagName: 'li',
      properties: {id: clobberPrefix + 'fn-' + safeId},
      children: state.wrap(content, true)
    };

    state.patch(definition, listItem);

    listItems.push(listItem);
  }

  if (listItems.length === 0) {
    return
  }

  return {
    type: 'element',
    tagName: 'section',
    properties: {dataFootnotes: true, className: ['footnotes']},
    children: [
      {
        type: 'element',
        tagName: footnoteLabelTagName,
        properties: {
          ...structuredClone$1(footnoteLabelProperties),
          id: 'footnote-label'
        },
        children: [{type: 'text', value: footnoteLabel}]
      },
      {type: 'text', value: '\n'},
      {
        type: 'element',
        tagName: 'ol',
        properties: {},
        children: state.wrap(listItems, true)
      },
      {type: 'text', value: '\n'}
    ]
  }
}

/**
 * @typedef {import('hast').Element} HastElement
 * @typedef {import('hast').ElementContent} HastElementContent
 * @typedef {import('hast').Nodes} HastNodes
 * @typedef {import('hast').Properties} HastProperties
 * @typedef {import('hast').RootContent} HastRootContent
 * @typedef {import('hast').Text} HastText
 *
 * @typedef {import('mdast').Definition} MdastDefinition
 * @typedef {import('mdast').FootnoteDefinition} MdastFootnoteDefinition
 * @typedef {import('mdast').Nodes} MdastNodes
 * @typedef {import('mdast').Parents} MdastParents
 *
 * @typedef {import('vfile').VFile} VFile
 *
 * @typedef {import('./footer.js').FootnoteBackContentTemplate} FootnoteBackContentTemplate
 * @typedef {import('./footer.js').FootnoteBackLabelTemplate} FootnoteBackLabelTemplate
 */


const own$3 = {}.hasOwnProperty;

/** @type {Options} */
const emptyOptions = {};

/**
 * Create `state` from an mdast tree.
 *
 * @param {MdastNodes} tree
 *   mdast node to transform.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {State}
 *   `state` function.
 */
function createState$1(tree, options) {
  const settings = options || emptyOptions;
  /** @type {Map<string, MdastDefinition>} */
  const definitionById = new Map();
  /** @type {Map<string, MdastFootnoteDefinition>} */
  const footnoteById = new Map();
  /** @type {Map<string, number>} */
  const footnoteCounts = new Map();
  /** @type {Handlers} */
  // @ts-expect-error: the root handler returns a root.
  // Hard to type.
  const handlers$1 = {...handlers, ...settings.handlers};

  /** @type {State} */
  const state = {
    all,
    applyData,
    definitionById,
    footnoteById,
    footnoteCounts,
    footnoteOrder: [],
    handlers: handlers$1,
    one,
    options: settings,
    patch,
    wrap: wrap$1
  };

  visit(tree, function (node) {
    if (node.type === 'definition' || node.type === 'footnoteDefinition') {
      const map = node.type === 'definition' ? definitionById : footnoteById;
      const id = String(node.identifier).toUpperCase();

      // Mimick CM behavior of link definitions.
      // See: <https://github.com/syntax-tree/mdast-util-definitions/blob/9032189/lib/index.js#L20-L21>.
      if (!map.has(id)) {
        // @ts-expect-error: node type matches map.
        map.set(id, node);
      }
    }
  });

  return state

  /**
   * Transform an mdast node into a hast node.
   *
   * @param {MdastNodes} node
   *   mdast node.
   * @param {MdastParents | undefined} [parent]
   *   Parent of `node`.
   * @returns {Array<HastElementContent> | HastElementContent | undefined}
   *   Resulting hast node.
   */
  function one(node, parent) {
    const type = node.type;
    const handle = state.handlers[type];

    if (own$3.call(state.handlers, type) && handle) {
      return handle(state, node, parent)
    }

    if (state.options.passThrough && state.options.passThrough.includes(type)) {
      if ('children' in node) {
        const {children, ...shallow} = node;
        const result = structuredClone$1(shallow);
        // @ts-expect-error: TS doesn’t understand…
        result.children = state.all(node);
        // @ts-expect-error: TS doesn’t understand…
        return result
      }

      // @ts-expect-error: it’s custom.
      return structuredClone$1(node)
    }

    const unknown = state.options.unknownHandler || defaultUnknownHandler;

    return unknown(state, node, parent)
  }

  /**
   * Transform the children of an mdast node into hast nodes.
   *
   * @param {MdastNodes} parent
   *   mdast node to compile
   * @returns {Array<HastElementContent>}
   *   Resulting hast nodes.
   */
  function all(parent) {
    /** @type {Array<HastElementContent>} */
    const values = [];

    if ('children' in parent) {
      const nodes = parent.children;
      let index = -1;
      while (++index < nodes.length) {
        const result = state.one(nodes[index], parent);

        // To do: see if we van clean this? Can we merge texts?
        if (result) {
          if (index && nodes[index - 1].type === 'break') {
            if (!Array.isArray(result) && result.type === 'text') {
              result.value = trimMarkdownSpaceStart(result.value);
            }

            if (!Array.isArray(result) && result.type === 'element') {
              const head = result.children[0];

              if (head && head.type === 'text') {
                head.value = trimMarkdownSpaceStart(head.value);
              }
            }
          }

          if (Array.isArray(result)) {
            values.push(...result);
          } else {
            values.push(result);
          }
        }
      }
    }

    return values
  }
}

/**
 * Copy a node’s positional info.
 *
 * @param {MdastNodes} from
 *   mdast node to copy from.
 * @param {HastNodes} to
 *   hast node to copy into.
 * @returns {undefined}
 *   Nothing.
 */
function patch(from, to) {
  if (from.position) to.position = position(from);
}

/**
 * Honor the `data` of `from` and maybe generate an element instead of `to`.
 *
 * @template {HastNodes} Type
 *   Node type.
 * @param {MdastNodes} from
 *   mdast node to use data from.
 * @param {Type} to
 *   hast node to change.
 * @returns {HastElement | Type}
 *   Nothing.
 */
function applyData(from, to) {
  /** @type {HastElement | Type} */
  let result = to;

  // Handle `data.hName`, `data.hProperties, `data.hChildren`.
  if (from && from.data) {
    const hName = from.data.hName;
    const hChildren = from.data.hChildren;
    const hProperties = from.data.hProperties;

    if (typeof hName === 'string') {
      // Transforming the node resulted in an element with a different name
      // than wanted:
      if (result.type === 'element') {
        result.tagName = hName;
      }
      // Transforming the node resulted in a non-element, which happens for
      // raw, text, and root nodes (unless custom handlers are passed).
      // The intent of `hName` is to create an element, but likely also to keep
      // the content around (otherwise: pass `hChildren`).
      else {
        /** @type {Array<HastElementContent>} */
        // @ts-expect-error: assume no doctypes in `root`.
        const children = 'children' in result ? result.children : [result];
        result = {type: 'element', tagName: hName, properties: {}, children};
      }
    }

    if (result.type === 'element' && hProperties) {
      Object.assign(result.properties, structuredClone$1(hProperties));
    }

    if (
      'children' in result &&
      result.children &&
      hChildren !== null &&
      hChildren !== undefined
    ) {
      result.children = hChildren;
    }
  }

  return result
}

/**
 * Transform an unknown node.
 *
 * @param {State} state
 *   Info passed around.
 * @param {MdastNodes} node
 *   Unknown mdast node.
 * @returns {HastElement | HastText}
 *   Resulting hast node.
 */
function defaultUnknownHandler(state, node) {
  const data = node.data || {};
  /** @type {HastElement | HastText} */
  const result =
    'value' in node &&
    !(own$3.call(data, 'hProperties') || own$3.call(data, 'hChildren'))
      ? {type: 'text', value: node.value}
      : {
          type: 'element',
          tagName: 'div',
          properties: {},
          children: state.all(node)
        };

  state.patch(node, result);
  return state.applyData(node, result)
}

/**
 * Wrap `nodes` with line endings between each node.
 *
 * @template {HastRootContent} Type
 *   Node type.
 * @param {Array<Type>} nodes
 *   List of nodes to wrap.
 * @param {boolean | undefined} [loose=false]
 *   Whether to add line endings at start and end (default: `false`).
 * @returns {Array<HastText | Type>}
 *   Wrapped nodes.
 */
function wrap$1(nodes, loose) {
  /** @type {Array<HastText | Type>} */
  const result = [];
  let index = -1;

  if (loose) {
    result.push({type: 'text', value: '\n'});
  }

  while (++index < nodes.length) {
    if (index) result.push({type: 'text', value: '\n'});
    result.push(nodes[index]);
  }

  if (loose && nodes.length > 0) {
    result.push({type: 'text', value: '\n'});
  }

  return result
}

/**
 * Trim spaces and tabs at the start of `value`.
 *
 * @param {string} value
 *   Value to trim.
 * @returns {string}
 *   Result.
 */
function trimMarkdownSpaceStart(value) {
  let index = 0;
  let code = value.charCodeAt(index);

  while (code === 9 || code === 32) {
    index++;
    code = value.charCodeAt(index);
  }

  return value.slice(index)
}

/**
 * @typedef {import('hast').Nodes} HastNodes
 * @typedef {import('mdast').Nodes} MdastNodes
 * @typedef {import('./state.js').Options} Options
 */


/**
 * Transform mdast to hast.
 *
 * ##### Notes
 *
 * ###### HTML
 *
 * Raw HTML is available in mdast as `html` nodes and can be embedded in hast
 * as semistandard `raw` nodes.
 * Most utilities ignore `raw` nodes but two notable ones don’t:
 *
 * *   `hast-util-to-html` also has an option `allowDangerousHtml` which will
 *     output the raw HTML.
 *     This is typically discouraged as noted by the option name but is useful
 *     if you completely trust authors
 * *   `hast-util-raw` can handle the raw embedded HTML strings by parsing them
 *     into standard hast nodes (`element`, `text`, etc).
 *     This is a heavy task as it needs a full HTML parser, but it is the only
 *     way to support untrusted content
 *
 * ###### Footnotes
 *
 * Many options supported here relate to footnotes.
 * Footnotes are not specified by CommonMark, which we follow by default.
 * They are supported by GitHub, so footnotes can be enabled in markdown with
 * `mdast-util-gfm`.
 *
 * The options `footnoteBackLabel` and `footnoteLabel` define natural language
 * that explains footnotes, which is hidden for sighted users but shown to
 * assistive technology.
 * When your page is not in English, you must define translated values.
 *
 * Back references use ARIA attributes, but the section label itself uses a
 * heading that is hidden with an `sr-only` class.
 * To show it to sighted users, define different attributes in
 * `footnoteLabelProperties`.
 *
 * ###### Clobbering
 *
 * Footnotes introduces a problem, as it links footnote calls to footnote
 * definitions on the page through `id` attributes generated from user content,
 * which results in DOM clobbering.
 *
 * DOM clobbering is this:
 *
 * ```html
 * <p id=x></p>
 * <script>alert(x) // `x` now refers to the DOM `p#x` element</script>
 * ```
 *
 * Elements by their ID are made available by browsers on the `window` object,
 * which is a security risk.
 * Using a prefix solves this problem.
 *
 * More information on how to handle clobbering and the prefix is explained in
 * Example: headings (DOM clobbering) in `rehype-sanitize`.
 *
 * ###### Unknown nodes
 *
 * Unknown nodes are nodes with a type that isn’t in `handlers` or `passThrough`.
 * The default behavior for unknown nodes is:
 *
 * *   when the node has a `value` (and doesn’t have `data.hName`,
 *     `data.hProperties`, or `data.hChildren`, see later), create a hast `text`
 *     node
 * *   otherwise, create a `<div>` element (which could be changed with
 *     `data.hName`), with its children mapped from mdast to hast as well
 *
 * This behavior can be changed by passing an `unknownHandler`.
 *
 * @param {MdastNodes} tree
 *   mdast tree.
 * @param {Options | null | undefined} [options]
 *   Configuration (optional).
 * @returns {HastNodes}
 *   hast tree.
 */
function toHast(tree, options) {
  const state = createState$1(tree, options);
  const node = state.one(tree, undefined);
  const foot = footer(state);
  /** @type {HastNodes} */
  const result = Array.isArray(node)
    ? {type: 'root', children: node}
    : node || {type: 'root', children: []};

  if (foot) {
    result.children.push({type: 'text', value: '\n'}, foot);
  }

  return result
}

// Include `data` fields in mdast and `raw` nodes in hast.
/// <reference types="mdast-util-to-hast" />


/**
 * Turn markdown into HTML.
 *
 * ##### Notes
 *
 * ###### Signature
 *
 * *   if a processor is given, runs the (rehype) plugins used on it with a
 *     hast tree, then discards the result (*bridge mode*)
 * *   otherwise, returns a hast tree, the plugins used after `remarkRehype`
 *     are rehype plugins (*mutate mode*)
 *
 * > 👉 **Note**: It’s highly unlikely that you want to pass a `processor`.
 *
 * ###### HTML
 *
 * Raw HTML is available in mdast as `html` nodes and can be embedded in hast
 * as semistandard `raw` nodes.
 * Most plugins ignore `raw` nodes but two notable ones don’t:
 *
 * *   `rehype-stringify` also has an option `allowDangerousHtml` which will
 *     output the raw HTML.
 *     This is typically discouraged as noted by the option name but is useful if
 *     you completely trust authors
 * *   `rehype-raw` can handle the raw embedded HTML strings by parsing them
 *     into standard hast nodes (`element`, `text`, etc).
 *     This is a heavy task as it needs a full HTML parser, but it is the only way
 *     to support untrusted content
 *
 * ###### Footnotes
 *
 * Many options supported here relate to footnotes.
 * Footnotes are not specified by CommonMark, which we follow by default.
 * They are supported by GitHub, so footnotes can be enabled in markdown with
 * `remark-gfm`.
 *
 * The options `footnoteBackLabel` and `footnoteLabel` define natural language
 * that explains footnotes, which is hidden for sighted users but shown to
 * assistive technology.
 * When your page is not in English, you must define translated values.
 *
 * Back references use ARIA attributes, but the section label itself uses a
 * heading that is hidden with an `sr-only` class.
 * To show it to sighted users, define different attributes in
 * `footnoteLabelProperties`.
 *
 * ###### Clobbering
 *
 * Footnotes introduces a problem, as it links footnote calls to footnote
 * definitions on the page through `id` attributes generated from user content,
 * which results in DOM clobbering.
 *
 * DOM clobbering is this:
 *
 * ```html
 * <p id=x></p>
 * <script>alert(x) // `x` now refers to the DOM `p#x` element</script>
 * ```
 *
 * Elements by their ID are made available by browsers on the `window` object,
 * which is a security risk.
 * Using a prefix solves this problem.
 *
 * More information on how to handle clobbering and the prefix is explained in
 * *Example: headings (DOM clobbering)* in `rehype-sanitize`.
 *
 * ###### Unknown nodes
 *
 * Unknown nodes are nodes with a type that isn’t in `handlers` or `passThrough`.
 * The default behavior for unknown nodes is:
 *
 * *   when the node has a `value` (and doesn’t have `data.hName`,
 *     `data.hProperties`, or `data.hChildren`, see later), create a hast `text`
 *     node
 * *   otherwise, create a `<div>` element (which could be changed with
 *     `data.hName`), with its children mapped from mdast to hast as well
 *
 * This behavior can be changed by passing an `unknownHandler`.
 *
 * @overload
 * @param {Processor} processor
 * @param {Readonly<Options> | null | undefined} [options]
 * @returns {TransformBridge}
 *
 * @overload
 * @param {Readonly<Options> | null | undefined} [options]
 * @returns {TransformMutate}
 *
 * @param {Readonly<Options> | Processor | null | undefined} [destination]
 *   Processor or configuration (optional).
 * @param {Readonly<Options> | null | undefined} [options]
 *   When a processor was given, configuration (optional).
 * @returns {TransformBridge | TransformMutate}
 *   Transform.
 */
function remarkRehype(destination, options) {
  if (destination && 'run' in destination) {
    /**
     * @type {TransformBridge}
     */
    return async function (tree, file) {
      // Cast because root in -> root out.
      const hastTree = /** @type {HastRoot} */ (
        toHast(tree, {file, ...options})
      );
      await destination.run(hastTree, file);
    }
  }

  /**
   * @type {TransformMutate}
   */
  return function (tree, file) {
    // Cast because root in -> root out.
    // To do: in the future, disallow ` || options` fallback.
    // With `unified-engine`, `destination` can be `undefined` but
    // `options` will be the file set.
    // We should not pass that as `options`.
    return /** @type {HastRoot} */ (
      toHast(tree, {file, ...(destination || options)})
    )
  }
}

var emptyMulticharIndex = {};
var emptyRegularIndex = {};
function extendIndex(item, index) {
    var currentIndex = index;
    for (var pos = 0; pos < item.length; pos++) {
        var isLast = pos === item.length - 1;
        var char = item.charAt(pos);
        var charIndex = currentIndex[char] || (currentIndex[char] = { chars: {} });
        if (isLast) {
            charIndex.self = item;
        }
        currentIndex = charIndex.chars;
    }
}
function createMulticharIndex(items) {
    if (items.length === 0) {
        return emptyMulticharIndex;
    }
    var index = {};
    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
        var item = items_1[_i];
        extendIndex(item, index);
    }
    return index;
}
function createRegularIndex(items) {
    if (items.length === 0) {
        return emptyRegularIndex;
    }
    var result = {};
    for (var _i = 0, items_2 = items; _i < items_2.length; _i++) {
        var item = items_2[_i];
        result[item] = true;
    }
    return result;
}

var emptyPseudoSignatures = {};
var defaultPseudoSignature = {
    type: 'String',
    optional: true
};
function calculatePseudoSignature(types) {
    var result = {
        type: 'NoArgument',
        optional: false
    };
    function setResultType(type) {
        if (result.type && result.type !== type && result.type !== 'NoArgument') {
            throw new Error("Conflicting pseudo-class argument type: \"".concat(result.type, "\" vs \"").concat(type, "\"."));
        }
        result.type = type;
    }
    for (var _i = 0, types_1 = types; _i < types_1.length; _i++) {
        var type = types_1[_i];
        if (type === 'NoArgument') {
            result.optional = true;
        }
        if (type === 'Formula') {
            setResultType('Formula');
        }
        if (type === 'FormulaOfSelector') {
            setResultType('Formula');
            result.ofSelector = true;
        }
        if (type === 'String') {
            setResultType('String');
        }
        if (type === 'Selector') {
            setResultType('Selector');
        }
    }
    return result;
}
function inverseCategories(obj) {
    var result = {};
    for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
        var category = _a[_i];
        var items = obj[category];
        if (items) {
            for (var _b = 0, _c = items; _b < _c.length; _b++) {
                var item = _c[_b];
                (result[item] || (result[item] = [])).push(category);
            }
        }
    }
    return result;
}
function calculatePseudoSignatures(definitions) {
    var pseudoClassesToArgumentTypes = inverseCategories(definitions);
    var result = {};
    for (var _i = 0, _a = Object.keys(pseudoClassesToArgumentTypes); _i < _a.length; _i++) {
        var pseudoClass = _a[_i];
        var argumentTypes = pseudoClassesToArgumentTypes[pseudoClass];
        if (argumentTypes) {
            result[pseudoClass] = calculatePseudoSignature(argumentTypes);
        }
    }
    return result;
}

var __assign = (undefined && undefined.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var emptyXmlOptions = {};
var defaultXmlOptions = { wildcard: true };
function getXmlOptions(param) {
    if (param) {
        if (typeof param === 'boolean') {
            return defaultXmlOptions;
        }
        else {
            return param;
        }
    }
    else {
        return emptyXmlOptions;
    }
}
function withMigration(migration, merge) {
    return function (base, extension) { return merge(migration(base), migration(extension)); };
}
function withNoNegative(merge) {
    return function (base, extension) {
        var result = merge(base, extension);
        if (!result) {
            throw new Error("Syntax definition cannot be null or undefined.");
        }
        return result;
    };
}
function withPositive(positive, merge) {
    return function (base, extension) {
        if (extension === true) {
            return positive;
        }
        return merge(base === true ? positive : base, extension);
    };
}
function mergeSection(values) {
    return function (base, extension) {
        if (!extension || !base) {
            return extension;
        }
        if (typeof extension !== 'object' || extension === null) {
            throw new Error("Unexpected syntax definition extension type: ".concat(extension, "."));
        }
        var result = __assign({}, base);
        for (var _i = 0, _a = Object.entries(extension); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            if (key === 'latest') {
                continue;
            }
            var mergeSchema = values[key];
            result[key] = mergeSchema(base[key], value);
        }
        return result;
    };
}
function replaceValueIfSpecified(base, extension) {
    if (extension !== undefined) {
        return extension;
    }
    return base;
}
function concatArray(base, extension) {
    if (!extension) {
        return base;
    }
    if (!base) {
        return extension;
    }
    return base.concat(extension);
}
function mergeDefinitions(base, extension) {
    if (!extension) {
        return base;
    }
    if (!base) {
        return extension;
    }
    var result = __assign({}, base);
    for (var _i = 0, _a = Object.entries(extension); _i < _a.length; _i++) {
        var _b = _a[_i], key = _b[0], value = _b[1];
        if (!value) {
            delete result[key];
            continue;
        }
        var baseValue = base[key];
        if (!baseValue) {
            result[key] = value;
            continue;
        }
        result[key] = baseValue.concat(value);
    }
    return result;
}
var extendSyntaxDefinition = withNoNegative(mergeSection({
    baseSyntax: replaceValueIfSpecified,
    modules: concatArray,
    tag: withPositive(defaultXmlOptions, mergeSection({
        wildcard: replaceValueIfSpecified
    })),
    ids: replaceValueIfSpecified,
    classNames: replaceValueIfSpecified,
    namespace: withPositive(defaultXmlOptions, mergeSection({
        wildcard: replaceValueIfSpecified
    })),
    combinators: concatArray,
    attributes: mergeSection({
        operators: concatArray,
        caseSensitivityModifiers: concatArray,
        unknownCaseSensitivityModifiers: replaceValueIfSpecified
    }),
    pseudoClasses: mergeSection({
        unknown: replaceValueIfSpecified,
        definitions: mergeDefinitions
    }),
    pseudoElements: mergeSection({
        unknown: replaceValueIfSpecified,
        notation: replaceValueIfSpecified,
        definitions: withMigration(function (definitions) { return (Array.isArray(definitions) ? { NoArgument: definitions } : definitions); }, mergeDefinitions)
    })
}));
var css1SyntaxDefinition = {
    tag: {},
    ids: true,
    classNames: true,
    combinators: [],
    pseudoElements: {
        unknown: 'reject',
        notation: 'singleColon',
        definitions: ['first-letter', 'first-line']
    },
    pseudoClasses: {
        unknown: 'reject',
        definitions: {
            NoArgument: ['link', 'visited', 'active']
        }
    }
};
var css2SyntaxDefinition = extendSyntaxDefinition(css1SyntaxDefinition, {
    tag: { wildcard: true },
    combinators: ['>', '+'],
    attributes: {
        unknownCaseSensitivityModifiers: 'reject',
        operators: ['=', '~=', '|=']
    },
    pseudoElements: {
        definitions: ['before', 'after']
    },
    pseudoClasses: {
        unknown: 'reject',
        definitions: {
            NoArgument: ['hover', 'focus', 'first-child'],
            String: ['lang']
        }
    }
});
var selectors3SyntaxDefinition = extendSyntaxDefinition(css2SyntaxDefinition, {
    namespace: {
        wildcard: true
    },
    combinators: ['~'],
    attributes: {
        operators: ['^=', '$=', '*=']
    },
    pseudoElements: {
        notation: 'both'
    },
    pseudoClasses: {
        definitions: {
            NoArgument: [
                'root',
                'last-child',
                'first-of-type',
                'last-of-type',
                'only-child',
                'only-of-type',
                'empty',
                'target',
                'enabled',
                'disabled',
                'checked',
                'indeterminate'
            ],
            Formula: ['nth-child', 'nth-last-child', 'nth-of-type', 'nth-last-of-type'],
            Selector: ['not']
        }
    }
});
var selectors4SyntaxDefinition = extendSyntaxDefinition(selectors3SyntaxDefinition, {
    combinators: ['||'],
    attributes: {
        caseSensitivityModifiers: ['i', 'I', 's', 'S']
    },
    pseudoClasses: {
        definitions: {
            NoArgument: [
                'any-link',
                'local-link',
                'target-within',
                'scope',
                'current',
                'past',
                'future',
                'focus-within',
                'focus-visible',
                'read-write',
                'read-only',
                'placeholder-shown',
                'default',
                'valid',
                'invalid',
                'in-range',
                'out-of-range',
                'required',
                'optional',
                'blank',
                'user-invalid',
                'playing',
                'paused',
                'autofill',
                'modal',
                'fullscreen',
                'picture-in-picture',
                'defined',
                'loading',
                'popover-open'
            ],
            Formula: ['nth-col', 'nth-last-col'],
            String: ['dir'],
            FormulaOfSelector: ['nth-child', 'nth-last-child'],
            Selector: ['current', 'is', 'where', 'has', 'state']
        }
    },
    pseudoElements: {
        definitions: {
            NoArgument: ['marker'],
            Selector: ['part']
        }
    }
});
/**
 * CSS Modules with their syntax definitions.
 * These can be used to extend the parser with specific CSS modules.
 *
 * @example
 * // Using the css-position-3 module
 * createParser({ modules: ['css-position-3'] })
 */
var cssModules = {
    'css-position-1': {
        latest: false,
        pseudoClasses: {
            definitions: {
                NoArgument: ['static', 'relative', 'absolute']
            }
        }
    },
    'css-position-2': {
        latest: false,
        pseudoClasses: {
            definitions: {
                NoArgument: ['static', 'relative', 'absolute', 'fixed']
            }
        }
    },
    'css-position-3': {
        latest: false,
        pseudoClasses: {
            definitions: {
                NoArgument: ['sticky', 'fixed', 'absolute', 'relative', 'static']
            }
        }
    },
    'css-position-4': {
        latest: true,
        pseudoClasses: {
            definitions: {
                NoArgument: ['sticky', 'fixed', 'absolute', 'relative', 'static', 'initial']
            }
        }
    },
    'css-scoping-1': {
        latest: true,
        pseudoClasses: {
            definitions: {
                NoArgument: ['host', 'host-context'],
                Selector: ['host', 'host-context']
            }
        },
        pseudoElements: {
            definitions: {
                Selector: ['slotted']
            }
        }
    },
    'css-pseudo-4': {
        latest: true,
        pseudoElements: {
            definitions: {
                NoArgument: [
                    'marker',
                    'selection',
                    'target-text',
                    'search-text',
                    'spelling-error',
                    'grammar-error',
                    'backdrop',
                    'file-selector-button',
                    'prefix',
                    'postfix',
                    'placeholder',
                    'details-content'
                ],
                String: ['highlight']
            }
        }
    },
    'css-shadow-parts-1': {
        latest: true,
        pseudoElements: {
            definitions: {
                Selector: ['part']
            }
        }
    }
};
var latestSyntaxDefinition = __assign(__assign({}, selectors4SyntaxDefinition), { modules: Object.entries(cssModules)
        .filter(function (_a) {
        var latest = _a[1].latest;
        return latest;
    })
        .map(function (_a) {
        var name = _a[0];
        return name;
    }) });
var progressiveSyntaxDefinition = extendSyntaxDefinition(latestSyntaxDefinition, {
    pseudoElements: {
        unknown: 'accept'
    },
    pseudoClasses: {
        unknown: 'accept'
    },
    attributes: {
        unknownCaseSensitivityModifiers: 'accept'
    }
});
var cssSyntaxDefinitions = {
    css1: css1SyntaxDefinition,
    css2: css2SyntaxDefinition,
    css3: selectors3SyntaxDefinition,
    'selectors-3': selectors3SyntaxDefinition,
    'selectors-4': selectors4SyntaxDefinition,
    latest: latestSyntaxDefinition,
    progressive: progressiveSyntaxDefinition
};
/**
 * Builds an index of where each pseudo-class and pseudo-element is defined
 * (in which CSS Level or CSS Module)
 */
function buildPseudoLocationIndex() {
    var index = {
        pseudoClasses: {},
        pseudoElements: {}
    };
    // Add CSS Levels (excluding 'latest' and 'progressive')
    var cssLevels = ['css1', 'css2', 'css3', 'selectors-3', 'selectors-4'];
    for (var _i = 0, cssLevels_1 = cssLevels; _i < cssLevels_1.length; _i++) {
        var level = cssLevels_1[_i];
        var syntax = cssSyntaxDefinitions[level];
        // Process pseudo-classes
        if (syntax.pseudoClasses && typeof syntax.pseudoClasses === 'object') {
            var definitions = syntax.pseudoClasses.definitions;
            if (definitions) {
                for (var _a = 0, _b = Object.entries(definitions); _a < _b.length; _a++) {
                    var _c = _b[_a], names = _c[1];
                    for (var _d = 0, names_1 = names; _d < names_1.length; _d++) {
                        var name_1 = names_1[_d];
                        if (!index.pseudoClasses[name_1]) {
                            index.pseudoClasses[name_1] = [];
                        }
                        if (!index.pseudoClasses[name_1].includes(level)) {
                            index.pseudoClasses[name_1].push(level);
                        }
                    }
                }
            }
        }
        // Process pseudo-elements
        if (syntax.pseudoElements && typeof syntax.pseudoElements === 'object') {
            var definitions = syntax.pseudoElements.definitions;
            if (definitions) {
                if (Array.isArray(definitions)) {
                    for (var _e = 0, definitions_1 = definitions; _e < definitions_1.length; _e++) {
                        var name_2 = definitions_1[_e];
                        if (!index.pseudoElements[name_2]) {
                            index.pseudoElements[name_2] = [];
                        }
                        if (!index.pseudoElements[name_2].includes(level)) {
                            index.pseudoElements[name_2].push(level);
                        }
                    }
                }
                else {
                    for (var _f = 0, _g = Object.values(definitions); _f < _g.length; _f++) {
                        var names = _g[_f];
                        for (var _h = 0, names_2 = names; _h < names_2.length; _h++) {
                            var name_3 = names_2[_h];
                            if (!index.pseudoElements[name_3]) {
                                index.pseudoElements[name_3] = [];
                            }
                            if (!index.pseudoElements[name_3].includes(level)) {
                                index.pseudoElements[name_3].push(level);
                            }
                        }
                    }
                }
            }
        }
    }
    // Add CSS Modules
    for (var _j = 0, _k = Object.entries(cssModules); _j < _k.length; _j++) {
        var _l = _k[_j], moduleName = _l[0], moduleSyntax = _l[1];
        // Process pseudo-classes
        if (moduleSyntax.pseudoClasses && typeof moduleSyntax.pseudoClasses === 'object') {
            var definitions = moduleSyntax.pseudoClasses.definitions;
            if (definitions) {
                for (var _m = 0, _o = Object.values(definitions); _m < _o.length; _m++) {
                    var names = _o[_m];
                    for (var _p = 0, names_3 = names; _p < names_3.length; _p++) {
                        var name_4 = names_3[_p];
                        if (!index.pseudoClasses[name_4]) {
                            index.pseudoClasses[name_4] = [];
                        }
                        if (!index.pseudoClasses[name_4].includes(moduleName)) {
                            index.pseudoClasses[name_4].push(moduleName);
                        }
                    }
                }
            }
        }
        // Process pseudo-elements
        if (moduleSyntax.pseudoElements && typeof moduleSyntax.pseudoElements === 'object') {
            var definitions = moduleSyntax.pseudoElements.definitions;
            if (definitions) {
                if (Array.isArray(definitions)) {
                    for (var _q = 0, definitions_2 = definitions; _q < definitions_2.length; _q++) {
                        var name_5 = definitions_2[_q];
                        if (!index.pseudoElements[name_5]) {
                            index.pseudoElements[name_5] = [];
                        }
                        if (!index.pseudoElements[name_5].includes(moduleName)) {
                            index.pseudoElements[name_5].push(moduleName);
                        }
                    }
                }
                else {
                    for (var _r = 0, _s = Object.values(definitions); _r < _s.length; _r++) {
                        var names = _s[_r];
                        for (var _t = 0, names_4 = names; _t < names_4.length; _t++) {
                            var name_6 = names_4[_t];
                            if (!index.pseudoElements[name_6]) {
                                index.pseudoElements[name_6] = [];
                            }
                            if (!index.pseudoElements[name_6].includes(moduleName)) {
                                index.pseudoElements[name_6].push(moduleName);
                            }
                        }
                    }
                }
            }
        }
    }
    return index;
}
// Pre-build the index for faster lookup
var pseudoLocationIndex = buildPseudoLocationIndex();

function isIdentStart(c) {
    return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '-' || c === '_' || c === '\\' || c >= '\u00a0';
}
function isIdent(c) {
    return ((c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        c === '-' ||
        c === '_' ||
        c >= '\u00a0');
}
function isHex(c) {
    return (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F') || (c >= '0' && c <= '9');
}
var whitespaceChars = {
    ' ': true,
    '\t': true,
    '\n': true,
    '\r': true,
    '\f': true
};
var quoteChars = {
    '"': true,
    "'": true
};
var digitsChars = {
    0: true,
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true
};
var maxHexLength = 6;

var errorPrefix = "css-selector-parser parse error: ";
/**
 * Creates a parse function to be used later to parse CSS selectors.
 */
function createParser(options) {
    if (options === void 0) { options = {}; }
    var _a = options.syntax, syntax = _a === void 0 ? 'latest' : _a, substitutes = options.substitutes, _b = options.strict, strict = _b === void 0 ? true : _b, modules = options.modules;
    var syntaxDefinition = typeof syntax === 'object' ? syntax : cssSyntaxDefinitions[syntax];
    if (syntaxDefinition.baseSyntax) {
        syntaxDefinition = extendSyntaxDefinition(cssSyntaxDefinitions[syntaxDefinition.baseSyntax], syntaxDefinition);
    }
    // Apply modules from syntax definition
    if (syntaxDefinition.modules && syntaxDefinition.modules.length > 0) {
        for (var _i = 0, _c = syntaxDefinition.modules; _i < _c.length; _i++) {
            var module_1 = _c[_i];
            var moduleSyntax = cssModules[module_1];
            if (moduleSyntax) {
                syntaxDefinition = extendSyntaxDefinition(moduleSyntax, syntaxDefinition);
            }
        }
    }
    // Apply additional modules if specified from options
    if (modules && modules.length > 0) {
        for (var _d = 0, modules_1 = modules; _d < modules_1.length; _d++) {
            var module_2 = modules_1[_d];
            var moduleSyntax = cssModules[module_2];
            if (moduleSyntax) {
                syntaxDefinition = extendSyntaxDefinition(moduleSyntax, syntaxDefinition);
            }
        }
    }
    var _e = syntaxDefinition.tag
        ? [true, Boolean(getXmlOptions(syntaxDefinition.tag).wildcard)]
        : [false, false], tagNameEnabled = _e[0], tagNameWildcardEnabled = _e[1];
    var idEnabled = Boolean(syntaxDefinition.ids);
    var classNamesEnabled = Boolean(syntaxDefinition.classNames);
    var namespaceEnabled = Boolean(syntaxDefinition.namespace);
    var namespaceWildcardEnabled = syntaxDefinition.namespace &&
        (syntaxDefinition.namespace === true || syntaxDefinition.namespace.wildcard === true);
    if (namespaceEnabled && !tagNameEnabled) {
        throw new Error("".concat(errorPrefix, "Namespaces cannot be enabled while tags are disabled."));
    }
    var substitutesEnabled = Boolean(substitutes);
    var combinatorsIndex = syntaxDefinition.combinators
        ? createMulticharIndex(syntaxDefinition.combinators)
        : emptyMulticharIndex;
    var _f = syntaxDefinition.attributes
        ? [
            true,
            syntaxDefinition.attributes.operators
                ? createMulticharIndex(syntaxDefinition.attributes.operators)
                : emptyMulticharIndex,
            syntaxDefinition.attributes.caseSensitivityModifiers
                ? createRegularIndex(syntaxDefinition.attributes.caseSensitivityModifiers)
                : emptyRegularIndex,
            syntaxDefinition.attributes.unknownCaseSensitivityModifiers === 'accept'
        ]
        : [false, emptyMulticharIndex, emptyRegularIndex, false], attributesEnabled = _f[0], attributesOperatorsIndex = _f[1], attributesCaseSensitivityModifiers = _f[2], attributesAcceptUnknownCaseSensitivityModifiers = _f[3];
    var attributesCaseSensitivityModifiersEnabled = attributesAcceptUnknownCaseSensitivityModifiers || Object.keys(attributesCaseSensitivityModifiers).length > 0;
    var _g = syntaxDefinition.pseudoClasses
        ? [
            true,
            syntaxDefinition.pseudoClasses.definitions
                ? calculatePseudoSignatures(syntaxDefinition.pseudoClasses.definitions)
                : emptyPseudoSignatures,
            syntaxDefinition.pseudoClasses.unknown === 'accept'
        ]
        : [false, emptyPseudoSignatures, false], pseudoClassesEnabled = _g[0], pseudoClassesDefinitions = _g[1], pseudoClassesAcceptUnknown = _g[2];
    var _h = syntaxDefinition.pseudoElements
        ? [
            true,
            syntaxDefinition.pseudoElements.notation === 'singleColon' ||
                syntaxDefinition.pseudoElements.notation === 'both',
            !syntaxDefinition.pseudoElements.notation ||
                syntaxDefinition.pseudoElements.notation === 'doubleColon' ||
                syntaxDefinition.pseudoElements.notation === 'both',
            syntaxDefinition.pseudoElements.definitions
                ? calculatePseudoSignatures(Array.isArray(syntaxDefinition.pseudoElements.definitions)
                    ? { NoArgument: syntaxDefinition.pseudoElements.definitions }
                    : syntaxDefinition.pseudoElements.definitions)
                : emptyPseudoSignatures,
            syntaxDefinition.pseudoElements.unknown === 'accept'
        ]
        : [false, false, false, emptyPseudoSignatures, false], pseudoElementsEnabled = _h[0], pseudoElementsSingleColonNotationEnabled = _h[1], pseudoElementsDoubleColonNotationEnabled = _h[2], pseudoElementsDefinitions = _h[3], pseudoElementsAcceptUnknown = _h[4];
    var str = '';
    var l = str.length;
    var pos = 0;
    var chr = '';
    var is = function (comparison) { return chr === comparison; };
    var isTagStart = function () { return is('*') || isIdentStart(chr); };
    var rewind = function (newPos) {
        pos = newPos;
        chr = str.charAt(pos);
    };
    var next = function () {
        pos++;
        chr = str.charAt(pos);
    };
    var readAndNext = function () {
        var current = chr;
        pos++;
        chr = str.charAt(pos);
        return current;
    };
    /** @throws ParserError */
    function fail(errorMessage) {
        var position = Math.min(l - 1, pos);
        var error = new Error("".concat(errorPrefix).concat(errorMessage, " Pos: ").concat(position, "."));
        error.position = position;
        error.name = 'ParserError';
        throw error;
    }
    function assert(condition, errorMessage) {
        if (!condition) {
            return fail(errorMessage);
        }
    }
    var assertNonEof = function () {
        assert(pos < l, 'Unexpected end of input.');
    };
    var isEof = function () { return pos >= l; };
    var pass = function (character) {
        assert(pos < l, "Expected \"".concat(character, "\" but end of input reached."));
        assert(chr === character, "Expected \"".concat(character, "\" but \"").concat(chr, "\" found."));
        pos++;
        chr = str.charAt(pos);
    };
    function matchMulticharIndex(index) {
        var match = matchMulticharIndexPos(index, pos);
        if (match) {
            pos += match.length;
            chr = str.charAt(pos);
            return match;
        }
    }
    function matchMulticharIndexPos(index, subPos) {
        var char = str.charAt(subPos);
        var charIndex = index[char];
        if (charIndex) {
            var subMatch = matchMulticharIndexPos(charIndex.chars, subPos + 1);
            if (subMatch) {
                return subMatch;
            }
            if (charIndex.self) {
                return charIndex.self;
            }
        }
    }
    /**
     * @see https://www.w3.org/TR/css-syntax/#hex-digit-diagram
     */
    function parseHex() {
        var hex = readAndNext();
        var count = 1;
        while (isHex(chr) && count < maxHexLength) {
            hex += readAndNext();
            count++;
        }
        skipSingleWhitespace();
        return String.fromCharCode(parseInt(hex, 16));
    }
    /**
     * @see https://www.w3.org/TR/css-syntax/#string-token-diagram
     */
    function parseString(quote) {
        var result = '';
        pass(quote);
        while (pos < l) {
            if (is(quote)) {
                next();
                return result;
            }
            else if (is('\\')) {
                next();
                if (is(quote)) {
                    result += quote;
                    next();
                }
                else if (chr === '\n' || chr === '\f') {
                    next();
                }
                else if (chr === '\r') {
                    next();
                    if (is('\n')) {
                        next();
                    }
                }
                else if (isHex(chr)) {
                    result += parseHex();
                }
                else {
                    result += chr;
                    next();
                }
            }
            else {
                result += chr;
                next();
            }
        }
        return result;
    }
    /**
     * @see https://www.w3.org/TR/css-syntax/#ident-token-diagram
     */
    function parseIdentifier() {
        if (!isIdentStart(chr)) {
            return null;
        }
        var result = '';
        while (is('-')) {
            result += chr;
            next();
        }
        if (result === '-' && !isIdent(chr) && !is('\\')) {
            fail('Identifiers cannot consist of a single hyphen.');
        }
        if (strict && result.length >= 2) {
            // Checking this only for strict mode since browsers work fine with these identifiers.
            fail('Identifiers cannot start with two hyphens with strict mode on.');
        }
        if (digitsChars[chr]) {
            fail('Identifiers cannot start with hyphens followed by digits.');
        }
        while (pos < l) {
            if (isIdent(chr)) {
                result += readAndNext();
            }
            else if (is('\\')) {
                next();
                assertNonEof();
                if (isHex(chr)) {
                    result += parseHex();
                }
                else {
                    result += readAndNext();
                }
            }
            else {
                break;
            }
        }
        return result;
    }
    function parsePseudoClassString() {
        var result = '';
        while (pos < l) {
            if (is(')')) {
                break;
            }
            else if (is('\\')) {
                next();
                if (isEof() && !strict) {
                    return (result + '\\').trim();
                }
                assertNonEof();
                if (isHex(chr)) {
                    result += parseHex();
                }
                else {
                    result += readAndNext();
                }
            }
            else {
                result += readAndNext();
            }
        }
        return result.trim();
    }
    function skipSingleWhitespace() {
        if (chr === ' ' || chr === '\t' || chr === '\f' || chr === '\n') {
            next();
            return;
        }
        if (chr === '\r') {
            next();
        }
        if (chr === '\n') {
            next();
        }
    }
    function skipWhitespace() {
        while (whitespaceChars[chr]) {
            next();
        }
    }
    function parseSelector(relative) {
        if (relative === void 0) { relative = false; }
        skipWhitespace();
        var rules = [parseRule(relative)];
        while (is(',')) {
            next();
            skipWhitespace();
            rules.push(parseRule(relative));
        }
        return {
            type: 'Selector',
            rules: rules
        };
    }
    function parseAttribute() {
        pass('[');
        skipWhitespace();
        var attr;
        if (is('|')) {
            assert(namespaceEnabled, 'Namespaces are not enabled.');
            next();
            var name_1 = parseIdentifier();
            assert(name_1, 'Expected attribute name.');
            attr = {
                type: 'Attribute',
                name: name_1,
                namespace: { type: 'NoNamespace' }
            };
        }
        else if (is('*')) {
            assert(namespaceEnabled, 'Namespaces are not enabled.');
            assert(namespaceWildcardEnabled, 'Wildcard namespace is not enabled.');
            next();
            pass('|');
            var name_2 = parseIdentifier();
            assert(name_2, 'Expected attribute name.');
            attr = {
                type: 'Attribute',
                name: name_2,
                namespace: { type: 'WildcardNamespace' }
            };
        }
        else {
            var identifier = parseIdentifier();
            assert(identifier, 'Expected attribute name.');
            attr = {
                type: 'Attribute',
                name: identifier
            };
            if (is('|')) {
                var savedPos = pos;
                next();
                if (isIdentStart(chr)) {
                    assert(namespaceEnabled, 'Namespaces are not enabled.');
                    var name_3 = parseIdentifier();
                    assert(name_3, 'Expected attribute name.');
                    attr = {
                        type: 'Attribute',
                        name: name_3,
                        namespace: { type: 'NamespaceName', name: identifier }
                    };
                }
                else {
                    rewind(savedPos);
                }
            }
        }
        assert(attr.name, 'Expected attribute name.');
        skipWhitespace();
        if (isEof() && !strict) {
            return attr;
        }
        if (is(']')) {
            next();
        }
        else {
            attr.operator = matchMulticharIndex(attributesOperatorsIndex);
            assert(attr.operator, 'Expected a valid attribute selector operator.');
            skipWhitespace();
            assertNonEof();
            if (quoteChars[chr]) {
                attr.value = {
                    type: 'String',
                    value: parseString(chr)
                };
            }
            else if (substitutesEnabled && is('$')) {
                next();
                var name_4 = parseIdentifier();
                assert(name_4, 'Expected substitute name.');
                attr.value = {
                    type: 'Substitution',
                    name: name_4
                };
            }
            else {
                var value = parseIdentifier();
                assert(value, 'Expected attribute value.');
                attr.value = {
                    type: 'String',
                    value: value
                };
            }
            skipWhitespace();
            if (isEof() && !strict) {
                return attr;
            }
            if (!is(']')) {
                var caseSensitivityModifier = parseIdentifier();
                assert(caseSensitivityModifier, 'Expected end of attribute selector.');
                attr.caseSensitivityModifier = caseSensitivityModifier;
                assert(attributesCaseSensitivityModifiersEnabled, 'Attribute case sensitivity modifiers are not enabled.');
                assert(attributesAcceptUnknownCaseSensitivityModifiers ||
                    attributesCaseSensitivityModifiers[attr.caseSensitivityModifier], 'Unknown attribute case sensitivity modifier.');
                skipWhitespace();
                if (isEof() && !strict) {
                    return attr;
                }
            }
            pass(']');
        }
        return attr;
    }
    function parseNumber() {
        var result = '';
        while (digitsChars[chr]) {
            result += readAndNext();
        }
        assert(result !== '', 'Formula parse error.');
        return parseInt(result);
    }
    var isNumberStart = function () { return is('-') || is('+') || digitsChars[chr]; };
    function parseFormula() {
        if (is('e') || is('o')) {
            var ident = parseIdentifier();
            if (ident === 'even') {
                skipWhitespace();
                return [2, 0];
            }
            if (ident === 'odd') {
                skipWhitespace();
                return [2, 1];
            }
        }
        var firstNumber = null;
        var firstNumberMultiplier = 1;
        if (is('-')) {
            next();
            firstNumberMultiplier = -1;
        }
        if (isNumberStart()) {
            if (is('+')) {
                next();
            }
            firstNumber = parseNumber();
            if (!is('\\') && !is('n')) {
                return [0, firstNumber * firstNumberMultiplier];
            }
        }
        if (firstNumber === null) {
            firstNumber = 1;
        }
        firstNumber *= firstNumberMultiplier;
        var identifier;
        if (is('\\')) {
            next();
            if (isHex(chr)) {
                identifier = parseHex();
            }
            else {
                identifier = readAndNext();
            }
        }
        else {
            identifier = readAndNext();
        }
        assert(identifier === 'n', 'Formula parse error: expected "n".');
        skipWhitespace();
        if (is('+') || is('-')) {
            var sign = is('+') ? 1 : -1;
            next();
            skipWhitespace();
            return [firstNumber, sign * parseNumber()];
        }
        else {
            return [firstNumber, 0];
        }
    }
    function parsePseudoArgument(pseudoName, type, signature) {
        var argument;
        if (is('(')) {
            next();
            skipWhitespace();
            if (substitutesEnabled && is('$')) {
                next();
                var name_5 = parseIdentifier();
                assert(name_5, 'Expected substitute name.');
                argument = {
                    type: 'Substitution',
                    name: name_5
                };
            }
            else if (signature.type === 'String') {
                argument = {
                    type: 'String',
                    value: parsePseudoClassString()
                };
                assert(argument.value, "Expected ".concat(type, " argument value."));
            }
            else if (signature.type === 'Selector') {
                argument = parseSelector(true);
            }
            else if (signature.type === 'Formula') {
                var _a = parseFormula(), a = _a[0], b = _a[1];
                argument = {
                    type: 'Formula',
                    a: a,
                    b: b
                };
                if (signature.ofSelector) {
                    skipWhitespace();
                    if (is('o') || is('\\')) {
                        var ident = parseIdentifier();
                        assert(ident === 'of', 'Formula of selector parse error.');
                        skipWhitespace();
                        argument = {
                            type: 'FormulaOfSelector',
                            a: a,
                            b: b,
                            selector: parseRule()
                        };
                    }
                }
            }
            else {
                return fail("Invalid ".concat(type, " signature."));
            }
            skipWhitespace();
            if (isEof() && !strict) {
                return argument;
            }
            pass(')');
        }
        else {
            assert(signature.optional, "Argument is required for ".concat(type, " \"").concat(pseudoName, "\"."));
        }
        return argument;
    }
    function parseTagName() {
        if (is('*')) {
            assert(tagNameWildcardEnabled, 'Wildcard tag name is not enabled.');
            next();
            return { type: 'WildcardTag' };
        }
        else if (isIdentStart(chr)) {
            assert(tagNameEnabled, 'Tag names are not enabled.');
            var name_6 = parseIdentifier();
            assert(name_6, 'Expected tag name.');
            return {
                type: 'TagName',
                name: name_6
            };
        }
        else {
            return fail('Expected tag name.');
        }
    }
    function parseTagNameWithNamespace() {
        if (is('*')) {
            var savedPos = pos;
            next();
            if (!is('|')) {
                rewind(savedPos);
                return parseTagName();
            }
            next();
            if (!isTagStart()) {
                rewind(savedPos);
                return parseTagName();
            }
            assert(namespaceEnabled, 'Namespaces are not enabled.');
            assert(namespaceWildcardEnabled, 'Wildcard namespace is not enabled.');
            var tagName = parseTagName();
            tagName.namespace = { type: 'WildcardNamespace' };
            return tagName;
        }
        else if (is('|')) {
            assert(namespaceEnabled, 'Namespaces are not enabled.');
            next();
            var tagName = parseTagName();
            tagName.namespace = { type: 'NoNamespace' };
            return tagName;
        }
        else if (isIdentStart(chr)) {
            var identifier = parseIdentifier();
            assert(identifier, 'Expected tag name.');
            if (!is('|')) {
                assert(tagNameEnabled, 'Tag names are not enabled.');
                return {
                    type: 'TagName',
                    name: identifier
                };
            }
            var savedPos = pos;
            next();
            if (!isTagStart()) {
                rewind(savedPos);
                return {
                    type: 'TagName',
                    name: identifier
                };
            }
            assert(namespaceEnabled, 'Namespaces are not enabled.');
            var tagName = parseTagName();
            tagName.namespace = { type: 'NamespaceName', name: identifier };
            return tagName;
        }
        else {
            return fail('Expected tag name.');
        }
    }
    function parseRule(relative) {
        var _a, _b;
        if (relative === void 0) { relative = false; }
        var rule = { type: 'Rule', items: [] };
        if (relative) {
            var combinator = matchMulticharIndex(combinatorsIndex);
            if (combinator) {
                rule.combinator = combinator;
                skipWhitespace();
            }
        }
        while (pos < l) {
            if (isTagStart()) {
                assert(rule.items.length === 0, 'Unexpected tag/namespace start.');
                rule.items.push(parseTagNameWithNamespace());
            }
            else if (is('|')) {
                var savedPos = pos;
                next();
                if (isTagStart()) {
                    assert(rule.items.length === 0, 'Unexpected tag/namespace start.');
                    rewind(savedPos);
                    rule.items.push(parseTagNameWithNamespace());
                }
                else {
                    rewind(savedPos);
                    break;
                }
            }
            else if (is('.')) {
                assert(classNamesEnabled, 'Class names are not enabled.');
                next();
                var className = parseIdentifier();
                assert(className, 'Expected class name.');
                rule.items.push({ type: 'ClassName', name: className });
            }
            else if (is('#')) {
                assert(idEnabled, 'IDs are not enabled.');
                next();
                var idName = parseIdentifier();
                assert(idName, 'Expected ID name.');
                rule.items.push({ type: 'Id', name: idName });
            }
            else if (is('[')) {
                assert(attributesEnabled, 'Attributes are not enabled.');
                rule.items.push(parseAttribute());
            }
            else if (is(':')) {
                var isDoubleColon = false;
                var isPseudoElement = false;
                next();
                if (is(':')) {
                    assert(pseudoElementsEnabled, 'Pseudo elements are not enabled.');
                    assert(pseudoElementsDoubleColonNotationEnabled, 'Pseudo elements double colon notation is not enabled.');
                    isDoubleColon = true;
                    next();
                }
                var pseudoName = parseIdentifier();
                assert(isDoubleColon || pseudoName, 'Expected pseudo-class name.');
                assert(!isDoubleColon || pseudoName, 'Expected pseudo-element name.');
                assert(pseudoName, 'Expected pseudo-class name.');
                if (!isDoubleColon ||
                    pseudoElementsAcceptUnknown ||
                    Object.prototype.hasOwnProperty.call(pseudoElementsDefinitions, pseudoName)) ;
                else {
                    // Generate a helpful error message with location information
                    var locations = pseudoLocationIndex.pseudoElements[pseudoName];
                    var errorMessage = "Unknown pseudo-element \"".concat(pseudoName, "\"");
                    if (locations && locations.length > 0) {
                        errorMessage += ". It is defined in: ".concat(locations.join(', '));
                    }
                    fail(errorMessage + '.');
                }
                isPseudoElement =
                    pseudoElementsEnabled &&
                        (isDoubleColon ||
                            (!isDoubleColon &&
                                pseudoElementsSingleColonNotationEnabled &&
                                Object.prototype.hasOwnProperty.call(pseudoElementsDefinitions, pseudoName)));
                if (isPseudoElement) {
                    var signature = (_a = pseudoElementsDefinitions[pseudoName]) !== null && _a !== void 0 ? _a : (pseudoElementsAcceptUnknown && defaultPseudoSignature);
                    var pseudoElement = {
                        type: 'PseudoElement',
                        name: pseudoName
                    };
                    var argument = parsePseudoArgument(pseudoName, 'pseudo-element', signature);
                    if (argument) {
                        assert(argument.type !== 'Formula' && argument.type !== 'FormulaOfSelector', 'Pseudo-elements cannot have formula argument.');
                        pseudoElement.argument = argument;
                    }
                    rule.items.push(pseudoElement);
                }
                else {
                    assert(pseudoClassesEnabled, 'Pseudo-classes are not enabled.');
                    var signature = (_b = pseudoClassesDefinitions[pseudoName]) !== null && _b !== void 0 ? _b : (pseudoClassesAcceptUnknown && defaultPseudoSignature);
                    if (signature) ;
                    else {
                        // Generate a helpful error message with location information
                        var locations = pseudoLocationIndex.pseudoClasses[pseudoName];
                        var errorMessage = "Unknown pseudo-class: \"".concat(pseudoName, "\"");
                        if (locations && locations.length > 0) {
                            errorMessage += ". It is defined in: ".concat(locations.join(', '));
                        }
                        fail(errorMessage + '.');
                    }
                    var argument = parsePseudoArgument(pseudoName, 'pseudo-class', signature);
                    var pseudoClass = {
                        type: 'PseudoClass',
                        name: pseudoName
                    };
                    if (argument) {
                        pseudoClass.argument = argument;
                    }
                    rule.items.push(pseudoClass);
                }
            }
            else {
                break;
            }
        }
        if (rule.items.length === 0) {
            if (isEof()) {
                return fail('Expected rule but end of input reached.');
            }
            else {
                return fail("Expected rule but \"".concat(chr, "\" found."));
            }
        }
        skipWhitespace();
        if (!isEof() && !is(',') && !is(')')) {
            var combinator = matchMulticharIndex(combinatorsIndex);
            skipWhitespace();
            rule.nestedRule = parseRule();
            rule.nestedRule.combinator = combinator;
        }
        return rule;
    }
    return function (input) {
        // noinspection SuspiciousTypeOfGuard
        if (typeof input !== 'string') {
            throw new Error("".concat(errorPrefix, "Expected string input."));
        }
        str = input;
        l = str.length;
        pos = 0;
        chr = str.charAt(0);
        return parseSelector();
    };
}

/**
 * @import {AstSelector} from 'css-selector-parser'
 */


const cssSelectorParse = createParser({syntax: 'selectors-4'});

/**
 * @param {string} selector
 *   Selector to parse.
 * @returns {AstSelector}
 *   Parsed selector.
 */
function parse$1(selector) {
  if (typeof selector !== 'string') {
    throw new TypeError('Expected `string` as selector, not `' + selector + '`')
  }

  return cssSelectorParse(selector)
}

const rtlRange = '\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC';
const ltrRange =
  'A-Za-z\u00C0-\u00D6\u00D8-\u00F6' +
  '\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u2C00-\uFB1C' +
  '\uFE00-\uFE6F\uFEFD-\uFFFF';

/* eslint-disable no-misleading-character-class */
const rtl = new RegExp('^[^' + ltrRange + ']*[' + rtlRange + ']');
const ltr = new RegExp('^[^' + rtlRange + ']*[' + ltrRange + ']');
/* eslint-enable no-misleading-character-class */

/**
 * Detect the direction of text: left-to-right, right-to-left, or neutral
 *
 * @param {string} value
 * @returns {'rtl'|'ltr'|'neutral'}
 */
function direction(value) {
  const source = String(value || '');
  return rtl.test(source) ? 'rtl' : ltr.test(source) ? 'ltr' : 'neutral'
}

/**
 * @import {Nodes, Parents} from 'hast'
 */

/**
 * Get the plain-text value of a hast node.
 *
 * @param {Nodes} node
 *   Node to serialize.
 * @returns {string}
 *   Serialized node.
 */
function toString(node) {
  // “The concatenation of data of all the Text node descendants of the context
  // object, in tree order.”
  if ('children' in node) {
    return all$1(node)
  }

  // “Context object’s data.”
  return 'value' in node ? node.value : ''
}

/**
 * @param {Nodes} node
 *   Node.
 * @returns {string}
 *   Serialized node.
 */
function one$1(node) {
  if (node.type === 'text') {
    return node.value
  }

  return 'children' in node ? all$1(node) : ''
}

/**
 * @param {Parents} node
 *   Node.
 * @returns {string}
 *   Serialized node.
 */
function all$1(node) {
  let index = -1;
  /** @type {Array<string>} */
  const result = [];

  while (++index < node.children.length) {
    result[index] = one$1(node.children[index]);
  }

  return result.join('')
}

/**
 * @import {Visitor} from 'unist-util-visit'
 * @import {ElementContent, Nodes} from 'hast'
 * @import {Direction, State} from './index.js'
 */


/**
 * Enter a node.
 *
 * The caller is responsible for calling the return value `exit`.
 *
 * @param {State} state
 *   Current state.
 *
 *   Will be mutated: `exit` undos the changes.
 * @param {Nodes} node
 *   Node to enter.
 * @returns {() => undefined}
 *   Call to exit.
 */
// eslint-disable-next-line complexity
function enterState(state, node) {
  const schema = state.schema;
  const language = state.language;
  const currentDirection = state.direction;
  const editableOrEditingHost = state.editableOrEditingHost;
  /** @type {Direction | undefined} */
  let directionInferred;

  if (node.type === 'element') {
    const lang = node.properties.xmlLang || node.properties.lang;
    const type = node.properties.type || 'text';
    const direction = directionProperty(node);

    if (lang !== null && lang !== undefined) {
      state.language = String(lang);
    }

    if (schema && schema.space === 'html') {
      if (node.properties.contentEditable === 'true') {
        state.editableOrEditingHost = true;
      }

      if (node.tagName === 'svg') {
        state.schema = svg;
      }

      // See: <https://html.spec.whatwg.org/#the-directionality>.
      // Explicit `[dir=rtl]`.
      if (direction === 'rtl') {
        directionInferred = direction;
      } else if (
        // Explicit `[dir=ltr]`.
        direction === 'ltr' ||
        // HTML with an invalid or no `[dir]`.
        (direction !== 'auto' && node.tagName === 'html') ||
        // `input[type=tel]` with an invalid or no `[dir]`.
        (direction !== 'auto' && node.tagName === 'input' && type === 'tel')
      ) {
        directionInferred = 'ltr';
        // `[dir=auto]` or `bdi` with an invalid or no `[dir]`.
      } else if (direction === 'auto' || node.tagName === 'bdi') {
        if (node.tagName === 'textarea') {
          // Check contents of `<textarea>`.
          directionInferred = directionBidi(toString(node));
        } else if (
          node.tagName === 'input' &&
          (type === 'email' ||
            type === 'search' ||
            type === 'tel' ||
            type === 'text')
        ) {
          // Check value of `<input>`.
          directionInferred = node.properties.value
            ? directionBidi(String(node.properties.value))
            : 'ltr';
        } else {
          // Check text nodes in `node`.
          visit(node, inferDirectionality);
        }
      }

      if (directionInferred) {
        state.direction = directionInferred;
      }
    }
    // Turn off editing mode in non-HTML spaces.
    else if (state.editableOrEditingHost) {
      state.editableOrEditingHost = false;
    }
  }

  return reset

  /**
   * @returns {undefined}
   *   Nothing.
   */
  function reset() {
    state.schema = schema;
    state.language = language;
    state.direction = currentDirection;
    state.editableOrEditingHost = editableOrEditingHost;
  }

  /** @type {Visitor<ElementContent>} */
  function inferDirectionality(child) {
    if (child.type === 'text') {
      directionInferred = directionBidi(child.value);
      return directionInferred ? EXIT : undefined
    }

    if (
      child !== node &&
      child.type === 'element' &&
      (child.tagName === 'bdi' ||
        child.tagName === 'script' ||
        child.tagName === 'style' ||
        child.tagName === 'textare' ||
        directionProperty(child))
    ) {
      return SKIP
    }
  }
}

/**
 * See `wooorm/direction`.
 *
 * @param {string} value
 *   Value to check.
 * @returns {Exclude<Direction, 'auto'> | undefined}
 *   Directionality.
 */
function directionBidi(value) {
  const result = direction(value);
  return result === 'neutral' ? undefined : result
}

/**
 * @param {ElementContent} node
 *   Node to check.
 * @returns {Direction | undefined}
 *   Directionality.
 */
function directionProperty(node) {
  const value =
    node.type === 'element' && typeof node.properties.dir === 'string'
      ? node.properties.dir.toLowerCase()
      : undefined;

  return value === 'auto' || value === 'ltr' || value === 'rtl'
    ? value
    : undefined
}

/**
 * @import {AstAttribute} from 'css-selector-parser'
 * @import {Element, Properties} from 'hast'
 * @import {Info, Schema} from 'property-information'
 */


/**
 * @param {AstAttribute} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {Schema} schema
 *   Schema of element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function attribute(query, element, schema) {
  const info = find(schema, query.name);
  const propertyValue = element.properties[info.property];
  let value = normalizeValue(propertyValue, info);

  // Exists.
  if (!query.value) {
    return value !== undefined
  }

  ok$1(query.value.type === 'String');
  let key = query.value.value;

  // Case-sensitivity.
  if (query.caseSensitivityModifier === 'i') {
    key = key.toLowerCase();

    if (value) {
      value = value.toLowerCase();
    }
  }

  if (value !== undefined) {
    switch (query.operator) {
      // Exact.
      case '=': {
        return key === value
      }

      // Ends.
      case '$=': {
        return key === value.slice(-key.length)
      }

      // Contains.
      case '*=': {
        return value.includes(key)
      }

      // Begins.
      case '^=': {
        return key === value.slice(0, key.length)
      }

      // Exact or prefix.
      case '|=': {
        return (
          key === value ||
          (key === value.slice(0, key.length) &&
            value.charAt(key.length) === '-')
        )
      }

      // Space-separated list.
      case '~=': {
        return (
          // For all other values (including comma-separated lists), return whether this
          // is an exact match.
          key === value ||
          // If this is a space-separated list, and the query is contained in it, return
          // true.
          parse$3(value).includes(key)
        )
      }
      // Other values are not yet supported by CSS.
      // No default
    }
  }

  return false
}

/**
 *
 * @param {Properties[keyof Properties]} value
 * @param {Info} info
 * @returns {string | undefined}
 */
function normalizeValue(value, info) {
  if (value === null || value === undefined) ; else if (typeof value === 'boolean') {
    if (value) {
      return info.attribute
    }
  } else if (Array.isArray(value)) {
    if (value.length > 0) {
      return (info.commaSeparated ? stringify$1 : stringify)(value)
    }
  } else {
    return String(value)
  }
}

/**
 * @import {AstClassName} from 'css-selector-parser'
 * @import {Element} from 'hast'
 */

/** @type {Array<never>} */
const emptyClassNames = [];

/**
 * Check whether an element has all class names.
 *
 * @param {AstClassName} query
 *   AST rule (with `classNames`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function className(query, element) {
  // Assume array.
  const value = /** @type {Readonly<Array<string>>} */ (
    element.properties.className || emptyClassNames
  );

  return value.includes(query.name)
}

/**
 * @import {AstId} from 'css-selector-parser'
 * @import {Element} from 'hast'
 */

/**
 * Check whether an element has an ID.
 *
 * @param {AstId} query
 *   AST rule (with `ids`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function id(query, element) {
  return element.properties.id === query.name
}

/**
 * @import {AstTagName} from 'css-selector-parser'
 * @import {Element} from 'hast'
 */

/**
 * Check whether an element has a tag name.
 *
 * @param {AstTagName} query
 *   AST rule (with `tag`).
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function name(query, element) {
  return query.name === element.tagName
}

/**
 * See <https://tools.ietf.org/html/rfc4647#section-3.1>
 * for more info on the algorithms.
 */

/**
 * @typedef {string} Tag
 *   BCP-47 tag.
 * @typedef {Array<Tag>} Tags
 *   List of BCP-47 tags.
 * @typedef {string} Range
 *   RFC 4647 range.
 * @typedef {Array<Range>} Ranges
 *   List of RFC 4647 range.
 *
 * @callback Check
 *   An internal check.
 * @param {Tag} tag
 *   BCP-47 tag.
 * @param {Range} range
 *   RFC 4647 range.
 * @returns {boolean}
 *   Whether the range matches the tag.
 *
 * @typedef {FilterOrLookup<true>} Filter
 *   Filter: yields all tags that match a range.
 * @typedef {FilterOrLookup<false>} Lookup
 *   Lookup: yields the best tag that matches a range.
 */

/**
 * @template {boolean} IsFilter
 *   Whether to filter or perform a lookup.
 * @callback FilterOrLookup
 *   A check.
 * @param {Tag|Tags} tags
 *   One or more BCP-47 tags.
 * @param {Range|Ranges|undefined} [ranges='*']
 *   One or more RFC 4647 ranges.
 * @returns {IsFilter extends true ? Tags : Tag|undefined}
 *   Result.
 */

/**
 * Factory to perform a filter or a lookup.
 *
 * This factory creates a function that accepts a list of tags and a list of
 * ranges, and contains logic to exit early for lookups.
 * `check` just has to deal with one tag and one range.
 * This match function iterates over ranges, and for each range,
 * iterates over tags.
 * That way, earlier ranges matching any tag have precedence over later ranges.
 *
 * @template {boolean} IsFilter
 * @param {Check} check
 *   A check.
 * @param {IsFilter} filter
 *   Whether to filter or perform a lookup.
 * @returns {FilterOrLookup<IsFilter>}
 *   Filter or lookup.
 */
function factory(check, filter) {
  /**
   * @param {Tag|Tags} tags
   *   One or more BCP-47 tags.
   * @param {Range|Ranges|undefined} [ranges='*']
   *   One or more RFC 4647 ranges.
   * @returns {IsFilter extends true ? Tags : Tag|undefined}
   *   Result.
   */
  return function (tags, ranges) {
    let left = cast(tags, 'tag');
    const right = cast(
      ranges === null || ranges === undefined ? '*' : ranges,
      'range'
    );
    /** @type {Tags} */
    const matches = [];
    let rightIndex = -1;

    while (++rightIndex < right.length) {
      const range = right[rightIndex].toLowerCase();

      // Ignore wildcards in lookup mode.
      if (!filter && range === '*') continue

      let leftIndex = -1;
      /** @type {Tags} */
      const next = [];

      while (++leftIndex < left.length) {
        if (check(left[leftIndex].toLowerCase(), range)) {
          // Exit if this is a lookup and we have a match.
          if (!filter) {
            return /** @type {IsFilter extends true ? Tags : Tag|undefined} */ (
              left[leftIndex]
            )
          }

          matches.push(left[leftIndex]);
        } else {
          next.push(left[leftIndex]);
        }
      }

      left = next;
    }

    // If this is a filter, return the list.  If it’s a lookup, we didn’t find
    // a match, so return `undefined`.
    return /** @type {IsFilter extends true ? Tags : Tag|undefined} */ (
      filter ? matches : undefined
    )
  }
}

/**
 * Extended Filtering (Section 3.3.2) matches a language priority list
 * consisting of extended language ranges (Section 2.2) to sets of language
 * tags.
 *
 * @param {Tag|Tags} tags
 *   One or more BCP-47 tags.
 * @param {Range|Ranges|undefined} [ranges='*']
 *   One or more RFC 4647 ranges.
 * @returns {Tags}
 *   List of BCP-47 tags.
 */
const extendedFilter = factory(function (tag, range) {
  // 3.3.2.1
  const left = tag.split('-');
  const right = range.split('-');
  let leftIndex = 0;
  let rightIndex = 0;

  // 3.3.2.2
  if (right[rightIndex] !== '*' && left[leftIndex] !== right[rightIndex]) {
    return false
  }

  leftIndex++;
  rightIndex++;

  // 3.3.2.3
  while (rightIndex < right.length) {
    // 3.3.2.3.A
    if (right[rightIndex] === '*') {
      rightIndex++;
      continue
    }

    // 3.3.2.3.B
    if (!left[leftIndex]) return false

    // 3.3.2.3.C
    if (left[leftIndex] === right[rightIndex]) {
      leftIndex++;
      rightIndex++;
      continue
    }

    // 3.3.2.3.D
    if (left[leftIndex].length === 1) return false

    // 3.3.2.3.E
    leftIndex++;
  }

  // 3.3.2.4
  return true
}, true);

/**
 * Validate tags or ranges, and cast them to arrays.
 *
 * @param {string|Array<string>} values
 * @param {string} name
 * @returns {Array<string>}
 */
function cast(values, name) {
  const value = values && typeof values === 'string' ? [values] : values;

  if (!value || typeof value !== 'object' || !('length' in value)) {
    throw new Error(
      'Invalid ' + name + ' `' + value + '`, expected non-empty string'
    )
  }

  return value
}

/**
 * @typedef {import('hast').Element} Element
 * @typedef {import('hast').Nodes} Nodes
 */

const own$2 = {}.hasOwnProperty;

/**
 * Check if `node` is an element and has a `name` property.
 *
 * @template {string} Key
 *   Type of key.
 * @param {Nodes} node
 *   Node to check (typically `Element`).
 * @param {Key} name
 *   Property name to check.
 * @returns {node is Element & {properties: Record<Key, Array<number | string> | number | string | true>}}}
 *   Whether `node` is an element that has a `name` property.
 *
 *   Note: see <https://github.com/DefinitelyTyped/DefinitelyTyped/blob/27c9274/types/hast/index.d.ts#L37C29-L37C98>.
 */
function hasProperty(node, name) {
  const value =
    node.type === 'element' &&
    own$2.call(node.properties, name) &&
    node.properties[name];

  return value !== null && value !== undefined && value !== false
}

// Following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo
// Whitespace as per https://www.w3.org/TR/selectors-3/#lex is " \t\r\n\f"
const whitespace = new Set([9, 10, 12, 13, 32]);
const ZERO = "0".charCodeAt(0);
const NINE = "9".charCodeAt(0);
/**
 * Parses an expression.
 *
 * @throws An `Error` if parsing fails.
 * @returns An array containing the integer step size and the integer offset of the nth rule.
 * @example nthCheck.parse("2n+3"); // returns [2, 3]
 */
function parse(formula) {
    formula = formula.trim().toLowerCase();
    if (formula === "even") {
        return [2, 0];
    }
    else if (formula === "odd") {
        return [2, 1];
    }
    // Parse [ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?
    let idx = 0;
    let a = 0;
    let sign = readSign();
    let number = readNumber();
    if (idx < formula.length && formula.charAt(idx) === "n") {
        idx++;
        a = sign * (number !== null && number !== void 0 ? number : 1);
        skipWhitespace();
        if (idx < formula.length) {
            sign = readSign();
            skipWhitespace();
            number = readNumber();
        }
        else {
            sign = number = 0;
        }
    }
    // Throw if there is anything else
    if (number === null || idx < formula.length) {
        throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
    }
    return [a, sign * number];
    function readSign() {
        if (formula.charAt(idx) === "-") {
            idx++;
            return -1;
        }
        if (formula.charAt(idx) === "+") {
            idx++;
        }
        return 1;
    }
    function readNumber() {
        const start = idx;
        let value = 0;
        while (idx < formula.length &&
            formula.charCodeAt(idx) >= ZERO &&
            formula.charCodeAt(idx) <= NINE) {
            value = value * 10 + (formula.charCodeAt(idx) - ZERO);
            idx++;
        }
        // Return `null` if we didn't read anything.
        return idx === start ? null : value;
    }
    function skipWhitespace() {
        while (idx < formula.length &&
            whitespace.has(formula.charCodeAt(idx))) {
            idx++;
        }
    }
}

var boolbase$1;
var hasRequiredBoolbase;

function requireBoolbase () {
	if (hasRequiredBoolbase) return boolbase$1;
	hasRequiredBoolbase = 1;
	boolbase$1 = {
		trueFunc: function trueFunc(){
			return true;
		},
		falseFunc: function falseFunc(){
			return false;
		}
	};
	return boolbase$1;
}

var boolbaseExports = requireBoolbase();
var boolbase = /*@__PURE__*/getDefaultExportFromCjs(boolbaseExports);

/**
 * Returns a function that checks if an elements index matches the given rule
 * highly optimized to return the fastest solution.
 *
 * @param parsed A tuple [a, b], as returned by `parse`.
 * @returns A highly optimized function that returns whether an index matches the nth-check.
 * @example
 *
 * ```js
 * const check = nthCheck.compile([2, 3]);
 *
 * check(0); // `false`
 * check(1); // `false`
 * check(2); // `true`
 * check(3); // `false`
 * check(4); // `true`
 * check(5); // `false`
 * check(6); // `true`
 * ```
 */
function compile(parsed) {
    const a = parsed[0];
    // Subtract 1 from `b`, to convert from one- to zero-indexed.
    const b = parsed[1] - 1;
    /*
     * When `b <= 0`, `a * n` won't be lead to any matches for `a < 0`.
     * Besides, the specification states that no elements are
     * matched when `a` and `b` are 0.
     *
     * `b < 0` here as we subtracted 1 from `b` above.
     */
    if (b < 0 && a <= 0)
        return boolbase.falseFunc;
    // When `a` is in the range -1..1, it matches any element (so only `b` is checked).
    if (a === -1)
        return (index) => index <= b;
    if (a === 0)
        return (index) => index === b;
    // When `b <= 0` and `a === 1`, they match any element.
    if (a === 1)
        return b < 0 ? boolbase.trueFunc : (index) => index >= b;
    /*
     * Otherwise, modulo can be used to check if there is a match.
     *
     * Modulo doesn't care about the sign, so let's use `a`s absolute value.
     */
    const absA = Math.abs(a);
    // Get `b mod a`, + a if this is negative.
    const bMod = ((b % absA) + absA) % absA;
    return a > 1
        ? (index) => index >= b && index % absA === bMod
        : (index) => index <= b && index % absA === bMod;
}

/**
 * Parses and compiles a formula to a highly optimized function.
 * Combination of {@link parse} and {@link compile}.
 *
 * If the formula doesn't match any elements,
 * it returns [`boolbase`](https://github.com/fb55/boolbase)'s `falseFunc`.
 * Otherwise, a function accepting an _index_ is returned, which returns
 * whether or not the passed _index_ matches the formula.
 *
 * Note: The nth-rule starts counting at `1`, the returned function at `0`.
 *
 * @param formula The formula to compile.
 * @example
 * const check = nthCheck("2n+3");
 *
 * check(0); // `false`
 * check(1); // `false`
 * check(2); // `true`
 * check(3); // `false`
 * check(4); // `true`
 * check(5); // `false`
 * check(6); // `true`
 */
function nthCheck$1(formula) {
    return compile(parse(formula));
}

/**
 * @import {AstPseudoClass} from 'css-selector-parser'
 * @import {default as NthCheck} from 'nth-check'
 * @import {ElementContent, Element, Parents} from 'hast'
 * @import {State} from './index.js'
 */


/** @type {NthCheck} */
// @ts-expect-error: types are broken.
const nthCheck = nthCheck$1.default || nthCheck$1;

/** @type {(rule: AstPseudoClass, element: Element, index: number | undefined, parent: Parents | undefined, state: State) => boolean} */
const pseudo = zwitch('name', {
  handlers: {
    'any-link': anyLink,
    blank,
    checked,
    dir,
    disabled,
    empty: empty$1,
    enabled,
    'first-child': firstChild,
    'first-of-type': firstOfType,
    has,
    is,
    lang,
    'last-child': lastChild,
    'last-of-type': lastOfType,
    not,
    'nth-child': nthChild,
    'nth-last-child': nthLastChild,
    'nth-last-of-type': nthLastOfType,
    'nth-of-type': nthOfType,
    'only-child': onlyChild,
    'only-of-type': onlyOfType,
    optional,
    'read-only': readOnly,
    'read-write': readWrite,
    required,
    root,
    scope
  },
  invalid: invalidPseudo,
  unknown: unknownPseudo
});

/**
 * Check whether an element matches an `:any-link` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function anyLink(_, element) {
  return (
    (element.tagName === 'a' ||
      element.tagName === 'area' ||
      element.tagName === 'link') &&
    hasProperty(element, 'href')
  )
}

/**
 * @param {State} state
 *   State.
 * @param {AstPseudoClass} query
 *   Query.
 */
function assertDeep(state, query) {
  if (state.shallow) {
    throw new Error('Cannot use `:' + query.name + '` without parent')
  }
}

/**
 * Check whether an element matches a `:blank` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function blank(_, element) {
  return !someChildren(element, check)

  /**
   * @param {ElementContent} child
   * @returns {boolean}
   */
  function check(child) {
    return (
      child.type === 'element' || (child.type === 'text' && !whitespace$1(child))
    )
  }
}

/**
 * Check whether an element matches a `:checked` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function checked(_, element) {
  if (element.tagName === 'input' || element.tagName === 'menuitem') {
    return Boolean(
      (element.properties.type === 'checkbox' ||
        element.properties.type === 'radio') &&
        hasProperty(element, 'checked')
    )
  }

  if (element.tagName === 'option') {
    return hasProperty(element, 'selected')
  }

  return false
}

/**
 * Check whether an element matches a `:dir()` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
// eslint-disable-next-line unicorn/prevent-abbreviations
function dir(query, _1, _2, _3, state) {
  ok$1(query.argument);
  ok$1(query.argument.type === 'String');
  return state.direction === query.argument.value
}

/**
 * Check whether an element matches a `:disabled` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function disabled(_, element) {
  return (
    (element.tagName === 'button' ||
      element.tagName === 'input' ||
      element.tagName === 'select' ||
      element.tagName === 'textarea' ||
      element.tagName === 'optgroup' ||
      element.tagName === 'option' ||
      element.tagName === 'menuitem' ||
      element.tagName === 'fieldset') &&
    hasProperty(element, 'disabled')
  )
}

/**
 * Check whether an element matches an `:empty` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function empty$1(_, element) {
  return !someChildren(element, check)

  /**
   * @param {ElementContent} child
   * @returns {boolean}
   */
  function check(child) {
    return child.type === 'element' || child.type === 'text'
  }
}

/**
 * Check whether an element matches an `:enabled` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function enabled(query, element) {
  return !disabled(query, element)
}

/**
 * Check whether an element matches a `:first-child` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function firstChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.elementIndex === 0
}

/**
 * Check whether an element matches a `:first-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function firstOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.typeIndex === 0
}

/**
 * @param {AstPseudoClass} query
 *   Query.
 * @returns {(value: number) => boolean}
 *   N.
 */
function getCachedNthCheck(query) {
  /** @type {(value: number) => boolean} */
  // @ts-expect-error: cache.
  let cachedFunction = query._cachedFn;

  if (!cachedFunction) {
    const value = query.argument;

    if (value.type !== 'Formula') {
      throw new Error(
        'Expected `nth` formula, such as `even` or `2n+1` (`of` is not yet supported)'
      )
    }

    cachedFunction = nthCheck(value.a + 'n+' + value.b);
    // @ts-expect-error: cache.
    query._cachedFn = cachedFunction;
  }

  return cachedFunction
}

/**
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} _1
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _2
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function has(query, element, _1, _2, state) {
  ok$1(query.argument);
  ok$1(query.argument.type === 'Selector');

  /** @type {State} */
  const childState = {
    ...state,
    // Not found yet.
    found: false,
    // One result is enough.
    one: true,
    results: [],
    rootQuery: query.argument,
    scopeElements: [element],
    // Do walk deep.
    shallow: false
  };

  walk(childState, {type: 'root', children: element.children});

  return childState.results.length > 0
}

// Shouldn’t be called, parser gives correct data.
/* c8 ignore next 3 */
function invalidPseudo() {
}

/**
 * Check whether an element `:is` further selectors.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} _1
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _2
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function is(query, element, _1, _2, state) {
  ok$1(query.argument);
  ok$1(query.argument.type === 'Selector');

  /** @type {State} */
  const childState = {
    ...state,
    // Not found yet.
    found: false,
    // One result is enough.
    one: true,
    results: [],
    rootQuery: query.argument,
    scopeElements: [element],
    // Do walk deep.
    shallow: false
  };

  walk(childState, element);

  return childState.results[0] === element
}

/**
 * Check whether an element matches a `:lang()` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function lang(query, _1, _2, _3, state) {
  ok$1(query.argument);
  ok$1(query.argument.type === 'String');

  return (
    state.language !== '' &&
    state.language !== undefined &&
    extendedFilter(state.language, parse$4(query.argument.value)).length > 0
  )
}

/**
 * Check whether an element matches a `:last-child` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function lastChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return Boolean(
    state.elementCount && state.elementIndex === state.elementCount - 1
  )
}

/**
 * Check whether an element matches a `:last-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function lastOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return (
    typeof state.typeIndex === 'number' &&
    typeof state.typeCount === 'number' &&
    state.typeIndex === state.typeCount - 1
  )
}

/**
 * Check whether an element does `:not` match further selectors.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} index
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function not(query, element, index, parent, state) {
  return !is(query, element, index, parent, state)
}

/**
 * Check whether an element matches an `:nth-child` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function nthChild(query, _1, _2, _3, state) {
  const cachedFunction = getCachedNthCheck(query);
  assertDeep(state, query);
  return (
    typeof state.elementIndex === 'number' && cachedFunction(state.elementIndex)
  )
}

/**
 * Check whether an element matches an `:nth-last-child` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function nthLastChild(query, _1, _2, _3, state) {
  const cachedFunction = getCachedNthCheck(query);
  assertDeep(state, query);
  return Boolean(
    typeof state.elementCount === 'number' &&
      typeof state.elementIndex === 'number' &&
      cachedFunction(state.elementCount - state.elementIndex - 1)
  )
}

/**
 * Check whether an element matches a `:nth-last-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function nthLastOfType(query, _1, _2, _3, state) {
  const cachedFunction = getCachedNthCheck(query);
  assertDeep(state, query);
  return (
    typeof state.typeCount === 'number' &&
    typeof state.typeIndex === 'number' &&
    cachedFunction(state.typeCount - 1 - state.typeIndex)
  )
}

/**
 * Check whether an element matches an `:nth-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function nthOfType(query, _1, _2, _3, state) {
  const cachedFunction = getCachedNthCheck(query);
  assertDeep(state, query);
  return typeof state.typeIndex === 'number' && cachedFunction(state.typeIndex)
}

/**
 * Check whether an element matches an `:only-child` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function onlyChild(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.elementCount === 1
}

/**
 * Check whether an element matches an `:only-of-type` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} _1
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function onlyOfType(query, _1, _2, _3, state) {
  assertDeep(state, query);
  return state.typeCount === 1
}

/**
 * Check whether an element matches an `:optional` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function optional(query, element) {
  return !required(query, element)
}

/**
 * Check whether an element matches a `:read-only` pseudo.
 *
 * @param {AstPseudoClass} query
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} index
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function readOnly(query, element, index, parent, state) {
  return !readWrite(query, element, index, parent, state)
}

/**
 * Check whether an element matches a `:read-write` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} _1
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _2
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function readWrite(_, element, _1, _2, state) {
  return element.tagName === 'input' || element.tagName === 'textarea'
    ? !hasProperty(element, 'readOnly') && !hasProperty(element, 'disabled')
    : Boolean(state.editableOrEditingHost)
}

/**
 * Check whether an element matches a `:required` pseudo.
 *
 * @param {AstPseudoClass} _
 *   Query.
 * @param {Element} element
 *   Element.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function required(_, element) {
  return (
    (element.tagName === 'input' ||
      element.tagName === 'textarea' ||
      element.tagName === 'select') &&
    hasProperty(element, 'required')
  )
}

/**
 * Check whether an element matches a `:root` pseudo.
 *
 * @param {AstPseudoClass} _1
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function root(_1, element, _2, parent, state) {
  return Boolean(
    (!parent || parent.type === 'root') &&
      state.schema &&
      (state.schema.space === 'html' || state.schema.space === 'svg') &&
      (element.tagName === 'html' || element.tagName === 'svg')
  )
}

/**
 * Check whether an element matches a `:scope` pseudo.
 *
 * @param {AstPseudoClass} _1
 *   Query.
 * @param {Element} element
 *   Element.
 * @param {number | undefined} _2
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} _3
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function scope(_1, element, _2, _3, state) {
  return state.scopeElements.includes(element)
}

/**
 * Check children.
 *
 * @param {Element} element
 *   Element.
 * @param {(child: ElementContent) => boolean} check
 *   Check.
 * @returns {boolean}
 *   Whether a child of `element` matches `check`.
 */
function someChildren(element, check) {
  const children = element.children;
  let index = -1;

  while (++index < children.length) {
    if (check(children[index])) return true
  }

  return false
}

/**
 * @param {unknown} query_
 *   Query-like value.
 * @returns {never}
 *   Nothing.
 * @throws
 *   Exception.
 */
function unknownPseudo(query_) {
  // Runtime JS guarantees it has a `name`.
  const query = /** @type {AstPseudoClass} */ (query_);
  throw new Error('Unknown pseudo-selector `' + query.name + '`')
}

/**
 * @import {AstRule} from 'css-selector-parser'
 * @import {Element, Parents} from 'hast'
 * @import {State} from './index.js'
 */


/**
 * Test a rule.
 *
 * @param {AstRule} query
 *   AST rule (with `pseudoClasses`).
 * @param {Element} element
 *   Element.
 * @param {number | undefined} index
 *   Index of `element` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `element`.
 * @param {State} state
 *   State.
 * @returns {boolean}
 *   Whether `element` matches `query`.
 */
function test(query, element, index, parent, state) {
  for (const item of query.items) {
    // eslint-disable-next-line unicorn/prefer-switch
    if (item.type === 'Attribute') {
      if (!attribute(item, element, state.schema)) return false
    } else if (item.type === 'Id') {
      if (!id(item, element)) return false
    } else if (item.type === 'ClassName') {
      if (!className(item, element)) return false
    } else if (item.type === 'PseudoClass') {
      if (!pseudo(item, element, index, parent, state)) return false
    } else if (item.type === 'PseudoElement') {
      throw new Error('Invalid selector: `::' + item.name + '`')
    } else if (item.type === 'TagName') {
      if (!name(item, element)) return false
    } else ;
  }

  return true
}

/**
 * @import {AstRule} from 'css-selector-parser'
 * @import {Element, Nodes, Parents} from 'hast'
 * @import {State} from './index.js'
 */


/** @type {Array<never>} */
const empty = [];

/**
 * Walk a tree.
 *
 * @param {State} state
 *   State.
 * @param {Nodes | undefined} tree
 *   Tree.
 */
function walk(state, tree) {
  if (tree) {
    one(state, [], tree, undefined, undefined, tree);
  }
}

/**
 * Add a rule to a nesting map.
 *
 * @param {Nest} nest
 *   Nesting.
 * @param {keyof Nest} field
 *   Field.
 * @param {AstRule} rule
 *   Rule.
 */
function add$1(nest, field, rule) {
  const list = nest[field];
  if (list) {
    list.push(rule);
  } else {
    nest[field] = [rule];
  }
}

/**
 * Check in a parent.
 *
 * @param {State} state
 *   State.
 * @param {Nest} nest
 *   Nesting.
 * @param {Parents} node
 *   Parent.
 * @param {Nodes} tree
 *   Tree.
 * @returns {undefined}
 *   Nothing.
 */
function all(state, nest, node, tree) {
  const fromParent = combine(nest.descendant, nest.directChild);
  /** @type {Array<AstRule> | undefined} */
  let fromSibling;
  let index = -1;
  /**
   * Total counts.
   * @type {Counts}
   */
  const total = {count: 0, types: new Map()};
  /**
   * Counts of previous siblings.
   * @type {Counts}
   */
  const before = {count: 0, types: new Map()};

  while (++index < node.children.length) {
    count(total, node.children[index]);
  }

  index = -1;

  while (++index < node.children.length) {
    const child = node.children[index];
    // Uppercase to prevent prototype polution, injecting `constructor` or so.
    // Normalize because HTML is insensitive.
    const name =
      child.type === 'element' ? child.tagName.toUpperCase() : undefined;
    // Before counting further elements:
    state.elementIndex = before.count;
    state.typeIndex = name ? before.types.get(name) || 0 : 0;
    // After counting all elements.
    state.elementCount = total.count;
    state.typeCount = name ? total.types.get(name) : 0;

    // Only apply if this is a parent, this should be an element, but we check
    // for parents so that we delve into custom nodes too.
    if ('children' in child) {
      const forSibling = combine(fromParent, fromSibling);
      const nest = one(
        state,
        forSibling,
        node.children[index],
        index,
        node,
        tree
      );
      fromSibling = combine(nest.generalSibling, nest.adjacentSibling);
    }

    // We found one thing, and one is enough.
    if (state.one && state.found) {
      break
    }

    count(before, node.children[index]);
  }
}

/**
 * Apply selectors to an element.
 *
 * @param {State} state
 *   Current state.
 * @param {Array<AstRule>} rules
 *   Rules to apply.
 * @param {Element} node
 *   Element to apply rules to.
 * @param {number | undefined} index
 *   Index of `node` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @returns {Nest}
 *   Further rules.
 */
function applySelectors(state, rules, node, index, parent) {
  /** @type {Nest} */
  const nestResult = {
    adjacentSibling: undefined,
    descendant: undefined,
    directChild: undefined,
    generalSibling: undefined
  };
  let selectorIndex = -1;

  while (++selectorIndex < rules.length) {
    const rule = rules[selectorIndex];

    // We found one thing, and one is enough.
    if (state.one && state.found) {
      break
    }

    // When shallow, we don’t allow nested rules.
    // Idea: we could allow a stack of parents?
    // Might get quite complex though.
    if (state.shallow && rule.nestedRule) {
      throw new Error('Expected selector without nesting')
    }

    // If this rule matches:
    if (test(rule, node, index, parent, state)) {
      const nest = rule.nestedRule;

      // Are there more?
      if (nest) {
        /** @type {keyof Nest} */
        const label =
          nest.combinator === '+'
            ? 'adjacentSibling'
            : nest.combinator === '~'
              ? 'generalSibling'
              : nest.combinator === '>'
                ? 'directChild'
                : 'descendant';
        add$1(nestResult, label, nest);
      } else {
        // We have a match!
        state.found = true;

        if (!state.results.includes(node)) {
          state.results.push(node);
        }
      }
    }

    // Descendant.
    if (rule.combinator === undefined) {
      add$1(nestResult, 'descendant', rule);
    }
    // Adjacent.
    else if (rule.combinator === '~') {
      add$1(nestResult, 'generalSibling', rule);
    }
    // Drop direct child (`>`), adjacent sibling (`+`).
  }

  return nestResult
}

/**
 * Combine two lists, if needed.
 *
 * This is optimized to create as few lists as possible.
 *
 * @param {Array<AstRule> | undefined} left
 *   Rules.
 * @param {Array<AstRule> | undefined} right
 *   Rules.
 * @returns {Array<AstRule>}
 *   Rules.
 */
function combine(left, right) {
  return left && right && left.length > 0 && right.length > 0
    ? [...left, ...right]
    : left && left.length > 0
      ? left
      : right && right.length > 0
        ? right
        : empty
}

/**
 * Count a node.
 *
 * @param {Counts} counts
 *   Counts.
 * @param {Nodes} node
 *   Node (we’re looking for elements).
 * @returns {undefined}
 *   Nothing.
 */
function count(counts, node) {
  if (node.type === 'element') {
    // Uppercase to prevent prototype polution, injecting `constructor` or so.
    // Normalize because HTML is insensitive.
    const name = node.tagName.toUpperCase();
    const count = (counts.types.get(name) || 0) + 1;
    counts.count++;
    counts.types.set(name, count);
  }
}

/**
 * Check a node.
 *
 * @param {State} state
 *   State.
 * @param {Array<AstRule>} currentRules
 *   Rules.
 * @param {Nodes} node
 *   Node.
 * @param {number | undefined} index
 *   Index of `node` in `parent`.
 * @param {Parents | undefined} parent
 *   Parent of `node`.
 * @param {Nodes} tree
 *   Tree.
 * @returns {Nest}
 *   Nesting.
 */
function one(state, currentRules, node, index, parent, tree) {
  /** @type {Nest} */
  let nestResult = {
    adjacentSibling: undefined,
    descendant: undefined,
    directChild: undefined,
    generalSibling: undefined
  };

  const exit = enterState(state, node);

  if (node.type === 'element') {
    let rootRules = state.rootQuery.rules;

    // Remove direct child rules if this is the root.
    // This only happens for a `:has()` rule, which can be like
    // `a:has(> b)`.
    if (parent && parent !== tree) {
      rootRules = state.rootQuery.rules.filter(
        (d) =>
          d.combinator === undefined ||
          (d.combinator === '>' && parent === tree)
      );
    }

    nestResult = applySelectors(
      state,
      // Try the root rules for this element too.
      combine(currentRules, rootRules),
      node,
      index,
      parent
    );
  }

  // If this is a parent, and we want to delve into them, and we haven’t found
  // our single result yet.
  if ('children' in node && !state.shallow && !(state.one && state.found)) {
    all(state, nestResult, node, tree);
  }

  exit();

  return nestResult
}

/**
 * @import {AstSelector} from 'css-selector-parser'
 * @import {Element, Nodes, RootContent} from 'hast'
 * @import {Schema} from 'property-information'
 */


/**
 * Select all elements that match `selector` in the given `tree`.
 * Searches the tree in *preorder*.
 *
 * @param {string} selector
 *   CSS selector, such as (`h1`, `a, b`).
 * @param {Nodes | null | undefined} [tree]
 *   Tree to search (optional).
 * @param {Space | null | undefined} [space='html']
 *   Name of namespace (default: `'html'`).
 * @returns {Array<Element>}
 *   Elements in `tree` that match `selector`.
 *   This could include `tree` itself.
 */
function selectAll(selector, tree, space) {
  const state = createState(selector, tree);
  walk(state, tree || undefined);
  return state.results
}

/**
 * @param {string} selector
 *   CSS selector, such as (`h1`, `a, b`).
 * @param {Nodes | null | undefined} [tree]
 *   Tree to search (optional).
 * @param {Space | null | undefined} [space='html']
 *   Name of namespace (default: `'html'`).
 * @returns {State} State
 *   State.
 */
function createState(selector, tree, space) {
  return {
    direction: 'ltr',
    editableOrEditingHost: false,
    elementCount: undefined,
    elementIndex: undefined,
    found: false,
    language: undefined,
    one: false,
    // State of the query.
    results: [],
    rootQuery: parse$1(selector),
    schema: html$4,
    scopeElements: tree ? (tree.type === 'root' ? tree.children : [tree]) : [],
    shallow: false,
    typeIndex: undefined,
    typeCount: undefined
  }
}

/**
 * @typedef {import('hast').Nodes} Nodes
 */


const own$1 = {}.hasOwnProperty;

/**
 * Merge classes.
 *
 * This function has two signatures, depending on whether a `node` was passed.
 *
 * @param node
 *   Optionally, node whose classes to append to (should be `Element`).
 * @param conditionals
 *   Class configuration to merge.
 * @returns
 *   The given node, if any, or a list of strings.
 */
const classnames =
  // Note: JSDoc overloads don’t support optional templates yet.
  /**
   * @type {(
   *   (<T extends Nodes>(node: T, ...conditionals: Array<Conditional>) => T) &
   *   ((...conditionals: Array<Conditional>) => Array<string>)
   * )}
   */
  (
    /**
     * @param {Conditional | Nodes | null | undefined} [node]
     * @param {...Conditional} conditionals
     */
    function (node, ...conditionals) {
      let index = -1;
      /** @type {Map<string, boolean>} */
      const map = new Map();
      /** @type {Array<string>} */
      const list = [];

      if (isNode(node)) {
        if (node.type !== 'element') throw new Error('Expected element node')

        if (Array.isArray(node.properties.className)) {
          add(map, node.properties.className);
        }

        // We’ll add to `list` later.
        node.properties.className = list;
      } else {
        conditionals.unshift(node);
      }

      while (++index < conditionals.length) {
        add(map, conditionals[index]);
      }

      for (const [key, value] of map) {
        if (value) list.push(key);
      }

      return isNode(node) ? node : list
    }
  );

/**
 * @param {Map<string, boolean>} result
 * @param {Conditional} conditional
 */
function add(result, conditional) {
  let index = -1;
  /** @type {string} */
  let key;
  /** @type {Array<string>} */
  let list;

  if (typeof conditional === 'number') {
    result.set(String(conditional), true);
  } else if (typeof conditional === 'string') {
    list = parse$3(conditional);

    while (++index < list.length) {
      result.set(list[index], true);
    }
  } else if (conditional && typeof conditional === 'object') {
    if (Array.isArray(conditional)) {
      while (++index < conditional.length) {
        add(result, conditional[index]);
      }
    } else {
      for (key in conditional) {
        if (own$1.call(conditional, key)) {
          result.set(key, conditional[key]);
        }
      }
    }
  }
}

/**
 * @param {Conditional | Nodes | null | undefined} value
 * @returns {value is Nodes}
 */
function isNode(value) {
  return Boolean(value && typeof value === 'object' && 'type' in value)
}

const rehypeClassNames = (additions) => {
    return (tree) => {
        if (additions)
            Object.entries(additions).map(([selector, cName]) => {
                return (nodes) => selectAll(selector, nodes).forEach((elem) => {
                    classnames(elem, cName);
                });
            }).forEach((a) => a(tree));
    };
};

/**
 * Throw a given error.
 *
 * @param {Error|null|undefined} [error]
 *   Maybe error.
 * @returns {asserts error is null|undefined}
 */
function bail(error) {
  if (error) {
    throw error
  }
}

var extend$1;
var hasRequiredExtend;

function requireExtend () {
	if (hasRequiredExtend) return extend$1;
	hasRequiredExtend = 1;

	var hasOwn = Object.prototype.hasOwnProperty;
	var toStr = Object.prototype.toString;
	var defineProperty = Object.defineProperty;
	var gOPD = Object.getOwnPropertyDescriptor;

	var isArray = function isArray(arr) {
		if (typeof Array.isArray === 'function') {
			return Array.isArray(arr);
		}

		return toStr.call(arr) === '[object Array]';
	};

	var isPlainObject = function isPlainObject(obj) {
		if (!obj || toStr.call(obj) !== '[object Object]') {
			return false;
		}

		var hasOwnConstructor = hasOwn.call(obj, 'constructor');
		var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
		// Not own constructor property must be Object
		if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
			return false;
		}

		// Own properties are enumerated firstly, so to speed up,
		// if last one is own, then all properties are own.
		var key;
		for (key in obj) { /**/ }

		return typeof key === 'undefined' || hasOwn.call(obj, key);
	};

	// If name is '__proto__', and Object.defineProperty is available, define __proto__ as an own property on target
	var setProperty = function setProperty(target, options) {
		if (defineProperty && options.name === '__proto__') {
			defineProperty(target, options.name, {
				enumerable: true,
				configurable: true,
				value: options.newValue,
				writable: true
			});
		} else {
			target[options.name] = options.newValue;
		}
	};

	// Return undefined instead of __proto__ if '__proto__' is not an own property
	var getProperty = function getProperty(obj, name) {
		if (name === '__proto__') {
			if (!hasOwn.call(obj, name)) {
				return void 0;
			} else if (gOPD) {
				// In early versions of node, obj['__proto__'] is buggy when obj has
				// __proto__ as an own property. Object.getOwnPropertyDescriptor() works.
				return gOPD(obj, name).value;
			}
		}

		return obj[name];
	};

	extend$1 = function extend() {
		var options, name, src, copy, copyIsArray, clone;
		var target = arguments[0];
		var i = 1;
		var length = arguments.length;
		var deep = false;

		// Handle a deep copy situation
		if (typeof target === 'boolean') {
			deep = target;
			target = arguments[1] || {};
			// skip the boolean and the target
			i = 2;
		}
		if (target == null || (typeof target !== 'object' && typeof target !== 'function')) {
			target = {};
		}

		for (; i < length; ++i) {
			options = arguments[i];
			// Only deal with non-null/undefined values
			if (options != null) {
				// Extend the base object
				for (name in options) {
					src = getProperty(target, name);
					copy = getProperty(options, name);

					// Prevent never-ending loop
					if (target !== copy) {
						// Recurse if we're merging plain objects or arrays
						if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
							if (copyIsArray) {
								copyIsArray = false;
								clone = src && isArray(src) ? src : [];
							} else {
								clone = src && isPlainObject(src) ? src : {};
							}

							// Never move original objects, clone them
							setProperty(target, { name: name, newValue: extend(deep, clone, copy) });

						// Don't bring in undefined values
						} else if (typeof copy !== 'undefined') {
							setProperty(target, { name: name, newValue: copy });
						}
					}
				}
			}
		}

		// Return the modified object
		return target;
	};
	return extend$1;
}

var extendExports = requireExtend();
var extend = /*@__PURE__*/getDefaultExportFromCjs(extendExports);

function isPlainObject(value) {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) && !(Symbol.toStringTag in value) && !(Symbol.iterator in value);
}

// To do: remove `void`s
// To do: remove `null` from output of our APIs, allow it as user APIs.

/**
 * @typedef {(error?: Error | null | undefined, ...output: Array<any>) => void} Callback
 *   Callback.
 *
 * @typedef {(...input: Array<any>) => any} Middleware
 *   Ware.
 *
 * @typedef Pipeline
 *   Pipeline.
 * @property {Run} run
 *   Run the pipeline.
 * @property {Use} use
 *   Add middleware.
 *
 * @typedef {(...input: Array<any>) => void} Run
 *   Call all middleware.
 *
 *   Calls `done` on completion with either an error or the output of the
 *   last middleware.
 *
 *   > 👉 **Note**: as the length of input defines whether async functions get a
 *   > `next` function,
 *   > it’s recommended to keep `input` at one value normally.

 *
 * @typedef {(fn: Middleware) => Pipeline} Use
 *   Add middleware.
 */

/**
 * Create new middleware.
 *
 * @returns {Pipeline}
 *   Pipeline.
 */
function trough() {
  /** @type {Array<Middleware>} */
  const fns = [];
  /** @type {Pipeline} */
  const pipeline = {run, use};

  return pipeline

  /** @type {Run} */
  function run(...values) {
    let middlewareIndex = -1;
    /** @type {Callback} */
    const callback = values.pop();

    if (typeof callback !== 'function') {
      throw new TypeError('Expected function as last argument, not ' + callback)
    }

    next(null, ...values);

    /**
     * Run the next `fn`, or we’re done.
     *
     * @param {Error | null | undefined} error
     * @param {Array<any>} output
     */
    function next(error, ...output) {
      const fn = fns[++middlewareIndex];
      let index = -1;

      if (error) {
        callback(error);
        return
      }

      // Copy non-nullish input into values.
      while (++index < values.length) {
        if (output[index] === null || output[index] === undefined) {
          output[index] = values[index];
        }
      }

      // Save the newly created `output` for the next call.
      values = output;

      // Next or done.
      if (fn) {
        wrap(fn, next)(...output);
      } else {
        callback(null, ...output);
      }
    }
  }

  /** @type {Use} */
  function use(middelware) {
    if (typeof middelware !== 'function') {
      throw new TypeError(
        'Expected `middelware` to be a function, not ' + middelware
      )
    }

    fns.push(middelware);
    return pipeline
  }
}

/**
 * Wrap `middleware` into a uniform interface.
 *
 * You can pass all input to the resulting function.
 * `callback` is then called with the output of `middleware`.
 *
 * If `middleware` accepts more arguments than the later given in input,
 * an extra `done` function is passed to it after that input,
 * which must be called by `middleware`.
 *
 * The first value in `input` is the main input value.
 * All other input values are the rest input values.
 * The values given to `callback` are the input values,
 * merged with every non-nullish output value.
 *
 * * if `middleware` throws an error,
 *   returns a promise that is rejected,
 *   or calls the given `done` function with an error,
 *   `callback` is called with that error
 * * if `middleware` returns a value or returns a promise that is resolved,
 *   that value is the main output value
 * * if `middleware` calls `done`,
 *   all non-nullish values except for the first one (the error) overwrite the
 *   output values
 *
 * @param {Middleware} middleware
 *   Function to wrap.
 * @param {Callback} callback
 *   Callback called with the output of `middleware`.
 * @returns {Run}
 *   Wrapped middleware.
 */
function wrap(middleware, callback) {
  /** @type {boolean} */
  let called;

  return wrapped

  /**
   * Call `middleware`.
   * @this {any}
   * @param {Array<any>} parameters
   * @returns {void}
   */
  function wrapped(...parameters) {
    const fnExpectsCallback = middleware.length > parameters.length;
    /** @type {any} */
    let result;

    if (fnExpectsCallback) {
      parameters.push(done);
    }

    try {
      result = middleware.apply(this, parameters);
    } catch (error) {
      const exception = /** @type {Error} */ (error);

      // Well, this is quite the pickle.
      // `middleware` received a callback and called it synchronously, but that
      // threw an error.
      // The only thing left to do is to throw the thing instead.
      if (fnExpectsCallback && called) {
        throw exception
      }

      return done(exception)
    }

    if (!fnExpectsCallback) {
      if (result && result.then && typeof result.then === 'function') {
        result.then(then, done);
      } else if (result instanceof Error) {
        done(result);
      } else {
        then(result);
      }
    }
  }

  /**
   * Call `callback`, only once.
   *
   * @type {Callback}
   */
  function done(error, ...output) {
    if (!called) {
      called = true;
      callback(error, ...output);
    }
  }

  /**
   * Call `done` with one value.
   *
   * @param {any} [value]
   */
  function then(value) {
    done(null, value);
  }
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Point} Point
 * @typedef {import('unist').Position} Position
 */


/**
 * Message.
 */
class VFileMessage extends Error {
  /**
   * Create a message for `reason`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {Options | null | undefined} [options]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | Options | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns
   *   Instance of `VFileMessage`.
   */
  // eslint-disable-next-line complexity
  constructor(causeOrReason, optionsOrParentOrPlace, origin) {
    super();

    if (typeof optionsOrParentOrPlace === 'string') {
      origin = optionsOrParentOrPlace;
      optionsOrParentOrPlace = undefined;
    }

    /** @type {string} */
    let reason = '';
    /** @type {Options} */
    let options = {};
    let legacyCause = false;

    if (optionsOrParentOrPlace) {
      // Point.
      if (
        'line' in optionsOrParentOrPlace &&
        'column' in optionsOrParentOrPlace
      ) {
        options = {place: optionsOrParentOrPlace};
      }
      // Position.
      else if (
        'start' in optionsOrParentOrPlace &&
        'end' in optionsOrParentOrPlace
      ) {
        options = {place: optionsOrParentOrPlace};
      }
      // Node.
      else if ('type' in optionsOrParentOrPlace) {
        options = {
          ancestors: [optionsOrParentOrPlace],
          place: optionsOrParentOrPlace.position
        };
      }
      // Options.
      else {
        options = {...optionsOrParentOrPlace};
      }
    }

    if (typeof causeOrReason === 'string') {
      reason = causeOrReason;
    }
    // Error.
    else if (!options.cause && causeOrReason) {
      legacyCause = true;
      reason = causeOrReason.message;
      options.cause = causeOrReason;
    }

    if (!options.ruleId && !options.source && typeof origin === 'string') {
      const index = origin.indexOf(':');

      if (index === -1) {
        options.ruleId = origin;
      } else {
        options.source = origin.slice(0, index);
        options.ruleId = origin.slice(index + 1);
      }
    }

    if (!options.place && options.ancestors && options.ancestors) {
      const parent = options.ancestors[options.ancestors.length - 1];

      if (parent) {
        options.place = parent.position;
      }
    }

    const start =
      options.place && 'start' in options.place
        ? options.place.start
        : options.place;

    /* eslint-disable no-unused-expressions */
    /**
     * Stack of ancestor nodes surrounding the message.
     *
     * @type {Array<Node> | undefined}
     */
    this.ancestors = options.ancestors || undefined;

    /**
     * Original error cause of the message.
     *
     * @type {Error | undefined}
     */
    this.cause = options.cause || undefined;

    /**
     * Starting column of message.
     *
     * @type {number | undefined}
     */
    this.column = start ? start.column : undefined;

    /**
     * State of problem.
     *
     * * `true` — error, file not usable
     * * `false` — warning, change may be needed
     * * `undefined` — change likely not needed
     *
     * @type {boolean | null | undefined}
     */
    this.fatal = undefined;

    /**
     * Path of a file (used throughout the `VFile` ecosystem).
     *
     * @type {string | undefined}
     */
    this.file;

    // Field from `Error`.
    /**
     * Reason for message.
     *
     * @type {string}
     */
    this.message = reason;

    /**
     * Starting line of error.
     *
     * @type {number | undefined}
     */
    this.line = start ? start.line : undefined;

    // Field from `Error`.
    /**
     * Serialized positional info of message.
     *
     * On normal errors, this would be something like `ParseError`, buit in
     * `VFile` messages we use this space to show where an error happened.
     */
    this.name = stringifyPosition(options.place) || '1:1';

    /**
     * Place of message.
     *
     * @type {Point | Position | undefined}
     */
    this.place = options.place || undefined;

    /**
     * Reason for message, should use markdown.
     *
     * @type {string}
     */
    this.reason = this.message;

    /**
     * Category of message (example: `'my-rule'`).
     *
     * @type {string | undefined}
     */
    this.ruleId = options.ruleId || undefined;

    /**
     * Namespace of message (example: `'my-package'`).
     *
     * @type {string | undefined}
     */
    this.source = options.source || undefined;

    // Field from `Error`.
    /**
     * Stack of message.
     *
     * This is used by normal errors to show where something happened in
     * programming code, irrelevant for `VFile` messages,
     *
     * @type {string}
     */
    this.stack =
      legacyCause && options.cause && typeof options.cause.stack === 'string'
        ? options.cause.stack
        : '';

    // The following fields are “well known”.
    // Not standard.
    // Feel free to add other non-standard fields to your messages.

    /**
     * Specify the source value that’s being reported, which is deemed
     * incorrect.
     *
     * @type {string | undefined}
     */
    this.actual;

    /**
     * Suggest acceptable values that can be used instead of `actual`.
     *
     * @type {Array<string> | undefined}
     */
    this.expected;

    /**
     * Long form description of the message (you should use markdown).
     *
     * @type {string | undefined}
     */
    this.note;

    /**
     * Link to docs for the message.
     *
     * > 👉 **Note**: this must be an absolute URL that can be passed as `x`
     * > to `new URL(x)`.
     *
     * @type {string | undefined}
     */
    this.url;
    /* eslint-enable no-unused-expressions */
  }
}

VFileMessage.prototype.file = '';
VFileMessage.prototype.name = '';
VFileMessage.prototype.reason = '';
VFileMessage.prototype.message = '';
VFileMessage.prototype.stack = '';
VFileMessage.prototype.column = undefined;
VFileMessage.prototype.line = undefined;
VFileMessage.prototype.ancestors = undefined;
VFileMessage.prototype.cause = undefined;
VFileMessage.prototype.fatal = undefined;
VFileMessage.prototype.place = undefined;
VFileMessage.prototype.ruleId = undefined;
VFileMessage.prototype.source = undefined;

/**
 * Checks if a value has the shape of a WHATWG URL object.
 *
 * Using a symbol or instanceof would not be able to recognize URL objects
 * coming from other implementations (e.g. in Electron), so instead we are
 * checking some well known properties for a lack of a better test.
 *
 * We use `href` and `protocol` as they are the only properties that are
 * easy to retrieve and calculate due to the lazy nature of the getters.
 *
 * We check for auth attribute to distinguish legacy url instance with
 * WHATWG URL instance.
 *
 * @param {unknown} fileUrlOrPath
 *   File path or URL.
 * @returns {fileUrlOrPath is URL}
 *   Whether it’s a URL.
 */
// From: <https://github.com/nodejs/node/blob/6a3403c/lib/internal/url.js#L720>
function isUrl(fileUrlOrPath) {
  return Boolean(
    fileUrlOrPath !== null &&
      typeof fileUrlOrPath === 'object' &&
      'href' in fileUrlOrPath &&
      fileUrlOrPath.href &&
      'protocol' in fileUrlOrPath &&
      fileUrlOrPath.protocol &&
      // @ts-expect-error: indexing is fine.
      fileUrlOrPath.auth === undefined
  )
}

/**
 * @import {Node, Point, Position} from 'unist'
 * @import {Options as MessageOptions} from 'vfile-message'
 * @import {Compatible, Data, Map, Options, Value} from 'vfile'
 */


/**
 * Order of setting (least specific to most), we need this because otherwise
 * `{stem: 'a', path: '~/b.js'}` would throw, as a path is needed before a
 * stem can be set.
 */
const order = /** @type {const} */ ([
  'history',
  'path',
  'basename',
  'stem',
  'extname',
  'dirname'
]);

class VFile {
  /**
   * Create a new virtual file.
   *
   * `options` is treated as:
   *
   * *   `string` or `Uint8Array` — `{value: options}`
   * *   `URL` — `{path: options}`
   * *   `VFile` — shallow copies its data over to the new file
   * *   `object` — all fields are shallow copied over to the new file
   *
   * Path related fields are set in the following order (least specific to
   * most specific): `history`, `path`, `basename`, `stem`, `extname`,
   * `dirname`.
   *
   * You cannot set `dirname` or `extname` without setting either `history`,
   * `path`, `basename`, or `stem` too.
   *
   * @param {Compatible | null | undefined} [value]
   *   File value.
   * @returns
   *   New instance.
   */
  constructor(value) {
    /** @type {Options | VFile} */
    let options;

    if (!value) {
      options = {};
    } else if (isUrl(value)) {
      options = {path: value};
    } else if (typeof value === 'string' || isUint8Array$1(value)) {
      options = {value};
    } else {
      options = value;
    }

    /* eslint-disable no-unused-expressions */

    /**
     * Base of `path` (default: `process.cwd()` or `'/'` in browsers).
     *
     * @type {string}
     */
    // Prevent calling `cwd` (which could be expensive) if it’s not needed;
    // the empty string will be overridden in the next block.
    this.cwd = 'cwd' in options ? '' : minproc.cwd();

    /**
     * Place to store custom info (default: `{}`).
     *
     * It’s OK to store custom data directly on the file but moving it to
     * `data` is recommended.
     *
     * @type {Data}
     */
    this.data = {};

    /**
     * List of file paths the file moved between.
     *
     * The first is the original path and the last is the current path.
     *
     * @type {Array<string>}
     */
    this.history = [];

    /**
     * List of messages associated with the file.
     *
     * @type {Array<VFileMessage>}
     */
    this.messages = [];

    /**
     * Raw value.
     *
     * @type {Value}
     */
    this.value;

    // The below are non-standard, they are “well-known”.
    // As in, used in several tools.
    /**
     * Source map.
     *
     * This type is equivalent to the `RawSourceMap` type from the `source-map`
     * module.
     *
     * @type {Map | null | undefined}
     */
    this.map;

    /**
     * Custom, non-string, compiled, representation.
     *
     * This is used by unified to store non-string results.
     * One example is when turning markdown into React nodes.
     *
     * @type {unknown}
     */
    this.result;

    /**
     * Whether a file was saved to disk.
     *
     * This is used by vfile reporters.
     *
     * @type {boolean}
     */
    this.stored;
    /* eslint-enable no-unused-expressions */

    // Set path related properties in the correct order.
    let index = -1;

    while (++index < order.length) {
      const field = order[index];

      // Note: we specifically use `in` instead of `hasOwnProperty` to accept
      // `vfile`s too.
      if (
        field in options &&
        options[field] !== undefined &&
        options[field] !== null
      ) {
        // @ts-expect-error: TS doesn’t understand basic reality.
        this[field] = field === 'history' ? [...options[field]] : options[field];
      }
    }

    /** @type {string} */
    let field;

    // Set non-path related properties.
    for (field in options) {
      // @ts-expect-error: fine to set other things.
      if (!order.includes(field)) {
        // @ts-expect-error: fine to set other things.
        this[field] = options[field];
      }
    }
  }

  /**
   * Get the basename (including extname) (example: `'index.min.js'`).
   *
   * @returns {string | undefined}
   *   Basename.
   */
  get basename() {
    return typeof this.path === 'string'
      ? minpath.basename(this.path)
      : undefined
  }

  /**
   * Set basename (including extname) (`'index.min.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} basename
   *   Basename.
   * @returns {undefined}
   *   Nothing.
   */
  set basename(basename) {
    assertNonEmpty(basename, 'basename');
    assertPart(basename, 'basename');
    this.path = minpath.join(this.dirname || '', basename);
  }

  /**
   * Get the parent path (example: `'~'`).
   *
   * @returns {string | undefined}
   *   Dirname.
   */
  get dirname() {
    return typeof this.path === 'string'
      ? minpath.dirname(this.path)
      : undefined
  }

  /**
   * Set the parent path (example: `'~'`).
   *
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} dirname
   *   Dirname.
   * @returns {undefined}
   *   Nothing.
   */
  set dirname(dirname) {
    assertPath(this.basename, 'dirname');
    this.path = minpath.join(dirname || '', this.basename);
  }

  /**
   * Get the extname (including dot) (example: `'.js'`).
   *
   * @returns {string | undefined}
   *   Extname.
   */
  get extname() {
    return typeof this.path === 'string'
      ? minpath.extname(this.path)
      : undefined
  }

  /**
   * Set the extname (including dot) (example: `'.js'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be set if there’s no `path` yet.
   *
   * @param {string | undefined} extname
   *   Extname.
   * @returns {undefined}
   *   Nothing.
   */
  set extname(extname) {
    assertPart(extname, 'extname');
    assertPath(this.dirname, 'extname');

    if (extname) {
      if (extname.codePointAt(0) !== 46 /* `.` */) {
        throw new Error('`extname` must start with `.`')
      }

      if (extname.includes('.', 1)) {
        throw new Error('`extname` cannot contain multiple dots')
      }
    }

    this.path = minpath.join(this.dirname, this.stem + (extname || ''));
  }

  /**
   * Get the full path (example: `'~/index.min.js'`).
   *
   * @returns {string}
   *   Path.
   */
  get path() {
    return this.history[this.history.length - 1]
  }

  /**
   * Set the full path (example: `'~/index.min.js'`).
   *
   * Cannot be nullified.
   * You can set a file URL (a `URL` object with a `file:` protocol) which will
   * be turned into a path with `url.fileURLToPath`.
   *
   * @param {URL | string} path
   *   Path.
   * @returns {undefined}
   *   Nothing.
   */
  set path(path) {
    if (isUrl(path)) {
      path = fileURLToPath(path);
    }

    assertNonEmpty(path, 'path');

    if (this.path !== path) {
      this.history.push(path);
    }
  }

  /**
   * Get the stem (basename w/o extname) (example: `'index.min'`).
   *
   * @returns {string | undefined}
   *   Stem.
   */
  get stem() {
    return typeof this.path === 'string'
      ? minpath.basename(this.path, this.extname)
      : undefined
  }

  /**
   * Set the stem (basename w/o extname) (example: `'index.min'`).
   *
   * Cannot contain path separators (`'/'` on unix, macOS, and browsers, `'\'`
   * on windows).
   * Cannot be nullified (use `file.path = file.dirname` instead).
   *
   * @param {string} stem
   *   Stem.
   * @returns {undefined}
   *   Nothing.
   */
  set stem(stem) {
    assertNonEmpty(stem, 'stem');
    assertPart(stem, 'stem');
    this.path = minpath.join(this.dirname || '', stem + (this.extname || ''));
  }

  // Normal prototypal methods.
  /**
   * Create a fatal message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `true` (error; file not usable)
   * and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {never}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {never}
   *   Never.
   * @throws {VFileMessage}
   *   Message.
   */
  fail(causeOrReason, optionsOrParentOrPlace, origin) {
    // @ts-expect-error: the overloads are fine.
    const message = this.message(causeOrReason, optionsOrParentOrPlace, origin);

    message.fatal = true;

    throw message
  }

  /**
   * Create an info message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `undefined` (info; change
   * likely not needed) and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {VFileMessage}
   *   Message.
   */
  info(causeOrReason, optionsOrParentOrPlace, origin) {
    // @ts-expect-error: the overloads are fine.
    const message = this.message(causeOrReason, optionsOrParentOrPlace, origin);

    message.fatal = undefined;

    return message
  }

  /**
   * Create a message for `reason` associated with the file.
   *
   * The `fatal` field of the message is set to `false` (warning; change may be
   * needed) and the `file` field is set to the current file path.
   * The message is added to the `messages` field on `file`.
   *
   * > 🪦 **Note**: also has obsolete signatures.
   *
   * @overload
   * @param {string} reason
   * @param {MessageOptions | null | undefined} [options]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {string} reason
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Node | NodeLike | null | undefined} parent
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {Point | Position | null | undefined} place
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @overload
   * @param {Error | VFileMessage} cause
   * @param {string | null | undefined} [origin]
   * @returns {VFileMessage}
   *
   * @param {Error | VFileMessage | string} causeOrReason
   *   Reason for message, should use markdown.
   * @param {Node | NodeLike | MessageOptions | Point | Position | string | null | undefined} [optionsOrParentOrPlace]
   *   Configuration (optional).
   * @param {string | null | undefined} [origin]
   *   Place in code where the message originates (example:
   *   `'my-package:my-rule'` or `'my-rule'`).
   * @returns {VFileMessage}
   *   Message.
   */
  message(causeOrReason, optionsOrParentOrPlace, origin) {
    const message = new VFileMessage(
      // @ts-expect-error: the overloads are fine.
      causeOrReason,
      optionsOrParentOrPlace,
      origin
    );

    if (this.path) {
      message.name = this.path + ':' + message.name;
      message.file = this.path;
    }

    message.fatal = false;

    this.messages.push(message);

    return message
  }

  /**
   * Serialize the file.
   *
   * > **Note**: which encodings are supported depends on the engine.
   * > For info on Node.js, see:
   * > <https://nodejs.org/api/util.html#whatwg-supported-encodings>.
   *
   * @param {string | null | undefined} [encoding='utf8']
   *   Character encoding to understand `value` as when it’s a `Uint8Array`
   *   (default: `'utf-8'`).
   * @returns {string}
   *   Serialized file.
   */
  toString(encoding) {
    if (this.value === undefined) {
      return ''
    }

    if (typeof this.value === 'string') {
      return this.value
    }

    const decoder = new TextDecoder(encoding || undefined);
    return decoder.decode(this.value)
  }
}

/**
 * Assert that `part` is not a path (as in, does not contain `path.sep`).
 *
 * @param {string | null | undefined} part
 *   File path part.
 * @param {string} name
 *   Part name.
 * @returns {undefined}
 *   Nothing.
 */
function assertPart(part, name) {
  if (part && part.includes(minpath.sep)) {
    throw new Error(
      '`' + name + '` cannot be a path: did not expect `' + minpath.sep + '`'
    )
  }
}

/**
 * Assert that `part` is not empty.
 *
 * @param {string | undefined} part
 *   Thing.
 * @param {string} name
 *   Part name.
 * @returns {asserts part is string}
 *   Nothing.
 */
function assertNonEmpty(part, name) {
  if (!part) {
    throw new Error('`' + name + '` cannot be empty')
  }
}

/**
 * Assert `path` exists.
 *
 * @param {string | undefined} path
 *   Path.
 * @param {string} name
 *   Dependency name.
 * @returns {asserts path is string}
 *   Nothing.
 */
function assertPath(path, name) {
  if (!path) {
    throw new Error('Setting `' + name + '` requires `path` to be set too')
  }
}

/**
 * Assert `value` is an `Uint8Array`.
 *
 * @param {unknown} value
 *   thing.
 * @returns {value is Uint8Array}
 *   Whether `value` is an `Uint8Array`.
 */
function isUint8Array$1(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'byteLength' in value &&
      'byteOffset' in value
  )
}

const CallableInstance =
  /**
   * @type {new <Parameters extends Array<unknown>, Result>(property: string | symbol) => (...parameters: Parameters) => Result}
   */
  (
    /** @type {unknown} */
    (
      /**
       * @this {Function}
       * @param {string | symbol} property
       * @returns {(...parameters: Array<unknown>) => unknown}
       */
      function (property) {
        const self = this;
        const constr = self.constructor;
        const proto = /** @type {Record<string | symbol, Function>} */ (
          // Prototypes do exist.
          // type-coverage:ignore-next-line
          constr.prototype
        );
        const value = proto[property];
        /** @type {(...parameters: Array<unknown>) => unknown} */
        const apply = function () {
          return value.apply(apply, arguments)
        };

        Object.setPrototypeOf(apply, proto);

        // Not needed for us in `unified`: we only call this on the `copy`
        // function,
        // and we don't need to add its fields (`length`, `name`)
        // over.
        // See also: GH-246.
        // const names = Object.getOwnPropertyNames(value)
        //
        // for (const p of names) {
        //   const descriptor = Object.getOwnPropertyDescriptor(value, p)
        //   if (descriptor) Object.defineProperty(apply, p, descriptor)
        // }

        return apply
      }
    )
  );

/**
 * @typedef {import('trough').Pipeline} Pipeline
 *
 * @typedef {import('unist').Node} Node
 *
 * @typedef {import('vfile').Compatible} Compatible
 * @typedef {import('vfile').Value} Value
 *
 * @typedef {import('../index.js').CompileResultMap} CompileResultMap
 * @typedef {import('../index.js').Data} Data
 * @typedef {import('../index.js').Settings} Settings
 */


// To do: next major: drop `Compiler`, `Parser`: prefer lowercase.

// To do: we could start yielding `never` in TS when a parser is missing and
// `parse` is called.
// Currently, we allow directly setting `processor.parser`, which is untyped.

const own = {}.hasOwnProperty;

/**
 * @template {Node | undefined} [ParseTree=undefined]
 *   Output of `parse` (optional).
 * @template {Node | undefined} [HeadTree=undefined]
 *   Input for `run` (optional).
 * @template {Node | undefined} [TailTree=undefined]
 *   Output for `run` (optional).
 * @template {Node | undefined} [CompileTree=undefined]
 *   Input of `stringify` (optional).
 * @template {CompileResults | undefined} [CompileResult=undefined]
 *   Output of `stringify` (optional).
 * @extends {CallableInstance<[], Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>>}
 */
class Processor extends CallableInstance {
  /**
   * Create a processor.
   */
  constructor() {
    // If `Processor()` is called (w/o new), `copy` is called instead.
    super('copy');

    /**
     * Compiler to use (deprecated).
     *
     * @deprecated
     *   Use `compiler` instead.
     * @type {(
     *   Compiler<
     *     CompileTree extends undefined ? Node : CompileTree,
     *     CompileResult extends undefined ? CompileResults : CompileResult
     *   > |
     *   undefined
     * )}
     */
    this.Compiler = undefined;

    /**
     * Parser to use (deprecated).
     *
     * @deprecated
     *   Use `parser` instead.
     * @type {(
     *   Parser<ParseTree extends undefined ? Node : ParseTree> |
     *   undefined
     * )}
     */
    this.Parser = undefined;

    // Note: the following fields are considered private.
    // However, they are needed for tests, and TSC generates an untyped
    // `private freezeIndex` field for, which trips `type-coverage` up.
    // Instead, we use `@deprecated` to visualize that they shouldn’t be used.
    /**
     * Internal list of configured plugins.
     *
     * @deprecated
     *   This is a private internal property and should not be used.
     * @type {Array<PluginTuple<Array<unknown>>>}
     */
    this.attachers = [];

    /**
     * Compiler to use.
     *
     * @type {(
     *   Compiler<
     *     CompileTree extends undefined ? Node : CompileTree,
     *     CompileResult extends undefined ? CompileResults : CompileResult
     *   > |
     *   undefined
     * )}
     */
    this.compiler = undefined;

    /**
     * Internal state to track where we are while freezing.
     *
     * @deprecated
     *   This is a private internal property and should not be used.
     * @type {number}
     */
    this.freezeIndex = -1;

    /**
     * Internal state to track whether we’re frozen.
     *
     * @deprecated
     *   This is a private internal property and should not be used.
     * @type {boolean | undefined}
     */
    this.frozen = undefined;

    /**
     * Internal state.
     *
     * @deprecated
     *   This is a private internal property and should not be used.
     * @type {Data}
     */
    this.namespace = {};

    /**
     * Parser to use.
     *
     * @type {(
     *   Parser<ParseTree extends undefined ? Node : ParseTree> |
     *   undefined
     * )}
     */
    this.parser = undefined;

    /**
     * Internal list of configured transformers.
     *
     * @deprecated
     *   This is a private internal property and should not be used.
     * @type {Pipeline}
     */
    this.transformers = trough();
  }

  /**
   * Copy a processor.
   *
   * @deprecated
   *   This is a private internal method and should not be used.
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   New *unfrozen* processor ({@linkcode Processor}) that is
   *   configured to work the same as its ancestor.
   *   When the descendant processor is configured in the future it does not
   *   affect the ancestral processor.
   */
  copy() {
    // Cast as the type parameters will be the same after attaching.
    const destination =
      /** @type {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>} */ (
        new Processor()
      );
    let index = -1;

    while (++index < this.attachers.length) {
      const attacher = this.attachers[index];
      destination.use(...attacher);
    }

    destination.data(extend(true, {}, this.namespace));

    return destination
  }

  /**
   * Configure the processor with info available to all plugins.
   * Information is stored in an object.
   *
   * Typically, options can be given to a specific plugin, but sometimes it
   * makes sense to have information shared with several plugins.
   * For example, a list of HTML elements that are self-closing, which is
   * needed during all phases.
   *
   * > **Note**: setting information cannot occur on *frozen* processors.
   * > Call the processor first to create a new unfrozen processor.
   *
   * > **Note**: to register custom data in TypeScript, augment the
   * > {@linkcode Data} interface.
   *
   * @example
   *   This example show how to get and set info:
   *
   *   ```js
   *   import {unified} from 'unified'
   *
   *   const processor = unified().data('alpha', 'bravo')
   *
   *   processor.data('alpha') // => 'bravo'
   *
   *   processor.data() // => {alpha: 'bravo'}
   *
   *   processor.data({charlie: 'delta'})
   *
   *   processor.data() // => {charlie: 'delta'}
   *   ```
   *
   * @template {keyof Data} Key
   *
   * @overload
   * @returns {Data}
   *
   * @overload
   * @param {Data} dataset
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {Key} key
   * @returns {Data[Key]}
   *
   * @overload
   * @param {Key} key
   * @param {Data[Key]} value
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @param {Data | Key} [key]
   *   Key to get or set, or entire dataset to set, or nothing to get the
   *   entire dataset (optional).
   * @param {Data[Key]} [value]
   *   Value to set (optional).
   * @returns {unknown}
   *   The current processor when setting, the value at `key` when getting, or
   *   the entire dataset when getting without key.
   */
  data(key, value) {
    if (typeof key === 'string') {
      // Set `key`.
      if (arguments.length === 2) {
        assertUnfrozen('data', this.frozen);
        this.namespace[key] = value;
        return this
      }

      // Get `key`.
      return (own.call(this.namespace, key) && this.namespace[key]) || undefined
    }

    // Set space.
    if (key) {
      assertUnfrozen('data', this.frozen);
      this.namespace = key;
      return this
    }

    // Get space.
    return this.namespace
  }

  /**
   * Freeze a processor.
   *
   * Frozen processors are meant to be extended and not to be configured
   * directly.
   *
   * When a processor is frozen it cannot be unfrozen.
   * New processors working the same way can be created by calling the
   * processor.
   *
   * It’s possible to freeze processors explicitly by calling `.freeze()`.
   * Processors freeze automatically when `.parse()`, `.run()`, `.runSync()`,
   * `.stringify()`, `.process()`, or `.processSync()` are called.
   *
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   The current processor.
   */
  freeze() {
    if (this.frozen) {
      return this
    }

    // Cast so that we can type plugins easier.
    // Plugins are supposed to be usable on different processors, not just on
    // this exact processor.
    const self = /** @type {Processor} */ (/** @type {unknown} */ (this));

    while (++this.freezeIndex < this.attachers.length) {
      const [attacher, ...options] = this.attachers[this.freezeIndex];

      if (options[0] === false) {
        continue
      }

      if (options[0] === true) {
        options[0] = undefined;
      }

      const transformer = attacher.call(self, ...options);

      if (typeof transformer === 'function') {
        this.transformers.use(transformer);
      }
    }

    this.frozen = true;
    this.freezeIndex = Number.POSITIVE_INFINITY;

    return this
  }

  /**
   * Parse text to a syntax tree.
   *
   * > **Note**: `parse` freezes the processor if not already *frozen*.
   *
   * > **Note**: `parse` performs the parse phase, not the run phase or other
   * > phases.
   *
   * @param {Compatible | undefined} [file]
   *   file to parse (optional); typically `string` or `VFile`; any value
   *   accepted as `x` in `new VFile(x)`.
   * @returns {ParseTree extends undefined ? Node : ParseTree}
   *   Syntax tree representing `file`.
   */
  parse(file) {
    this.freeze();
    const realFile = vfile(file);
    const parser = this.parser || this.Parser;
    assertParser('parse', parser);
    return parser(String(realFile), realFile)
  }

  /**
   * Process the given file as configured on the processor.
   *
   * > **Note**: `process` freezes the processor if not already *frozen*.
   *
   * > **Note**: `process` performs the parse, run, and stringify phases.
   *
   * @overload
   * @param {Compatible | undefined} file
   * @param {ProcessCallback<VFileWithOutput<CompileResult>>} done
   * @returns {undefined}
   *
   * @overload
   * @param {Compatible | undefined} [file]
   * @returns {Promise<VFileWithOutput<CompileResult>>}
   *
   * @param {Compatible | undefined} [file]
   *   File (optional); typically `string` or `VFile`]; any value accepted as
   *   `x` in `new VFile(x)`.
   * @param {ProcessCallback<VFileWithOutput<CompileResult>> | undefined} [done]
   *   Callback (optional).
   * @returns {Promise<VFile> | undefined}
   *   Nothing if `done` is given.
   *   Otherwise a promise, rejected with a fatal error or resolved with the
   *   processed file.
   *
   *   The parsed, transformed, and compiled value is available at
   *   `file.value` (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most
   *   > compilers return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  process(file, done) {
    const self = this;

    this.freeze();
    assertParser('process', this.parser || this.Parser);
    assertCompiler('process', this.compiler || this.Compiler);

    return done ? executor(undefined, done) : new Promise(executor)

    // Note: `void`s needed for TS.
    /**
     * @param {((file: VFileWithOutput<CompileResult>) => undefined | void) | undefined} resolve
     * @param {(error: Error | undefined) => undefined | void} reject
     * @returns {undefined}
     */
    function executor(resolve, reject) {
      const realFile = vfile(file);
      // Assume `ParseTree` (the result of the parser) matches `HeadTree` (the
      // input of the first transform).
      const parseTree =
        /** @type {HeadTree extends undefined ? Node : HeadTree} */ (
          /** @type {unknown} */ (self.parse(realFile))
        );

      self.run(parseTree, realFile, function (error, tree, file) {
        if (error || !tree || !file) {
          return realDone(error)
        }

        // Assume `TailTree` (the output of the last transform) matches
        // `CompileTree` (the input of the compiler).
        const compileTree =
          /** @type {CompileTree extends undefined ? Node : CompileTree} */ (
            /** @type {unknown} */ (tree)
          );

        const compileResult = self.stringify(compileTree, file);

        if (looksLikeAValue(compileResult)) {
          file.value = compileResult;
        } else {
          file.result = compileResult;
        }

        realDone(error, /** @type {VFileWithOutput<CompileResult>} */ (file));
      });

      /**
       * @param {Error | undefined} error
       * @param {VFileWithOutput<CompileResult> | undefined} [file]
       * @returns {undefined}
       */
      function realDone(error, file) {
        if (error || !file) {
          reject(error);
        } else if (resolve) {
          resolve(file);
        } else {
          done(undefined, file);
        }
      }
    }
  }

  /**
   * Process the given file as configured on the processor.
   *
   * An error is thrown if asynchronous transforms are configured.
   *
   * > **Note**: `processSync` freezes the processor if not already *frozen*.
   *
   * > **Note**: `processSync` performs the parse, run, and stringify phases.
   *
   * @param {Compatible | undefined} [file]
   *   File (optional); typically `string` or `VFile`; any value accepted as
   *   `x` in `new VFile(x)`.
   * @returns {VFileWithOutput<CompileResult>}
   *   The processed file.
   *
   *   The parsed, transformed, and compiled value is available at
   *   `file.value` (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most
   *   > compilers return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  processSync(file) {
    /** @type {boolean} */
    let complete = false;
    /** @type {VFileWithOutput<CompileResult> | undefined} */
    let result;

    this.freeze();
    assertParser('processSync', this.parser || this.Parser);
    assertCompiler('processSync', this.compiler || this.Compiler);

    this.process(file, realDone);
    assertDone('processSync', 'process', complete);

    return result

    /**
     * @type {ProcessCallback<VFileWithOutput<CompileResult>>}
     */
    function realDone(error, file) {
      complete = true;
      bail(error);
      result = file;
    }
  }

  /**
   * Run *transformers* on a syntax tree.
   *
   * > **Note**: `run` freezes the processor if not already *frozen*.
   *
   * > **Note**: `run` performs the run phase, not other phases.
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} done
   * @returns {undefined}
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {Compatible | undefined} file
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} done
   * @returns {undefined}
   *
   * @overload
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   * @param {Compatible | undefined} [file]
   * @returns {Promise<TailTree extends undefined ? Node : TailTree>}
   *
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   *   Tree to transform and inspect.
   * @param {(
   *   RunCallback<TailTree extends undefined ? Node : TailTree> |
   *   Compatible
   * )} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @param {RunCallback<TailTree extends undefined ? Node : TailTree>} [done]
   *   Callback (optional).
   * @returns {Promise<TailTree extends undefined ? Node : TailTree> | undefined}
   *   Nothing if `done` is given.
   *   Otherwise, a promise rejected with a fatal error or resolved with the
   *   transformed tree.
   */
  run(tree, file, done) {
    assertNode(tree);
    this.freeze();

    const transformers = this.transformers;

    if (!done && typeof file === 'function') {
      done = file;
      file = undefined;
    }

    return done ? executor(undefined, done) : new Promise(executor)

    // Note: `void`s needed for TS.
    /**
     * @param {(
     *   ((tree: TailTree extends undefined ? Node : TailTree) => undefined | void) |
     *   undefined
     * )} resolve
     * @param {(error: Error) => undefined | void} reject
     * @returns {undefined}
     */
    function executor(resolve, reject) {
      const realFile = vfile(file);
      transformers.run(tree, realFile, realDone);

      /**
       * @param {Error | undefined} error
       * @param {Node} outputTree
       * @param {VFile} file
       * @returns {undefined}
       */
      function realDone(error, outputTree, file) {
        const resultingTree =
          /** @type {TailTree extends undefined ? Node : TailTree} */ (
            outputTree || tree
          );

        if (error) {
          reject(error);
        } else if (resolve) {
          resolve(resultingTree);
        } else {
          done(undefined, resultingTree, file);
        }
      }
    }
  }

  /**
   * Run *transformers* on a syntax tree.
   *
   * An error is thrown if asynchronous transforms are configured.
   *
   * > **Note**: `runSync` freezes the processor if not already *frozen*.
   *
   * > **Note**: `runSync` performs the run phase, not other phases.
   *
   * @param {HeadTree extends undefined ? Node : HeadTree} tree
   *   Tree to transform and inspect.
   * @param {Compatible | undefined} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @returns {TailTree extends undefined ? Node : TailTree}
   *   Transformed tree.
   */
  runSync(tree, file) {
    /** @type {boolean} */
    let complete = false;
    /** @type {(TailTree extends undefined ? Node : TailTree) | undefined} */
    let result;

    this.run(tree, file, realDone);

    assertDone('runSync', 'run', complete);
    return result

    /**
     * @type {RunCallback<TailTree extends undefined ? Node : TailTree>}
     */
    function realDone(error, tree) {
      bail(error);
      result = tree;
      complete = true;
    }
  }

  /**
   * Compile a syntax tree.
   *
   * > **Note**: `stringify` freezes the processor if not already *frozen*.
   *
   * > **Note**: `stringify` performs the stringify phase, not the run phase
   * > or other phases.
   *
   * @param {CompileTree extends undefined ? Node : CompileTree} tree
   *   Tree to compile.
   * @param {Compatible | undefined} [file]
   *   File associated with `node` (optional); any value accepted as `x` in
   *   `new VFile(x)`.
   * @returns {CompileResult extends undefined ? Value : CompileResult}
   *   Textual representation of the tree (see note).
   *
   *   > **Note**: unified typically compiles by serializing: most compilers
   *   > return `string` (or `Uint8Array`).
   *   > Some compilers, such as the one configured with
   *   > [`rehype-react`][rehype-react], return other values (in this case, a
   *   > React tree).
   *   > If you’re using a compiler that doesn’t serialize, expect different
   *   > result values.
   *   >
   *   > To register custom results in TypeScript, add them to
   *   > {@linkcode CompileResultMap}.
   *
   *   [rehype-react]: https://github.com/rehypejs/rehype-react
   */
  stringify(tree, file) {
    this.freeze();
    const realFile = vfile(file);
    const compiler = this.compiler || this.Compiler;
    assertCompiler('stringify', compiler);
    assertNode(tree);

    return compiler(tree, realFile)
  }

  /**
   * Configure the processor to use a plugin, a list of usable values, or a
   * preset.
   *
   * If the processor is already using a plugin, the previous plugin
   * configuration is changed based on the options that are passed in.
   * In other words, the plugin is not added a second time.
   *
   * > **Note**: `use` cannot be called on *frozen* processors.
   * > Call the processor first to create a new unfrozen processor.
   *
   * @example
   *   There are many ways to pass plugins to `.use()`.
   *   This example gives an overview:
   *
   *   ```js
   *   import {unified} from 'unified'
   *
   *   unified()
   *     // Plugin with options:
   *     .use(pluginA, {x: true, y: true})
   *     // Passing the same plugin again merges configuration (to `{x: true, y: false, z: true}`):
   *     .use(pluginA, {y: false, z: true})
   *     // Plugins:
   *     .use([pluginB, pluginC])
   *     // Two plugins, the second with options:
   *     .use([pluginD, [pluginE, {}]])
   *     // Preset with plugins and settings:
   *     .use({plugins: [pluginF, [pluginG, {}]], settings: {position: false}})
   *     // Settings only:
   *     .use({settings: {position: false}})
   *   ```
   *
   * @template {Array<unknown>} [Parameters=[]]
   * @template {Node | string | undefined} [Input=undefined]
   * @template [Output=Input]
   *
   * @overload
   * @param {Preset | null | undefined} [preset]
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {PluggableList} list
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *
   * @overload
   * @param {Plugin<Parameters, Input, Output>} plugin
   * @param {...(Parameters | [boolean])} parameters
   * @returns {UsePlugin<ParseTree, HeadTree, TailTree, CompileTree, CompileResult, Input, Output>}
   *
   * @param {PluggableList | Plugin | Preset | null | undefined} value
   *   Usable value.
   * @param {...unknown} parameters
   *   Parameters, when a plugin is given as a usable value.
   * @returns {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>}
   *   Current processor.
   */
  use(value, ...parameters) {
    const attachers = this.attachers;
    const namespace = this.namespace;

    assertUnfrozen('use', this.frozen);

    if (value === null || value === undefined) ; else if (typeof value === 'function') {
      addPlugin(value, parameters);
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        addList(value);
      } else {
        addPreset(value);
      }
    } else {
      throw new TypeError('Expected usable value, not `' + value + '`')
    }

    return this

    /**
     * @param {Pluggable} value
     * @returns {undefined}
     */
    function add(value) {
      if (typeof value === 'function') {
        addPlugin(value, []);
      } else if (typeof value === 'object') {
        if (Array.isArray(value)) {
          const [plugin, ...parameters] =
            /** @type {PluginTuple<Array<unknown>>} */ (value);
          addPlugin(plugin, parameters);
        } else {
          addPreset(value);
        }
      } else {
        throw new TypeError('Expected usable value, not `' + value + '`')
      }
    }

    /**
     * @param {Preset} result
     * @returns {undefined}
     */
    function addPreset(result) {
      if (!('plugins' in result) && !('settings' in result)) {
        throw new Error(
          'Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither'
        )
      }

      addList(result.plugins);

      if (result.settings) {
        namespace.settings = extend(true, namespace.settings, result.settings);
      }
    }

    /**
     * @param {PluggableList | null | undefined} plugins
     * @returns {undefined}
     */
    function addList(plugins) {
      let index = -1;

      if (plugins === null || plugins === undefined) ; else if (Array.isArray(plugins)) {
        while (++index < plugins.length) {
          const thing = plugins[index];
          add(thing);
        }
      } else {
        throw new TypeError('Expected a list of plugins, not `' + plugins + '`')
      }
    }

    /**
     * @param {Plugin} plugin
     * @param {Array<unknown>} parameters
     * @returns {undefined}
     */
    function addPlugin(plugin, parameters) {
      let index = -1;
      let entryIndex = -1;

      while (++index < attachers.length) {
        if (attachers[index][0] === plugin) {
          entryIndex = index;
          break
        }
      }

      if (entryIndex === -1) {
        attachers.push([plugin, ...parameters]);
      }
      // Only set if there was at least a `primary` value, otherwise we’d change
      // `arguments.length`.
      else if (parameters.length > 0) {
        let [primary, ...rest] = parameters;
        const currentPrimary = attachers[entryIndex][1];
        if (isPlainObject(currentPrimary) && isPlainObject(primary)) {
          primary = extend(true, currentPrimary, primary);
        }

        attachers[entryIndex] = [plugin, primary, ...rest];
      }
    }
  }
}

// Note: this returns a *callable* instance.
// That’s why it’s documented as a function.
/**
 * Create a new processor.
 *
 * @example
 *   This example shows how a new processor can be created (from `remark`) and linked
 *   to **stdin**(4) and **stdout**(4).
 *
 *   ```js
 *   import process from 'node:process'
 *   import concatStream from 'concat-stream'
 *   import {remark} from 'remark'
 *
 *   process.stdin.pipe(
 *     concatStream(function (buf) {
 *       process.stdout.write(String(remark().processSync(buf)))
 *     })
 *   )
 *   ```
 *
 * @returns
 *   New *unfrozen* processor (`processor`).
 *
 *   This processor is configured to work the same as its ancestor.
 *   When the descendant processor is configured in the future it does not
 *   affect the ancestral processor.
 */
const unified = new Processor().freeze();

/**
 * Assert a parser is available.
 *
 * @param {string} name
 * @param {unknown} value
 * @returns {asserts value is Parser}
 */
function assertParser(name, value) {
  if (typeof value !== 'function') {
    throw new TypeError('Cannot `' + name + '` without `parser`')
  }
}

/**
 * Assert a compiler is available.
 *
 * @param {string} name
 * @param {unknown} value
 * @returns {asserts value is Compiler}
 */
function assertCompiler(name, value) {
  if (typeof value !== 'function') {
    throw new TypeError('Cannot `' + name + '` without `compiler`')
  }
}

/**
 * Assert the processor is not frozen.
 *
 * @param {string} name
 * @param {unknown} frozen
 * @returns {asserts frozen is false}
 */
function assertUnfrozen(name, frozen) {
  if (frozen) {
    throw new Error(
      'Cannot call `' +
        name +
        '` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.'
    )
  }
}

/**
 * Assert `node` is a unist node.
 *
 * @param {unknown} node
 * @returns {asserts node is Node}
 */
function assertNode(node) {
  // `isPlainObj` unfortunately uses `any` instead of `unknown`.
  // type-coverage:ignore-next-line
  if (!isPlainObject(node) || typeof node.type !== 'string') {
    throw new TypeError('Expected node, got `' + node + '`')
    // Fine.
  }
}

/**
 * Assert that `complete` is `true`.
 *
 * @param {string} name
 * @param {string} asyncName
 * @param {unknown} complete
 * @returns {asserts complete is true}
 */
function assertDone(name, asyncName, complete) {
  if (!complete) {
    throw new Error(
      '`' + name + '` finished async. Use `' + asyncName + '` instead'
    )
  }
}

/**
 * @param {Compatible | undefined} [value]
 * @returns {VFile}
 */
function vfile(value) {
  return looksLikeAVFile(value) ? value : new VFile(value)
}

/**
 * @param {Compatible | undefined} [value]
 * @returns {value is VFile}
 */
function looksLikeAVFile(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'message' in value &&
      'messages' in value
  )
}

/**
 * @param {unknown} [value]
 * @returns {value is Value}
 */
function looksLikeAValue(value) {
  return typeof value === 'string' || isUint8Array(value)
}

/**
 * Assert `value` is an `Uint8Array`.
 *
 * @param {unknown} value
 *   thing.
 * @returns {value is Uint8Array}
 *   Whether `value` is an `Uint8Array`.
 */
function isUint8Array(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      'byteLength' in value &&
      'byteOffset' in value
  )
}

const markdownTextProcessing = (rawText) => {
    return unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeClassNames, {
        a: "spectrum-Link spectrum-Link--quiet spectrum-Link--primary",
        p: "spectrum-Body spectrum-Body--serif spectrum-Body--sizeM",
    })
        .use(rehypeStringify)
        .processSync(rawText)
        .toString();
};

const DEBUG$1 = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG$1) {
    console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
class BookmarksList {
    constructor() {
        this.#category_accessor_storage = "";
        this._bookmarks = new Array();
        this.listBookMarks = () => {
            return this._bookmarks
                .map((b) => {
                return `
        <dt class="spectrum-Heading spectrum-Heading--sizeM">
          ${b.title.link
                    ? `<a
                  href="${b.title.link}"
                  class=" spectrum-Link spectrum-Link--quiet spectrum-Link--primary "
                  ><cite >${b.title.name}</cite></a>`
                    : `<span><cite>${b.title.name}</cite></span>`}
        </dt>
        <dd>
          <span class=" spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong ">Author: </span> <span class="spectrum-Body spectrum-Body--serif spectrum-Body--sizeXS">
          ${b.author.link
                    ? `<a
                  href="${b.author.link}"
                  class=" spectrum-Link spectrum-Link--quiet spectrum-Link--primary "
                  >${b.author.name}</a>`
                    : `<span>${b.author.name}</span>`}
          </span>
        </dd>
        <dd>
          <span class="spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong ">Date(s): </span><br/>
            <ul class="dateList">
            ${b.dates.series_start
                    ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Series Started:</span>
                    <span class="spectrum-Detail--light">${b.dates.series_start}</span>
                  </li>
                `
                    : ""}
            ${b.dates.published
                    ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Published:</span>
                    <span class="spectrum-Detail--light">${b.dates.published}</span>
                  </li>
                `
                    : ``}
            ${b.dates.updated
                    ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Updated:</span>
                    <span class="spectrum-Detail--light">${b.dates.updated}</span>
                  </li>
                `
                    : ""}
            ${b.dates.completed
                    ? `
                  <li class="spectrum-Detail spectrum-Detail--sizeM">
                    <span class="spectrum-Detail-strong ">Completed:</span>
                    <span class="spectrum-Detail--light">${b.dates.completed}</span>
                  </li>
                `
                    : b.dates.completed == undefined
                        ? ""
                        : `<span class="spectrum-Detail spectrum-Detail--sizeM  spectrum-Detail-strong spectrum-Detail-emphasized ">Incomplete.</span>`}
            </ul>
        </dd>
        <dd>
          <span class=" spectrum-Detail spectrum-Detail--sizeM spectrum-Detail-strong">Comments: </span> ${markdownTextProcessing(b.comments)}
        </dd>
      `;
            })
                .join("\n");
        };
        this.computeBasePath = (depth) => {
            let bp = "";
            if (depth < 0) {
                throw new Error(`depth must be a positive integer, not ${depth}`);
            }
            if (depth == 1) {
                bp = "./";
                return bp;
            }
            else {
                while (depth) {
                    bp = bp.concat("../");
                    depth--;
                }
            }
            return bp;
        };
        this.ParseBookmarks = async () => {
            const basePath = process.env.__GWD_COMMAND__ == "serve" ? this.computeBasePath(1) : "../";
            const filePath = new URL(minpath.join(basePath, `/assets/Bookmarks/${this.category}.json`), import.meta.url);
            const bookmarkData = await fs
                .readFile(filePath, {
                encoding: "utf-8",
            })
                .catch((error) => {
                console.error(`failed to load file for ${this.category}`, `error is ${JSON.stringify(error)}`);
            });
            if (bookmarkData) {
                if (DEBUG$1) {
                    console.log(`ParseBookmarks read in data from file for '${this.category}`);
                }
                const valid = z.array(Bookmark).safeParse(JSON.parse(bookmarkData));
                if (valid.success) {
                    valid.data.map((b) => {
                        this._bookmarks.push(b);
                    });
                }
                else {
                    if (DEBUG$1) {
                        console.log(`failed to parse bookmark data`, `error is \n`, valid.error.message);
                    }
                }
            }
            else {
                if (DEBUG$1) {
                    console.log(`no data available for '${this.category}`);
                }
            }
        };
    }
    #category_accessor_storage;
    get category() { return this.#category_accessor_storage; }
    set category(value) { this.#category_accessor_storage = value; }
    get bookmarks() {
        return this._bookmarks;
    }
}

const getLayout = (compilation, route) => {
    const page = compilation.graph.find((p) => {
        return !p.route.localeCompare(route);
    });
    return `
  <body>
    <header>
      <h1 class="spectrum-Heading spectrum-Heading--sizeXXL">
        ${page ? (page.title ? page.title : page.label) : ""}
      </h1>
      <link rel="stylesheet" href="/styles/BookmarksList.css" />
    </header>

    <div class="main">
      <div class="content">
        <content-outlet></content-outlet>

      </div>
    </div>
  </body>
  `;
};

const DEBUG = debugFunction(new URL(import.meta.url).pathname);
if (DEBUG) {
    console.log(`DEBUG enabled for ${new URL(import.meta.url).pathname}`);
}
const getBody = async () => {
    const bodyText = `
I have made no secret of the fact that [Ron] is not my most favourite character in the series. These stories highlight what could have been.

[Ron]: /Harrypedia/people/Weasley/Ronald_Bilius/
`;
    const bookmarksList = new BookmarksList();
    bookmarksList.category = "Featuring Ron";
    await bookmarksList.ParseBookmarks().then(() => {
        if (DEBUG) {
            console.log(`after parsing getBody sees ${bookmarksList.bookmarks.length} bookmarks`);
        }
    });
    return markdownTextProcessing(bodyText).concat(`
    <dl>
      ${bookmarksList.listBookMarks()}
    </dl>
    `);
};
const getFrontmatter = () => {
    return {
        title: "Featuring Ron",
        collection: "Bookmarks",
        description: "HP stories in which Ron is key",
        author: "Luke Schierer",
        layout: "standard",
        data: {},
    };
};

export { getBody, getFrontmatter, getLayout };
