import { assert } from './asserts';
import Symbol from './Symbol';
import { DEF_PARAM } from './SymbolConstants';
import { DEF_BOUND } from './SymbolConstants';
import { FREE } from './SymbolConstants';
import { FunctionBlock } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { SCOPE_MASK } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';

let astScopeCounter = 0;

export default class SymbolTableScope {
    symFlags: { [name: string]: number };
    private name;
    private varnames;
    children;
    blockType;
    private isNested;
    hasFree: boolean;
    childHasFree: boolean;
    generator;
    private varargs;
    private varkeywords;
    private returnsValue;
    private lineno;
    private table;
    private symbols;
    private _classMethods;
    private _funcParams: string[];
    private _funcLocals: string[];
    private _funcGlobals: string[];
    private _funcFrees: string[];
    /**
     * @constructor
     * @param {Object} table
     * @param {string} name
     * @param {string} type
     * @param {number} lineno
     */
    constructor(table, name, type, ast, lineno) {
        this.symFlags = {};
        this.name = name;
        this.varnames = [];
        /**
         * @type Array.<SymbolTableScope>
         */
        this.children = [];
        this.blockType = type;

        this.isNested = false;
        this.hasFree = false;
        this.childHasFree = false;  // true if child block has free vars including free refs to globals
        this.generator = false;
        this.varargs = false;
        this.varkeywords = false;
        this.returnsValue = false;

        this.lineno = lineno;

        this.table = table;

        if (table.cur && (table.cur.nested || table.cur.blockType === FunctionBlock))
            this.isNested = true;

        ast.scopeId = astScopeCounter++;
        table.stss[ast.scopeId] = this;

        // cache of Symbols for returning to other parts of code
        this.symbols = {};
    }
    get_type() { return this.blockType; }
    get_name() { return this.name; }
    get_lineno() { return this.lineno; }
    is_nested() { return this.isNested; }
    has_children() { return this.children.length > 0; }
    get_identifiers() { return this._identsMatching(function (x) { return true; }); }

    lookup(name: string) {
        var sym;
        if (!this.symbols.hasOwnProperty(name)) {
            const flags = this.symFlags[name];
            var namespaces = this.__check_children(name);
            sym = this.symbols[name] = new Symbol(name, flags, namespaces);
        }
        else {
            sym = this.symbols[name];
        }
        return sym;
    }

    __check_children(name: string): any[] {
        // print("  check_children:", name);
        var ret = [];
        for (var i = 0; i < this.children.length; ++i) {
            var child = this.children[i];
            if (child.name === name)
                ret.push(child);
        }
        return ret;
    }

    _identsMatching(f: (flags: number) => boolean): string[] {
        const ret: string[] = [];
        for (var k in this.symFlags) {
            if (this.symFlags.hasOwnProperty(k)) {
                if (f(this.symFlags[k]))
                    ret.push(k);
            }
        }
        ret.sort();
        return ret;
    }

    get_parameters() {
        assert(this.get_type() === 'function', "get_parameters only valid for function scopes");
        if (!this._funcParams)
            this._funcParams = this._identsMatching(function (x) { return !!(x & DEF_PARAM); });
        return this._funcParams;
    }

    get_locals() {
        assert(this.get_type() === 'function', "get_locals only valid for function scopes");
        if (!this._funcLocals)
            this._funcLocals = this._identsMatching(function (x) { return !!(x & DEF_BOUND); });
        return this._funcLocals;
    }

    get_globals() {
        assert(this.get_type() === 'function', "get_globals only valid for function scopes");
        if (!this._funcGlobals) {
            this._funcGlobals = this._identsMatching(function (x) {
                const masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked === GLOBAL_IMPLICIT || masked === GLOBAL_EXPLICIT;
            });
        }
        return this._funcGlobals;
    }

    get_frees() {
        assert(this.get_type() === 'function', "get_frees only valid for function scopes");
        if (!this._funcFrees) {
            this._funcFrees = this._identsMatching(function (x) {
                var masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked === FREE;
            });
        }
        return this._funcFrees;
    }

    get_methods() {
        assert(this.get_type() === 'class', "get_methods only valid for class scopes");
        if (!this._classMethods) {
            // todo; uniq?
            var all = [];
            for (var i = 0; i < this.children.length; ++i)
                all.push(this.children[i].name);
            all.sort();
            this._classMethods = all;
        }
        return this._classMethods;
    }

    getScope(name: string): number {
        // print("getScope");
        // for (var k in this.symFlags) print(k);
        var v = this.symFlags[name];
        if (v === undefined) return 0;
        return (v >> SCOPE_OFF) & SCOPE_MASK;
    }
}
