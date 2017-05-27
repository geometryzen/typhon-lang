import { Symbol } from './Symbol';
import { SymbolTable } from './SymbolTable';
import { SymbolFlags } from './SymbolConstants';
export declare type BlockType = 'class' | 'function' | 'module';
export declare class SymbolTableScope {
    /**
     * A mapping from the name of a symbol to its flags.
     */
    symFlags: {
        [name: string]: SymbolFlags;
    };
    private name;
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
    private table;
    private symbols;
    private _classMethods;
    private _funcParams;
    private _funcLocals;
    private _funcGlobals;
    private _funcFrees;
    /**
     * @param table
     * @param name
     * @param type
     * @param lineno
     */
    constructor(table: SymbolTable, name: string, blockType: BlockType, ast: {
        scopeId: number;
    }, lineno: number);
    get_type(): BlockType;
    get_name(): string;
    get_lineno(): number;
    is_nested(): boolean;
    has_children(): boolean;
    get_identifiers(): string[];
    lookup(name: string): Symbol;
    __check_children(name: string): SymbolTableScope[];
    _identsMatching(f: (flags: number) => boolean): string[];
    get_parameters(): string[];
    get_locals(): string[];
    get_globals(): string[];
    get_frees(): string[];
    get_methods(): string[];
    getScope(name: string): number;
}
