/// <reference path="../../../node_modules/typescript/lib/typescriptServices.d.ts" />
import { SymbolTable } from '../pytools/SymbolTable';
import { Assert } from '../pytools/types';
import { AugAssign } from '../pytools/types';
import { Call } from '../pytools/types';
import { ClassDef } from '../pytools/types';
import { Compare } from '../pytools/types';
import { ContinueStatement } from '../pytools/types';
import { Expression } from '../pytools/types';
import { ForStatement } from '../pytools/types';
import { FunctionDef } from '../pytools/types';
import { IfStatement } from '../pytools/types';
import { ImportStatement } from '../pytools/types';
import { ImportFrom } from '../pytools/types';
import { ListComp } from '../pytools/types';
import { Module } from '../pytools/types';
import { Print } from '../pytools/types';
import { Raise } from '../pytools/types';
import { Statement } from '../pytools/types';
import { TryExcept } from '../pytools/types';
import { TryFinally } from '../pytools/types';
import { WhileStatement } from '../pytools/types';
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
    annotateSource(ast: any): void;
    gensym(hint?: string): string;
    niceName(roughName: string): string;
    emitArgs(arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any, arg6?: any, arg7?: any, arg8?: any, arg9?: any, argA?: any, argB?: any, argC?: any, argD?: any, argE?: any): void;
    ctupleorlist(e: any, data: any, tuporlist: any): void;
    cdict(e: any): void;
    clistcompgen(tmpname: any, generators: any, genIndex: any, elt: any): any;
    clistcomp(e: ListComp): void;
    cyield(e: any): string;
    ccompare(e: Compare): void;
    ccall(e: Call): void;
    cslice(s: any): void;
    vslicesub(s: any): any;
    vslice(s: any, ctx: any, obj: any, dataToStore: any): void;
    chandlesubscr(ctx: any, obj: any, subs: any, data: any): void;
    cboolop(e: any): any;
    /**
     *
     * compiles an expression. to 'return' something, it'll gensym a var and store
     * into that var so that the calling code doesn't have avoid just pasting the
     * returned name.
     *
     * @param {Object} e
     * @param {string=} data data to store in a store operation
     * @param {Object=} augstoreval value to store to for an aug operation (not
     * vexpr'd yet)
     */
    vexpr(e: any, data?: any, augstoreval?: any): any;
    /**
     * @param {Array.<Object>} exprs
     * @param {Array.<string>=} data
     */
    vseqexpr(exprs: any, data?: string[]): any[];
    caugassign(s: AugAssign): any;
    /**
     * optimize some constant exprs. returns 0 if always 0, 1 if always 1 or -1 otherwise.
     */
    exprConstant(e: any): number;
    newBlock(name: string): number;
    setBlock(n: number): void;
    pushBreakBlock(n: number): void;
    popBreakBlock(): void;
    pushContinueBlock(n: number): void;
    popContinueBlock(): void;
    pushExceptBlock(n: any): void;
    popExceptBlock(): void;
    pushFinallyBlock(n: number): void;
    popFinallyBlock(): void;
    setupExcept(eb: any): void;
    endExcept(): void;
    outputLocals(unit: any): string;
    outputAllUnits(): string;
    generateExpression(expression: Expression, s: any, flags?: number): string;
    generateStatements(statement: Statement[], s: any, flags?: number): string;
    maybeBlock(one: any, flags: number): string;
    maybeBlockSuffix(one: any, two: any): string;
    ifStatement(stmt: IfStatement, flags: number): any;
    cwhile(s: WhileStatement, flags: number): void;
    cfor(s: ForStatement, flags: number): void;
    craise(s: Raise): void;
    ctryexcept(s: TryExcept, flags: number): void;
    ctryfinally(s: TryFinally, flags: number): void;
    cassert(s: Assert): void;
    /**
     * @param {string} name
     * @param {string} asname
     * @param {string=} mod
     */
    cimportas(name: any, asname: any, mod: any): string;
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
    buildcodeobj(n: any, coname: any, decorator_list: any, args: any, callback: any): void;
    cfunction(s: FunctionDef): void;
    clambda(e: any): void;
    cifexp(e: any): void;
    cgenexpgen(generators: any, genIndex: any, elt: any): void;
    cgenexp(e: any): void;
    cclass(s: ClassDef, flags: number): void;
    ccontinue(s: ContinueStatement): void;
    /**
     * compiles a statement
     */
    vstmt(s: Statement, flags: number): any;
    vseqstmt(stmts: Statement[], flags?: number): void;
    isCell(name: string): boolean;
    /**
     * @param {string} name
     * @param {Object} ctx
     * @param {string=} dataToStore
     */
    nameop(name: string, ctx: any, dataToStore?: any): string;
    /**
     * @method enterScope
     * @param {string} name
     * @return {string} The generated name of the scope, usually $scopeN.
     */
    enterScope(name: string, key: any, lineno: number): string;
    exitScope(): void;
    /**
     *
     */
    cbody(stmts: Statement[], flags: number): void;
    cprint(s: Print): void;
    cmod(mod: Module, flags: number): string;
}
/**
 * @param {string} source the code
 * @param {string} fileName where it came from
 *
 * @return {{code: string}}
 */
export declare function compile(source: string, fileName: string): {
    code: string;
};
export declare function resetCompiler(): void;
export declare function transpile(source: string, fileName: string): ts.Node;
