import { Module } from '../pytools/types';
import { PyNode } from '../pytools/parser';
import { SymbolTable } from '../pytools/SymbolTable';
import { MappingTree } from './MappingTree';
export declare function transpileModule(sourceText: string): {
    code: string;
    sourceMap: MappingTree;
    cst: PyNode;
    mod: Module;
    symbolTable: SymbolTable;
};
