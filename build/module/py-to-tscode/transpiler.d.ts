import { SymbolTable } from '../pytools/SymbolTable';
export declare function transpileModule(sourceText: string, fileName: string): {
    code: string;
    symbolTable: SymbolTable;
};
