import { Module } from '../pytools/types';
import { PyNode } from '../pytools/parser';
import { SymbolTable } from '../pytools/SymbolTable';
import { SourceMap } from './SourceMap';
export declare function transpileModule(sourceText: string, trace?: boolean): {
    code: string;
    sourceMap: SourceMap;
    cst: PyNode;
    mod: Module;
    symbolTable: SymbolTable;
};
