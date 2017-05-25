import SymbolTable from './SymbolTable';
/**
 * @methdod symbolTable
 * @param {Object} ast
 * @param {string} fileName
 * @return {SymbolTable}
 */
export declare function symbolTable(ast: any, fileName: string): SymbolTable;
/**
 * @method dumpSymbolTable
 * @param st {SymbolTable}
 * @return {string}
 */
export declare function dumpSymbolTable(st: SymbolTable): string;
