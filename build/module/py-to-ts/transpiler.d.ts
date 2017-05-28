import { PyNode } from '../pytools/parser';
import { SymbolTable } from '../pytools/SymbolTable';
export declare function transpileModule(sourceText: string, fileName: string): {
    code: string;
    cst: PyNode;
    symbolTable: SymbolTable;
};
