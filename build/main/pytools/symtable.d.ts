import { SymbolTable } from './SymbolTable';
/**
 * @param ast
 * @param fileName
 */
export declare function symbolTable(ast: any, fileName: string): SymbolTable;
/**
 * @param st
 */
export declare function dumpSymbolTable(st: SymbolTable): string;
