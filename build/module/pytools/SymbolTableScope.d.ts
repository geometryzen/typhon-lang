export declare class SymbolTableScope {
    symFlags: {
        [name: string]: number;
    };
    private name;
    private varnames;
    children: any;
    blockType: any;
    private isNested;
    hasFree: boolean;
    childHasFree: boolean;
    generator: any;
    private varargs;
    private varkeywords;
    private returnsValue;
    private lineno;
    private table;
    private symbols;
    private _classMethods;
    private _funcParams;
    private _funcLocals;
    private _funcGlobals;
    private _funcFrees;
    /**
     * @constructor
     * @param {Object} table
     * @param {string} name
     * @param {string} type
     * @param {number} lineno
     */
    constructor(table: any, name: any, type: any, ast: any, lineno: any);
    get_type(): any;
    get_name(): any;
    get_lineno(): any;
    is_nested(): any;
    has_children(): boolean;
    get_identifiers(): string[];
    lookup(name: string): any;
    __check_children(name: string): any[];
    _identsMatching(f: (flags: number) => boolean): string[];
    get_parameters(): string[];
    get_locals(): string[];
    get_globals(): string[];
    get_frees(): string[];
    get_methods(): any;
    getScope(name: string): number;
}
