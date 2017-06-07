import { Module } from '../pytools/types';
import { PyNode } from '../pytools/parser';
import { SymbolTable } from '../pytools/SymbolTable';
import { MappingTree } from './MappingTree';
import { MutableRange } from '../pytools/MutableRange';
import { Tree } from '../btree/btree';
export declare function transpileModule(sourceText: string, trace?: boolean): {
    code: string;
    sourceMap: MappingTree;
    sourceTree: Tree<Range, MutableRange>;
    cst: PyNode;
    mod: Module;
    symbolTable: SymbolTable;
};
