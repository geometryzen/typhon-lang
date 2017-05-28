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
import { SymbolFlags } from './SymbolConstants';

let astScopeCounter = 0;

export type BlockType = 'class' | 'function' | 'module';

/**
 * A SymbolTableScope is created for nodes in the AST.
 * It is created only when the SymbolTable enters a block.
 */
export class SymbolTableScope {
    /**
     * A mapping from the name of a symbol to its flags.
     */
    readonly symFlags: { [name: string]: SymbolFlags } = {};
    /**
     * The name of the node defining the scope. e.g.
     * Module:      'top'
     * ClassDef:     The class name.
     * FunctionDef:  The function name.
     * Lambda:       'lambda'
     * GeneratorExp: 'genexpr'
     */
    private readonly name: string;
    /**
     * A list of (local) variables that exists in the current scope.
     * This is populated by the addDef method in SymbolTable.
     * e.g. Name, FunctionDef, ClassDef, Global?, Lambda, Alias.
     * Note that global variables are maintained in the SymbolTable to which we have access.
     */
    varnames: string[] = [];
    children: SymbolTableScope[] = [];
    readonly blockType: BlockType;
    isNested: boolean;
    hasFree: boolean;
    childHasFree: boolean;
    /**
     * `true`for a GeneratorExp or Yield, `false` otherwise.
     */
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
     * @param name The name of the node defining the scope.
     * @param blockType
     * @param astNode
     * @param lineno
     */
    constructor(table: SymbolTable, name: string, blockType: BlockType, astNode: { scopeId: number }, lineno: number) {
        this.table = table;
        this.name = name;
        this.blockType = blockType;

        astNode.scopeId = astScopeCounter++;
        table.stss[astNode.scopeId] = this;

        this.lineno = lineno;

        if (table.cur && (table.cur.isNested || table.cur.blockType === FunctionBlock)) {
            this.isNested = true;
        }
        else {
            this.isNested = false;
        }

        this.hasFree = false;
        this.childHasFree = false;  // true if child block has free vars including free refs to globals
        this.generator = false;
        this.varargs = false;
        this.varkeywords = false;
        this.returnsValue = false;


        // cache of Symbols for returning to other parts of code
        this.symbols = {};
    }
    get_type(): BlockType { return this.blockType; }
    get_name(): string { return this.name; }
    get_lineno(): number { return this.lineno; }
    is_nested(): boolean { return this.isNested; }
    has_children(): boolean { return this.children.length > 0; }
    get_identifiers(): string[] { return this._identsMatching(function (x) { return true; }); }

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

    /**
     * Looks in the bindings for this scope and returns the names of the nodes that match the mask filter.
     */
    private _identsMatching(filter: (flags: SymbolFlags) => boolean): string[] {
        const ret: string[] = [];
        for (let k in this.symFlags) {
            if (this.symFlags.hasOwnProperty(k)) {
                if (filter(this.symFlags[k]))
                    ret.push(k);
            }
        }
        ret.sort();
        return ret;
    }

    /**
     * Returns the names of parameters (DEF_PARAM) for function scopes.
     */
    get_parameters(): string[] {
        assert(this.get_type() === 'function', "get_parameters only valid for function scopes");
        if (!this._funcParams) {
            this._funcParams = this._identsMatching(function (x) { return !!(x & DEF_PARAM); });
        }
        return this._funcParams;
    }

    /**
     * Returns the names of local variables (DEF_BOUND) for function scopes.
     */
    get_locals(): string[] {
        assert(this.get_type() === 'function', "get_locals only valid for function scopes");
        if (!this._funcLocals) {
            this._funcLocals = this._identsMatching(function (x) { return !!(x & DEF_BOUND); });
        }
        return this._funcLocals;
    }

    /**
     * Returns the names of global variables for function scopes.
     */
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

    /**
     * Returns the names of free variables for function scopes.
     */
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

    /**
     * Returns the names of methods for class scopes.
     */
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

    /**
     * I think this returns the scopeId of a node with the specified name.
     */
    getScope(name: string): number {
        // print("getScope");
        // for (var k in this.symFlags) print(k);
        const v = this.symFlags[name];
        if (v === undefined) return 0;
        return (v >> SCOPE_OFF) & SCOPE_MASK;
    }
}
