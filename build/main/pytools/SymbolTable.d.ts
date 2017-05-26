import { BlockType, SymbolTableScope } from './SymbolTableScope';
import { Alias } from './types';
import { Arguments } from './types';
import { Comprehension } from './types';
import { Ellipsis } from './types';
import { ExceptHandler } from './types';
import { Expression } from './types';
import { ExtSlice } from './types';
import { GeneratorExp } from './types';
import { Index } from './types';
import { Name } from './types';
import { Slice } from './types';
import { Statement } from './types';
import { DictionaryKind } from './SymbolConstants';
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
    enterBlock(name: string, blockType: BlockType, ast: {
        scopeId: number;
    }, lineno: number): void;
    exitBlock(): void;
    visitParams(args: Name[], toplevel: boolean): void;
    visitArguments(a: Arguments, lineno: number): void;
    /**
     * @param {number} lineno
     * @return {void}
     */
    newTmpname(lineno: number): void;
    /**
     * @param {string} name
     * @param {number} flag
     * @param {number} lineno
     * @return {void}
     */
    addDef(name: string, flag: number, lineno: number): void;
    visitSlice(s: Slice | ExtSlice | Index | Ellipsis): void;
    /**
     * @param {Object} s
     */
    visitStmt(s: Statement): void;
    visitExpr(e: Expression): void;
    visitComprehension(lcs: Comprehension[], startAt: number): void;
    /**
     * This is probably not correct for names. What are they?
     * @param {Array.<Object>} names
     * @param {number} lineno
     */
    visitAlias(names: Alias[], lineno: number): void;
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
