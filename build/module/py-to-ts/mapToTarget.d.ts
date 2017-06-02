import { MappingTree } from './MappingTree';
export declare function mapToTarget(m: MappingTree, sourceLine: number, sourceColumn: number): {
    line: number;
    column: number;
} | null;
