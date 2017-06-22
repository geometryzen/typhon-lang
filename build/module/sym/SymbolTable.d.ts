import { BlockType, SymbolTableScope } from './SymbolTableScope';
import { Alias } from '../ast/types';
import { Arguments } from '../ast/types';
import { Assign } from '../ast/types';
import { Attribute } from '../ast/types';
import { BinOp } from '../ast/types';
import { Call } from '../ast/types';
import { ClassDef } from '../ast/types';
import { Compare } from '../ast/types';
import { Comprehension } from '../ast/types';
import { Dict } from '../ast/types';
import { Ellipsis } from '../ast/types';
import { ExceptHandler } from '../ast/types';
import { Expression } from '../ast/types';
import { ExpressionStatement } from '../ast/types';
import { ExtSlice } from '../ast/types';
import { ForStatement } from '../ast/types';
import { FunctionDef } from '../ast/types';
import { FunctionParamDef } from '../ast/types';
import { GeneratorExp } from '../ast/types';
import { IfStatement } from '../ast/types';
import { ImportFrom } from '../ast/types';
import { Index } from '../ast/types';
import { List } from '../ast/types';
import { Module } from '../ast/types';
import { Name } from '../ast/types';
import { Num } from '../ast/types';
import { Print } from '../ast/types';
import { ReturnStatement } from '../ast/types';
import { Slice } from '../ast/types';
import { Statement } from '../ast/types';
import { Str } from '../ast/types';
import { Visitor } from '../ast/types';
import { DictionaryKind } from './SymbolConstants';
import { SymbolFlags } from './SymbolConstants';
import { Range } from '../common/Range';
/**
 * Migrate to using this class to providing the implementation for the SymbolTable.
 */
export declare class SemanticVisitor implements Visitor {
    private st;
    constructor(st: SymbolTable);
    forStatement(fs: ForStatement): void;
    assign(assign: Assign): void;
    attribute(attribute: Attribute): void;
    binOp(be: BinOp): void;
    callExpression(ce: Call): void;
    classDef(cd: ClassDef): void;
    compareExpression(ce: Compare): void;
    dict(dict: Dict): void;
    expressionStatement(expressionStatement: ExpressionStatement): void;
    functionDef(fd: FunctionDef): void;
    ifStatement(i: IfStatement): void;
    importFrom(importFrom: ImportFrom): void;
    list(list: List): void;
    module(module: Module): void;
    name(name: Name): void;
    num(num: Num): void;
    print(print: Print): void;
    returnStatement(rs: ReturnStatement): void;
    str(str: Str): void;
}
/**
 * The symbol table uses the abstract synntax tree (not the parse tree).
 */
export declare class SymbolTable {
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
