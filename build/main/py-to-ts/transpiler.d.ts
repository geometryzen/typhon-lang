/// <reference path="../../../node_modules/typescript/lib/typescriptServices.d.ts" />
import { SymbolTable } from '../pytools/SymbolTable';
import { SymbolTableScope } from '../pytools/SymbolTableScope';
import { Arguments } from '../pytools/types';
import { Assert } from '../pytools/types';
import { AugAssign } from '../pytools/types';
import { AugStore } from '../pytools/types';
import { BoolOp } from '../pytools/types';
import { Call } from '../pytools/types';
import { ClassDef } from '../pytools/types';
import { Compare } from '../pytools/types';
import { Comprehension } from '../pytools/types';
import { ContinueStatement } from '../pytools/types';
import { Decorator } from '../pytools/types';
import { Del } from '../pytools/types';
import { Dict } from '../pytools/types';
import { Ellipsis } from '../pytools/types';
import { Expression } from '../pytools/types';
import { ExtSlice } from '../pytools/types';
import { ForStatement } from '../pytools/types';
import { FunctionDef } from '../pytools/types';
import { GeneratorExp } from '../pytools/types';
import { IfStatement } from '../pytools/types';
import { IfExp } from '../pytools/types';
import { ImportStatement } from '../pytools/types';
import { ImportFrom } from '../pytools/types';
import { Index } from '../pytools/types';
import { Lambda } from '../pytools/types';
import { ListComp } from '../pytools/types';
import { Module } from '../pytools/types';
import { Print } from '../pytools/types';
import { Raise } from '../pytools/types';
import { Slice } from '../pytools/types';
import { Statement } from '../pytools/types';
import { Store } from '../pytools/types';
import { SubscriptContext } from '../pytools/types';
import { TryExcept } from '../pytools/types';
import { TryFinally } from '../pytools/types';
import { Tuple } from '../pytools/types';
import { WhileStatement } from '../pytools/types';
import { Yield } from '../pytools/types';
/**
 * FIXME: CompilerUnit is coupled to this module by the out variable.
 */
export declare class CompilerUnit {
    ste: SymbolTableScope;
    name: string;
    /**
     * Some sort of private name?
     */
    private_: string;
    firstlineno: number;
    lineno: number;
    /**
     * Has the line number been set?
     */
    linenoSet: boolean;
    localnames: string[];
    blocknum: number;
    /**
     * TODO: What are these blocks?
     */
    blocks: any[];
    curblock: number;
    scopename: string;
    prefixCode: string;
    varDeclsCode: string;
    switchCode: string;
    suffixCode: string;
    breakCode: string;
    breakBlocks: number[];
    continueBlocks: number[];
    exceptBlocks: number[];
    finallyBlocks: number[];
    argnames: any[];
    /**
     * @constructor
     *
     * Stuff that changes on entry/exit of code blocks. must be saved and restored
     * when returning to a block.
     *
     * Corresponds to the body of a module, class, or function.
     */
    constructor();
    activateScope(): void;
}
export declare class Compiler {
    result: string[];
    private fileName;
    private st;
    private flags;
    private interactive;
    private nestlevel;
    private u;
    private stack;
    private allUnits;
    private source;
    /**
     * @constructor
     * @param fileName {string}
     * @param st {SymbolTable}
     * @param flags {number}
     * @param {string=} sourceCodeForAnnotation used to add original source to listing if desired
     */
    constructor(fileName: string, st: SymbolTable, flags: number, sourceCodeForAnnotation: string);
    getSourceLine(lineno: number): any;
    annotateSource(ast: {
        col_offset?: number;
    }): void;
    gensym(hint?: string): string;
    niceName(roughName: string): string;
    emitArgs(arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any, argA?: any, argB?: any, argC?: any, argD?: any, argE?: any): string;
    ctupleorlist(e: Tuple, data: string, tuporlist: 'tuple' | 'list'): void;
    cdict(e: Dict): void;
    clistcompgen(tmpname: string, generators: Comprehension[], genIndex: number, elt: Expression): string;
    clistcomp(e: ListComp): void;
    cyield(e: Yield): string;
    ccompare(e: Compare): void;
    ccall(e: Call): void;
    cslice(s: Slice): Number | String;
    vslicesub(s: Number | String | Index | Slice | Ellipsis | ExtSlice): Number | String;
    vslice(s: Number | String | Index | Slice | Ellipsis | ExtSlice, ctx: SubscriptContext, obj: any, dataToStore: string): void;
    chandlesubscr(ctx: SubscriptContext, obj: any, subs: String | Number, data: string): void;
    cboolop(e: BoolOp): undefined;
    vexpr(e: Expression, data?: string | undefined, augstoreval?: object): any;
    vseqexpr(exprs: Expression[], data?: string[]): any[];
    caugassign(s: AugAssign): any;
    /**
     * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
     */
    exprConstant(e: Expression): ts.LiteralExpression;
    newBlock(name: string): number;
    setBlock(n: number): void;
    pushBreakBlock(n: number): void;
    popBreakBlock(): void;
    pushContinueBlock(n: number): void;
    popContinueBlock(): void;
    pushExceptBlock(n: number): void;
    popExceptBlock(): void;
    pushFinallyBlock(n: number): void;
    popFinallyBlock(): void;
    setupExcept(eb: number): void;
    endExcept(): void;
    outputLocals(unit: CompilerUnit): string;
    outputAllUnits(): string;
    generateExpression(expression: Expression, s: number, flags?: number): string;
    generateStatements(statement: Statement[], s: number, flags?: number): string;
    maybeBlock(one: Statement[], flags: number): string;
    maybeBlockSuffix(one: Statement[], two: string[]): string;
    ifStatement(stmt: IfStatement, flags: number): string[];
    cwhile(s: WhileStatement, flags: number): void;
    cfor(s: ForStatement, flags: number): void;
    craise(s: Raise): void;
    ctryexcept(s: TryExcept, flags: number): void;
    ctryfinally(s: TryFinally, flags: number): void;
    cassert(s: Assert): void;
    cimportas(name: string, asname: string, mod?: string): string;
    cimport(s: ImportStatement): void;
    cfromimport(s: ImportFrom): void;
    /**
     * builds a code object (js function) for various constructs. used by def,
     * lambda, generator expressions. it isn't used for class because it seemed
     * different enough.
     *
     * handles:
     * - setting up a new scope
     * - decorators (if any)
     * - defaults setup
     * - setup for cell and free vars
     * - setup and modification for generators
     *
     * @param {Object} n ast node to build for
     * @param {string} coname name of code object to build
     * @param {Array} decorator_list ast of decorators if any
     * @param {*} args arguments to function, if any
     * @param {Function} callback called after setup to do actual work of function
     *
     * @returns the name of the newly created function or generator object.
     *
     */
    buildcodeobj(n: {
        scopeId: number;
        lineno: number;
    }, coname: string, decorator_list: Decorator[], args: Arguments, callback: (scopename: string) => void): string;
    cfunction(s: FunctionDef): void;
    clambda(e: Lambda): string;
    cifexp(e: IfExp): string;
    cgenexpgen(generators: Comprehension[], genIndex: number, elt: Expression): void;
    cgenexp(e: GeneratorExp): string;
    cclass(s: ClassDef, flags: number): void;
    ccontinue(s: ContinueStatement): void;
    vstmt(s: Statement, flags: number): any;
    vseqstmt(stmts: Statement[], flags?: number): void;
    isCell(name: string): boolean;
    nameop(name: string, ctx: AugStore | Store | Del, dataToStore?: string): string;
    enterScope(name: string, key: {
        scopeId: number;
    }, lineno: number): string;
    exitScope(): void;
    /**
     *
     */
    cbody(stmts: Statement[], flags: number): void;
    cprint(s: Print): void;
    cmod(mod: Module, flags: number): string;
}
/**
 *
 */
export declare function compile(source: string, fileName: string): {
    code: string;
};
export declare function resetCompiler(): void;
export declare function transpile(source: string): ts.ModuleBlock;
