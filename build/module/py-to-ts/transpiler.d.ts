import { Module } from '../pytools/types';
import { PyNode } from '../pytools/parser';
import { SymbolTable } from '../pytools/SymbolTable';
export declare function transpileModule(sourceText: string): {
    code: string;
    cst: PyNode;
    mod: Module;
    symbolTable: SymbolTable;
};
