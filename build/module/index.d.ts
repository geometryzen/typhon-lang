/**
 * Symbolic constants for various Python Language tokens.
 */
declare enum Tokens {
    T_ENDMARKER = 0,
    T_NAME = 1,
    T_NUMBER = 2,
    T_STRING = 3,
    T_NEWLINE = 4,
    T_INDENT = 5,
    T_DEDENT = 6,
    T_LPAR = 7,
    T_RPAR = 8,
    T_LSQB = 9,
    T_RSQB = 10,
    T_COLON = 11,
    T_COMMA = 12,
    T_SEMI = 13,
    T_PLUS = 14,
    T_MINUS = 15,
    T_STAR = 16,
    T_SLASH = 17,
    T_VBAR = 18,
    T_AMPER = 19,
    T_LESS = 20,
    T_GREATER = 21,
    T_EQUAL = 22,
    T_DOT = 23,
    T_PERCENT = 24,
    T_BACKQUOTE = 25,
    T_LBRACE = 26,
    T_RBRACE = 27,
    T_EQEQUAL = 28,
    T_NOTEQUAL = 29,
    T_LESSEQUAL = 30,
    T_GREATEREQUAL = 31,
    T_TILDE = 32,
    T_CIRCUMFLEX = 33,
    T_LEFTSHIFT = 34,
    T_RIGHTSHIFT = 35,
    T_DOUBLESTAR = 36,
    T_PLUSEQUAL = 37,
    T_MINEQUAL = 38,
    T_STAREQUAL = 39,
    T_SLASHEQUAL = 40,
    T_PERCENTEQUAL = 41,
    T_AMPEREQUAL = 42,
    T_VBAREQUAL = 43,
    T_CIRCUMFLEXEQUAL = 44,
    T_LEFTSHIFTEQUAL = 45,
    T_RIGHTSHIFTEQUAL = 46,
    T_DOUBLESTAREQUAL = 47,
    T_DOUBLESLASH = 48,
    T_DOUBLESLASHEQUAL = 49,
    T_AT = 50,
    T_ATEQUAL = 51,
    T_OP = 52,
    T_COMMENT = 53,
    T_NL = 54,
    T_RARROW = 55,
    T_AWAIT = 56,
    T_ASYNC = 57,
    T_ERRORTOKEN = 58,
    T_N_TOKENS = 59,
    T_NT_OFFSET = 256
}

declare class Position$1 {
    /**
     * 1-based line number.
     */
    readonly line: number;
    /**
     * 0-based column index.
     */
    readonly column: number;
    /**
     *
     */
    constructor(line: number, column: number);
    toString(): string;
}

declare class Range {
    /**
     * begin is always defined.
     */
    readonly begin: Position$1;
    /**
     * end is always defined.
     */
    readonly end: Position$1;
    /**
     *
     */
    constructor(begin: Position$1, end: Position$1);
    toString(): string;
}

/**
 * The parse tree (not the abstract syntax tree).
 */
interface PyNode {
    /**
     * For terminals, the type is defined in the Tokens enumeration.
     * For non-terminals, the type is defined in the generated ParseTables.
     */
    type: Tokens;
    value: string | null;
    range: Range | null;
    used_names?: {
        [name: string]: boolean;
    };
    children: PyNode[] | null;
}
/**
 * Determines the starting point in the grammar for parsing the source.
 */
declare enum SourceKind {
    /**
     * Suitable for a module.
     */
    File = 0,
    /**
     * Suitable for execution.
     */
    Eval = 1,
    /**
     * Suitable for a REPL.
     */
    Single = 2
}
declare function parse(sourceText: string, sourceKind?: SourceKind): boolean | PyNode;
/**
 * Concrete Syntax Tree
 */
declare function cstDump(parseTree: PyNode): string;

interface Position {
    row: number;
    column: number;
}
declare class ParseError extends SyntaxError {
    constructor(message: string);
    begin?: Position;
    end?: Position;
}

/**
 * A numeric literal used in parsing.
 */
interface INumericLiteral {
    isFloat(): boolean;
    isInt(): boolean;
    isLong(): boolean;
    radix?: number;
    text?: string;
    toString(): string;
    value?: number;
}
interface Visitor {
    annAssign(annassign: AnnAssign): void;
    assign(assign: Assign): void;
    attribute(attribute: Attribute): void;
    binOp(be: BinOp): void;
    callExpression(ce: Call): void;
    classDef(classDef: ClassDef): void;
    compareExpression(ce: Compare): void;
    dict(dict: Dict): void;
    expressionStatement(es: ExpressionStatement): void;
    functionDef(functionDef: FunctionDef): void;
    ifStatement(ifs: IfStatement): void;
    importFrom(importFrom: ImportFrom): void;
    list(list: List): void;
    module(module: Module): void;
    name(name: Name): void;
    num(num: Num): void;
    print(print: Print): void;
    returnStatement(rs: ReturnStatement): void;
    str(str: Str): void;
    forStatement(fs: ForStatement): void;
}
interface Visitable {
    /**
     * Who am I?
     */
    accept(visitor: Visitor): void;
}
/**
 * Binary operators.
 * TODO: Rename to BinaryOperator. Consider using an enum.
 */
declare type Operator = BitOr | BitXor | BitAnd | LShift | RShift | Add | Sub | Mult | Div | FloorDiv | Mod;
interface HasAstName {
}
declare class Load {
}
declare class Param {
}
declare class Add implements HasAstName {
}
declare class Sub implements HasAstName {
}
declare class Mult implements HasAstName {
}
declare class Div implements HasAstName {
}
declare class Mod implements HasAstName {
}
declare class LShift implements HasAstName {
}
declare class RShift implements HasAstName {
}
declare class BitOr implements HasAstName {
}
declare class BitXor implements HasAstName {
}
declare class BitAnd implements HasAstName {
}
declare class FloorDiv implements HasAstName {
}
declare class Eq {
}
declare class NotEq {
}
declare class Lt {
}
declare class LtE {
}
declare class Gt {
}
declare class GtE {
}
declare class Is {
}
declare class IsNot {
}
declare class In {
}
declare class NotIn {
}
declare class RangeAnnotated<T> {
    readonly value: T;
    readonly range: Range;
    constructor(value: T, range: Range);
}
declare abstract class Expression implements Visitable {
    id?: RangeAnnotated<string>;
    constructor();
    accept(visitor: Visitor): void;
}
declare abstract class Statement implements Visitable {
    lineno?: number;
    accept(visitor: Visitor): void;
}
declare class Module implements Visitable {
    body: Statement[];
    scopeId: number;
    constructor(body: Statement[]);
    accept(visitor: Visitor): void;
}
declare type Decorator = Attribute | Call | Name;
declare class FunctionDef extends Statement {
    readonly range?: Range;
    name: RangeAnnotated<string>;
    args: Arguments;
    body: Statement[];
    decorator_list: Decorator[];
    scopeId: number;
    returnType: Expression;
    constructor(name: RangeAnnotated<string>, args: Arguments, body: Statement[], returnType: Expression, decorator_list: Decorator[], range?: Range);
    accept(visitor: Visitor): void;
}
declare class FunctionParamDef {
    name: Name;
    type: Expression;
    constructor(name: Name, type?: Expression);
}
declare class ClassDef extends Statement {
    readonly range?: Range;
    name: RangeAnnotated<string>;
    bases: Expression[];
    body: Statement[];
    decorator_list: Decorator[];
    scopeId: number;
    constructor(name: RangeAnnotated<string>, bases: Expression[], body: Statement[], decorator_list: Decorator[], range?: Range);
    accept(visitor: Visitor): void;
}
declare class ReturnStatement extends Statement {
    readonly range?: Range;
    /**
     * An expression, and probably should be optional.
     */
    value: Expression | Tuple | null;
    constructor(value: Expression | Tuple | null, range?: Range);
    accept(visitor: Visitor): void;
}
declare type Target = Expression | Tuple;
declare class Assign extends Statement {
    readonly range: Range;
    readonly eqRange: Range;
    targets: Target[];
    value: Target;
    type?: Expression;
    constructor(targets: Target[], value: Target, range: Range, eqRange: Range, type?: Expression);
    accept(visitor: Visitor): void;
}
declare class AnnAssign extends Statement {
    readonly range?: Range;
    value: Expression;
    target: Expression;
    constructor(type: Expression, target: Expression, range?: Range);
    accept(visitor: Visitor): void;
}
declare class Print extends Statement {
    readonly range?: Range;
    dest: Expression;
    values: Expression[];
    nl: boolean;
    constructor(dest: Expression, values: Expression[], nl: boolean, range?: Range);
    accept(visitor: Visitor): void;
}
declare class ForStatement extends Statement {
    readonly range?: Range;
    target: Target;
    iter: Expression | Tuple;
    body: Statement[];
    orelse: Statement[];
    constructor(target: Target, iter: Expression | Tuple, body: Statement[], orelse: Statement[], range?: Range);
    accept(visitor: Visitor): void;
}
declare class IfStatement extends Statement {
    readonly range?: Range;
    test: Expression;
    consequent: Statement[];
    alternate: Statement[];
    constructor(test: Expression, consequent: Statement[], alternate: Statement[], range?: Range);
    accept(visitor: Visitor): void;
}
declare class ImportFrom extends Statement {
    readonly range?: Range;
    module: RangeAnnotated<string>;
    names: Alias[];
    level: number;
    constructor(module: RangeAnnotated<string>, names: Alias[], level: number, range?: Range);
    accept(visitor: Visitor): void;
}
declare class ExpressionStatement extends Statement {
    readonly range?: Range;
    value: Expression;
    constructor(value: Expression, range?: Range);
    accept(visitor: Visitor): void;
}
declare class BinOp extends Expression {
    readonly range: Range;
    lhs: Expression;
    op: Operator;
    opRange: Range;
    rhs: Expression;
    constructor(lhs: Expression, ops: {
        op: Operator;
        range: Range;
    }, rhs: Expression, range: Range);
    accept(visitor: Visitor): void;
}
declare class Dict extends Expression {
    readonly range?: Range;
    keys: Expression[];
    values: Expression[];
    constructor(keys: Expression[], values: Expression[], range?: Range);
    accept(visitor: Visitor): void;
}
declare class GeneratorExp extends Expression {
    readonly range?: Range;
    elt: Expression;
    generators: Comprehension[];
    scopeId: number;
    constructor(elt: Expression, generators: Comprehension[], range?: Range);
}
/**
 * TODO: Consider replacing with an enum.
 */
declare type CompareOperator = Eq | NotEq | Gt | GtE | Lt | LtE | Is | IsNot | In | NotIn;
declare class Compare extends Expression {
    readonly range?: Range;
    left: Expression;
    ops: CompareOperator[];
    comparators: Expression[];
    constructor(left: Expression, ops: CompareOperator[], comparators: Expression[], range?: Range);
    accept(visitor: Visitor): void;
}
declare class Call extends Expression {
    func: Expression;
    args: (Expression | GeneratorExp)[];
    keywords: Keyword[];
    starargs: Expression | null;
    kwargs: Expression | null;
    constructor(func: Expression, args: (Expression | GeneratorExp)[], keywords: Keyword[], starargs: Expression | null, kwargs: Expression | null);
    accept(visitor: Visitor): void;
}
declare class Num extends Expression {
    n: RangeAnnotated<INumericLiteral>;
    constructor(n: RangeAnnotated<INumericLiteral>);
    accept(visitor: Visitor): void;
}
declare class Str extends Expression {
    s: RangeAnnotated<string>;
    constructor(s: RangeAnnotated<string>);
    accept(visitor: Visitor): void;
}
declare class Attribute extends Expression {
    readonly range: Range;
    value: Expression;
    attr: RangeAnnotated<string>;
    ctx: Load;
    constructor(value: Expression, attr: RangeAnnotated<string>, ctx: Load, range: Range);
    accept(visitor: Visitor): void;
}
declare class Name extends Expression {
    id: RangeAnnotated<string>;
    ctx: Param;
    constructor(id: RangeAnnotated<string>, ctx: Param);
    accept(visitor: Visitor): void;
}
declare class List extends Expression {
    readonly range?: Range;
    elts: Expression[];
    ctx: Load;
    constructor(elts: Expression[], ctx: Load, range?: Range);
    accept(visitor: Visitor): void;
}
declare class Tuple extends Expression {
    readonly range?: Range;
    elts: Expression[];
    ctx: Load;
    id?: RangeAnnotated<string>;
    constructor(elts: Expression[], ctx: Load, range?: Range);
}
declare class Ellipsis {
    constructor();
}
declare class Slice {
    lower: Expression;
    upper: Expression;
    step: Expression;
    constructor(lower: Expression, upper: Expression, step: Expression);
}
declare class ExtSlice {
    dims: (Name | Ellipsis | Index | Slice)[];
    constructor(dims: (Name | Ellipsis | Index | Slice)[]);
}
declare class Index {
    value: Tuple;
    constructor(value: Tuple);
}
declare class Comprehension {
    readonly range?: Range;
    target: Expression | Tuple;
    iter: Expression;
    ifs: any[];
    constructor(target: Expression | Tuple, iter: Expression, ifs: any[], range?: Range);
}
declare class ExceptHandler {
    readonly range?: Range;
    type: Expression | null;
    name: Expression | null;
    body: Statement[];
    constructor(type: Expression | null, name: Expression | null, body: Statement[], range?: Range);
}
declare class Arguments {
    args: FunctionParamDef[];
    vararg: string;
    kwarg: string;
    defaults: Expression[];
    constructor(args: FunctionParamDef[], vararg: string, kwarg: string, defaults: Expression[]);
}
declare class Keyword {
    arg: RangeAnnotated<string>;
    value: Expression;
    constructor(arg: RangeAnnotated<string>, value: Expression);
}
declare class Alias {
    name: RangeAnnotated<string>;
    asname: string | null;
    constructor(name: RangeAnnotated<string>, asname: string);
    toString(): string;
}

declare function astFromParse(n: PyNode): Statement[];
declare function astDump(node: Expression | Statement): string;

declare const DEF_LOCAL: number;
declare type SymbolFlags = number;
declare type DictionaryKind = 1 | 2 | 3 | 4;

declare class Symbol {
    private __name;
    private __flags;
    private __scope;
    private __namespaces;
    /**
     * @param name
     * @param flags
     * @param namespaces
     */
    constructor(name: string, flags: number, namespaces: SymbolTableScope[]);
    get_name(): string;
    is_referenced(): boolean;
    is_parameter(): boolean;
    is_global(): boolean;
    is_declared_global(): boolean;
    is_local(): boolean;
    is_free(): boolean;
    is_imported(): boolean;
    is_assigned(): boolean;
    is_namespace(): boolean;
    get_namespaces(): SymbolTableScope[];
}

declare type BlockType = 'class' | 'function' | 'module';
/**
 * A SymbolTableScope is created for nodes in the AST.
 * It is created only when the SymbolTable enters a block.
 */
declare class SymbolTableScope {
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
    range: Range;
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
     * @param range
     */
    constructor(table: SymbolTable, name: string, blockType: BlockType, astNode: {
        scopeId: number;
    }, range: Range);
    get_type(): BlockType;
    get_name(): string;
    get_range(): Range;
    is_nested(): boolean;
    has_children(): boolean;
    get_identifiers(): string[];
    lookup(name: string): Symbol;
    __check_children(name: string): SymbolTableScope[];
    /**
     * Looks in the bindings for this scope and returns the names of the nodes that match the mask filter.
     */
    private _identsMatching;
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

/**
 * The symbol table uses the abstract synntax tree (not the parse tree).
 */
declare class SymbolTable {
    cur: SymbolTableScope;
    top: SymbolTableScope;
    stack: SymbolTableScope[];
    global: {
        [name: string]: number;
    };
    curClass: string;
    tmpname: number;
    stss: {
        [scopeId: number]: SymbolTableScope;
    };
    /**
     *
     */
    constructor();
    /**
     * Lookup the SymbolTableScope for a scopeId of the AST.
     */
    getStsForAst(ast: {
        scopeId: number;
    }): SymbolTableScope;
    SEQStmt(nodes: Statement[]): void;
    SEQExpr(nodes: Expression[]): void;
    /**
     * A block represents a scope.
     * The following nodes in the AST define new blocks of the indicated type and name:
     * Module        ModuleBlock   = 'module'    name = 'top'
     * FunctionDef   FunctionBlock = 'function'  name = The name of the function.
     * ClassDef      ClassBlock    = 'class'     name = The name of the class.
     * Lambda        FunctionBlock = 'function'  name = 'lambda'
     * GeneratoeExp  FunctionBlock = 'function'  name = 'genexpr'
     *
     * @param name
     * @param blockType
     * @param astNode The AST node that is defining the block.
     * @param lineno
     */
    enterBlock(name: string, blockType: BlockType, astNode: {
        scopeId: number;
    }, range: Range): void;
    exitBlock(): void;
    visitParams(args: FunctionParamDef[], toplevel: boolean): void;
    visitArguments(a: Arguments, range: Range): void;
    /**
     *
     */
    newTmpname(range: Range): void;
    /**
     * 1. Modifies symbol flags for the current scope.
     * 2.a Adds a variable name for the current scope, OR
     * 2.b Sets the SymbolFlags for a global variable.
     * @param name
     * @param flags
     * @param lineno
     */
    addDef(name: string, flags: SymbolFlags, range: Range): void;
    visitSlice(s: Slice | ExtSlice | Index | Ellipsis): void;
    /**
     *
     */
    visitStmt(s: Statement): void;
    visitExpr(e: Expression): void;
    visitComprehension(lcs: Comprehension[], startAt: number): void;
    /**
     * This is probably not correct for names. What are they?
     * @param names
     * @param range
     */
    visitAlias(names: Alias[], range: Range): void;
    /**
     *
     */
    visitGenexp(e: GeneratorExp): void;
    visitExcepthandlers(handlers: ExceptHandler[]): void;
    /**
     * @param ste The Symbol Table Scope.
     */
    analyzeBlock(ste: SymbolTableScope, bound: {}, free: {}, global: {}): void;
    analyzeChildBlock(entry: SymbolTableScope, bound: {}, free: {}, global: {}, childFree: {}): void;
    analyzeCells(scope: {
        [name: string]: number;
    }, free: {
        [name: string]: any;
    }): void;
    /**
     * store scope info back into the st symbols dict. symbols is modified,
     * others are not.
     */
    updateSymbols(symbols: {
        [name: string]: number;
    }, scope: {
        [name: string]: number;
    }, bound: {}, free: {}, classflag: boolean): void;
    /**
     * @param {Object} ste The Symbol Table Scope.
     * @param {string} name
     */
    analyzeName(ste: SymbolTableScope, dict: {
        [name: string]: DictionaryKind;
    }, name: string, flags: number, bound: {}, local: {}, free: {}, global: {}): void;
    analyze(): void;
}

/**
 * Creates a SymbolTable for the specified Module.
 */
declare function semanticsOfModule(mod: Module): SymbolTable;

export { Add, AnnAssign, Assign, Attribute, BinOp, BitAnd, BitOr, BitXor, Call, ClassDef, Compare, DEF_LOCAL, Dict, Div, Eq, Expression, ExpressionStatement, FloorDiv, ForStatement, FunctionDef, Gt, GtE, IfStatement, ImportFrom, In, Is, IsNot, LShift, List, Lt, LtE, Mod, Module, Mult, Name, NotEq, NotIn, Num, Param, ParseError, Position$1 as Position, Print, PyNode, RShift, Range, RangeAnnotated, ReturnStatement, SourceKind, Str, Sub, SymbolFlags, SymbolTable, SymbolTableScope, Visitable, Visitor, astDump, astFromParse, cstDump, parse, semanticsOfModule };
