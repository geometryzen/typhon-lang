import { BlockType, SymbolTableScope } from './SymbolTableScope';
import { Alias } from './types';
import { Arguments } from './types';
import { Assign } from './types';
import { Attribute } from './types';
import { BinOp } from './types';
import { Call } from './types';
import { ClassDef } from './types';
import { Compare } from './types';
import { Comprehension } from './types';
import { Dict } from './types';
import { Ellipsis } from './types';
import { ExceptHandler } from './types';
import { Expression } from './types';
import { ExpressionStatement } from './types';
import { ExtSlice } from './types';
import { FunctionDef } from './types';
import { GeneratorExp } from './types';
import { IfStatement } from './types';
import { ImportFrom } from './types';
import { Index } from './types';
import { List } from './types';
import { Module } from './types';
import { Name } from './types';
import { Num } from './types';
import { Print } from './types';
import { ReturnStatement } from './types';
import { Slice } from './types';
import { Statement } from './types';
import { Str } from './types';
import { Visitor } from './types';
import { DictionaryKind } from './SymbolConstants';
import { SymbolFlags } from './SymbolConstants';
import { Range } from './Range';
/**
 * Migrate to using this class to providing the implementation for the SymbolTable.
 */
export declare class SemanticVisitor implements Visitor {
    private st;
    constructor(st: SymbolTable);
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
    visitParams(args: Name[], toplevel: boolean): void;
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
