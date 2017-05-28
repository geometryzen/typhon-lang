import { Symbol } from './Symbol';
import { SymbolTable } from './SymbolTable';
import { SymbolFlags } from './SymbolConstants';
export declare type BlockType = 'class' | 'function' | 'module';
/**
 * A SymbolTableScope is created for nodes in the AST.
 * It is created only when the SymbolTable enters a block.
 */
export declare class SymbolTableScope {
    /**
     * A mapping from the name of a symbol to its flags.
     */
    readonly symFlags: {
        [name: string]: SymbolFlags;
    };
    /**
     * The name of the node defining the scope. e.g.
     * Module:      'top'
     * ClassDef:     The class name.
     * FunctionDef:  The function name.
     * Lambda:       'lambda'
     * GeneratorExp: 'genexpr'
     */
    private readonly name;
    /**
     * A list of (local) variables that exists in the current scope.
     * This is populated by the addDef method in SymbolTable.
     * e.g. Name, FunctionDef, ClassDef, Global?, Lambda, Alias.
     * Note that global variables are maintained in the SymbolTable to which we have access.
     */
    varnames: string[];
    children: SymbolTableScope[];
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
    private table;
    private symbols;
    private _classMethods;
    private _funcParams;
    private _funcLocals;
    private _funcGlobals;
    private _funcFrees;
    /**
     * @param table
     * @param name The name of the node defining the scope.
     * @param blockType
     * @param astNode
     * @param lineno
     */
    constructor(table: SymbolTable, name: string, blockType: BlockType, astNode: {
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
    /**
     * Looks in the bindings for this scope and returns the names of the nodes that match the mask filter.
     */
    private _identsMatching(filter);
    /**
     * Returns the names of parameters (DEF_PARAM) for function scopes.
     */
    get_parameters(): string[];
    /**
     * Returns the names of local variables (DEF_BOUND) for function scopes.
     */
    get_locals(): string[];
    /**
     * Returns the names of global variables for function scopes.
     */
    get_globals(): string[];
    /**
     * Returns the names of free variables for function scopes.
     */
    get_frees(): string[];
    /**
     * Returns the names of methods for class scopes.
     */
    get_methods(): string[];
    /**
     * I think this returns the scopeId of a node with the specified name.
     */
    getScope(name: string): number;
}
