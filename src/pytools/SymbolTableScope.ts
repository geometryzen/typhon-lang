import { assert } from './asserts';
import { Symbol } from './Symbol';
import { SymbolTable } from './SymbolTable';
import { DEF_PARAM } from './SymbolConstants';
import { DEF_BOUND } from './SymbolConstants';
import { FREE } from './SymbolConstants';
import { FunctionBlock } from './SymbolConstants';
import { GLOBAL_EXPLICIT } from './SymbolConstants';
import { GLOBAL_IMPLICIT } from './SymbolConstants';
import { SCOPE_MASK } from './SymbolConstants';
import { SCOPE_OFF } from './SymbolConstants';

let astScopeCounter = 0;

export type BlockType = 'class' | 'function' | 'module';

export class SymbolTableScope {
    symFlags: { [name: string]: number };
    private name: string;
    varnames: string[];
    children: SymbolTableScope[];
    blockType: BlockType;
    isNested: boolean;
    hasFree: boolean;
    childHasFree: boolean;
    generator: boolean;
    varargs: boolean;
    varkeywords: boolean;
    returnsValue: boolean;
    lineno: number;
    private table: SymbolTable;
    private symbols: { [name: string]: Symbol };
    private _classMethods: string[];
    private _funcParams: string[];
    private _funcLocals: string[];
    private _funcGlobals: string[];
    private _funcFrees: string[];
    /**
     * @param table
     * @param name
     * @param type
     * @param lineno
     */
    constructor(table: SymbolTable, name: string, blockType: BlockType, ast: { scopeId: number }, lineno: number) {
        this.symFlags = {};
        this.name = name;
        this.varnames = [];
        /**
         *
         */
        this.children = [];
        this.blockType = blockType;

        this.isNested = false;
        this.hasFree = false;
        this.childHasFree = false;  // true if child block has free vars including free refs to globals
        this.generator = false;
        this.varargs = false;
        this.varkeywords = false;
        this.returnsValue = false;

        this.lineno = lineno;

        this.table = table;

        if (table.cur && (table.cur.isNested || table.cur.blockType === FunctionBlock))
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
        let sym: Symbol;
        if (!this.symbols.hasOwnProperty(name)) {
            const flags = this.symFlags[name];
            const namespaces = this.__check_children(name);
            sym = this.symbols[name] = new Symbol(name, flags, namespaces);
        }
        else {
            sym = this.symbols[name];
        }
        return sym;
    }

    __check_children(name: string): SymbolTableScope[] {
        // print("  check_children:", name);
        const ret: SymbolTableScope[] = [];
        for (let i = 0; i < this.children.length; ++i) {
            const child = this.children[i];
            if (child.name === name)
                ret.push(child);
        }
        return ret;
    }

    _identsMatching(f: (flags: number) => boolean): string[] {
        const ret: string[] = [];
        for (let k in this.symFlags) {
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

    get_globals(): string[] {
        assert(this.get_type() === 'function', "get_globals only valid for function scopes");
        if (!this._funcGlobals) {
            this._funcGlobals = this._identsMatching(function (x) {
                const masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked === GLOBAL_IMPLICIT || masked === GLOBAL_EXPLICIT;
            });
        }
        return this._funcGlobals;
    }

    get_frees(): string[] {
        assert(this.get_type() === 'function', "get_frees only valid for function scopes");
        if (!this._funcFrees) {
            this._funcFrees = this._identsMatching(function (x) {
                const masked = (x >> SCOPE_OFF) & SCOPE_MASK;
                return masked === FREE;
            });
        }
        return this._funcFrees;
    }

    get_methods(): string[] {
        assert(this.get_type() === 'class', "get_methods only valid for class scopes");
        if (!this._classMethods) {
            // todo; uniq?
            const all: string[] = [];
            for (let i = 0; i < this.children.length; ++i)
                all.push(this.children[i].name);
            all.sort();
            this._classMethods = all;
        }
        return this._classMethods;
    }

    getScope(name: string): number {
        // print("getScope");
        // for (var k in this.symFlags) print(k);
        const v = this.symFlags[name];
        if (v === undefined) return 0;
        return (v >> SCOPE_OFF) & SCOPE_MASK;
    }
}
