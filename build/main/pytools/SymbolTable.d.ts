import { SymbolTableScope } from './SymbolTableScope';
/**
 * The symbol table uses the abstract synntax tree (not the parse tree).
 */
export declare class SymbolTable {
    fileName: string;
    cur: any;
    top: any;
    stack: any;
    global: any;
    curClass: string;
    tmpname: number;
    stss: any;
    /**
     * @param fileName
     */
    constructor(fileName: string);
    /**
     * Lookup the SymbolTableScope for a scopeId of the AST.
     */
    getStsForAst(ast: any): any;
    SEQStmt(nodes: any): void;
    SEQExpr(nodes: any): void;
    enterBlock(name: any, blockType: any, ast: any, lineno: any): void;
    exitBlock(): void;
    visitParams(args: any, toplevel: any): void;
    visitArguments(a: any, lineno: number): void;
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
    visitSlice(s: any): void;
    /**
     * @param {Object} s
     */
    visitStmt(s: any): void;
    visitExpr(e: any): void;
    visitComprehension(lcs: any, startAt: any): void;
    /**
     * This is probably not correct for names. What are they?
     * @param {Array.<Object>} names
     * @param {number} lineno
     */
    visitAlias(names: any, lineno: any): void;
    /**
     * @param {Object} e
     */
    visitGenexp(e: any): void;
    visitExcepthandlers(handlers: any): void;
    /**
     * @param {SymbolTableScope} ste The Symbol Table Scope.
     */
    analyzeBlock(ste: SymbolTableScope, bound: any, free: any, global: any): void;
    analyzeChildBlock(entry: any, bound: any, free: any, global: any, childFree: any): void;
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
    }, bound: any, free: any, classflag: any): void;
    /**
     * @param {Object} ste The Symbol Table Scope.
     * @param {string} name
     */
    analyzeName(ste: any, dict: any, name: any, flags: any, bound: any, local: any, free: any, global: any): void;
    analyze(): void;
}
