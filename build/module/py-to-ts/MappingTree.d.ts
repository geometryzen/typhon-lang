import { Range } from '../pytools/Range';
import { MutableRange } from '../pytools/MutableRange';
export declare class MappingTree {
    readonly source: Range;
    target: MutableRange;
    readonly children: MappingTree[];
    constructor(source: Range, target: MutableRange, children: MappingTree[]);
    offset(rows: number, cols: number): void;
}
